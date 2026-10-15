import React, { useEffect, useRef } from 'react';
import { getSocket } from '../utils/realtime';

/* Shared look and helpers for the monitoring pages
   (Employee Monitor, Activity Tracking, Activity Alerts). */

export const TZ = 'Asia/Kolkata';

export const PUNCH_STATUS = {
  on_duty: { label: 'On duty', color: '#15803d', soft: '#dcfce7' },
  punched_out: { label: 'Punched out', color: '#1d4ed8', soft: '#dbeafe' },
  not_punched: { label: 'Not punched in', color: '#b91c1c', soft: '#fee2e2' },
  missed_out: { label: 'Missed punch-out', color: '#c2410c', soft: '#ffedd5' },
  on_leave: { label: 'On leave', color: '#6d28d9', soft: '#ede9fe' },
  weekly_off: { label: 'Weekly off', color: '#475569', soft: '#e2e8f0' },
  holiday: { label: 'Holiday', color: '#0369a1', soft: '#e0f2fe' },
};

export const LOCATION_STATUS = {
  live: { label: 'Live (app GPS)', short: 'Live', color: '#15803d', soft: '#dcfce7' },
  web_only: { label: 'Website only', short: 'Website', color: '#0e7490', soft: '#cffafe' },
  gps_off: { label: 'GPS off', short: 'GPS off', color: '#dc2626', soft: '#fee2e2' },
  permission_off: { label: 'Permission off', short: 'No permission', color: '#dc2626', soft: '#fee2e2' },
  signal_lost: { label: 'Phone silent', short: 'Silent', color: '#ea580c', soft: '#ffedd5' },
  logged_out: { label: 'Logged out of app', short: 'Logged out', color: '#64748b', soft: '#f1f5f9' },
  paused: { label: 'Paused (off duty)', short: 'Paused', color: '#64748b', soft: '#f1f5f9' },
  stale: { label: 'No recent location', short: 'Not recent', color: '#d97706', soft: '#fef3c7' },
  no_app: { label: 'App not set up', short: 'No app', color: '#94a3b8', soft: '#f1f5f9' },
};

export const ACTIVITY = {
  punch_in: { label: 'Punched in', color: '#15803d', icon: 'IN' },
  punch_out: { label: 'Punched out', color: '#1d4ed8', icon: 'OUT' },
  logged_in: { label: 'Signed in', color: '#0f766e', icon: '→' },
  logged_out: { label: 'Signed out', color: '#64748b', icon: '←' },
  location_on: { label: 'Location on', color: '#15803d', icon: '◉' },
  location_off: { label: 'Location off', color: '#dc2626', icon: '⊘' },
  permission_denied: { label: 'Permission removed', color: '#dc2626', icon: '⊘' },
  signal_lost: { label: 'Phone silent', color: '#ea580c', icon: '!' },
  signal_restored: { label: 'Phone back online', color: '#15803d', icon: '✓' },
  attendance_approved: { label: 'Attendance approved', color: '#7c3aed', icon: '✓' },
};

export const SOURCE = {
  app: { label: 'Mobile app', short: 'App', color: '#0a1f8f', soft: '#e0e7ff' },
  web: { label: 'Website', short: 'Website', color: '#0e7490', soft: '#cffafe' },
  system: { label: 'System', short: 'System', color: '#475569', soft: '#f1f5f9' },
  admin: { label: 'HR', short: 'HR', color: '#7c3aed', soft: '#ede9fe' },
  unknown: { label: 'App / website (before tracking update)', short: 'Earlier', color: '#94a3b8', soft: '#f1f5f9' },
};

export const ALERT_EVENTS = [
  ['punch_in', 'Punch in', 'Every punch-in, with time, place and source'],
  ['punch_out', 'Punch out', 'Every punch-out with hours worked'],
  ['late_punch_in', 'Late punch-in', 'Punch-ins after the grace time'],
  ['outside_area', 'Punch outside area', 'Punch in / out away from the allowed location'],
  ['location_off', 'Location turned off', 'GPS switched off or permission removed'],
  ['location_on', 'Location turned on', 'Tracking is back on'],
  ['signal_lost', 'Phone silent', 'No location from the phone (off, no internet, app stopped)'],
  ['signal_restored', 'Phone back online', 'The phone is sending location again'],
  ['logged_in', 'Signed in', 'Sign-ins on the app or website'],
  ['logged_out', 'Signed out', 'Sign-outs of the app or website'],
  ['attendance_approved', 'Attendance approved', 'Approved by HR or automatically'],
];

export const timeOf = (value) => (value
  ? new Date(value).toLocaleTimeString('en-IN', { timeZone: TZ, hour: '2-digit', minute: '2-digit' })
  : '—');
