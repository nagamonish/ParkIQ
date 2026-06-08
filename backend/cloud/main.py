from __future__ import annotations

import asyncio
import logging
import os
import secrets
import time
from contextlib import asynccontextmanager
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from backend.cloud.geocode import Geocoder
from backend.cloud.models import (
    Amenity,
    AvailabilityStatus,
    GeoResult,
    GlobalStats,
    IngestAck,
    IngestPayload,
    LocationDetail,
    LocationSummary,
    LocationType,
    SearchResponse,
)
from backend.cloud.seed import AvailabilitySimulator
from backend.cloud.store import CloudStore

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("sightline.cloud")

store = CloudStore()
geocoder = Geocoder()


def _ingest_tokens() -> set[str]:
    raw = os.getenv("CLOUD_INGEST_TOKEN", "")
    return {token.strip() for token in raw.split(",") if token.strip()}


async def require_ingest_auth(x_api_key: str | None = Header(default=None)) -> None:
    tokens = _ingest_tokens()
    if not tokens:  # auth disabled (local/dev) -- a startup warning is logged.
        return
    # Constant-time comparison so a token can't be recovered by timing.
    if not x_api_key or not any(secrets.compare_digest(x_api_key, token) for token in tokens):
        raise HTTPException(status_code=401, detail="invalid or missing X-API-Key")


class WSHub:
    def __init__(self) -> None:
        self._connections: set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections.add(websocket)

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._connections.discard(websocket)

    async def broadcast(self, payload: dict[str, Any]) -> None:
        async with self._lock:
            connections = list(self._connections)
        if not connections:
            return
        results = await asyncio.gather(
            *(conn.send_json(payload) for conn in connections),
            return_exceptions=True,
        )
        # Match BaseException (not just Exception) so a send that raises
        # CancelledError still evicts its connection instead of leaking it.
        stale = [c for c, r in zip(connections, results, strict=False) if isinstance(r, BaseException)]
        if stale:
            async with self._lock:
                for conn in stale:
                    self._connections.discard(conn)


hub = WSHub()


async def broadcast_location(location_id: str) -> None:
    availability = store.availability_for(location_id)
    if availability is None:
        return
    await hub.broadcast(
        {
            "type": "availability",
            "location_id": location_id,
            "availability": availability.model_dump(),
        }
    )


simulator = AvailabilitySimulator(store, on_update=broadcast_location)


async def _stats_loop() -> None:
    while True:
        try:
            await asyncio.sleep(6)
            await hub.broadcast({"type": "stats", "stats": store.global_stats().model_dump()})
        except asyncio.CancelledError:
            break
        except Exception:  # noqa: BLE001
            logger.exception("stats broadcast failed")


@asynccontextmanager
async def lifespan(_: FastAPI):
    if not _ingest_tokens():
        if os.getenv("CLOUD_REQUIRE_INGEST_AUTH", "").lower() in {"1", "true", "yes"}:
            raise RuntimeError(
                "CLOUD_REQUIRE_INGEST_AUTH is set but CLOUD_INGEST_TOKEN is empty; "
                "refusing to start with an unauthenticated ingest endpoint."
            )
        logger.warning(
            "ingest auth is DISABLED — POST /api/ingest is open. "
            "Set CLOUD_INGEST_TOKEN to require an X-API-Key (recommended in production)."
        )
    await store.connect()
    enable_sim = os.getenv("CLOUD_DISABLE_SIMULATOR", "").lower() not in {"1", "true", "yes"}
    if enable_sim:
        simulator.seed()
        simulator.start()
        logger.info("seeded %d demo locations and started live simulator", len(store._locations))
    stats_task = asyncio.create_task(_stats_loop())
    try:
        yield
    finally:
        stats_task.cancel()
        if enable_sim:
            await simulator.stop()
        await store.close()


app = FastAPI(title="Sightline Cloud API", version="1.0.0", lifespan=lifespan)

# Public read API: no credentials, so a wildcard origin is valid and safe.
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CLOUD_CORS_ORIGINS", "*").split(","),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


def _location_not_found(location_id: str) -> HTTPException:
    return HTTPException(status_code=404, detail=f"location '{location_id}' not found")


