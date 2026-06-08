from __future__ import annotations

import asyncio
import logging
import math
import random
import time
from datetime import datetime
from typing import Awaitable, Callable

from backend.cloud.models import (
    Amenity,
    Location,
    LocationType,
    OpeningHours,
)
from backend.cloud.store import WEEKDAYS, CloudStore

logger = logging.getLogger(__name__)

OnUpdate = Callable[[str], Awaitable[None]]


# ---------------------------------------------------------------------------
# Typical demand curves -- shape of a "normal" day per location type.
# Returns a 0..1 demand factor for a given weekday (0=Mon) and hour.
# ---------------------------------------------------------------------------


def _bell(hour: float, center: float, width: float, height: float) -> float:
    return height * math.exp(-((hour - center) ** 2) / (2 * width**2))


def demand_factor(loc_type: LocationType, weekday: int, hour: int) -> float:
    weekend = weekday >= 5
    h = float(hour)
    if loc_type in (LocationType.garage, LocationType.lot):
        base = 0.12
        if not weekend:
            base += _bell(h, 9.5, 2.0, 0.7) + _bell(h, 14.5, 2.6, 0.65)
        else:
            base += _bell(h, 13.5, 3.5, 0.45)
    elif loc_type == LocationType.transit:
        base = 0.18
        if not weekend:
            base += _bell(h, 8.0, 1.2, 0.78) + _bell(h, 17.5, 1.4, 0.7)
        else:
            base += _bell(h, 12.0, 4.0, 0.3)
    elif loc_type == LocationType.mall:
        base = 0.1 + _bell(h, 13.0, 3.0, 0.5) + _bell(h, 19.0, 2.4, 0.6)
        if weekend:
            base += 0.18
    elif loc_type == LocationType.airport:
        base = 0.55 + _bell(h, 6.5, 2.5, 0.2) + _bell(h, 17.0, 3.0, 0.25)
    elif loc_type == LocationType.stadium:
        base = 0.05
        if weekend:
            base += _bell(h, 19.5, 1.8, 0.9)
        else:
            base += _bell(h, 19.5, 1.5, 0.55)
    elif loc_type == LocationType.hospital:
        base = 0.45 + _bell(h, 11.0, 3.5, 0.35)
    elif loc_type == LocationType.university:
        base = 0.1
        if not weekend:
            base += _bell(h, 11.0, 3.0, 0.72)
    elif loc_type == LocationType.street:
        base = 0.2 + _bell(h, 12.5, 2.5, 0.3) + _bell(h, 20.0, 2.8, 0.55)
        if weekend:
            base += _bell(h, 22.0, 2.5, 0.25)
    else:
        base = 0.3
    return max(0.02, min(0.99, base))


# ---------------------------------------------------------------------------
# Seed locations (downtown San Francisco footprint).
# ---------------------------------------------------------------------------

A = Amenity
T = LocationType

