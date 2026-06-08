from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------


class LocationType(str, Enum):
    garage = "garage"
    lot = "lot"
    street = "street"
    mall = "mall"
    airport = "airport"
    stadium = "stadium"
    hospital = "hospital"
    university = "university"
    transit = "transit"


class Amenity(str, Enum):
    ev_charging = "ev_charging"
    accessible = "accessible"
    covered = "covered"
    open_24h = "open_24h"
    security = "security"
    valet = "valet"
    motorcycle = "motorcycle"
    bike = "bike"
    car_wash = "car_wash"
    height_clearance = "height_clearance"


class AvailabilityStatus(str, Enum):
    """Public-facing congestion tier derived from occupancy percentage."""

    available = "available"  # plenty of space
    moderate = "moderate"  # filling up
    busy = "busy"  # nearly full
    full = "full"  # no space
    unknown = "unknown"  # no recent data


# Thresholds (occupancy %) for each tier. Edges are inclusive of the lower bound.
STATUS_THRESHOLDS: tuple[tuple[float, AvailabilityStatus], ...] = (
    (0.0, AvailabilityStatus.available),
    (60.0, AvailabilityStatus.moderate),
    (85.0, AvailabilityStatus.busy),
    (100.0, AvailabilityStatus.full),
)

# A snapshot older than this (seconds) is treated as stale / unknown.
STALE_AFTER_SECONDS = 600.0


def status_for_occupancy(occupancy_pct: float, available: int | None = None) -> AvailabilityStatus:
    """Map an occupancy percentage to a public congestion tier."""

    if available is not None and available <= 0:
        return AvailabilityStatus.full

    # Defensive clamp: a malformed upstream count must never escape the tiers.
    occupancy_pct = max(0.0, min(100.0, occupancy_pct))
    tier = AvailabilityStatus.available
    for threshold, candidate in STATUS_THRESHOLDS:
        if occupancy_pct >= threshold:
            tier = candidate
    return tier


# ---------------------------------------------------------------------------
# Public-facing read models
# ---------------------------------------------------------------------------


class OpeningHours(BaseModel):
    open_24h: bool = False
    # 7-element list (Mon..Sun); each is [open_minute, close_minute] or null when closed.
    week: list[list[int] | None] = Field(default_factory=lambda: [[480, 1320]] * 7)


class Availability(BaseModel):
    available: int = 0
    occupied: int = 0
    total: int = 0
    occupancy_pct: float = 0.0
    status: AvailabilityStatus = AvailabilityStatus.unknown
    updated_at: float | None = None
    age_seconds: float | None = None
    is_live: bool = False
    # Recent occupancy_pct samples for a sparkline (oldest -> newest).
    trend: list[float] = Field(default_factory=list)


class Location(BaseModel):
    id: str
    name: str
    type: LocationType
    operator: str
    address: str
    city: str
    lat: float
    lng: float
    total_spaces: int
    amenities: list[Amenity] = Field(default_factory=list)
    price_per_hour: float | None = None
    currency: str = "USD"
    hours: OpeningHours = Field(default_factory=OpeningHours)
    description: str | None = None
    # Decorative gradient seed so the UI can render a consistent cover per site.
    accent: str = "#6366f1"


class LocationSummary(Location):
    """A location plus its live availability and (optionally) distance."""

    availability: Availability = Field(default_factory=Availability)
    distance_km: float | None = None


class HistoryPoint(BaseModel):
    bucket: str
    occupancy_pct: float
    available: int
    total: int


class TypicalPoint(BaseModel):
    hour: int
    occupancy_pct: float


class LocationDetail(LocationSummary):
    history: list[HistoryPoint] = Field(default_factory=list)
    typical_week: dict[str, list[TypicalPoint]] = Field(default_factory=dict)
    best_times: list[str] = Field(default_factory=list)


class SearchResponse(BaseModel):
    results: list[LocationSummary]
    total: int
    generated_at: float


class GlobalStats(BaseModel):
    locations: int
    cities: int
    total_spaces: int
    available_now: int
    live_sites: int
    avg_occupancy_pct: float


class GeoPlace(BaseModel):
    """A free-text search term resolved to a point on the map."""

    label: str
    lat: float
    lng: float
    source: str  # "gazetteer" (offline SF index) or "osm" (Nominatim)


class GeoResult(BaseModel):
    """Geocode response. ``place`` is null when the term couldn't be resolved,
    which lets the client cleanly fall back to literal text matching."""

    query: str
    place: GeoPlace | None = None


# ---------------------------------------------------------------------------
# Ingest models (what a ParkIQ site pushes up to the cloud)
# ---------------------------------------------------------------------------


class SiteMetadata(BaseModel):
    """Optional metadata an operator can send so the cloud can self-register
    a location the first time it reports in."""

    name: str | None = None
    type: LocationType | None = None
    operator: str | None = None
    address: str | None = None
    city: str | None = None
    lat: float | None = None
    lng: float | None = None
    amenities: list[Amenity] | None = None
    price_per_hour: float | None = None
    currency: str | None = None
    hours: OpeningHours | None = None
    description: str | None = None
    accent: str | None = None


class IngestPayload(BaseModel):
    """A single parking-detection snapshot from one ParkIQ site.

    Only aggregate counts cross the wire -- no video, no per-vehicle data.
    """

    site_id: str = Field(..., min_length=1)
    available: int = Field(..., ge=0)
    occupied: int = Field(..., ge=0)
    total: int | None = Field(default=None, ge=0)
    timestamp: float | None = None
    metadata: SiteMetadata | None = None

    def resolved_total(self) -> int:
        if self.total is not None:
            return self.total
        return self.available + self.occupied


class IngestAck(BaseModel):
    accepted: bool
    site_id: str
    status: AvailabilityStatus
    occupancy_pct: float
    received_at: float


class WSMessage(BaseModel):
    type: str
    location_id: str | None = None
    availability: Availability | None = None
    stats: GlobalStats | None = None
    payload: dict[str, Any] | None = None
