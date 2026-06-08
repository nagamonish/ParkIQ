from __future__ import annotations

import asyncio
import json
import logging
import os
import time
import urllib.error
import urllib.request
from typing import Any

logger = logging.getLogger(__name__)


def _env(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name)
    return value if value not in (None, "") else default


def _env_float(name: str) -> float | None:
    raw = os.getenv(name)
    if raw in (None, ""):
        return None
    try:
        return float(raw)
    except ValueError:
        return None


class CloudPublisher:
    """Pushes this ParkIQ site's *aggregate* parking-detection availability up to
    the Sightline cloud.

    Privacy by design: only summed counts (available / occupied / total) leave
    the operator deployment -- never frames, never per-vehicle data. Disabled
    unless CLOUD_INGEST_URL and SIGHTLINE_SITE_ID are configured, so existing
    operator-only deployments are unaffected.
    """

    def __init__(self, camera_manager: Any) -> None:
        self.camera_manager = camera_manager
        self.ingest_url = _env("CLOUD_INGEST_URL")
        self.site_id = _env("SIGHTLINE_SITE_ID")
        self.api_key = _env("SIGHTLINE_API_KEY")
        self.interval = float(_env("CLOUD_PUBLISH_INTERVAL", "15") or 15)
        self.timeout = float(_env("CLOUD_PUBLISH_TIMEOUT", "5") or 5)
        self.max_backoff = float(_env("CLOUD_PUBLISH_MAX_BACKOFF", "300") or 300)
        self._task: asyncio.Task | None = None
        self._stop = asyncio.Event()
        self._registered = False
        self._consecutive_failures = 0

    @property
    def enabled(self) -> bool:
        return bool(self.ingest_url and self.site_id)

    def _site_metadata(self) -> dict[str, Any] | None:
        name = _env("SITE_NAME")
        if not name:
            return None
        meta: dict[str, Any] = {"name": name}
        for key, env_name in (
            ("type", "SITE_TYPE"),
            ("operator", "SITE_OPERATOR"),
            ("address", "SITE_ADDRESS"),
            ("city", "SITE_CITY"),
            ("description", "SITE_DESCRIPTION"),
            ("accent", "SITE_ACCENT"),
        ):
            value = _env(env_name)
            if value:
                meta[key] = value
        for key, env_name in (("lat", "SITE_LAT"), ("lng", "SITE_LNG"), ("price_per_hour", "SITE_PRICE")):
            value = _env_float(env_name)
            if value is not None:
                meta[key] = value
        amenities = _env("SITE_AMENITIES")
        if amenities:
            meta["amenities"] = [a.strip() for a in amenities.split(",") if a.strip()]
        return meta

    def _aggregate(self) -> dict[str, int]:
        total = 0
        occupied = 0
        for camera in self.camera_manager.list_cameras():
            total += int(camera.get("total", 0))
            occupied += int(camera.get("occupied", 0))
        available = max(0, total - occupied)
        return {"available": available, "occupied": occupied, "total": total}

    def _build_payload(self) -> dict[str, Any]:
        counts = self._aggregate()
        payload: dict[str, Any] = {
            "site_id": self.site_id,
            "available": counts["available"],
            "occupied": counts["occupied"],
            "total": counts["total"],
            "timestamp": time.time(),
        }
        if not self._registered:
            meta = self._site_metadata()
            if meta is not None:
                payload["metadata"] = meta
        return payload

    def _post(self, payload: dict[str, Any]) -> bool:
        data = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(self.ingest_url, data=data, method="POST")
        request.add_header("Content-Type", "application/json")
        if self.api_key:
            request.add_header("X-API-Key", self.api_key)
        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                return 200 <= response.status < 300
        except urllib.error.HTTPError as exc:
            logger.warning("cloud ingest rejected snapshot (%s): %s", exc.code, exc.reason)
        except Exception as exc:  # noqa: BLE001 - never let publishing break the operator.
            logger.warning("cloud ingest unreachable: %s", exc)
        return False

    async def publish_once(self) -> bool:
        if not self.enabled:
            return False
        payload = self._build_payload()
        ok = await asyncio.to_thread(self._post, payload)
        if ok:
            self._registered = True
        return ok

    def _next_delay(self) -> float:
        """Normal cadence on success; exponential backoff (capped) on failure so
        we don't hammer an unreachable cloud."""
        if self._consecutive_failures == 0:
            return self.interval
        return min(self.interval * (2 ** min(self._consecutive_failures, 8)), self.max_backoff)

    async def _run(self) -> None:
        logger.info("cloud publisher active -> %s (site=%s, every %ss)", self.ingest_url, self.site_id, self.interval)
        while not self._stop.is_set():
            ok = await self.publish_once()
            if ok:
                self._consecutive_failures = 0
            else:
                self._consecutive_failures += 1
                if self._consecutive_failures in (5, 20):
                    logger.error(
                        "cloud publish has failed %d times in a row; backing off",
                        self._consecutive_failures,
                    )
            try:
                await asyncio.wait_for(self._stop.wait(), timeout=self._next_delay())
            except asyncio.TimeoutError:
                pass

    def start(self) -> None:
        if not self.enabled or (self._task and not self._task.done()):
            return
        self._stop.clear()
        self._task = asyncio.create_task(self._run())

    async def stop(self) -> None:
        self._stop.set()
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except (asyncio.CancelledError, Exception):  # noqa: BLE001
                pass
            self._task = None