SEED_LOCATIONS: list[Location] = [
    Location(
        id="union-square-garage",
        name="Union Square Garage",
        type=T.garage,
        operator="MetroPark SF",
        address="333 Post St",
        city="San Francisco",
        lat=37.7880,
        lng=-122.4074,
        total_spaces=985,
        amenities=[A.ev_charging, A.accessible, A.covered, A.open_24h, A.security, A.valet],
        price_per_hour=4.5,
        hours=OpeningHours(open_24h=True),
        description="Flagship downtown garage steps from Union Square shopping and theaters.",
        accent="#6366f1",
    ),
    Location(
        id="embarcadero-center",
        name="Embarcadero Center",
        type=T.garage,
        operator="MetroPark SF",
        address="4 Embarcadero Center",
        city="San Francisco",
        lat=37.7949,
        lng=-122.3990,
        total_spaces=1320,
        amenities=[A.ev_charging, A.accessible, A.covered, A.security, A.car_wash],
        price_per_hour=5.0,
        hours=OpeningHours(week=[[300, 1439]] * 7),
        description="Waterfront office and retail garage with EV banks on every level.",
        accent="#0ea5e9",
    ),
    Location(
        id="ferry-building-lot",
        name="Ferry Building Lot",
        type=T.lot,
        operator="Bayfront Parking Co.",
        address="1 Ferry Building",
        city="San Francisco",
        lat=37.7955,
        lng=-122.3937,
        total_spaces=240,
        amenities=[A.accessible, A.ev_charging, A.bike],
        price_per_hour=6.0,
        hours=OpeningHours(week=[[360, 1380]] * 7),
        description="Open-air lot beside the Ferry Building marketplace and farmers market.",
        accent="#14b8a6",
    ),
    Location(
        id="moscone-center",
        name="Moscone Center Garage",
        type=T.garage,
        operator="CityPark",
        address="255 3rd St",
        city="San Francisco",
        lat=37.7841,
        lng=-122.4010,
        total_spaces=760,
        amenities=[A.ev_charging, A.accessible, A.covered, A.security, A.height_clearance],
        price_per_hour=4.0,
        hours=OpeningHours(open_24h=True),
        description="Convention-district garage with oversized-vehicle clearance.",
        accent="#8b5cf6",
    ),
    Location(
        id="westfield-mall",
        name="Westfield Centre",
        type=T.mall,
        operator="Westfield Parking",
        address="845 Market St",
        city="San Francisco",
        lat=37.7841,
        lng=-122.4071,
        total_spaces=1100,
        amenities=[A.ev_charging, A.accessible, A.covered, A.valet, A.car_wash],
        price_per_hour=3.5,
        hours=OpeningHours(week=[[540, 1320]] * 7),
        description="Mall garage with validated parking and weekend valet.",
        accent="#ec4899",
    ),
    Location(
        id="sfo-garage-a",
        name="SFO International Garage A",
        type=T.airport,
        operator="SFO Airport",
        address="San Francisco Intl Airport",
        city="San Francisco",
        lat=37.6156,
        lng=-122.3892,
        total_spaces=3200,
        amenities=[A.ev_charging, A.accessible, A.covered, A.open_24h, A.security, A.height_clearance],
        price_per_hour=3.0,
        hours=OpeningHours(open_24h=True),
        description="Long- and short-term airport parking connected to the terminals via AirTrain.",
        accent="#f59e0b",
    ),
    Location(
        id="oracle-park",
        name="Oracle Park Lot A",
        type=T.stadium,
        operator="Giants Parking",
        address="24 Willie Mays Plaza",
        city="San Francisco",
        lat=37.7786,
        lng=-122.3893,
        total_spaces=5000,
        amenities=[A.accessible, A.security, A.motorcycle],
        price_per_hour=8.0,
        hours=OpeningHours(week=[[600, 1439]] * 7),
        description="Ballpark event parking on the bay; opens early on game days.",
        accent="#f97316",
    ),
    Location(
        id="ucsf-mission-bay",
        name="UCSF Mission Bay",
        type=T.university,
        operator="UCSF Transportation",
        address="1675 Owens St",
        city="San Francisco",
        lat=37.7679,
        lng=-122.3914,
        total_spaces=540,
        amenities=[A.ev_charging, A.accessible, A.covered, A.bike, A.security],
        price_per_hour=3.0,
        hours=OpeningHours(week=[[360, 1320], [360, 1320], [360, 1320], [360, 1320], [360, 1320], [480, 1080], None]),
        description="Campus structure for the Mission Bay research and hospital complex.",
        accent="#22c55e",
    ),
    Location(
        id="zuckerberg-sfgh",
        name="Zuckerberg SF General",
        type=T.hospital,
        operator="SF Health",
        address="1001 Potrero Ave",
        city="San Francisco",
        lat=37.7559,
        lng=-122.4049,
        total_spaces=420,
        amenities=[A.accessible, A.ev_charging, A.open_24h, A.security],
        price_per_hour=2.5,
        hours=OpeningHours(open_24h=True),
        description="Hospital visitor and patient parking, open around the clock.",
        accent="#06b6d4",
    ),
    Location(
        id="powell-bart",
        name="Powell St BART Lot",
        type=T.transit,
        operator="BART Parking",
        address="899 Market St",
        city="San Francisco",
        lat=37.7845,
        lng=-122.4079,
        total_spaces=310,
        amenities=[A.accessible, A.bike, A.security],
        price_per_hour=2.0,
        hours=OpeningHours(week=[[240, 1439]] * 7),
        description="Park-and-ride beside Powell Street station for downtown commuters.",
        accent="#3b82f6",
    ),
    Location(
        id="north-beach-street",
        name="North Beach Street Parking",
        type=T.street,
        operator="SFMTA",
        address="Columbus Ave",
        city="San Francisco",
        lat=37.8000,
        lng=-122.4090,
        total_spaces=180,
        amenities=[A.accessible, A.motorcycle],
        price_per_hour=2.5,
        hours=OpeningHours(week=[[420, 1380]] * 7),
        description="Metered street parking through the North Beach restaurant district.",
        accent="#ef4444",
    ),
    Location(
        id="hayes-valley-lot",
        name="Hayes Valley Lot",
        type=T.lot,
        operator="Bayfront Parking Co.",
        address="401 Hayes St",
        city="San Francisco",
        lat=37.7766,
        lng=-122.4244,
        total_spaces=150,
        amenities=[A.ev_charging, A.accessible, A.bike],
        price_per_hour=3.5,
        hours=OpeningHours(week=[[420, 1320]] * 7),
        description="Boutique-district surface lot near Hayes Street shops and cafes.",
        accent="#a855f7",
    ),
    Location(
        id="chase-center",
        name="Chase Center Garage",
        type=T.stadium,
        operator="Warriors Parking",
        address="1 Warriors Way",
        city="San Francisco",
        lat=37.7680,
        lng=-122.3877,
        total_spaces=950,
        amenities=[A.ev_charging, A.accessible, A.covered, A.security, A.valet],
        price_per_hour=9.0,
        hours=OpeningHours(week=[[600, 1439]] * 7),
        description="Arena garage for Warriors games and Chase Center concerts.",
        accent="#fbbf24",
    ),
    Location(
        id="presidio-main-post",
        name="Presidio Main Post",
        type=T.lot,
        operator="Presidio Trust",
        address="103 Montgomery St",
        city="San Francisco",
        lat=37.7989,
        lng=-122.4577,
        total_spaces=380,
        amenities=[A.ev_charging, A.accessible, A.bike],
        price_per_hour=2.0,
        hours=OpeningHours(week=[[360, 1320]] * 7),
        description="Parkside lot for Presidio trails, museums, and the Tunnel Tops.",
        accent="#10b981",
    ),
]


