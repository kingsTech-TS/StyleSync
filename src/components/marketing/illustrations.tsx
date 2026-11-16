/* Flat garment illustrations for the marketing pages. Original artwork, fixed colors. */

const BODY =
  "M150 92 L120 100 C95 108 82 120 75 145 L42 355 C40 368 48 376 60 378 L92 382 C102 383 108 377 110 368 L122 250 L118 420 C118 432 126 440 140 440 L260 440 C274 440 282 432 282 420 L278 250 L290 368 C292 377 298 383 308 382 L340 378 C352 376 360 368 358 355 L325 145 C318 120 305 108 280 100 L250 92 C238 110 220 118 200 118 C180 118 162 110 150 92 Z";

/** An oversized hoodie with a color-block print, hanging on a hanger. */
export function StatementHoodie({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 470" className={className} role="img" aria-label="Color-block hoodie on a hanger">
      <defs>
        <clipPath id="mk-hoodie-body">
          <path d={BODY} />
        </clipPath>
        <linearGradient id="mk-hoodie-shade" x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.16" />
          <stop offset="0.22" stopColor="#000" stopOpacity="0" />
          <stop offset="0.78" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.18" />
        </linearGradient>
        <filter id="mk-hoodie-drop" x="-20%" y="-10%" width="140%" height="130%">
          <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#5a1512" floodOpacity="0.28" />
        </filter>
      </defs>

      {/* hanger */}
      <path d="M200 96 L200 58 C200 36 228 34 228 52 C228 62 218 64 214 58" fill="none" stroke="#2a2423" strokeWidth="6" strokeLinecap="round" />

      <g filter="url(#mk-hoodie-drop)">
        {/* hood lying back */}
        <path d="M138 100 C132 52 268 52 262 100 C240 84 160 84 138 100 Z" fill="#e6ddd3" />
        <path d={BODY} fill="#f7f2ec" />
        <g clipPath="url(#mk-hoodie-body)">
          {/* print */}
          <path d="M60 150 L200 300 L120 420 L30 330 Z" fill="#f0625d" />
          <path d="M200 300 L300 160 L380 260 L280 380 Z" fill="#1d1919" />
          <path d="M200 300 L280 380 L230 460 L150 460 Z" fill="#17a589" />
          <path d="M120 140 L200 300 L150 175 Z" fill="#17a589" />
          <path d="M300 160 L250 120 L200 300 Z" fill="#f0625d" />
          <g stroke="#1d1919" strokeWidth="9">
            <path d="M40 250 L110 238" />
            <path d="M40 274 L112 262" />
            <path d="M40 298 L114 286" />
          </g>
          <g stroke="#f0625d" strokeWidth="9">
            <path d="M290 250 L362 262" />
            <path d="M288 274 L364 286" />
          </g>
          <path d="M322 300 L360 290 L362 330 L330 336 Z" fill="#17a589" />
          {/* pocket */}
          <path d="M146 330 L254 330 L270 396 L130 396 Z" fill="#000" opacity="0.08" />
          <path d="M146 330 L254 330 L270 396 L130 396 Z" fill="none" stroke="#000" strokeOpacity="0.18" strokeWidth="2" />
          {/* hem + cuffs */}
          <rect x="110" y="418" width="180" height="24" fill="#ece5dc" />
          <path d="M42 352 L110 362 L106 384 L40 376 Z" fill="#ece5dc" />
          <path d="M358 352 L290 362 L294 384 L360 376 Z" fill="#ece5dc" />
          <g stroke="#000" strokeOpacity="0.07" strokeWidth="2">
            {Array.from({ length: 17 }, (_, i) => (
              <path key={i} d={`M${118 + i * 10} 420 L${118 + i * 10} 440`} />
            ))}
          </g>
          <path d={BODY} fill="url(#mk-hoodie-shade)" />
        </g>
        {/* neckline + drawstrings */}
        <path d="M150 92 C166 114 234 114 250 92 C234 102 166 102 150 92 Z" fill="#d9cfc4" />
        <path d="M178 112 C176 140 172 170 170 196" stroke="#f7f2ec" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M222 112 C224 140 228 170 230 196" stroke="#f7f2ec" strokeWidth="5" strokeLinecap="round" fill="none" />
        <rect x="165" y="194" width="10" height="16" rx="3" fill="#1d1919" />
        <rect x="225" y="194" width="10" height="16" rx="3" fill="#1d1919" />
      </g>
    </svg>
  );
}