export const dateTimeOf = (value) => (value
  ? new Date(value).toLocaleString('en-IN', { timeZone: TZ, day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  : '—');
export const todayKey = () => new Date().toLocaleDateString('en-CA', { timeZone: TZ });
export const agoText = (value, now = Date.now()) => {
  if (!value) return 'never';
  const minutes = Math.max(0, Math.round((now - new Date(value).getTime()) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
};
export const hoursText = (hours) => {
  const minutes = Math.round((Number(hours) || 0) * 60);
  return minutes ? `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m` : '0h';
};
export const distanceText = (meters) => (Number(meters) >= 1000 ? `${(Number(meters) / 1000).toFixed(1)} km` : `${Math.round(Number(meters) || 0)} m`);
export const mapsUrl = (lat, lng) => `https://www.google.com/maps?q=${lat},${lng}`;
export const initials = (name) => String(name || 'E').trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
export const shortAddress = (address) => String(address || '').split(',').slice(0, 3).join(',').trim();

export const Chip = ({ meta, children, title }) => (
  <span className="mn-chip" style={{ '--c': meta?.color || '#475569', '--s': meta?.soft || '#f1f5f9' }} title={title}>
    <i />{children || meta?.label}
  </span>
);

export const Avatar = ({ person, size = 36 }) => (
  <span className="mn-avatar" style={{ width: size, height: size, fontSize: size * 0.34 }}>
    {person?.profilePhoto ? <img src={person.profilePhoto} alt="" /> : initials(person?.name)}
  </span>
);

/** Where the admin asked another page to open (employee / filter). */
export const handOff = {
  set: (key, value) => { try { sessionStorage.setItem(`mn:${key}`, JSON.stringify(value)); } catch (e) { /* ignore */ } },
  take: (key) => {
    try {
      const raw = sessionStorage.getItem(`mn:${key}`);
      sessionStorage.removeItem(`mn:${key}`);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  },
};

const LIVE_EVENTS = ['activity', 'attendance', 'status', 'location', 'presence', 'device'];

/**
 * Subscribes to live server events over Socket.IO (shared connection).
 * handlers: { activity, attendance, status, location, presence, device } -> fn(data).
 * onConnection(bool) reports the connection state. Cleans up on unmount.
 */
export const useLiveStream = (handlers, onConnection) => {
  const ref = useRef(handlers);
  ref.current = handlers;
  const connRef = useRef(onConnection);
  connRef.current = onConnection;
  useEffect(() => {
    const socket = getSocket('staff');
    if (!socket) return undefined;
    const listeners = LIVE_EVENTS.map((name) => {
      const fn = (data) => {
        const handler = ref.current && ref.current[name];
        if (handler) handler(data);
      };
      socket.on(name, fn);
      return [name, fn];
    });
    const up = () => connRef.current && connRef.current(true);
    const down = () => connRef.current && connRef.current(false);
    const ready = (data) => {
      up();
      if (data?.presence && ref.current?.presenceSnapshot) ref.current.presenceSnapshot(data.presence);
    };
    socket.on('connect', up);
    socket.on('disconnect', down);
    socket.on('connect_error', down);
    socket.on('ready', ready);
    if (socket.connected) up();
    return () => {
      listeners.forEach(([name, fn]) => socket.off(name, fn));
      socket.off('connect', up);
      socket.off('disconnect', down);
      socket.off('connect_error', down);
      socket.off('ready', ready);
    };
  }, []);
};

/** Downloads rows as a CSV file. */
export const downloadCsv = (filename, header, rows) => {
  const cell = (value) => {
    const text = value === null || value === undefined ? '' : String(value);
    const safe = /^[=+@-]/.test(text) ? `'${text}` : text;
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const csv = [header, ...rows].map((row) => row.map(cell).join(',')).join('\r\n');
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const monitoringStyles = `
  .mn { display: grid; gap: 16px; color: #0f172a; }
  .mn-hero { display: flex; flex-wrap: wrap; gap: 14px; justify-content: space-between; align-items: center; padding: 20px 22px; border-radius: 18px; color: #fff; background: radial-gradient(circle at 90% 0%, rgba(34,197,94,.25), transparent 45%), linear-gradient(135deg, #04122e 0%, #0a1f8f 60%, #1d4ed8 100%); box-shadow: 0 16px 36px rgba(10,31,143,.2); }
  .mn-hero h3 { margin: 2px 0 4px; font-weight: 800; font-size: 1.4rem; }
  .mn-hero p { margin: 0; color: rgba(255,255,255,.8); font-size: .88rem; }
  .mn-eyebrow { font-size: .7rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: #86efac; }
  .mn-conn { display: inline-flex; align-items: center; gap: 8px; padding: 7px 12px; border-radius: 999px; font-size: .8rem; font-weight: 700; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2); }
  .mn-dot { width: 9px; height: 9px; border-radius: 50%; background: #34d399; animation: mn-pulse 1.6s infinite; }
  .mn-dot.off { background: #fbbf24; animation: none; }
  @keyframes mn-pulse { 0% { box-shadow: 0 0 0 0 rgba(52,211,153,.6); } 70% { box-shadow: 0 0 0 9px rgba(52,211,153,0); } 100% { box-shadow: 0 0 0 0 rgba(52,211,153,0); } }
  .mn-btn { border: 1px solid #dbe3ef; background: #fff; color: #0f172a; border-radius: 10px; padding: 7px 12px; font-size: .82rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; white-space: nowrap; }
  .mn-btn:hover:not(:disabled) { border-color: #0a1f8f; color: #0a1f8f; }
  .mn-btn:disabled { opacity: .55; cursor: not-allowed; }
  .mn-btn.primary { background: #0a1f8f; border-color: #0a1f8f; color: #fff; }
  .mn-btn.primary:hover:not(:disabled) { background: #06135c; color: #fff; }
  .mn-btn.danger { color: #b91c1c; border-color: #fecaca; }
  .mn-btn.ghost { background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.25); color: #fff; }
  .mn-btn.sm { padding: 4px 9px; font-size: .74rem; border-radius: 8px; }
  .mn-btn.active { background: #0a1f8f; border-color: #0a1f8f; color: #fff; }
  .mn-kpis { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
  .mn-kpi { text-align: left; background: #fff; border: 1px solid #e6e9f2; border-radius: 14px; padding: 11px 13px; border-left: 4px solid var(--c); box-shadow: 0 6px 16px rgba(15,23,42,.04); cursor: pointer; }
  .mn-kpi.active { outline: 2px solid var(--c); }
  .mn-kpi b { display: block; font-size: 1.55rem; font-weight: 800; color: var(--c); line-height: 1.15; }
  .mn-kpi span { display: block; font-size: .7rem; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: .05em; }
  .mn-kpi small { color: #94a3b8; font-size: .7rem; }
  .mn-card { background: #fff; border: 1px solid #e6e9f2; border-radius: 16px; box-shadow: 0 6px 18px rgba(15,23,42,.04); min-width: 0; }
  .mn-card-head { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid #f0f2f7; }
  .mn-card-head h4 { margin: 0; font-size: .98rem; font-weight: 800; }
  .mn-card-head p { margin: 0; font-size: .76rem; color: #64748b; }
  .mn-card-body { padding: 14px; }
  .mn-toolbar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .mn-input, .mn-select { border: 1px solid #dbe3ef; border-radius: 10px; padding: 7px 10px; font-size: .84rem; background: #fff; color: #0f172a; }
  .mn-input:focus, .mn-select:focus { outline: none; border-color: #0a1f8f; box-shadow: 0 0 0 3px rgba(10,31,143,.12); }
  .mn-chip { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px; font-size: .7rem; font-weight: 800; white-space: nowrap; color: var(--c); background: var(--s); }
  .mn-chip i { width: 7px; height: 7px; border-radius: 50%; background: var(--c); }
  .mn-avatar { position: relative; flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: linear-gradient(135deg, #0a1f8f, #2b45c4); color: #fff; font-weight: 800; overflow: hidden; }
  .mn-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .mn-table { width: 100%; border-collapse: collapse; font-size: .84rem; }
  .mn-table th { text-align: left; padding: 9px 12px; font-size: .68rem; text-transform: uppercase; letter-spacing: .05em; color: #64748b; background: #f8fafc; border-bottom: 1px solid #e6e9f2; white-space: nowrap; position: sticky; top: 0; z-index: 1; }
  .mn-table td { padding: 10px 12px; border-bottom: 1px solid #f0f2f7; vertical-align: top; }
  .mn-table tr:hover td { background: #fafbff; }
  .mn-muted { color: #64748b; font-size: .76rem; }
  .mn-strong { font-weight: 700; }
  .mn-src { display: inline-block; padding: 1px 6px; border-radius: 6px; font-size: .66rem; font-weight: 800; color: var(--c); background: var(--s); margin-left: 4px; vertical-align: 1px; }
  .mn-empty { padding: 28px; text-align: center; color: #64748b; font-size: .88rem; }
  .mn-feed { display: grid; max-height: 640px; overflow-y: auto; }
  .mn-feed-row { display: grid; grid-template-columns: 34px 1fr auto; gap: 10px; padding: 9px 12px; border-bottom: 1px solid #f5f6fa; align-items: start; }
  .mn-feed-row.fresh { animation: mn-flash 2.4s ease; }
  @keyframes mn-flash { 0% { background: #ecfdf5; } 100% { background: transparent; } }
  .mn-ev { width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: #fff; font-size: .62rem; font-weight: 800; background: var(--c); }
  .mn-alert { border-radius: 12px; padding: 10px 12px; font-size: .84rem; }
  .mn-alert.info { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
  .mn-alert.warn { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
  .mn-alert.ok { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
  .mn-alert.err { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
  @media (max-width: 640px) { .mn-hero { padding: 16px; } .mn-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
`;

export const SourceTag = ({ source }) => {
  const meta = SOURCE[source] || SOURCE.unknown;
  return <span className="mn-src" style={{ '--c': meta.color, '--s': meta.soft }} title={meta.label}>{meta.short}</span>;
};