# Per-location "busyness" multiplier so similar types still differ.
_CAPACITY_BIAS = {
    "union-square-garage": 1.08,
    "westfield-mall": 1.05,
    "sfo-garage-a": 1.0,
    "north-beach-street": 1.12,
    "powell-bart": 1.05,
}


class AvailabilitySimulator:
    """Drives believable live availability for seeded sites by walking each
    location's occupancy along its typical daily curve with a little noise.

    This stands in for real ParkIQ sites pushing snapshots, so the public site
    is alive out of the box. Real ingests via /api/ingest override it."""

    def __init__(self, store: CloudStore, on_update: OnUpdate | None = None) -> None:
        self.store = store
        self.on_update = on_update
        self._task: asyncio.Task | None = None
        self._stop = asyncio.Event()
        self._noise: dict[str, float] = {}
        self.interval = 4.0

    def seed(self) -> None:
        rng = random.Random(7)
        for location in SEED_LOCATIONS:
            self.store.upsert_location(location)
            self._build_typical(location)
            self._backfill_history(location, rng)
            # Prime the live state at "now" so the first page load looks real.
            target = self._target_occupancy(location, time.time())
            occupied = int(round(location.total_spaces * target))
            occupied = min(location.total_spaces, max(0, occupied))
            self.store.ingest(
                location.id,
                available=location.total_spaces - occupied,
                occupied=occupied,
                total=location.total_spaces,
            )
            self._noise[location.id] = 0.0

    def _build_typical(self, location: Location) -> None:
        state = self.store._live.get(location.id)  # noqa: SLF001 - internal seeding
        if state is None:
            return
        for weekday, day in enumerate(WEEKDAYS):
            state.typical[day] = {
                hour: round(demand_factor(location.type, weekday, hour) * 100.0, 1)
                for hour in range(24)
            }

    def _backfill_history(self, location: Location, rng: random.Random) -> None:
        state = self.store._live.get(location.id)  # noqa: SLF001 - internal seeding
        if state is None:
            return
        now = time.time()
        for hours_ago in range(48, 0, -1):
            ts = now - hours_ago * 3600
            dt = datetime.fromtimestamp(ts)
            factor = demand_factor(location.type, dt.weekday(), dt.hour)
            factor *= _CAPACITY_BIAS.get(location.id, 1.0)
            factor = max(0.02, min(0.99, factor + rng.uniform(-0.05, 0.05)))
            occupied = int(round(location.total_spaces * factor))
            hour_epoch = int(ts // 3600) * 3600
            occ_pct = round((occupied / location.total_spaces) * 100.0, 1)
            state.hourly[hour_epoch] = {
                "sum": occ_pct,
                "count": 1.0,
                "available": location.total_spaces - occupied,
                "total": location.total_spaces,
            }

    def _target_occupancy(self, location: Location, ts: float) -> float:
        dt = datetime.fromtimestamp(ts)
        factor = demand_factor(location.type, dt.weekday(), dt.hour)
        factor *= _CAPACITY_BIAS.get(location.id, 1.0)
        return max(0.0, min(1.0, factor))

    def start(self) -> None:
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

    async def _run(self) -> None:
        while not self._stop.is_set():
            try:
                await self._tick()
            except Exception:  # noqa: BLE001 - keep the simulator alive.
                logger.exception("simulator tick failed")
            try:
                await asyncio.wait_for(self._stop.wait(), timeout=self.interval)
            except asyncio.TimeoutError:
                pass

    async def _tick(self) -> None:
        now = time.time()
        for location in SEED_LOCATIONS:
            target = self._target_occupancy(location, now)
            # Smooth random walk that drifts toward the typical target.
            noise = self._noise.get(location.id, 0.0)
            noise = noise * 0.8 + random.uniform(-0.03, 0.03)
            self._noise[location.id] = noise
            occ = max(0.0, min(1.0, target + noise))
            occupied = int(round(location.total_spaces * occ))
            occupied = min(location.total_spaces, max(0, occupied))
            self.store.ingest(
                location.id,
                available=location.total_spaces - occupied,
                occupied=occupied,
                total=location.total_spaces,
            )
            if self.on_update is not None:
                await self.on_update(location.id)
