export function Logo({ size = 30 }) {
  return (
    <span className="logo">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill="url(#logo-grad)" />
        <circle cx="16" cy="16" r="7" fill="none" stroke="#0b1020" strokeWidth="2.6" />
        <circle cx="16" cy="16" r="2.4" fill="#0b1020" />
      </svg>
      <span className="logo-word">
        Sight<span className="logo-word-accent">line</span>
      </span>
    </span>
  );
}