export function TeeIllustration({ className, color = "#f7f2ec", print = "#f0625d" }: { className?: string; color?: string; print?: string }) {
  return (
    <svg viewBox="0 0 200 170" className={className} aria-hidden>
      <path d="M62 24 L86 14 C92 28 108 28 114 14 L138 24 L170 56 L150 76 L138 66 L138 156 L62 156 L62 66 L50 76 L30 56 Z" fill={color} />
      <path d="M86 14 C92 28 108 28 114 14 C108 22 92 22 86 14 Z" fill="#000" opacity="0.12" />
      <rect x="80" y="62" width="40" height="40" rx="6" fill={print} />
      <circle cx="100" cy="82" r="10" fill="#fff" opacity="0.85" />
      <path d="M62 66 L62 156 L72 156 L72 70 Z M138 66 L138 156 L128 156 L128 70 Z" fill="#000" opacity="0.07" />
    </svg>
  );
}

export function TrousersIllustration({ className, color = "#2f3b52" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 200 180" className={className} aria-hidden>
      <path d="M58 14 L142 14 L152 170 L112 170 L100 62 L88 170 L48 170 Z" fill={color} />
      <rect x="58" y="14" width="84" height="12" fill="#000" opacity="0.18" />
      <path d="M100 26 L100 62" stroke="#000" strokeOpacity="0.2" strokeWidth="2" />
      <path d="M70 26 L76 160 M130 26 L124 160" stroke="#fff" strokeOpacity="0.12" strokeWidth="2" />
    </svg>
  );
}

export function SneakerIllustration({ className, color = "#ffffff", accent = "#f0625d" }: { className?: string; color?: string; accent?: string }) {
  return (
    <svg viewBox="0 0 200 120" className={className} aria-hidden>
      <path d="M22 80 C22 52 48 40 70 42 L104 60 C138 62 168 66 180 80 Z" fill={color} />
      <path d="M70 42 L104 60 L96 80 L58 80 C60 64 64 52 70 42 Z" fill={accent} opacity="0.9" />
      <path d="M16 80 L184 80 C190 80 192 98 182 100 L26 100 C14 100 10 82 16 80 Z" fill="#1d1919" />
      <path d="M18 86 L186 86" stroke="#fff" strokeOpacity="0.5" strokeWidth="2" />
      <g stroke="#1d1919" strokeOpacity="0.5" strokeWidth="2.5" strokeLinecap="round">
        <path d="M108 60 L118 52" />
        <path d="M118 62 L128 54" />
        <path d="M128 64 L138 56" />
      </g>
    </svg>
  );
}

export function CapIllustration({ className, color = "#17a589" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 200 120" className={className} aria-hidden>
      <path d="M48 90 C48 34 152 34 152 90 Z" fill={color} />
      <path d="M100 38 L100 90" stroke="#000" strokeOpacity="0.15" strokeWidth="2" />
      <circle cx="100" cy="38" r="5" fill="#000" opacity="0.25" />
      <path d="M40 88 L178 88 C186 98 176 106 164 104 L44 98 Z" fill={color} />
      <path d="M40 88 L178 88 C186 98 176 106 164 104 L44 98 Z" fill="#000" opacity="0.18" />
    </svg>
  );
}

export function ToteIllustration({ className, color = "#e9c46a" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 200 180" className={className} aria-hidden>
      <path d="M72 60 C72 18 128 18 128 60" fill="none" stroke="#1d1919" strokeWidth="7" />
      <path d="M44 56 L156 56 L168 170 L32 170 Z" fill={color} />
      <path d="M44 56 L156 56 L158 74 L42 74 Z" fill="#000" opacity="0.1" />
      <path d="M80 110 L120 110" stroke="#1d1919" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

/** A loose brush stroke, like a marker swipe under a headline. */
export function BrushStroke({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 40" preserveAspectRatio="none" className={className} aria-hidden>
      <path
        d="M8 26 C120 10 260 8 420 14 C500 17 560 20 592 24 C560 30 470 32 360 31 C240 30 110 34 8 26 Z"
        fill="currentColor"
      />
    </svg>
  );
}
