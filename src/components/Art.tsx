/** Brand artwork: logo, isometric blocks and coins. Decorative unless a label is given. */

export const BRAND = {
  blue: '#2552E8',
  orange: '#FF7A2F',
  yellow: '#FFC83D',
  ink: '#1C1A16',
  mint: '#7FC8A9',
};

/** Module colours, in module order 1–7. */
export const MODULE_COLORS = [BRAND.blue, BRAND.orange, BRAND.yellow, BRAND.mint, BRAND.blue, BRAND.orange, BRAND.yellow];
/** Readable text/icon colour on each module colour. */
export const MODULE_ON = ['#FFFFFF', BRAND.ink, BRAND.ink, BRAND.ink, '#FFFFFF', BRAND.ink, BRAND.ink];

function shade(hex: string, f: number): string {
  const h = hex.replace('#', '');
  const rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  const out = rgb.map((v) => Math.round(f >= 1 ? v + (255 - v) * (f - 1) : v * f));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

interface CubeProps {
  cx: number;
  cy: number;
  w: number;
  color: string;
  className?: string;
}

/** An isometric block centred on (cx, cy); w is half its width. */
export function Cube({ cx, cy, w, color, className }: CubeProps) {
  const d = w * 1.05;
  const top = `${cx},${cy - w / 2} ${cx + w},${cy} ${cx},${cy + w / 2} ${cx - w},${cy}`;
  const left = `${cx - w},${cy} ${cx},${cy + w / 2} ${cx},${cy + w / 2 + d} ${cx - w},${cy + d}`;
  const right = `${cx + w},${cy} ${cx},${cy + w / 2} ${cx},${cy + w / 2 + d} ${cx + w},${cy + d}`;
  return (
    <g className={className}>
      <polygon points={top} fill={shade(color, 1.25)} />
      <polygon points={left} fill={color} />
      <polygon points={right} fill={shade(color, 0.78)} />
    </g>
  );
}

export function Coin({ cx, cy, r = 14, className }: { cx: number; cy: number; r?: number; className?: string }) {
  return (
    <g className={className}>
      <circle cx={cx} cy={cy} r={r} fill={BRAND.yellow} stroke={BRAND.ink} strokeWidth={2.5} />
      <circle cx={cx} cy={cy} r={r - 5} fill="none" stroke={BRAND.ink} strokeWidth={1.5} strokeOpacity={0.5} />
    </g>
  );
}

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" aria-hidden="true">
      <rect x="1" y="1" width="13" height="13" rx="4" fill={BRAND.blue} />
      <rect x="16" y="1" width="13" height="13" rx="4" fill={BRAND.orange} />
      <rect x="1" y="16" width="13" height="13" rx="4" fill={BRAND.yellow} />
      <rect x="16" y="16" width="13" height="13" rx="4" className="logo-ink" />
    </svg>
  );
}

/** Hero: four linked blocks with practice coins travelling along the chain. */
export function HeroArt({ label, badge, badgeHref }: { label: string; badge: string; badgeHref?: string }) {
  return (
    <svg viewBox="0 0 560 480" className="hero-art" role="group" aria-label={label}>
      <path className="anim-dash" d="M96 352 L200 300 L304 248 L408 196 L470 165" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
      <Cube cx={110} cy={330} w={62} color={BRAND.blue} className="anim-float" />
      <Cube cx={222} cy={274} w={62} color={BRAND.orange} className="anim-float delay-1" />
      <Cube cx={334} cy={218} w={62} color={BRAND.yellow} className="anim-float delay-2" />
      <Cube cx={446} cy={162} w={62} color={BRAND.mint} className="anim-float" />
      <g className="anim-pop" style={{ transformOrigin: '446px 120px' }}>
        <circle cx={446} cy={120} r={24} fill="#FFFFFF" stroke={BRAND.ink} strokeWidth={3} />
        <path d="M435 120 l8 8 l14 -16" fill="none" stroke={BRAND.ink} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <Coin cx={110} cy={300} r={15} className="anim-coin" />
      <Coin cx={110} cy={300} r={15} className="anim-coin delay-coin" />
      <a href={badgeHref} className="hero-badge-link">
        <g transform="translate(30 404)">
          <rect width={210} height={52} rx={26} fill={BRAND.yellow} stroke={BRAND.ink} strokeWidth={2.5} />
          <text x={105} y={32} textAnchor="middle" fontFamily="Inter Variable, Inter, sans-serif" fontSize={17} fontWeight={800} fill={BRAND.ink}>
            {badge} →
          </text>
        </g>
      </a>
    </svg>
  );
}

export function ModuleCube({ index, size = 72 }: { index: number; size?: number }) {
  return (
    <svg width={size} height={size * 0.875} viewBox="0 0 96 84" aria-hidden="true">
      <Cube cx={48} cy={30} w={34} color={MODULE_COLORS[index]} />
    </svg>
  );
}

/** Small illustration in a consequence card: where the practice coin went. */
export function CoinPath({ tone, from, to }: { tone: 'good' | 'warn' | 'bad'; from: string; to: string }) {
  const bad = tone === 'bad';
  return (
    <svg viewBox="0 0 320 64" className={`coin-path tone-${tone}`} aria-hidden="true">
      <rect x={4} y={14} width={86} height={38} rx={12} className="cp-box" />
      <text x={47} y={38} textAnchor="middle" className="cp-text">{from}</text>
      <path className="anim-dash cp-line" d="M98 33 H222" fill="none" strokeWidth={2.5} strokeLinecap="round" />
      <Coin cx={160} cy={33} r={11} className="anim-slide" />
      <rect x={230} y={14} width={86} height={38} rx={12} className={bad ? 'cp-box cp-target-bad' : 'cp-box cp-target'} strokeDasharray={bad ? '4 4' : undefined} />
      <text x={273} y={38} textAnchor="middle" className="cp-text cp-target-text">{to}</text>
    </svg>
  );
}
