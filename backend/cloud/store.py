from __future__ import annotations

import logging
import math
import os
import threading
import time
from collections import deque
from datetime import UTC, datetime, timedelta
from typing import Any, Iterable

from backend.cloud.models import (
    STALE_AFTER_SECONDS,
    Amenity,
    Availability,
    AvailabilityStatus,
    GlobalStats,
    HistoryPoint,
    Location,
    LocationDetail,
    LocationSummary,
    LocationType,
    OpeningHours,
    SiteMetadata,
    TypicalPoint,
    status_for_occupancy,
)

try:  # pragma: no cover - optional durable storage.
    import asyncpg
except ImportError:  # pragma: no cover
    asyncpg = None


logger = logging.getLogger(__name__)

TREND_LENGTH = 30
HISTORY_HOURS = 24 * 7
WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance between two coordinates in kilometres."""

    radius = 6371.0088
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lng / 2) ** 2
    )
    return radius * 2 * math.asin(math.sqrt(a))


class _LiveState:
    """Mutable runtime availability for a single location."""

    __slots__ = (
        "available",
        "occupied",
        "total",
        "updated_at",
        "trend",
        "hourly",
        "typical",
    )

    def __init__(self, total: int) -> None:
        self.available = total
        self.occupied = 0
        self.total = total
        self.updated_at: float | None = None
        self.trend: deque[float] = deque(maxlen=TREND_LENGTH)
        # hour-epoch -> {"sum": float, "count": int, "available": int, "total": int}
        self.hourly: dict[int, dict[str, float]] = {}
        # weekday -> {hour -> occupancy_pct} typical pattern (0..100)
        self.typical: dict[str, dict[int, float]] = {}

    @property
    def occupancy_pct(self) -> float:
        if self.total <= 0:
            return 0.0
        return round((self.occupied / self.total) * 100.0, 1)


class CloudStore:
    """Authoritative in-memory index of every Sightline location plus its live
    parking-detection availability. Snapshots are optionally mirrored to
    PostgreSQL for durability, but every read path is served from memory so the
    public API stays fast and works even with no database attached."""

    def __init__(self, database_url: str | None = None) -> None:
        self.database_url = database_url or os.getenv("CLOUD_DATABASE_URL")
        self.pool_min_size = int(os.getenv("CLOUD_POOL_MIN", "1"))
        self.pool_max_size = int(os.getenv("CLOUD_POOL_MAX", "4"))
        self.pool: Any = None
        self._lock = threading.RLock()
        self._locations: dict[str, Location] = {}
        self._live: dict[str, _LiveState] = {}

    # -- lifecycle ---------------------------------------------------------

    async def connect(self) -> None:
        if not self.database_url or asyncpg is None:
            logger.info("cloud store running in-memory (no durable snapshot store)")
            return
        try:
            self.pool = await asyncpg.create_pool(
                self.database_url, min_size=self.pool_min_size, max_size=self.pool_max_size
            )
            logger.info("cloud store connected to durable snapshot store")
        except Exception:  # noqa: BLE001 - durability is best-effort.
            self.pool = None
            logger.exception("cloud snapshot store unavailable; continuing in-memory")

    async def close(self) -> None:
        if self.pool is not None:
            await self.pool.close()
            self.pool = None

    async def persist_snapshot(self, site_id: str, availability: Availability) -> None:
        """Best-effort durable write of a real site snapshot. No-op in-memory."""

        if self.pool is None:
            return
        try:
            async with self.pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO location_snapshots
                        (location_id, available, occupied, total, occupancy_pct, status, recorded_at)
                    VALUES ($1, $2, $3, $4, $5, $6, to_timestamp($7))
                    """,
                    site_id,
                    availability.available,
                    availability.occupied,
                    availability.total,
                    availability.occupancy_pct,
                    availability.status.value,
                    availability.updated_at or time.time(),
                )
        except Exception:  # noqa: BLE001 - durability must never break ingest.
            logger.exception("failed to persist snapshot for %s", site_id)

    # -- registration ------------------------------------------------------

    def upsert_location(self, location: Location) -> Location:
        with self._lock:
            self._locations[location.id] = location
            state = self._live.get(location.id)
            if state is None:
                self._live[location.id] = _LiveState(location.total_spaces)
            else:
                state.total = location.total_spaces
                if state.updated_at is None:
                    state.available = location.total_spaces
            return location

    def register_from_metadata(self, site_id: str, meta: SiteMetadata, total: int) -> Location:
        """Create a placeholder location the first time a site reports in."""

        existing = self._locations.get(site_id)
        location = Location(
            id=site_id,
            name=meta.name or (existing.name if existing else site_id),
            type=meta.type or (existing.type if existing else LocationType.lot),
            operator=meta.operator or (existing.operator if existing else "Unknown operator"),
            address=meta.address or (existing.address if existing else ""),
            city=meta.city or (existing.city if existing else ""),
            lat=meta.lat if meta.lat is not None else (existing.lat if existing else 0.0),
            lng=meta.lng if meta.lng is not None else (existing.lng if existing else 0.0),
            total_spaces=total or (existing.total_spaces if existing else 0),
            amenities=meta.amenities or (existing.amenities if existing else []),
            price_per_hour=meta.price_per_hour
            if meta.price_per_hour is not None
            else (existing.price_per_hour if existing else None),
            currency=meta.currency or (existing.currency if existing else "USD"),
            hours=meta.hours or (existing.hours if existing else OpeningHours()),
            description=meta.description or (existing.description if existing else None),
            accent=meta.accent or (existing.accent if existing else "#6366f1"),
        )
        return self.upsert_location(location)

    # -- ingest ------------------------------------------------------------

    def ingest(
        self,
        site_id: str,
        available: int,
        occupied: int,
        total: int,
        timestamp: float | None = None,
    ) -> Availability:
        now = timestamp or time.time()
        with self._lock:
            state = self._live.get(site_id)
            if state is None:
                state = _LiveState(total)
                self._live[site_id] = state

            state.available = max(0, int(available))
            state.occupied = max(0, int(occupied))
            state.total = max(state.available + state.occupied, int(total))
            state.updated_at = now
            state.trend.append(state.occupancy_pct)
            self._record_hourly(state, now)

            return self._availability(state)

    def _record_hourly(self, state: _LiveState, now: float) -> None:
        hour_epoch = int(now // 3600) * 3600
        bucket = state.hourly.get(hour_epoch)
        if bucket is None:
            bucket = {"sum": 0.0, "count": 0.0, "available": 0.0, "total": 0.0}
            state.hourly[hour_epoch] = bucket
        bucket["sum"] += state.occupancy_pct
        bucket["count"] += 1
        bucket["available"] = state.available
        bucket["total"] = state.total

        cutoff = hour_epoch - HISTORY_HOURS * 3600
        for key in [k for k in state.hourly if k < cutoff]:
            del state.hourly[key]

    # -- read models -------------------------------------------------------

    def _availability(self, state: _LiveState) -> Availability:
        now = time.time()
        age = None if state.updated_at is None else max(0.0, now - state.updated_at)
        is_live = age is not None and age <= STALE_AFTER_SECONDS
        if state.updated_at is None:
            status = AvailabilityStatus.unknown
        elif not is_live:
            status = AvailabilityStatus.unknown
        else:
            status = status_for_occupancy(state.occupancy_pct, state.available)
        return Availability(
            available=state.available,
            occupied=state.occupied,
            total=state.total,
            occupancy_pct=state.occupancy_pct,
            status=status,
            updated_at=state.updated_at,
            age_seconds=age,
            is_live=is_live,
            trend=list(state.trend),
        )

    def availability_for(self, location_id: str) -> Availability | None:
        with self._lock:
            state = self._live.get(location_id)
            return self._availability(state) if state else None

    def _summary(self, location: Location, origin: tuple[float, float] | None) -> LocationSummary:
        state = self._live.get(location.id) or _LiveState(location.total_spaces)
        distance = None
        if origin is not None and (location.lat or location.lng):
            distance = round(haversine_km(origin[0], origin[1], location.lat, location.lng), 2)
        return LocationSummary(
            **location.model_dump(),
            availability=self._availability(state),
            distance_km=distance,
        )

    def get_location(self, location_id: str) -> Location | None:
        with self._lock:
            return self._locations.get(location_id)

    def list_summaries(self, origin: tuple[float, float] | None = None) -> list[LocationSummary]:
        with self._lock:
            return [self._summary(loc, origin) for loc in self._locations.values()]

    # -- search ------------------------------------------------------------

    def search(
        self,
        *,
        q: str | None = None,
        origin: tuple[float, float] | None = None,
        radius_km: float | None = None,
        types: Iterable[LocationType] | None = None,
        amenities: Iterable[Amenity] | None = None,
        statuses: Iterable[AvailabilityStatus] | None = None,
        max_price: float | None = None,
        open_now: bool = False,
        sort: str = "relevance",
        limit: int = 60,
        offset: int = 0,
    ) -> tuple[list[LocationSummary], int]:
        summaries = self.list_summaries(origin)
        type_set = set(types) if types else None
        amenity_set = set(amenities) if amenities else None
        status_set = set(statuses) if statuses else None
        needle = q.strip().lower() if q else None

        filtered: list[LocationSummary] = []
        for summary in summaries:
            if needle and not _matches_text(summary, needle):
                continue
            if type_set and summary.type not in type_set:
                continue
            if amenity_set and not amenity_set.issubset(set(summary.amenities)):
                continue
            if status_set and summary.availability.status not in status_set:
                continue
            if max_price is not None and (
                summary.price_per_hour is None or summary.price_per_hour > max_price
            ):
                continue
            if open_now and not _is_open_now(summary.hours):
                continue
            if (
                radius_km is not None
                and summary.distance_km is not None
                and summary.distance_km > radius_km
            ):
                continue
            filtered.append(summary)

        filtered.sort(key=_sort_key(sort, needle, origin is not None))
        total = len(filtered)
        return filtered[offset : offset + limit], total

    # -- detail ------------------------------------------------------------

    def detail(self, location_id: str, history_hours: int = 24) -> LocationDetail | None:
        with self._lock:
            location = self._locations.get(location_id)
            if location is None:
                return None
            state = self._live.get(location_id) or _LiveState(location.total_spaces)
            summary = self._summary(location, None)
            history = self._history(state, history_hours)
            typical = {day: [TypicalPoint(hour=h, occupancy_pct=v) for h, v in sorted(hours.items())]
                       for day, hours in state.typical.items()}
            best = _best_times(state.typical)
            return LocationDetail(
                **summary.model_dump(),
                history=history,
                typical_week=typical,
                best_times=best,
            )

    def _history(self, state: _LiveState, hours: int) -> list[HistoryPoint]:
        if not state.hourly:
            return []
        cutoff = time.time() - hours * 3600
        points: list[HistoryPoint] = []
        for hour_epoch in sorted(state.hourly):
            if hour_epoch < cutoff:
                continue
            bucket = state.hourly[hour_epoch]
            count = bucket["count"] or 1
            occ = round(bucket["sum"] / count, 1)
            points.append(
                HistoryPoint(
                    bucket=datetime.fromtimestamp(hour_epoch, UTC).isoformat(),
                    occupancy_pct=occ,
                    available=int(bucket["available"]),
                    total=int(bucket["total"]),
                )
            )
        return points

    # -- stats -------------------------------------------------------------

    def global_stats(self) -> GlobalStats:
        with self._lock:
            locations = list(self._locations.values())
            cities = {loc.city for loc in locations if loc.city}
            total_spaces = sum(loc.total_spaces for loc in locations)
            available_now = 0
            live_sites = 0
            occ_values: list[float] = []
            for loc in locations:
                state = self._live.get(loc.id)
                if state is None:
                    continue
                avail = self._availability(state)
                if avail.is_live:
                    live_sites += 1
                    available_now += avail.available
                    occ_values.append(avail.occupancy_pct)
            avg_occ = round(sum(occ_values) / len(occ_values), 1) if occ_values else 0.0
            return GlobalStats(
                locations=len(locations),
                cities=len(cities),
                total_spaces=total_spaces,
                available_now=available_now,
                live_sites=live_sites,
                avg_occupancy_pct=avg_occ,
            )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _matches_text(summary: LocationSummary, needle: str) -> bool:
    haystack = " ".join(
        [
            summary.name,
            summary.city,
            summary.address,
            summary.operator,
            summary.type.value,
            *[a.value.replace("_", " ") for a in summary.amenities],
        ]
    ).lower()
    return all(token in haystack for token in needle.split())


def _is_open_now(hours: OpeningHours) -> bool:
    if hours.open_24h:
        return True
    now = datetime.now()
    weekday = now.weekday()
    window = hours.week[weekday] if weekday < len(hours.week) else None
    if not window:
        return False
    minutes = now.hour * 60 + now.minute
    return window[0] <= minutes <= window[1]


_STATUS_ORDER = {
    AvailabilityStatus.available: 0,
    AvailabilityStatus.moderate: 1,
    AvailabilityStatus.busy: 2,
    AvailabilityStatus.full: 3,
    AvailabilityStatus.unknown: 4,
}


def _sort_key(sort: str, needle: str | None, has_origin: bool):
    def key(summary: LocationSummary):
        avail = summary.availability
        if sort == "distance" and has_origin:
            return (summary.distance_km if summary.distance_km is not None else 1e9,)
        if sort == "availability":
            return (-avail.available, _STATUS_ORDER[avail.status])
        if sort == "occupancy":
            return (avail.occupancy_pct,)
        if sort == "price":
            return (summary.price_per_hour if summary.price_per_hour is not None else 1e9,)
        if sort == "name":
            return (summary.name.lower(),)
        # relevance: live + emptier + closer first
        return (
            0 if avail.is_live else 1,
            _STATUS_ORDER[avail.status],
            summary.distance_km if (has_origin and summary.distance_km is not None) else 1e9,
            -avail.available,
        )

    return key


def _best_times(typical: dict[str, dict[int, float]]) -> list[str]:
    """Pick the quietest open hours across a typical week."""

    if not typical:
        return []
    hour_avg: dict[int, list[float]] = {}
    for hours in typical.values():
        for hour, value in hours.items():
            hour_avg.setdefault(hour, []).append(value)
    averaged = {hour: sum(vals) / len(vals) for hour, vals in hour_avg.items()}
    quietest = sorted(averaged.items(), key=lambda item: item[1])[:3]
    quietest.sort(key=lambda item: item[0])
    return [f"{_fmt_hour(h)} ({int(v)}% full)" for h, v in quietest]


def _fmt_hour(hour: int) -> str:
    suffix = "AM" if hour < 12 else "PM"
    display = hour % 12 or 12
    return f"{display} {suffix}"
