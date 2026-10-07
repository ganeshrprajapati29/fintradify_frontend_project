import React, { useEffect, useMemo, useState } from 'react';

/* ------------------------------------------------------------------ */
/* Geo helpers (shared by the tracking page and the dashboard)         */
/* ------------------------------------------------------------------ */
export const isNum = (value) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));

export const metersBetween = (a, b) => {
  const R = 6371000;
  const dLat = (b[0] - a[0]) * Math.PI / 180;
  const dLng = (b[1] - a[1]) * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

// Compass bearing from a to b, degrees clockwise from north.
export const bearingBetween = (a, b) => {
  const lat1 = a[0] * Math.PI / 180;
  const lat2 = b[0] * Math.PI / 180;
  const dLng = (b[1] - a[1]) * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
};

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
export const compassOf = (bearing) => COMPASS[Math.round(bearing / 45) % 8];

export const formatDistance = (meters) => {
  const value = Number(meters);
  if (!Number.isFinite(value)) return '—';
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)} km`;
  return `${Math.round(value)} m`;
};

/* ------------------------------------------------------------------ */
/* Radar                                                               */
/* ------------------------------------------------------------------ */
export const RADAR_PRESETS = [1000, 5000, 25000, 100000, 500000, 1000000];
export const MAX_RADAR_KM = 20000;
const NICE_RANGES = [500, 1000, 2000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000, 2000000, 5000000, 10000000, 20000000];
export const niceRange = (meters) => NICE_RANGES.find((r) => r >= meters) || NICE_RANGES[NICE_RANGES.length - 1];

const LOG_FLOOR = 25; // metres drawn at the very centre on the log scale
const CORE = 0.05; // share of the radius used for 0..LOG_FLOOR

// Distance -> 0..1 of the radar radius. The log scale keeps someone 100 m away and
// someone 900 km away readable on the same screen.
const radial = (distance, range, scale) => {
  if (scale === 'linear') return Math.min(distance / range, 1);
  if (distance <= LOG_FLOOR) return (distance / LOG_FLOOR) * CORE;
  return Math.min(CORE + (1 - CORE) * (Math.log(distance / LOG_FLOOR) / Math.log(range / LOG_FLOOR)), 1);
};
const ringDistance = (fraction, range, scale) => (scale === 'linear'
  ? range * fraction
  : LOG_FLOOR * ((range / LOG_FLOOR) ** ((fraction - CORE) / (1 - CORE))));

const SWEEP_DEG_PER_SEC = 72; // one turn every 5 seconds

const useSweepAngle = () => {
  const [angle, setAngle] = useState(0);
  useEffect(() => {
    let frame;
    let last = 0;
    const started = performance.now();
    const tick = (time) => {
      if (time - last >= 40) {
        last = time;
        setAngle((((time - started) / 1000) * SWEEP_DEG_PER_SEC) % 360);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  return angle;
};

const polar = (c, r, bearing) => {
  const rad = bearing * Math.PI / 180;
  return [c + r * Math.sin(rad), c - r * Math.cos(rad)];
};

/**
 * blips: [{ id, name, label, color, live, distance (m), bearing (deg) }]
 */
const TrackingRadar = ({ blips, range, scale = 'log', selectedId, onSelect, centerLabel = 'Office', compact = false }) => {
  const angle = useSweepAngle();
  const size = 420;
  const c = size / 2;
  const R = compact ? 176 : 168;

  // Screen positions, merged when several people stand on the same spot.
  const clusters = useMemo(() => {
    const groups = new Map();
    blips.forEach((blip) => {
      const ratio = radial(blip.distance, range, scale);
      const [x, y] = polar(c, R * ratio, blip.bearing);
      const key = `${Math.round(x / 9)}:${Math.round(y / 9)}`;
      if (!groups.has(key)) groups.set(key, { key, x, y, items: [] });
      groups.get(key).items.push({ ...blip, beyond: blip.distance > range });
    });
    return [...groups.values()];
  }, [blips, range, scale, c, R]);

  const selected = blips.find((b) => b.id === selectedId);
  const liveCount = blips.filter((b) => b.live).length;
  const rings = [0.25, 0.5, 0.75, 1];

  // Fading sweep trail: thin wedges, brightest at the leading edge.
  const trail = Array.from({ length: 16 }, (_, i) => {
    const from = angle - (i + 1) * 3.5;
    const to = angle - i * 3.5;
    const [x1, y1] = polar(c, R, from);
    const [x2, y2] = polar(c, R, to);
    return <path key={i} d={`M ${c} ${c} L ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2} Z`} fill="#22c55e" fillOpacity={0.34 * (1 - i / 16)} />;
  });
  const [edgeX, edgeY] = polar(c, R, angle);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="tr-radar" role="img" aria-label="Employee radar">
      <defs>
        <radialGradient id="trRadarBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0b2a3f" />
          <stop offset="70%" stopColor="#061a2a" />
          <stop offset="100%" stopColor="#03101c" />
        </radialGradient>
        <filter id="trGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* bezel */}
      <circle cx={c} cy={c} r={R + 26} fill="#020b14" stroke="#16324a" strokeWidth="1.5" />
      <circle cx={c} cy={c} r={R} fill="url(#trRadarBg)" stroke="#22c55e" strokeOpacity="0.55" strokeWidth="1.4" />
      {Array.from({ length: 72 }, (_, i) => {
        const deg = i * 5;
        const major = deg % 30 === 0;
        const [x1, y1] = polar(c, R + 2, deg);
        const [x2, y2] = polar(c, R + (major ? 10 : 5), deg);
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#4ade80" strokeOpacity={major ? 0.8 : 0.35} strokeWidth={major ? 1.4 : 0.8} />;
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const deg = i * 30;
        const [x, y] = polar(c, R + 18, deg);
        const label = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' }[deg] || String(deg).padStart(3, '0');
        return <text key={deg} x={x} y={y + 3.5} textAnchor="middle" className={`tr-radar-deg ${label.length === 1 ? 'is-cardinal' : ''}`}>{label}</text>;
      })}

      {/* grid */}
      {rings.map((f) => (
        <g key={f}>
          <circle cx={c} cy={c} r={R * f} fill="none" stroke="#22c55e" strokeOpacity={f === 1 ? 0 : 0.22} strokeDasharray={f === 1 ? undefined : '2 4'} />
          {f < 1 && <text x={c + 5} y={c - R * f - 4} className="tr-radar-ring">{formatDistance(ringDistance(f, range, scale))}</text>}
        </g>
      ))}
      {[0, 45, 90, 135].map((deg) => {
        const [x1, y1] = polar(c, R, deg);
        const [x2, y2] = polar(c, R, deg + 180);
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#22c55e" strokeOpacity={deg % 90 === 0 ? 0.2 : 0.09} />;
      })}

      {/* sweep */}
      <g>{trail}</g>
      <line x1={c} y1={c} x2={edgeX} y2={edgeY} stroke="#86efac" strokeWidth="1.8" filter="url(#trGlow)" />

      {/* centre */}
      <circle cx={c} cy={c} r="4.5" fill="#f8fafc" />
      <circle cx={c} cy={c} r="9" fill="none" stroke="#f8fafc" strokeOpacity="0.45" />

      {/* contacts: bright when the sweep has just passed, fading until the next pass */}
      {clusters.map((cluster) => {
        const lead = cluster.items.find((b) => b.id === selectedId) || cluster.items[0];
        const since = (angle - lead.bearing + 360) % 360;
        const glow = 0.32 + 0.68 * ((1 - since / 360) ** 1.6);
        const isSelected = cluster.items.some((b) => b.id === selectedId);
        const count = cluster.items.length;
        const r = count > 1 ? 7.5 : isSelected ? 6.5 : 5;
        const title = cluster.items.map((b) => `${b.name} · ${b.label} · ${formatDistance(b.distance)} ${compassOf(b.bearing)}`).join('\n');
        return (
          <g key={cluster.key} className="tr-radar-blip" onClick={() => onSelect && onSelect(lead.id)} opacity={glow}>
            {since < 14 && <circle cx={cluster.x} cy={cluster.y} r={r + 6 + since} fill="none" stroke={lead.color} strokeOpacity={(14 - since) / 14} />}
            {lead.live && <circle cx={cluster.x} cy={cluster.y} r={r + 3} fill={lead.color} fillOpacity="0.25" />}
            <circle
              cx={cluster.x}
              cy={cluster.y}
              r={r}
              fill={lead.beyond ? 'none' : lead.color}
              stroke={isSelected ? '#facc15' : lead.beyond ? lead.color : '#e2e8f0'}
              strokeWidth={isSelected ? 2.4 : lead.beyond ? 2 : 0.8}
              filter="url(#trGlow)"
            />
            {count > 1 && <text x={cluster.x} y={cluster.y + 3.4} textAnchor="middle" className="tr-radar-count">{count}</text>}
            {isSelected && <text x={cluster.x} y={cluster.y - r - 6} textAnchor="middle" className="tr-radar-name">{(cluster.items.find((b) => b.id === selectedId) || lead).name}</text>}
            <title>{title}</title>
          </g>
        );
      })}

      {/* HUD */}
      <text x="12" y="20" className="tr-radar-hud">RANGE {formatDistance(range)}</text>
      <text x="12" y="34" className="tr-radar-hud dim">{scale === 'log' ? 'LOG SCALE' : 'LINEAR'} · {centerLabel.toUpperCase()}</text>
      <text x={size - 12} y="20" textAnchor="end" className="tr-radar-hud">CONTACTS {blips.length}</text>
      <text x={size - 12} y="34" textAnchor="end" className="tr-radar-hud dim">LIVE GPS {liveCount}</text>
      <text x="12" y={size - 14} className="tr-radar-hud dim">SWEEP {String(Math.round(angle)).padStart(3, '0')}°</text>
      {selected && (
        <text x={size - 12} y={size - 14} textAnchor="end" className="tr-radar-hud">
          {selected.name.split(' ')[0].toUpperCase()} · {String(Math.round(selected.bearing)).padStart(3, '0')}° {compassOf(selected.bearing)} · {formatDistance(selected.distance)}
        </text>
      )}
    </svg>
  );
};

export const radarStyles = `
  .tr-radar { width: 100%; display: block; margin: 0 auto; user-select: none; }
  .tr-radar-deg { fill: #4ade80; font-size: 9px; font-weight: 600; opacity: .75; font-family: ui-monospace, Menlo, Consolas, monospace; }
  .tr-radar-deg.is-cardinal { fill: #f8fafc; font-size: 11px; font-weight: 800; opacity: 1; }
  .tr-radar-ring { fill: #86efac; font-size: 9px; opacity: .8; font-family: ui-monospace, Menlo, Consolas, monospace; }
  .tr-radar-hud { fill: #86efac; font-size: 10.5px; font-weight: 700; letter-spacing: .06em; font-family: ui-monospace, Menlo, Consolas, monospace; }
  .tr-radar-hud.dim { fill: #4d7c63; font-weight: 600; }
  .tr-radar-count { fill: #04111f; font-size: 9px; font-weight: 800; pointer-events: none; }
  .tr-radar-name { fill: #fff; font-size: 11px; font-weight: 700; paint-order: stroke; stroke: #03101c; stroke-width: 3px; pointer-events: none; }
  .tr-radar-blip { cursor: pointer; }
`;

export default TrackingRadar;
