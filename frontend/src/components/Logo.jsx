export default function Logo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="hp-logo-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1668E3" />
          <stop offset="0.6" stopColor="#0EA5B7" />
          <stop offset="1" stopColor="#10B981" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#hp-logo-grad)" />
      <g fill="#fff">
        <circle cx="14" cy="22" r="3.2" />
        <circle cx="20.5" cy="14.5" r="3.4" />
        <circle cx="27.5" cy="14.5" r="3.4" />
        <circle cx="34" cy="22" r="3.2" />
        <path d="M24 24c-5 0-9.5 5-9.5 9 0 3 2.6 4.4 5 3.7 1.7-.5 3-1 4.5-1s2.8.5 4.5 1c2.4.7 5-.7 5-3.7 0-4-4.5-9-9.5-9z" />
      </g>
    </svg>
  );
}