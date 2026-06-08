import asyncio

from backend.cloud.geocode import (
    SF_BBOX,
    GAZETTEER,
    Geocoder,
    lookup_gazetteer,
    normalize,
)


def _in_sf(place):
    return SF_BBOX[0] <= place.lat <= SF_BBOX[1] and SF_BBOX[2] <= place.lng <= SF_BBOX[3]


def test_normalize_strips_punctuation_and_region():
    assert normalize("Fisherman's Wharf") == "fishermans wharf"
    assert normalize("SoMa, San Francisco, CA") == "soma"
    assert normalize("The Mission") == "mission"
    assert normalize("  AT&T   Park ") == "att park"


def test_gazetteer_exact_match():
    place = lookup_gazetteer("Marina")
    assert place is not None
    assert place.source == "gazetteer"
    assert place.label == "Marina District"
    assert _in_sf(place)


def test_gazetteer_alias_match():
    assert lookup_gazetteer("SoMa").label == "South of Market (SoMa)"
    assert lookup_gazetteer("FiDi").label == "Financial District"
    assert lookup_gazetteer("the haight").label == "Haight-Ashbury"


def test_gazetteer_landmark_with_apostrophe():
    place = lookup_gazetteer("Fisherman's Wharf")
    assert place is not None and place.label == "Fisherman's Wharf"


def test_gazetteer_phrase_containment_prefers_longest():
    # "mission bay" must win over the shorter "mission" alias.
    assert lookup_gazetteer("UCSF Mission Bay campus").label in {"Mission Bay", "UCSF Mission Bay"}
    assert lookup_gazetteer("parking near North Beach tonight").label == "North Beach"


def test_gazetteer_region_suffix_resolves_downtown():
    assert lookup_gazetteer("Downtown SF").label == "Downtown San Francisco"


def test_unknown_term_returns_none():
    assert lookup_gazetteer("zzz nowhere blvd 999") is None


def test_all_gazetteer_coords_inside_bbox():
    for key, (lat, lng, _label) in GAZETTEER.items():
        assert SF_BBOX[0] <= lat <= SF_BBOX[1], key
        assert SF_BBOX[2] <= lng <= SF_BBOX[3], key


def test_geocoder_offline_returns_gazetteer_hit():
    geo = Geocoder(use_nominatim=False)
    place = asyncio.run(geo.geocode("Hayes Valley"))
    assert place is not None and place.source == "gazetteer"


def test_geocoder_offline_unknown_is_none_without_network():
    geo = Geocoder(use_nominatim=False)
    assert asyncio.run(geo.geocode("totally unknown place 12345")) is None


def test_geocoder_blank_query_is_none():
    geo = Geocoder(use_nominatim=False)
    assert asyncio.run(geo.geocode("   ")) is None


def test_geocoder_nominatim_path_is_cached_and_best_effort(monkeypatch):
    geo = Geocoder(use_nominatim=True)
    calls = {"n": 0}

    from backend.cloud.models import GeoPlace

    def fake_lookup(query):
        calls["n"] += 1
        return GeoPlace(label="123 Fake St", lat=37.78, lng=-122.41, source="osm")

    monkeypatch.setattr(geo, "_nominatim_lookup", fake_lookup)
    first = asyncio.run(geo.geocode("123 Fake St"))
    second = asyncio.run(geo.geocode("123 Fake St"))
    assert first is not None and first.source == "osm"
    assert second == first
    assert calls["n"] == 1  # second call served from cache


def test_geocoder_nominatim_miss_degrades_to_none_and_is_cached(monkeypatch):
    # A genuine "no result" (None, no exception) reports not-found AND is cached,
    # so we don't re-hit Nominatim for the same dead query.
    geo = Geocoder(use_nominatim=True)
    calls = {"n": 0}

    def miss(query):
        calls["n"] += 1
        return None

    monkeypatch.setattr(geo, "_nominatim_lookup", miss)
    assert asyncio.run(geo.geocode("nonexistent address zzz")) is None
    assert asyncio.run(geo.geocode("nonexistent address zzz")) is None
    assert calls["n"] == 1  # genuine miss cached; second call served from cache


def test_geocoder_transient_error_is_not_cached(monkeypatch):
    # A network/parse error (raised) must NOT be cached as a permanent miss:
    # a later call should retry and can succeed.
    from backend.cloud.models import GeoPlace

    geo = Geocoder(use_nominatim=True)
    calls = {"n": 0}

    def flaky(query):
        calls["n"] += 1
        if calls["n"] == 1:
            raise OSError("transient network blip")
        return GeoPlace(label="100 Real St", lat=37.78, lng=-122.41, source="osm")

    monkeypatch.setattr(geo, "_nominatim_lookup", flaky)
    first = asyncio.run(geo.geocode("100 real st"))
    second = asyncio.run(geo.geocode("100 real st"))
    assert first is None  # transient error degrades to not-found...
    assert second is not None and second.source == "osm"  # ...but is retried, not cached
    assert calls["n"] == 2
