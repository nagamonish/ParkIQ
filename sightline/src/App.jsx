import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Logo } from "./components/Logo.jsx";
import { Hero } from "./components/Hero.jsx";
import { SearchBar } from "./components/SearchBar.jsx";
import { FilterBar } from "./components/FilterBar.jsx";
import { LocationCard } from "./components/LocationCard.jsx";
import { MapView } from "./components/MapView.jsx";
import { LocationDetail } from "./components/LocationDetail.jsx";
import { Icon } from "./components/Icon.jsx";
import { useLiveData } from "./hooks/useLiveData.js";
import { useGeolocation } from "./hooks/useGeolocation.js";
import { searchLocations, fetchStats, geocodePlace } from "./api.js";
import { DEFAULT_ORIGIN } from "./config.js";

const DEFAULT_FILTERS = {
  types: [],
  amenities: [],
  statuses: [],
  maxPrice: null,
  openNow: false,
  sort: "relevance",
};

const WS_LABEL = {
  connected: "Live",
  connecting: "Connecting",
  reconnecting: "Reconnecting",
  error: "Offline",
  closed: "Offline",
};

export default function App() {
  const [searchText, setSearchText] = useState("");
  const [query, setQuery] = useState("");
  const [place, setPlace] = useState(null); // geocoded {label, lat, lng} we're centred on, or null
  const [resolving, setResolving] = useState(false); // a geocode request is in flight
  const [resolveMiss, setResolveMiss] = useState(false); // last submit resolved to no place
  const [geoError, setGeoError] = useState(false); // last submit couldn't reach the geocoder
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [view, setView] = useState("list");
  const [origin, setOrigin] = useState(DEFAULT_ORIGIN);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [fetchedStats, setFetchedStats] = useState(null);
  const [heroVisible, setHeroVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  const { status: wsStatus, live, stats: liveStats } = useLiveData();
  const geo = useGeolocation();
  const heroSearchRef = useRef(null);
  const debounceRef = useRef(null);
  const searchTextRef = useRef(""); // current box text, for discarding stale async geocode results
  const stats = liveStats || fetchedStats;

  // A geocoded place takes precedence over the ambient (GPS / default) origin.
  const activeOrigin = useMemo(
    () => (place ? { lat: place.lat, lng: place.lng, label: place.label } : origin),
    [place, origin],
  );

  // Debounce the text box into the query that actually hits the API. The timer
  // id is tracked in a ref so an explicit search (Enter) can cancel a pending
  // tick that would otherwise re-populate `query` under a just-resolved place.
  useEffect(() => {
    searchTextRef.current = searchText;
    debounceRef.current = setTimeout(() => setQuery(searchText.trim()), 280);
    return () => clearTimeout(debounceRef.current);
  }, [searchText]);

  // Fallback stats (in case the socket is slow to deliver its snapshot).
  useEffect(() => {
    fetchStats().then(setFetchedStats).catch(() => {});
  }, []);

  // Adopt the visitor's real location once granted (and drop any place search +
  // typed text, since "near me" should show everything around the visitor
  // rather than a stale filter from a previous search).
  useEffect(() => {
    if (geo.status === "granted" && geo.coords) {
      setPlace(null);
      setSearchText("");
      setQuery("");
      setResolveMiss(false);
      setGeoError(false);
      setOrigin({ ...geo.coords, label: "Your location" });
      setFilters((f) => ({ ...f, sort: "distance" }));
    }
  }, [geo.status, geo.coords]);

  // The actual search request. When centred on a geocoded place we show parking
  // *near* it (distance-ranked) rather than text-filtering by the place name.
  useEffect(() => {
    let active = true;
    setLoading(true);
    searchLocations({
      q: place ? undefined : query || undefined,
      lat: activeOrigin?.lat,
      lng: activeOrigin?.lng,
      type: filters.types,
      amenity: filters.amenities,
      status: filters.statuses,
      max_price: filters.maxPrice ?? undefined,
      open_now: filters.openNow || undefined,
      sort: filters.sort,
      limit: 80,
    })
      .then((data) => {
        if (!active) return;
        setResults(data.results || []);
        setTotal(data.total || 0);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Could not reach Sightline");
        setResults([]);
        setTotal(0);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [query, place, activeOrigin, filters]);

  // Compact header search appears once the hero search scrolls away.
  useEffect(() => {
    const node = heroSearchRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(([entry]) => setHeroVisible(entry.isIntersecting), {
      rootMargin: "-72px 0px 0px 0px",
    });
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Merge the freshest live availability over the server-sorted results.
  const merged = useMemo(
    () => results.map((r) => ({ ...r, availability: live[r.id] || r.availability })),
    [results, live],
  );

  const updateFilters = useCallback((partial) => {
    setFilters((f) => ({ ...f, ...partial }));
    // A new filter context supersedes the previous submit's resolve outcome, so
    // an empty result is no longer attributable to "place not found / down".
    setResolveMiss(false);
    setGeoError(false);
  }, []);

  // Typing again exits "near a place" mode and resumes live text matching.
  const handleSearchChange = useCallback((value) => {
    setSearchText(value);
    setPlace(null);
    setResolveMiss(false);
    setGeoError(false);
  }, []);

  // Enter / submit: try to resolve the text to a place and recentre there;
  // if it isn't a known place, fall back to literal text matching.
  const runSearch = useCallback(async () => {
    // Cancel any pending debounce tick so it can't re-populate `query` after we
    // resolve a place below.
    clearTimeout(debounceRef.current);
    const text = searchText.trim();
    if (!text) {
      setPlace(null);
      setQuery("");
      setResolveMiss(false);
      setGeoError(false);
      return;
    }
    setResolving(true);
    try {
      const { place: found } = await geocodePlace(text);
      // If the box changed while we were resolving, this result is stale — drop
      // it so we never recentre on text the user has already moved on from.
      if (searchTextRef.current.trim() !== text) return;
      if (found) {
        setPlace(found);
        setQuery("");
        setResolveMiss(false);
        setGeoError(false);
        setFilters((f) => ({ ...f, sort: "distance" }));
      } else {
        setPlace(null);
        setQuery(text);
        setResolveMiss(true);
        setGeoError(false);
      }
    } catch {
      // Geocoder unreachable -> fall back to literal text search, but flag it so
      // the UI doesn't offer a "Search near…" action that can't do anything.
      setPlace(null);
      setQuery(text);
      setResolveMiss(false);
      setGeoError(true);
    } finally {
      setResolving(false);
    }
  }, [searchText]);

  const clearPlace = useCallback(() => {
    setPlace(null);
    setSearchText("");
    setQuery("");
    setResolveMiss(false);
    setGeoError(false);
  }, []);

  const handleUseLocation = useCallback(() => {
    // "Near me" shows everything around the visitor, so drop any place + text.
    clearTimeout(debounceRef.current);
    setPlace(null);
    setSearchText("");
    setQuery("");
    setResolveMiss(false);
    setGeoError(false);
    if (geo.status === "granted") {
      geo.clear();
      setOrigin(DEFAULT_ORIGIN);
    } else {
      geo.request();
    }
  }, [geo]);

  const handleQuick = useCallback(
    (action) => {
      if (action === "near") handleUseLocation();
      else if (action === "open") updateFilters({ openNow: true });
      else if (action === "open_spaces") updateFilters({ sort: "availability" });
      else if (action === "ev") {
        setFilters((f) => ({
          ...f,
          amenities: f.amenities.includes("ev_charging") ? f.amenities : [...f.amenities, "ev_charging"],
        }));
        setResolveMiss(false);
        setGeoError(false);
      }
      window.scrollTo({ top: heroSearchRef.current?.offsetTop ?? 0, behavior: "smooth" });
    },
    [handleUseLocation, updateFilters],
  );

  const searchProps = {
    value: searchText,
    onChange: handleSearchChange,
    onSubmit: runSearch,
    onUseLocation: handleUseLocation,
    geoStatus: geo.status,
    originLabel: origin?.label || "Near me",
    searching: resolving,
  };

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearchText("");
    setQuery("");
    setPlace(null);
    setResolveMiss(false);
    setGeoError(false);
  }, []);

  const closeDetail = useCallback(() => setSelected(null), []);

  return (
    <div className="app">
      <header className={`topbar ${scrolled ? "is-scrolled" : ""}`}>
        <Logo />
        <div className={`topbar-search ${!heroVisible ? "is-visible" : ""}`}>
          <SearchBar {...searchProps} compact />
        </div>
        <div className="topbar-right">
          <span className={`ws-pill ws-${wsStatus}`} title={`Realtime: ${wsStatus}`}>
            <span className="ws-dot" /> {WS_LABEL[wsStatus] || "…"}
          </span>
          <a className="topbar-link" href="http://localhost:5173" target="_blank" rel="noreferrer">
            Operators
          </a>
        </div>
      </header>

      <main>
        <Hero stats={stats} searchProps={searchProps} searchRef={heroSearchRef} onQuick={handleQuick} />

        <section className="results-wrap" id="results">
          <div className="filterbar-sticky">
            <FilterBar
              filters={filters}
              onChange={updateFilters}
              total={total}
              loading={loading}
              view={view}
              onViewChange={setView}
              onReset={resetFilters}
            />
          </div>

          {place && (
            <div className="search-context">
              <Icon name="pin" size={16} />
              <span>
                Parking near <strong>{place.label}</strong>
              </span>
              <button type="button" className="search-context-clear" onClick={clearPlace}>
                <Icon name="x" size={14} /> Clear
              </button>
            </div>
          )}

          {error && (
            <div className="banner banner--error">
              <Icon name="info" size={18} /> {error}. Is the Sightline cloud running on :8001?
            </div>
          )}

          {!error && !loading && merged.length === 0 && (
            <div className="empty-state">
              <Icon name="search" size={36} />
              {searchText.trim() && !place ? (
                geoError ? (
                  <>
                    <h3>Place search is unavailable</h3>
                    <p>
                      We couldn&apos;t reach the location service, so we&apos;re only matching names
                      for &ldquo;{searchText.trim()}&rdquo;. Try again in a moment.
                    </p>
                    <button className="btn-primary" onClick={runSearch} disabled={resolving}>
                      <Icon name="refresh" size={16} /> Try again
                    </button>
                    <button className="btn-text" onClick={resetFilters}>
                      Reset search
                    </button>
                  </>
                ) : resolveMiss ? (
                  <>
                    <h3>We couldn&apos;t find &ldquo;{searchText.trim()}&rdquo;</h3>
                    <p>Try a neighborhood (e.g. Marina, SoMa), a landmark, or a full street address.</p>
                    <button className="btn-text" onClick={resetFilters}>
                      Reset search
                    </button>
                  </>
                ) : (
                  <>
                    <h3>No matching parking</h3>
                    <p>No location is named &ldquo;{searchText.trim()}&rdquo;. Search the surrounding area instead?</p>
                    <button className="btn-primary" onClick={runSearch} disabled={resolving}>
                      <Icon name="pin" size={16} /> Search near &ldquo;{searchText.trim()}&rdquo;
                    </button>
                    <button className="btn-text" onClick={resetFilters}>
                      Reset search
                    </button>
                  </>
                )
              ) : (
                <>
                  <h3>No matching parking</h3>
                  <p>Try widening your filters or searching a different area.</p>
                  <button className="btn-primary" onClick={resetFilters}>
                    Reset search
                  </button>
                </>
              )}
            </div>
          )}

          {view === "list" ? (
            <div className={`card-grid ${loading && merged.length === 0 ? "is-loading" : ""}`}>
              {merged.length === 0 && loading
                ? Array.from({ length: 6 }).map((_, i) => <div className="card card--skeleton" key={i} />)
                : merged.map((loc) => <LocationCard key={loc.id} location={loc} onOpen={setSelected} />)}
            </div>
          ) : (
            <MapView locations={merged} origin={activeOrigin} onOpen={setSelected} selectedId={selected?.id} />
          )}
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <Logo size={24} />
          <p>
            Sightline aggregates anonymous parking-availability counts from ParkIQ camera sites. No video, no plates —
            just how many spaces are open, right now.
          </p>
          <span className="muted">© {new Date().getFullYear()} Sightline</span>
        </div>
      </footer>

      {selected && <LocationDetail location={selected} live={live} onClose={closeDetail} />}
    </div>
  );
}
