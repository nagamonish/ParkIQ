import { Icon } from "./Icon.jsx";

export function SearchBar({
  value,
  onChange,
  onSubmit,
  onUseLocation,
  geoStatus,
  originLabel,
  searching = false,
  compact = false,
  autoFocus = false,
}) {
  const locating = geoStatus === "locating";
  const located = geoStatus === "granted";
  return (
    <form
      className={`searchbar ${compact ? "searchbar--compact" : ""}`}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      role="search"
    >
      <Icon
        name={searching ? "refresh" : "search"}
        size={compact ? 18 : 22}
        className={`searchbar-icon ${searching ? "spin" : ""}`}
      />
      <input
        className="searchbar-input"
        type="text"
        value={value}
        autoFocus={autoFocus}
        placeholder={compact ? "Search parking…" : "Search a place, neighborhood, or address…"}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search parking locations"
      />
      {value && (
        <button type="button" className="searchbar-clear" onClick={() => onChange("")} aria-label="Clear search">
          <Icon name="x" size={16} />
        </button>
      )}
      <button
        type="button"
        className={`searchbar-loc ${located ? "is-active" : ""}`}
        onClick={onUseLocation}
        title={located ? `Showing distance from ${originLabel}` : "Use my location"}
      >
        <Icon name={locating ? "refresh" : "crosshair"} size={16} className={locating ? "spin" : ""} />
        <span className="searchbar-loc-label">{located ? originLabel : locating ? "Locating…" : "Near me"}</span>
      </button>
    </form>
  );
}