@app.get("/health")
async def health() -> dict[str, Any]:
    stats = store.global_stats()
    return {
        "status": "ok",
        "locations": stats.locations,
        "live_sites": stats.live_sites,
        "durable_store": store.pool is not None,
    }


@app.get("/api/stats", response_model=GlobalStats)
async def get_stats() -> GlobalStats:
    return store.global_stats()


@app.get("/api/locations", response_model=SearchResponse)
async def search_locations(
    q: str | None = Query(default=None, description="Free-text search across name/city/address"),
    lat: float | None = Query(default=None),
    lng: float | None = Query(default=None),
    radius_km: float | None = Query(default=None, ge=0),
    type: list[LocationType] | None = Query(default=None),
    amenity: list[Amenity] | None = Query(default=None),
    status: list[AvailabilityStatus] | None = Query(default=None),
    max_price: float | None = Query(default=None, ge=0),
    open_now: bool = Query(default=False),
    sort: str = Query(default="relevance"),
    limit: int = Query(default=60, ge=1, le=200),
    offset: int = Query(default=0, ge=0, le=100000),
) -> SearchResponse:
    origin = (lat, lng) if lat is not None and lng is not None else None
    results, total = store.search(
        q=q,
        origin=origin,
        radius_km=radius_km,
        types=type,
        amenities=amenity,
        statuses=status,
        max_price=max_price,
        open_now=open_now,
        sort=sort,
        limit=limit,
        offset=offset,
    )
    return SearchResponse(results=results, total=total, generated_at=time.time())


@app.get("/api/geocode", response_model=GeoResult)
async def geocode_place(
    q: str = Query(
        ..., min_length=1, max_length=200, description="Free-text place, neighborhood, or address"
    ),
) -> GeoResult:
    """Resolve a free-text place/neighborhood/address to a point so the client can
    recentre parking search around it. ``place`` is null when nothing matches."""

    place = await geocoder.geocode(q)
    return GeoResult(query=q, place=place)


@app.get("/api/locations/{location_id}", response_model=LocationDetail)
async def get_location(location_id: str, history_hours: int = Query(default=24, ge=1, le=168)) -> LocationDetail:
    detail = store.detail(location_id, history_hours)
    if detail is None:
        raise _location_not_found(location_id)
    return detail


@app.get("/api/locations/{location_id}/availability")
async def get_availability(location_id: str) -> dict[str, Any]:
    availability = store.availability_for(location_id)
    if availability is None:
        raise _location_not_found(location_id)
    return {"location_id": location_id, "availability": availability.model_dump()}


@app.post("/api/ingest", response_model=IngestAck, dependencies=[Depends(require_ingest_auth)])
async def ingest(payload: IngestPayload) -> IngestAck:
    """Receive an aggregate parking-detection snapshot from a ParkIQ site.

    If the site is unknown and metadata is supplied, the location self-registers.
    """

    total = payload.resolved_total()
    if store.get_location(payload.site_id) is None:
        if payload.metadata is None:
            raise HTTPException(
                status_code=404,
                detail=f"unknown site '{payload.site_id}'; include metadata to self-register",
            )
        store.register_from_metadata(payload.site_id, payload.metadata, total)
    elif payload.metadata is not None:
        store.register_from_metadata(payload.site_id, payload.metadata, total)

    availability = store.ingest(
        payload.site_id,
        available=payload.available,
        occupied=payload.occupied,
        total=total,
        timestamp=payload.timestamp,
    )
    await store.persist_snapshot(payload.site_id, availability)
    await broadcast_location(payload.site_id)
    return IngestAck(
        accepted=True,
        site_id=payload.site_id,
        status=availability.status,
        occupancy_pct=availability.occupancy_pct,
        received_at=time.time(),
    )


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    """Public, intentionally unauthenticated broadcast channel. Sends an initial
    snapshot of all location summaries + global stats, then live `availability`
    deltas and periodic `stats`. Only aggregate, non-sensitive data is sent."""
    await hub.connect(websocket)
    try:
        # Initial snapshot so a fresh client renders immediately.
        await websocket.send_json(
            {
                "type": "snapshot",
                "stats": store.global_stats().model_dump(),
                "locations": [s.model_dump() for s in store.list_summaries()],
            }
        )
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await hub.disconnect(websocket)
    except Exception:  # noqa: BLE001
        await hub.disconnect(websocket)
        raise
