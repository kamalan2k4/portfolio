/**
 * Static eco-park vista: the zero-request poster shown before (or instead of) the 3D world.
 * Mirrors the world's palette and layout: mountains, falls, glass skyline, river.
 */
export function HeroLandscape({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden className={className}>
      <defs>
        <linearGradient id="hl-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1d22" />
          <stop offset="0.55" stopColor="#1d3b36" />
          <stop offset="0.8" stopColor="#c58b4e" stopOpacity="0.55" />
          <stop offset="1" stopColor="#e7b46f" stopOpacity="0.7" />
        </linearGradient>
        <radialGradient id="hl-sun" cx="0.68" cy="0.62" r="0.35">
          <stop offset="0" stopColor="#ffe2a8" stopOpacity="0.9" />
          <stop offset="0.25" stopColor="#f2b45a" stopOpacity="0.35" />
          <stop offset="1" stopColor="#f2b45a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hl-fog" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d7c9a8" stopOpacity="0" />
          <stop offset="1" stopColor="#d7c9a8" stopOpacity="0.28" />
        </linearGradient>
        <linearGradient id="hl-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bfe9e0" stopOpacity="0.55" />
          <stop offset="1" stopColor="#2f5d46" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="hl-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9f6f1" stopOpacity="0.85" />
          <stop offset="1" stopColor="#7dd3c0" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="hl-river" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7dd3c0" stopOpacity="0.15" />
          <stop offset="0.5" stopColor="#f6d39a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#7dd3c0" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      <rect width="1600" height="900" fill="url(#hl-sky)" />
      <rect width="1600" height="900" fill="url(#hl-sun)" />

      {/* Far mountains */}
      <path d="M0 560 L140 430 L260 500 L420 340 L560 470 L700 390 L860 520 L1010 360 L1160 470 L1300 380 L1450 480 L1600 410 V900 H0Z" fill="#3c5a57" fillOpacity="0.55" />
      <path d="M0 600 L180 500 L330 560 L470 470 L640 580 L820 500 L980 590 L1150 500 L1340 580 L1600 500 V900 H0Z" fill="#2a4741" fillOpacity="0.8" />

      {/* Waterfall cliff, left */}
      <path d="M150 640 L210 420 L330 400 L380 640Z" fill="#203a33" />
      <path d="M262 420 C 258 500, 270 560, 266 650 L 292 650 C 288 560, 296 500, 290 420Z" fill="url(#hl-water)" />
      <ellipse cx="279" cy="655" rx="60" ry="10" fill="#e9f6f1" fillOpacity="0.25" />

      {/* Glass skyline, centre-right */}
      <g fill="url(#hl-glass)" stroke="#e9f6f1" strokeOpacity="0.35" strokeWidth="1.5">
        <path d="M820 640 V430 Q 840 400 860 430 V640Z" />
        <path d="M880 640 V360 L 905 330 L 930 360 V640Z" />
        <path d="M950 640 V470 H 1010 V640Z" />
        <path d="M1030 640 V400 Q 1060 380 1090 400 V640Z" />
        <path d="M1110 640 V500 H 1150 V640Z" />
        <circle cx="760" cy="600" r="54" />
      </g>
      <path d="M708 600 H812" stroke="#e9f6f1" strokeOpacity="0.3" />
      {/* Air taxis */}
      <g fill="#ffe2a8">
        <ellipse cx="1180" cy="330" rx="12" ry="3.5" />
        <ellipse cx="740" cy="380" rx="9" ry="2.5" fillOpacity="0.8" />
      </g>

      <rect y="480" width="1600" height="220" fill="url(#hl-fog)" />

      {/* Mid hills with forest */}
      <path d="M0 700 C 200 640, 380 660, 560 690 S 960 650, 1160 680 S 1460 640, 1600 660 V900 H0Z" fill="#1a3229" />
      <g fill="#14281f">
        {Array.from({ length: 46 }, (_, i) => {
          const x = i * 36 + ((i * 17) % 13);
          const h = 34 + ((i * 29) % 30);
          const y = 690 - ((i * 13) % 24);
          return <path key={i} d={`M${x} ${y} l12 -${h} l12 ${h}z`} />;
        })}
      </g>

      {/* River with bridge */}
      <path d="M-20 820 C 300 760, 520 800, 760 770 S 1200 740, 1620 790 L1620 830 C 1200 790, 980 820, 760 810 S 300 820, -20 860Z" fill="url(#hl-river)" />
      <path d="M640 780 Q 760 720 880 776" fill="none" stroke="#ece6d6" strokeOpacity="0.55" strokeWidth="4" />

      {/* Foreground */}
      <path d="M0 860 C 300 820, 600 850, 900 840 S 1400 820, 1600 840 V900 H0Z" fill="#0c1a15" />
      <rect width="1600" height="900" fill="#07110d" fillOpacity="0.18" />
    </svg>
  );
}
