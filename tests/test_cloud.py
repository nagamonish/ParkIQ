import time

import pytest

from backend.cloud.models import (
    Amenity,
    AvailabilityStatus,
    IngestPayload,
    LocationType,
    SiteMetadata,
    status_for_occupancy,
)
from backend.cloud.seed import SEED_LOCATIONS, AvailabilitySimulator, demand_factor
from backend.cloud.store import CloudStore, haversine_km


@pytest.fixture()
def seeded_store():
    store = CloudStore()
    AvailabilitySimulator(store).seed()
    return store


def test_status_thresholds():
    assert status_for_occupancy(10.0) is AvailabilityStatus.available
    assert status_for_occupancy(70.0) is AvailabilityStatus.moderate
    assert status_for_occupancy(90.0) is AvailabilityStatus.busy
    assert status_for_occupancy(100.0) is AvailabilityStatus.full
    # No spaces left always reads as full regardless of percentage rounding.
    assert status_for_occupancy(88.0, available=0) is AvailabilityStatus.full


def test_seed_populates_locations(seeded_store):
    stats = seeded_store.global_stats()
    assert stats.locations == len(SEED_LOCATIONS)
    assert stats.total_spaces > 0
    assert stats.live_sites == len(SEED_LOCATIONS)


def test_ingest_updates_availability_and_status():
    store = CloudStore()
    store.register_from_metadata(
        "lot-1",
        SiteMetadata(name="Lot One", type=LocationType.lot, lat=37.0, lng=-122.0),
        total=100,
    )
    avail = store.ingest("lot-1", available=5, occupied=95, total=100)
    assert avail.available == 5
    assert avail.occupancy_pct == 95.0
    assert avail.status is AvailabilityStatus.busy
    assert avail.is_live is True


def test_full_when_no_spaces():
    store = CloudStore()
    store.register_from_metadata("lot-2", SiteMetadata(name="Lot Two"), total=50)
    avail = store.ingest("lot-2", available=0, occupied=50, total=50)
    assert avail.status is AvailabilityStatus.full


def test_stale_snapshot_marked_unknown():
    store = CloudStore()
    store.register_from_metadata("lot-3", SiteMetadata(name="Lot Three"), total=20)
    store.ingest("lot-3", available=10, occupied=10, total=20, timestamp=time.time() - 5000)
    avail = store.availability_for("lot-3")
    assert avail.is_live is False
    assert avail.status is AvailabilityStatus.unknown


def test_text_search(seeded_store):
    results, total = seeded_store.search(q="garage")
    assert total > 0
    assert all("garage" in (r.name + r.type.value).lower() or r.type is LocationType.garage for r in results)

    none, total_none = seeded_store.search(q="zzz-no-such-place")
    assert total_none == 0


def test_amenity_filter_is_conjunctive(seeded_store):
    results, _ = seeded_store.search(amenities=[Amenity.ev_charging, Amenity.valet])
    for r in results:
        assert Amenity.ev_charging in r.amenities and Amenity.valet in r.amenities


def test_distance_sort(seeded_store):
    origin = (37.788, -122.4074)  # Union Square
    results, _ = seeded_store.search(origin=origin, sort="distance", limit=5)
    distances = [r.distance_km for r in results]
    assert distances == sorted(distances)
    assert results[0].distance_km == pytest.approx(0.0, abs=0.05)


def test_status_filter(seeded_store):
    results, _ = seeded_store.search(statuses=[AvailabilityStatus.available])
    assert all(r.availability.status is AvailabilityStatus.available for r in results)


def test_pagination(seeded_store):
    page1, total = seeded_store.search(limit=3, offset=0)
    page2, _ = seeded_store.search(limit=3, offset=3)
    assert len(page1) == 3
    ids1 = {r.id for r in page1}
    ids2 = {r.id for r in page2}
    assert ids1.isdisjoint(ids2)


def test_detail_has_history_and_typical(seeded_store):
    detail = seeded_store.detail("union-square-garage", history_hours=24)
    assert detail is not None
    assert len(detail.history) > 0
    assert len(detail.typical_week) == 7
    assert len(detail.best_times) > 0


def test_self_registration_via_ingest_metadata():
    store = CloudStore()
    assert store.get_location("new-site") is None
    payload = IngestPayload(
        site_id="new-site",
        available=40,
        occupied=10,
        metadata=SiteMetadata(name="Fresh Lot", type=LocationType.lot, city="Testville"),
    )
    store.register_from_metadata(payload.site_id, payload.metadata, payload.resolved_total())
    store.ingest(payload.site_id, payload.available, payload.occupied, payload.resolved_total())
    loc = store.get_location("new-site")
    assert loc is not None and loc.name == "Fresh Lot"
    assert loc.total_spaces == 50


def test_haversine_known_distance():
    # SF to LA is ~559 km.
    km = haversine_km(37.7749, -122.4194, 34.0522, -118.2437)
    assert 540 < km < 580


def test_demand_factor_bounds():
    for loc_type in LocationType:
        for weekday in range(7):
            for hour in range(24):
                f = demand_factor(loc_type, weekday, hour)
                assert 0.0 <= f <= 1.0
