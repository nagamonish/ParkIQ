export function Logo({ size = 26 }) {
  return (
    <span className="logo" aria-label="ParkIQ">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect width="32" height="32" rx="8.5" fill="currentColor" />
        <circle cx="16" cy="16" r="7" fill="none" stroke="#fff" strokeWidth="2.4" />
        <circle cx="16" cy="16" r="2.6" fill="#10b981" />
      </svg>
      <span className="logo-word">
        Park<span className="logo-iq">IQ</span>
      </span>
    </span>
  );
}
