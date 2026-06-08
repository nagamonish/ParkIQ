"""Free-text place/neighborhood/address -> coordinates for Sightline search.

The public site invites visitors to "search a place, neighborhood, or address".
Sightline's own data is just a set of parking locations, so to honour that we
resolve the typed text to a point and then sort/centre nearby parking around it.

Resolution is a hybrid:

1. An offline San Francisco *gazetteer* of neighborhoods and landmarks. This is
   instant, needs no network, and covers the overwhelming majority of "place"
   and "neighborhood" searches for the demo's SF footprint.
2. A best-effort OpenStreetMap **Nominatim** fallback for arbitrary street
   addresses the gazetteer can't know. It is rate-limited, networked, and may be
   disabled (``SIGHTLINE_GEOCODER_NOMINATIM=0``); any failure degrades silently
   to "not found" so search always keeps working offline.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import re
import urllib.parse
import urllib.request
from collections import OrderedDict

from backend.cloud.models import GeoPlace

logger = logging.getLogger(__name__)

# Generous bounding box around San Francisco + near peninsula. Coordinates that
# fall outside are rejected so a stray same-named match elsewhere can't fling
# the map across the country. (min_lat, max_lat, min_lng, max_lng)
SF_BBOX = (37.40, 37.95, -122.70, -122.20)

# Nominatim viewbox biases results toward SF: "left,top,right,bottom" =
# (min_lng, max_lat, max_lng, min_lat).
_NOMINATIM_VIEWBOX = f"{SF_BBOX[2]},{SF_BBOX[1]},{SF_BBOX[3]},{SF_BBOX[0]}"


# ---------------------------------------------------------------------------
# Offline SF gazetteer. Coordinates are approximate district/landmark centroids
# -- precise enough to recentre distance sorting and the map, not survey-grade.
# ---------------------------------------------------------------------------

GAZETTEER: dict[str, tuple[float, float, str]] = {
    # Downtown / central
    "union square": (37.7880, -122.4074, "Union Square"),
    "downtown": (37.7880, -122.4060, "Downtown San Francisco"),
    "financial district": (37.7946, -122.3999, "Financial District"),
    "south of market": (37.7785, -122.4056, "South of Market (SoMa)"),
    "yerba buena": (37.7847, -122.4029, "Yerba Buena"),
    "civic center": (37.7796, -122.4177, "Civic Center"),
    "tenderloin": (37.7840, -122.4140, "Tenderloin"),
    "hayes valley": (37.7763, -122.4241, "Hayes Valley"),
    # Hills & north
    "nob hill": (37.7930, -122.4161, "Nob Hill"),
    "russian hill": (37.8010, -122.4180, "Russian Hill"),
    "telegraph hill": (37.8021, -122.4058, "Telegraph Hill"),
    "north beach": (37.8003, -122.4103, "North Beach"),
    "chinatown": (37.7941, -122.4078, "Chinatown"),
    "embarcadero": (37.7955, -122.3937, "The Embarcadero"),
    # Marina / Pac Heights / Presidio
    "marina": (37.8030, -122.4360, "Marina District"),
    "cow hollow": (37.7975, -122.4368, "Cow Hollow"),
    "pacific heights": (37.7925, -122.4382, "Pacific Heights"),
    "presidio heights": (37.7880, -122.4530, "Presidio Heights"),
    "presidio": (37.7989, -122.4662, "The Presidio"),
    "japantown": (37.7849, -122.4294, "Japantown"),
    "western addition": (37.7805, -122.4324, "Western Addition"),
    "fillmore": (37.7840, -122.4330, "Fillmore District"),
    # Central / Haight
    "haight ashbury": (37.7700, -122.4469, "Haight-Ashbury"),
    "cole valley": (37.7656, -122.4500, "Cole Valley"),
    "duboce triangle": (37.7690, -122.4330, "Duboce Triangle"),
    "alamo square": (37.7763, -122.4329, "Alamo Square"),
    # Mission & south-central
    "mission bay": (37.7700, -122.3900, "Mission Bay"),
    "mission district": (37.7599, -122.4148, "Mission District"),
    "dolores park": (37.7596, -122.4269, "Dolores Park"),
    "castro": (37.7609, -122.4350, "The Castro"),
    "noe valley": (37.7502, -122.4337, "Noe Valley"),
    "potrero hill": (37.7585, -122.4000, "Potrero Hill"),
    "dogpatch": (37.7570, -122.3880, "Dogpatch"),
    "bernal heights": (37.7390, -122.4156, "Bernal Heights"),
    "glen park": (37.7338, -122.4337, "Glen Park"),
    "diamond heights": (37.7430, -122.4400, "Diamond Heights"),
    "twin peaks": (37.7510, -122.4476, "Twin Peaks"),
    # West side
    "inner sunset": (37.7600, -122.4660, "Inner Sunset"),
    "outer sunset": (37.7530, -122.4940, "Outer Sunset"),
    "sunset": (37.7530, -122.4940, "The Sunset"),
    "inner richmond": (37.7800, -122.4640, "Inner Richmond"),
    "outer richmond": (37.7770, -122.4960, "Outer Richmond"),
    "richmond": (37.7800, -122.4640, "The Richmond"),
    "sea cliff": (37.7855, -122.4900, "Sea Cliff"),
    "west portal": (37.7405, -122.4663, "West Portal"),
    "lake merced": (37.7250, -122.4900, "Lake Merced"),
    # South
    "bayview": (37.7299, -122.3870, "Bayview"),
    "excelsior": (37.7240, -122.4300, "Excelsior"),
    "outer mission": (37.7240, -122.4460, "Outer Mission"),
    "ingleside": (37.7230, -122.4560, "Ingleside"),
    "portola": (37.7270, -122.4060, "Portola"),
    "visitacion valley": (37.7180, -122.4050, "Visitacion Valley"),
    # Landmarks
    "fishermans wharf": (37.8080, -122.4177, "Fisherman's Wharf"),
    "pier 39": (37.8087, -122.4098, "Pier 39"),
    "ghirardelli square": (37.8059, -122.4230, "Ghirardelli Square"),
    "coit tower": (37.8024, -122.4058, "Coit Tower"),
    "lombard street": (37.8021, -122.4187, "Lombard Street"),
    "ferry building": (37.7955, -122.3937, "Ferry Building"),
    "golden gate park": (37.7694, -122.4862, "Golden Gate Park"),
    "golden gate bridge": (37.8199, -122.4783, "Golden Gate Bridge"),
    "palace of fine arts": (37.8029, -122.4485, "Palace of Fine Arts"),
    "lands end": (37.7800, -122.5070, "Lands End"),
    "ocean beach": (37.7594, -122.5107, "Ocean Beach"),
    "city hall": (37.7793, -122.4193, "San Francisco City Hall"),
    "moscone center": (37.7841, -122.4010, "Moscone Center"),
    "salesforce park": (37.7896, -122.3960, "Salesforce Park"),
    "salesforce tower": (37.7897, -122.3972, "Salesforce Tower"),
    "westfield centre": (37.7841, -122.4071, "Westfield Centre"),
    "oracle park": (37.7786, -122.3893, "Oracle Park"),
    "chase center": (37.7680, -122.3877, "Chase Center"),
    "sutro tower": (37.7553, -122.4528, "Sutro Tower"),
    "alcatraz": (37.8267, -122.4230, "Alcatraz Island"),
    # Transit hubs
    "powell street station": (37.7845, -122.4079, "Powell Street Station"),
    "montgomery station": (37.7894, -122.4019, "Montgomery Station"),
    "embarcadero station": (37.7929, -122.3969, "Embarcadero Station"),
    "caltrain": (37.7766, -122.3947, "Caltrain (4th & King)"),
    "sfo": (37.6213, -122.3790, "San Francisco Int'l Airport"),
    "ucsf mission bay": (37.7679, -122.3914, "UCSF Mission Bay"),
}

# Common nicknames / abbreviations -> a canonical gazetteer key.
ALIASES: dict[str, str] = {
    "soma": "south of market",
    "fidi": "financial district",
    "sf": "downtown",
    "san francisco": "downtown",
    "market street": "downtown",
    "mission": "mission district",
    "the mission": "mission district",
    "haight": "haight ashbury",
    "haight street": "haight ashbury",
    "wharf": "fishermans wharf",
    "pac heights": "pacific heights",
    "painted ladies": "alamo square",
    "dolores": "dolores park",
    "att park": "oracle park",
    "giants stadium": "oracle park",
    "warriors arena": "chase center",
    "transbay": "salesforce park",
    "transbay terminal": "salesforce park",
    "salesforce transit center": "salesforce park",
    "ucsf": "ucsf mission bay",
    "powell": "powell street station",
    "airport": "sfo",
    "sf airport": "sfo",
    "san francisco airport": "sfo",
    "westfield": "westfield centre",
    "westfield mall": "westfield centre",
}

_REGION_SUFFIXES = (
    " san francisco",
    " sf",
    " ca",
    " california",
    " usa",
    " united states",
)


def normalize(text: str) -> str:
    """Lowercase, strip punctuation/region qualifiers, and drop a leading 'the'."""

    s = text.lower().strip()
    for ch in "'’&.,":
        s = s.replace(ch, "")
    s = re.sub(r"[^a-z0-9 ]+", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    # Trim trailing "..., San Francisco, CA" style qualifiers (but never to empty).
    changed = True
    while changed:
        changed = False
        for suffix in _REGION_SUFFIXES:
            if s.endswith(suffix) and len(s) > len(suffix):
                s = s[: -len(suffix)].strip()
                changed = True
    if s.startswith("the "):
        s = s[4:].strip()
    return s


def _resolve_key(key: str) -> str | None:
    """Map a normalized query to a gazetteer key via exact, alias, or phrase match."""

    if key in GAZETTEER:
        return key
    if key in ALIASES:
        return ALIASES[key]
    # Phrase containment: e.g. "parking near north beach" -> "north beach".
    # Prefer the longest matching name so "mission bay" beats "mission".
    padded = f" {key} "
    best: str | None = None
    for name in (*GAZETTEER.keys(), *ALIASES.keys()):
        if f" {name} " in padded and (best is None or len(name) > len(best)):
            best = name
    if best is None:
        return None
    return best if best in GAZETTEER else ALIASES[best]


def lookup_gazetteer(text: str) -> GeoPlace | None:
    """Resolve free text against the offline SF gazetteer. None if no match."""

    key = normalize(text)
    if not key:
        return None
    resolved = _resolve_key(key)
    if resolved is None:
        return None
    lat, lng, label = GAZETTEER[resolved]
    return GeoPlace(label=label, lat=lat, lng=lng, source="gazetteer")


def _in_sf_bbox(lat: float, lng: float) -> bool:
    return SF_BBOX[0] <= lat <= SF_BBOX[1] and SF_BBOX[2] <= lng <= SF_BBOX[3]


class Geocoder:
    """Resolves free-text places to coordinates: offline gazetteer first, then a
    best-effort Nominatim lookup for arbitrary addresses."""

    def __init__(self, *, use_nominatim: bool | None = None) -> None:
        if use_nominatim is None:
            use_nominatim = os.getenv("SIGHTLINE_GEOCODER_NOMINATIM", "1").lower() not in {
                "0",
                "false",
                "no",
                "",
            }
        self.use_nominatim = use_nominatim
        self.endpoint = os.getenv("NOMINATIM_URL", "https://nominatim.openstreetmap.org/search")
        self.user_agent = os.getenv(
            "NOMINATIM_USER_AGENT", "Sightline-Parking/1.0 (+https://sightline.app)"
        )
        self.timeout = float(os.getenv("NOMINATIM_TIMEOUT", "3.0"))
        # Guards only the (fast) cache dict, so a slow network call never blocks
        # cache hits or unrelated lookups.
        self._cache_lock = asyncio.Lock()
        # Politeness toward Nominatim: at most one outbound call at a time.
        self._net_sem = asyncio.Semaphore(1)
        # Bounded LRU so an attacker can't grow memory with unique queries.
        self._cache_max = int(os.getenv("SIGHTLINE_GEOCODER_CACHE_MAX", "2048"))
        self._cache: OrderedDict[str, GeoPlace | None] = OrderedDict()

    async def geocode(self, query: str) -> GeoPlace | None:
        text = (query or "").strip()
        if not text:
            return None

        # 1. Offline gazetteer -- instant, no network.
        place = lookup_gazetteer(text)
        if place is not None:
            return place

        # 2. Networked fallback for arbitrary addresses (best-effort).
        if not self.use_nominatim:
            return None
        cache_key = normalize(text)

        async with self._cache_lock:
            if cache_key in self._cache:
                self._cache.move_to_end(cache_key)
                return self._cache[cache_key]

        # Network call OUTSIDE the cache lock. A transient failure raises here and
        # is deliberately NOT cached, so a one-off blip isn't remembered forever.
        try:
            async with self._net_sem:
                result = await asyncio.to_thread(self._nominatim_lookup, text)
        except Exception:  # noqa: BLE001 - any failure -> "not found", search still works.
            logger.debug("nominatim geocode failed for %r", text, exc_info=True)
            return None

        async with self._cache_lock:
            self._cache[cache_key] = result
            self._cache.move_to_end(cache_key)
            while len(self._cache) > self._cache_max:
                self._cache.popitem(last=False)
        return result

    def _nominatim_lookup(self, query: str) -> GeoPlace | None:
        """Returns a GeoPlace, or None for a genuine no-match / out-of-area result.
        Network, HTTP, and parse errors propagate so the caller can avoid caching
        a transient failure as a permanent miss."""

        params = urllib.parse.urlencode(
            {
                "q": query,
                "format": "jsonv2",
                "limit": "1",
                "addressdetails": "0",
                "countrycodes": "us",
                "viewbox": _NOMINATIM_VIEWBOX,
                "bounded": "1",
            }
        )
        request = urllib.request.Request(
            f"{self.endpoint}?{params}", headers={"User-Agent": self.user_agent}
        )
        with urllib.request.urlopen(request, timeout=self.timeout) as response:
            payload = json.loads(response.read().decode("utf-8"))

        if not isinstance(payload, list) or not payload:
            return None
        top = payload[0]
        try:
            lat = float(top["lat"])
            lng = float(top["lon"])
        except (KeyError, TypeError, ValueError):
            return None
        if not _in_sf_bbox(lat, lng):
            return None
        display = str(top.get("display_name", query))
        # Shorten the long OSM display string to the first couple of parts.
        label = ", ".join(part.strip() for part in display.split(",")[:2]) or query
        return GeoPlace(label=label, lat=lat, lng=lng, source="osm")
