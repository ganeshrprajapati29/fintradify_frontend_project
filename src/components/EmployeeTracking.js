import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Circle, CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const API = process.env.REACT_APP_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const LIVE_WINDOW_MIN = 15; // a position older than this is "offline"

const STATUS = {
  moving: { label: 'Moving', color: '#2563eb', soft: '#dbeafe', rank: 1 },
  onsite: { label: 'On site', color: '#16a34a', soft: '#dcfce7', rank: 2 },
  outside: { label: 'Outside area', color: '#dc2626', soft: '#fee2e2', rank: 0 },
  offline: { label: 'No signal', color: '#d97706', soft: '#fef3c7', rank: 3 },
  offduty: { label: 'Off duty', color: '#94a3b8', soft: '#f1f5f9', rank: 4 },
};

const TILES = {
  light: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap contributors' },
  dark: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attribution: '&copy; OpenStreetMap contributors &copy; CARTO' },
};

const isNum = (value) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));

const positionOf = (employee) => {
  const gps = employee.currentLocation;
  const saved = employee.location;
  const lat = Number(gps?.latitude ?? saved?.latitude);
  const lng = Number(gps?.longitude ?? saved?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lat, lng];
};

const lastSeenOf = (employee) => employee.currentLocation?.timestamp || employee.location?.lastUpdated || employee.lastLocationUpdate || null;

const minutesAgo = (value, now) => {
  if (!value) return null;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return null;
  return Math.max(0, Math.round((now - time) / 60000));
};

const metersBetween = (a, b) => {
  const R = 6371000;
  const dLat = (b[0] - a[0]) * Math.PI / 180;
  const dLng = (b[1] - a[1]) * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

// Compass bearing from a to b, degrees clockwise from north.
const bearingBetween = (a, b) => {
  const lat1 = a[0] * Math.PI / 180;
  const lat2 = b[0] * Math.PI / 180;
  const dLng = (b[1] - a[1]) * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
};

const formatDistance = (meters) => {
  const value = Number(meters);
  if (!Number.isFinite(value)) return '—';
  return value >= 1000 ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)} km` : `${Math.round(value)} m`;
};

const formatClock = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
};

const agoText = (minutes) => {
  if (minutes === null) return 'never';
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
};

const todayKey = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
const googleMapsUrl = (lat, lng) => `https://www.google.com/maps?q=${lat},${lng}`;
const initials = (name) => String(name || 'E').trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const trailLength = (points) => {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += metersBetween([points[i - 1].latitude, points[i - 1].longitude], [points[i].latitude, points[i].longitude]);
  }
  return total;
};

/**
 * What an employee is doing right now, derived from attendance + latest position:
 * off duty, no signal, outside their punch area, moving, or on site.
 */
const describe = (employee, trail, now) => {
  const position = positionOf(employee);
  const age = minutesAgo(lastSeenOf(employee), now);
  const live = position && age !== null && age <= LIVE_WINDOW_MIN;
  const speed = Number(employee.currentLocation?.speed);

  // Moving: device speed, or it covered real ground between its last two points.
  let moving = Number.isFinite(speed) && speed >= 1;
  let kmh = Number.isFinite(speed) && speed > 0 ? speed * 3.6 : 0;
  if (!moving && trail && trail.length >= 2) {
    const a = trail[trail.length - 2];
    const b = trail[trail.length - 1];
    const seconds = (new Date(b.timestamp) - new Date(a.timestamp)) / 1000;
    const meters = metersBetween([a.latitude, a.longitude], [b.latitude, b.longitude]);
    if (seconds > 0 && seconds <= 300 && meters >= 30) {
      moving = true;
      kmh = (meters / seconds) * 3.6;
    }
  }

  let key = 'onsite';
  if (!employee.isActive) key = 'offduty';
  else if (!live) key = 'offline';
  else if (employee.insideZone === false) key = 'outside';
  else if (moving) key = 'moving';

  const zone = employee.geofence?.label || 'punch area';
  let activity;
  if (key === 'offduty') activity = position ? `Not punched in · last seen ${agoText(age)}` : 'Not punched in';
  else if (key === 'offline') activity = position ? `Signal lost · last seen ${agoText(age)}` : 'Punched in · waiting for first location';
  else if (key === 'outside') activity = `${moving ? `Moving ${Math.round(kmh)} km/h · ` : ''}${formatDistance(employee.distanceFromZone)} outside ${zone}`;
  else if (key === 'moving') activity = `Moving ${Math.round(kmh)} km/h · inside ${zone}`;
  else activity = `At ${zone}`;

  return { key, ...STATUS[key], position, age, live, moving, kmh, activity };
};

/* ------------------------------------------------------------------ */
/* Map pieces                                                          */
/* ------------------------------------------------------------------ */
const markerIcon = (employee, info, selected) => {
  const photo = employee.profilePhoto
    ? `<img src="${escapeHtml(employee.profilePhoto)}" alt="" />`
    : `<span>${escapeHtml(initials(employee.name))}</span>`;
  return L.divIcon({
    className: 'lt-marker-wrap',
    iconSize: [46, 56],
    iconAnchor: [23, 52],
    popupAnchor: [0, -50],
    html: `
      <div class="lt-marker ${selected ? 'is-selected' : ''}" style="--c:${info.color}">
        ${info.live ? '<i class="lt-marker-pulse"></i>' : ''}
        <div class="lt-marker-face">${photo}</div>
        <b class="lt-marker-tip"></b>
      </div>`,
  });
};

// Fits the map when the fit key changes (filter, selection) - not on every live update.
const FitBounds = ({ points, fitKey }) => {
  const map = useMap();
  const last = useRef(null);
  useEffect(() => {
    if (last.current === fitKey || !points.length) return;
    last.current = fitKey;
    if (points.length === 1) map.setView(points[0], 15);
    else map.fitBounds(points, { padding: [48, 48], maxZoom: 16 });
  }, [points, fitKey, map]);
  return null;
};

const FollowPoint = ({ point }) => {
  const map = useMap();
  useEffect(() => {
    if (point) map.panTo(point, { animate: true });
  }, [point, map]);
  return null;
};

/* ------------------------------------------------------------------ */
/* Radar                                                               */
/* ------------------------------------------------------------------ */
const RADAR_RANGES = [500, 1000, 2000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];
const niceRange = (meters) => RADAR_RANGES.find((r) => r >= meters) || RADAR_RANGES[RADAR_RANGES.length - 1];

const Radar = ({ center, centerLabel, blips, range, selectedId, onSelect }) => {
  const size = 320;
  const c = size / 2;
  const R = 138;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="lt-radar" role="img" aria-label="Employee radar">
      <defs>
        <radialGradient id="ltRadarBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0f2a52" />
          <stop offset="100%" stopColor="#06132e" />
        </radialGradient>
        <linearGradient id="ltSweep" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx={c} cy={c} r={R + 12} fill="url(#ltRadarBg)" stroke="#1e3a6b" strokeWidth="2" />
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}>
          <circle cx={c} cy={c} r={R * f} fill="none" stroke="#2dd4bf" strokeOpacity={f === 1 ? 0.55 : 0.22} strokeWidth="1" />
          <text x={c + 4} y={c - R * f + 11} className="lt-radar-ring">{formatDistance(range * f)}</text>
        </g>
      ))}
      <line x1={c - R} y1={c} x2={c + R} y2={c} stroke="#2dd4bf" strokeOpacity="0.18" />
      <line x1={c} y1={c - R} x2={c} y2={c + R} stroke="#2dd4bf" strokeOpacity="0.18" />
      {[['N', c, c - R - 2], ['E', c + R + 6, c + 4], ['S', c, c + R + 11], ['W', c - R - 6, c + 4]].map(([t, x, y]) => (
        <text key={t} x={x} y={y} textAnchor="middle" className="lt-radar-dir">{t}</text>
      ))}

      {/* rotating sweep */}
      <g className="lt-radar-sweep" style={{ transformOrigin: `${c}px ${c}px` }}>
        <path d={`M ${c} ${c} L ${c} ${c - R} A ${R} ${R} 0 0 1 ${c + R * Math.sin(Math.PI / 3)} ${c - R * Math.cos(Math.PI / 3)} Z`} fill="url(#ltSweep)" />
        <line x1={c} y1={c} x2={c} y2={c - R} stroke="#6ee7b7" strokeWidth="1.6" strokeOpacity="0.9" />
      </g>

      {/* centre = office / base */}
      <circle cx={c} cy={c} r="5" fill="#f8fafc" />
      <circle cx={c} cy={c} r="9" fill="none" stroke="#f8fafc" strokeOpacity="0.5" />
      <title>{centerLabel}</title>

      {center && blips.map((blip) => {
        const ratio = Math.min(blip.distance / range, 1);
        const beyond = blip.distance > range;
        const angle = blip.bearing * Math.PI / 180;
        const x = c + R * ratio * Math.sin(angle);
        const y = c - R * ratio * Math.cos(angle);
        const active = blip.id === selectedId;
        return (
          <g key={blip.id} className="lt-radar-blip" onClick={() => onSelect(blip.id)}>
            {blip.live && <circle cx={x} cy={y} r="5" fill={blip.color} className="lt-radar-ping" style={{ transformOrigin: `${x}px ${y}px` }} />}
            <circle cx={x} cy={y} r={active ? 7 : 5} fill={beyond ? 'none' : blip.color} stroke={active ? '#ffffff' : blip.color} strokeWidth={active || beyond ? 2 : 0} />
            {active && <text x={x} y={y - 11} textAnchor="middle" className="lt-radar-name">{blip.name}</text>}
            <title>{`${blip.name} · ${blip.label} · ${formatDistance(blip.distance)} from ${centerLabel}`}</title>
          </g>
        );
      })}
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
const FILTERS = [
  ['all', 'All'],
  ['onduty', 'On duty'],
  ['moving', 'Moving'],
  ['onsite', 'On site'],
  ['outside', 'Outside area'],
  ['offline', 'No signal'],
  ['offduty', 'Off duty'],
];

const EmployeeTracking = () => {
  const [employees, setEmployees] = useState([]);
  const [trails, setTrails] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [view, setView] = useState('map');
  const [mapStyle, setMapStyle] = useState('light');
  const [showTrails, setShowTrails] = useState(true);
  const [radarRange, setRadarRange] = useState('auto');
  const [liveConnected, setLiveConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const [now, setNow] = useState(Date.now());

  const [selectedId, setSelectedId] = useState(null);
  const [follow, setFollow] = useState(true);
  const [followPoint, setFollowPoint] = useState(null);
  const [route, setRoute] = useState(null);
  const [routeDate, setRouteDate] = useState(todayKey());
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');
  const selectedRef = useRef(null);
  const routeDateRef = useRef(todayKey());

  /* ---------------- data ---------------- */
  const fetchRoute = async (employeeId, silent = false, date = routeDateRef.current) => {
    if (!employeeId) return;
    if (!silent) setRouteLoading(true);
    try {
      const res = await axios.get(`${API}/tracking/route/${employeeId}`, { headers: authHeaders(), params: { date } });
      if (selectedRef.current === employeeId) {
        setRoute(res.data || null);
        setRouteError('');
      }
    } catch (err) {
      if (selectedRef.current === employeeId) setRouteError(err.response?.data?.message || 'Failed to load route');
    } finally {
      if (!silent) setRouteLoading(false);
    }
  };

  const fetchTrails = async () => {
    try {
      const res = await axios.get(`${API}/tracking/trails`, { headers: authHeaders(), params: { hours: 12 } });
      const data = res.data?.data;
      if (data && typeof data === 'object') setTrails(data);
    } catch (err) {
      // Trails are a visual extra; the map still works without them.
    }
  };

  // First load shows the loader; later refreshes are silent so the map never flickers.
  const fetchTracking = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await axios.get(`${API}/tracking`, { headers: authHeaders() });
      setEmployees(Array.isArray(res.data?.data) ? res.data.data : []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch tracking data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // A point pushed by the server stream: move the marker, extend the trail and the open route.
  const applyLivePoint = (data) => {
    if (!data || !data.employeeId || !isNum(data.latitude) || !isNum(data.longitude)) return;
    const stamp = data.timestamp || new Date().toISOString();
    setEmployees((prev) => prev.map((employee) => (employee._id === data.employeeId ? {
      ...employee,
      currentLocation: {
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        speed: data.speed,
        heading: data.heading,
        address: data.address || employee.currentLocation?.address || '',
        timestamp: stamp,
        batteryLevel: data.batteryLevel ?? employee.currentLocation?.batteryLevel,
        source: data.source || 'gps',
      },
      insideZone: typeof data.insideZone === 'boolean' ? data.insideZone : employee.insideZone,
      distanceFromZone: isNum(data.distanceFromZone) ? data.distanceFromZone : employee.distanceFromZone,
      lastLocationUpdate: stamp,
    } : employee)));
    setTrails((prev) => {
      const points = prev[data.employeeId] || [];
      const next = [...points, { latitude: data.latitude, longitude: data.longitude, timestamp: stamp, speed: data.speed }];
      return { ...prev, [data.employeeId]: next.length > 400 ? next.slice(-400) : next };
    });
    setLastEvent(new Date());

    if (selectedRef.current === data.employeeId) {
      setFollowPoint([data.latitude, data.longitude]);
      if (routeDateRef.current === todayKey()) {
        setRoute((prev) => {
          if (!prev) return prev;
          const points = prev.route || [];
          const last = points[points.length - 1];
          const step = last ? metersBetween([last.latitude, last.longitude], [data.latitude, data.longitude]) : 0;
          return {
            ...prev,
            route: [...points, { latitude: data.latitude, longitude: data.longitude, accuracy: data.accuracy, timestamp: stamp, address: data.address || '', speed: data.speed, distance: Math.round(step), sequence: points.length + 1 }],
            totalPoints: points.length + 1,
            totalDistance: (prev.totalDistance || 0) + Math.round(step),
            firstSeen: prev.firstSeen || stamp,
            lastSeen: stamp,
          };
        });
      }
    }
  };

  useEffect(() => {
    fetchTracking();
    fetchTrails();
    const poll = setInterval(() => fetchTracking(true), 30000);
    const trailPoll = setInterval(fetchTrails, 180000);
    const clock = setInterval(() => setNow(Date.now()), 10000);

    // Live stream (Server-Sent Events). EventSource cannot send the auth header, so a
    // one-time ticket is requested first; on any error we reconnect with a fresh ticket.
    let source = null;
    let retryTimer = null;
    let closed = false;
    const connect = async () => {
      if (closed || typeof window.EventSource === 'undefined') return;
      try {
        const res = await axios.post(`${API}/tracking/stream-ticket`, {}, { headers: authHeaders() });
        if (closed) return;
        source = new window.EventSource(`${API}/tracking/stream?ticket=${res.data.ticket}`);
        source.addEventListener('ready', () => setLiveConnected(true));
        source.addEventListener('location', (event) => {
          try { applyLivePoint(JSON.parse(event.data)); } catch (parseError) { /* ignore malformed frame */ }
        });
        source.addEventListener('attendance', () => fetchTracking(true));
        source.onerror = () => {
          setLiveConnected(false);
          if (source) source.close();
          source = null;
          if (!closed) retryTimer = setTimeout(connect, 5000);
        };
      } catch (streamError) {
        setLiveConnected(false);
        if (!closed) retryTimer = setTimeout(connect, 10000);
      }
    };
    connect();

    const onAttendance = () => fetchTracking(true);
    window.addEventListener('attendanceUpdated', onAttendance);
    return () => {
      closed = true;
      clearInterval(poll);
      clearInterval(trailPoll);
      clearInterval(clock);
      if (retryTimer) clearTimeout(retryTimer);
      if (source) source.close();
      window.removeEventListener('attendanceUpdated', onAttendance);
    };
  }, []);

  /* ---------------- derived ---------------- */
  const rows = useMemo(() => employees.map((employee) => ({
    employee,
    info: describe(employee, trails[employee._id], now),
  })), [employees, trails, now]);

  const counts = useMemo(() => {
    const base = { total: rows.length, onduty: 0, live: 0, moving: 0, onsite: 0, outside: 0, offline: 0, offduty: 0, late: 0 };
    rows.forEach(({ employee, info }) => {
      base[info.key] += 1;
      if (employee.isActive) base.onduty += 1;
      if (info.live) base.live += 1;
      if (employee.isActive && employee.isLate) base.late += 1;
    });
    return base;
  }, [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter(({ employee, info }) => {
        const matchFilter = filter === 'all'
          || (filter === 'onduty' && employee.isActive)
          || info.key === filter;
        const matchQuery = !q || [employee.name, employee.employeeId, employee.position, employee.department, employee.team, employee.shift?.name]
          .some((value) => String(value || '').toLowerCase().includes(q));
        return matchFilter && matchQuery;
      })
      .sort((a, b) => a.info.rank - b.info.rank || String(a.employee.name).localeCompare(String(b.employee.name)));
  }, [rows, filter, query]);

  const located = visible.filter(({ info }) => info.position);
  const selected = rows.find(({ employee }) => employee._id === selectedId) || null;
  const routePoints = (route?.route || []).map((p) => [p.latitude, p.longitude]);

  // Radar centre: the office point (the default punch area), else the middle of everyone.
  const radarCenter = useMemo(() => {
    const office = employees.find((e) => e.geofence?.source === 'office' && isNum(e.geofence.latitude))?.geofence;
    if (office) return { point: [Number(office.latitude), Number(office.longitude)], label: office.label || 'Office' };
    const points = rows.map(({ info }) => info.position).filter(Boolean);
    if (!points.length) return null;
    return {
      point: [points.reduce((s, p) => s + p[0], 0) / points.length, points.reduce((s, p) => s + p[1], 0) / points.length],
      label: 'Team centre',
    };
  }, [employees, rows]);

  const blips = useMemo(() => {
    if (!radarCenter) return [];
    return visible
      .filter(({ info }) => info.position)
      .map(({ employee, info }) => ({
        id: employee._id,
        name: employee.name,
        label: info.label,
        color: info.color,
        live: info.live,
        distance: metersBetween(radarCenter.point, info.position),
        bearing: bearingBetween(radarCenter.point, info.position),
      }));
  }, [visible, radarCenter]);

  const effectiveRange = radarRange === 'auto'
    ? niceRange(Math.max(500, ...blips.filter((b) => b.live).map((b) => b.distance), ...(blips.some((b) => b.live) ? [] : blips.map((b) => b.distance))))
    : Number(radarRange);

  // Distinct punch areas to draw once.
  const zones = useMemo(() => Object.values(visible.reduce((acc, { employee }) => {
    const zone = employee.geofence;
    if (!zone || !isNum(zone.latitude) || !isNum(zone.longitude) || Number(zone.radiusMeters) > 50000) return acc;
    const key = `${zone.latitude},${zone.longitude},${zone.radiusMeters}`;
    acc[key] = acc[key] || { ...zone, key, count: 0 };
    acc[key].count += 1;
    return acc;
  }, {})), [visible]);

  /* ---------------- actions ---------------- */
  const selectEmployee = (employeeId) => {
    if (selectedRef.current === employeeId) return;
    selectedRef.current = employeeId;
    routeDateRef.current = todayKey();
    setRouteDate(todayKey());
    setSelectedId(employeeId);
    setRoute(null);
    setRouteError('');
    setFollowPoint(null);
    setView('map');
    fetchRoute(employeeId, false, todayKey());
  };

  const clearSelection = () => {
    selectedRef.current = null;
    setSelectedId(null);
    setRoute(null);
    setRouteError('');
    setFollowPoint(null);
  };

  const changeRouteDate = (date) => {
    if (!date) return;
    routeDateRef.current = date;
    setRouteDate(date);
    setRoute(null);
    fetchRoute(selectedRef.current, false, date);
  };

  const fitKey = `${filter}|${query}|${located.length > 0}|${selectedId || ''}|${routePoints.length ? 'r' : ''}|${routeDate}`;
  const fitPoints = selectedId
    ? (routePoints.length ? routePoints : (selected?.info.position ? [selected.info.position] : []))
    : located.map(({ info }) => info.position);
  const tiles = TILES[mapStyle];

  /* ---------------- render ---------------- */
  return (
    <div className="lt-page">
      <style>{`
        .lt-page { display: grid; gap: 14px; color: #0f172a; }
        .lt-hero { display: flex; flex-wrap: wrap; gap: 14px; justify-content: space-between; align-items: center; padding: 18px 20px; border-radius: 18px; color: #fff; background: linear-gradient(135deg, #06135c 0%, #0a1f8f 55%, #1d4ed8 100%); box-shadow: 0 16px 36px rgba(10,31,143,.22); }
        .lt-hero h3 { margin: 2px 0 4px; font-weight: 800; font-size: 1.45rem; }
        .lt-hero p { margin: 0; color: rgba(255,255,255,.78); font-size: .88rem; }
        .lt-eyebrow { font-size: .72rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #93c5fd; }
        .lt-conn { display: inline-flex; align-items: center; gap: 8px; padding: 7px 12px; border-radius: 999px; font-size: .8rem; font-weight: 700; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2); }
        .lt-dot { width: 9px; height: 9px; border-radius: 50%; background: #34d399; animation: lt-pulse 1.6s infinite; }
        .lt-dot.off { background: #fbbf24; animation: none; }
        @keyframes lt-pulse { 0% { box-shadow: 0 0 0 0 rgba(52,211,153,.6); } 70% { box-shadow: 0 0 0 9px rgba(52,211,153,0); } 100% { box-shadow: 0 0 0 0 rgba(52,211,153,0); } }
        .lt-btn { border: 1px solid #dbe3ef; background: #fff; color: #0f172a; border-radius: 10px; padding: 7px 12px; font-size: .82rem; font-weight: 700; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
        .lt-btn:hover { border-color: #0a1f8f; color: #0a1f8f; }
        .lt-btn.active { background: #0a1f8f; border-color: #0a1f8f; color: #fff; }
        .lt-btn.ghost { background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.25); color: #fff; }
        .lt-kpis { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; }
        .lt-kpi { background: #fff; border: 1px solid #e6e9f2; border-radius: 14px; padding: 12px 14px; cursor: pointer; box-shadow: 0 6px 18px rgba(15,23,42,.05); border-left: 4px solid var(--c, #0a1f8f); text-align: left; }
        .lt-kpi.active { outline: 2px solid var(--c, #0a1f8f); }
        .lt-kpi b { display: block; font-size: 1.55rem; font-weight: 800; line-height: 1.1; }
        .lt-kpi span { font-size: .74rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .05em; }
        .lt-grid { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 14px; align-items: start; }
        .lt-card { background: #fff; border: 1px solid #e6e9f2; border-radius: 16px; box-shadow: 0 6px 18px rgba(15,23,42,.05); overflow: hidden; }
        .lt-card-head { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid #f0f2f7; }
        .lt-card-head strong { font-size: .95rem; }
        .lt-map { height: 600px; position: relative; }
        .lt-map .leaflet-container { height: 100%; width: 100%; font-family: inherit; }
        .lt-map-empty { height: 100%; display: flex; align-items: center; justify-content: center; text-align: center; padding: 24px; color: #64748b; background: #f8fafc; }
        .lt-legend { position: absolute; left: 12px; bottom: 12px; z-index: 500; display: flex; flex-wrap: wrap; gap: 8px; padding: 8px 10px; border-radius: 12px; background: rgba(255,255,255,.94); border: 1px solid #e6e9f2; font-size: .72rem; font-weight: 700; }
        .lt-legend i { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 5px; }
        .lt-marker-wrap { background: none; border: none; }
        .lt-marker { position: relative; width: 46px; height: 56px; }
        .lt-marker-face { position: absolute; left: 3px; top: 0; width: 40px; height: 40px; border-radius: 50%; background: var(--c); border: 3px solid #fff; box-shadow: 0 4px 12px rgba(15,23,42,.35); display: flex; align-items: center; justify-content: center; overflow: hidden; color: #fff; font-weight: 800; font-size: 13px; }
        .lt-marker.is-selected .lt-marker-face { border-color: #facc15; box-shadow: 0 0 0 3px rgba(250,204,21,.5), 0 4px 12px rgba(15,23,42,.35); }
        .lt-marker-face img { width: 100%; height: 100%; object-fit: cover; }
        .lt-marker-tip { position: absolute; left: 17px; top: 37px; width: 12px; height: 12px; background: var(--c); transform: rotate(45deg); border-right: 3px solid #fff; border-bottom: 3px solid #fff; }
        .lt-marker-pulse { position: absolute; left: 3px; top: 0; width: 40px; height: 40px; border-radius: 50%; background: var(--c); opacity: .45; animation: lt-ring 1.8s ease-out infinite; }
        @keyframes lt-ring { 0% { transform: scale(1); opacity: .45; } 100% { transform: scale(2.3); opacity: 0; } }
        .lt-radar-card { background: linear-gradient(180deg, #081a3d, #050f26); color: #e2e8f0; }
        .lt-radar-card .lt-card-head { border-bottom-color: rgba(255,255,255,.08); }
        .lt-radar { width: 100%; max-width: 330px; display: block; margin: 4px auto 0; }
        .lt-radar-sweep { animation: lt-sweep 4s linear infinite; }
        @keyframes lt-sweep { to { transform: rotate(360deg); } }
        .lt-radar-ring { fill: #5eead4; font-size: 8.5px; opacity: .75; }
        .lt-radar-dir { fill: #94a3b8; font-size: 10px; font-weight: 700; }
        .lt-radar-name { fill: #fff; font-size: 10px; font-weight: 700; paint-order: stroke; stroke: #06132e; stroke-width: 3px; }
        .lt-radar-blip { cursor: pointer; }
        .lt-radar-ping { animation: lt-ping 2s ease-out infinite; opacity: .5; }
        @keyframes lt-ping { 0% { transform: scale(1); opacity: .55; } 100% { transform: scale(3.2); opacity: 0; } }
        .lt-radar-meta { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; padding: 8px 12px 14px; }
        .lt-radar-meta button { border: 1px solid rgba(255,255,255,.18); background: transparent; color: #cbd5e1; border-radius: 999px; font-size: .7rem; font-weight: 700; padding: 3px 9px; cursor: pointer; }
        .lt-radar-meta button.active { background: #14b8a6; border-color: #14b8a6; color: #04111f; }
        .lt-roster { max-height: 470px; overflow-y: auto; }
        .lt-row { display: flex; gap: 10px; align-items: center; width: 100%; text-align: left; border: none; background: #fff; padding: 10px 14px; border-bottom: 1px solid #f0f2f7; cursor: pointer; }
        .lt-row:hover { background: #f8fafc; }
        .lt-row.selected { background: #eef1fc; box-shadow: inset 3px 0 0 #0a1f8f; }
        .lt-avatar { position: relative; width: 38px; height: 38px; border-radius: 50%; flex: 0 0 auto; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: .78rem; color: #fff; background: var(--c); overflow: hidden; }
        .lt-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .lt-row-main { min-width: 0; flex: 1; }
        .lt-row-main strong { display: block; font-size: .88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .lt-row-main small { display: block; color: #64748b; font-size: .74rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .lt-chip { display: inline-flex; align-items: center; gap: 5px; padding: 3px 8px; border-radius: 999px; font-size: .7rem; font-weight: 800; white-space: nowrap; color: var(--c); background: var(--s); }
        .lt-chip i { width: 7px; height: 7px; border-radius: 50%; background: var(--c); }
        .lt-input { border: 1px solid #dbe3ef; border-radius: 10px; padding: 8px 11px; font-size: .86rem; width: 100%; background: #fff; }
        .lt-input:focus { outline: none; border-color: #0a1f8f; box-shadow: 0 0 0 3px rgba(10,31,143,.12); }
        .lt-detail { padding: 14px; display: grid; gap: 12px; }
        .lt-detail-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
        .lt-stat { background: #f8fafc; border: 1px solid #eef1f6; border-radius: 12px; padding: 9px 10px; }
        .lt-stat span { display: block; font-size: .68rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .04em; }
        .lt-stat b { font-size: .92rem; }
        .lt-timeline { max-height: 230px; overflow-y: auto; display: grid; gap: 6px; }
        .lt-tl-row { display: grid; grid-template-columns: 64px 1fr auto; gap: 10px; align-items: center; font-size: .82rem; padding: 6px 9px; border-radius: 9px; background: #f5f7fb; }
        .lt-tl-row b { color: #0a1f8f; }
        .lt-tl-row span { color: #334155; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .lt-table { width: 100%; border-collapse: collapse; font-size: .84rem; }
        .lt-table th { text-align: left; padding: 10px 12px; font-size: .7rem; text-transform: uppercase; letter-spacing: .05em; color: #64748b; background: #f8fafc; border-bottom: 1px solid #e6e9f2; white-space: nowrap; }
        .lt-table td { padding: 10px 12px; border-bottom: 1px solid #f0f2f7; vertical-align: middle; }
        .lt-table tr:hover td { background: #f8fafc; cursor: pointer; }
        @media (max-width: 1280px) { .lt-grid { grid-template-columns: 1fr; } .lt-kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); } .lt-detail-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 640px) { .lt-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } .lt-map { height: 440px; } }
      `}</style>

      {/* ---------- header ---------- */}
      <section className="lt-hero">
        <div>
          <div className="lt-eyebrow">Live operations</div>
          <h3>Employee Live Tracking</h3>
          <p>Where every employee is, what they are doing and the route they are taking — updated the moment their phone reports.</p>
        </div>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <span className="lt-conn">
            <span className={`lt-dot ${liveConnected ? '' : 'off'}`} />
            {liveConnected ? 'Live' : 'Reconnecting'} · {counts.live} transmitting
            {lastEvent ? ` · last ping ${lastEvent.toLocaleTimeString('en-IN')}` : ''}
          </span>
          <button type="button" className="lt-btn ghost" onClick={() => { fetchTracking(true); fetchTrails(); }} disabled={loading || refreshing}>
            {loading || refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </section>

      {error && <div className="alert alert-danger mb-0">{error}</div>}

      {/* ---------- KPIs (click to filter) ---------- */}
      <section className="lt-kpis">
        {[
          ['onduty', 'On duty', counts.onduty, '#0a1f8f'],
          ['moving', 'Moving', counts.moving, STATUS.moving.color],
          ['onsite', 'On site', counts.onsite, STATUS.onsite.color],
          ['outside', 'Outside area', counts.outside, STATUS.outside.color],
          ['offline', 'No signal', counts.offline, STATUS.offline.color],
          ['offduty', 'Off duty', counts.offduty, STATUS.offduty.color],
        ].map(([key, label, value, color]) => (
          <button key={key} type="button" className={`lt-kpi ${filter === key ? 'active' : ''}`} style={{ '--c': color }} onClick={() => setFilter(filter === key ? 'all' : key)}>
            <b style={{ color }}>{value}</b>
            <span>{label}</span>
          </button>
        ))}
      </section>

      <section className="lt-grid">
        {/* ---------- map / table ---------- */}
        <div className="d-grid gap-3">
          <div className="lt-card">
            <div className="lt-card-head">
              <strong>{view === 'map' ? 'Live map' : 'All employees'} <span className="text-muted fw-normal">· {visible.length} shown{counts.late ? ` · ${counts.late} late today` : ''}</span></strong>
              <div className="d-flex flex-wrap gap-2">
                <button type="button" className={`lt-btn ${view === 'map' ? 'active' : ''}`} onClick={() => setView('map')}>Map</button>
                <button type="button" className={`lt-btn ${view === 'table' ? 'active' : ''}`} onClick={() => setView('table')}>Table</button>
                {view === 'map' && (
                  <>
                    <button type="button" className={`lt-btn ${showTrails ? 'active' : ''}`} onClick={() => setShowTrails(!showTrails)}>Routes</button>
                    <button type="button" className={`lt-btn ${mapStyle === 'dark' ? 'active' : ''}`} onClick={() => setMapStyle(mapStyle === 'dark' ? 'light' : 'dark')}>Dark map</button>
                  </>
                )}
              </div>
            </div>

            {view === 'map' ? (
              <div className="lt-map">
                {loading ? (
                  <div className="lt-map-empty">Loading live positions…</div>
                ) : (
                  <MapContainer center={radarCenter?.point || [28.6139, 77.209]} zoom={11} scrollWheelZoom>
                    <TileLayer key={mapStyle} url={tiles.url} attribution={tiles.attribution} />
                    <FitBounds points={fitPoints} fitKey={fitKey} />
                    {follow && selectedId && followPoint && <FollowPoint point={followPoint} />}

                    {zones.map((zone) => (
                      <Circle
                        key={zone.key}
                        center={[Number(zone.latitude), Number(zone.longitude)]}
                        radius={Number(zone.radiusMeters)}
                        pathOptions={{ color: zone.source === 'employee' ? '#7c3aed' : '#0a1f8f', fillOpacity: 0.07, weight: 2, dashArray: zone.source === 'employee' ? '6 6' : undefined }}
                      >
                        <Tooltip>{zone.label} · {formatDistance(zone.radiusMeters)} · {zone.count} employee(s)</Tooltip>
                      </Circle>
                    ))}

                    {/* everyone's recent route */}
                    {showTrails && !selectedId && located.map(({ employee, info }) => {
                      const trail = trails[employee._id];
                      if (!trail || trail.length < 2 || !employee.isActive) return null;
                      return (
                        <Polyline
                          key={`trail-${employee._id}`}
                          positions={trail.map((p) => [p.latitude, p.longitude])}
                          pathOptions={{ color: info.color, weight: 3, opacity: 0.55 }}
                        />
                      );
                    })}

                    {/* selected employee's route for the chosen day */}
                    {selectedId && routePoints.length > 1 && (
                      <>
                        <Polyline positions={routePoints} pathOptions={{ color: '#ffffff', weight: 8, opacity: 0.9 }} />
                        <Polyline positions={routePoints} pathOptions={{ color: '#d0142a', weight: 4, opacity: 0.95 }} />
                      </>
                    )}
                    {selectedId && routePoints.length > 0 && (
                      <>
                        <CircleMarker center={routePoints[0]} radius={7} pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#16a34a', fillOpacity: 1 }}>
                          <Tooltip>Start · {formatClock(route.route[0].timestamp)}</Tooltip>
                        </CircleMarker>
                        {route.route.slice(1, -1).map((p) => (
                          <CircleMarker key={p.sequence} center={[p.latitude, p.longitude]} radius={3} pathOptions={{ color: '#d0142a', fillColor: '#ffffff', fillOpacity: 1, weight: 1.5 }}>
                            <Tooltip>{formatClock(p.timestamp)}{isNum(p.speed) && p.speed > 0 ? ` · ${Math.round(p.speed * 3.6)} km/h` : ''}</Tooltip>
                          </CircleMarker>
                        ))}
                      </>
                    )}

                    {located.map(({ employee, info }) => (
                      <Marker
                        key={employee._id}
                        position={info.position}
                        icon={markerIcon(employee, info, employee._id === selectedId)}
                        zIndexOffset={employee._id === selectedId ? 1000 : info.live ? 500 : 0}
                        eventHandlers={{ click: () => selectEmployee(employee._id) }}
                      >
                        <Popup>
                          <div style={{ minWidth: 210 }}>
                            <strong style={{ fontSize: 14 }}>{employee.name}</strong>
                            <div style={{ color: '#64748b', fontSize: 12 }}>{employee.employeeId} · {employee.position || employee.department || 'Employee'}</div>
                            <div style={{ margin: '8px 0' }}>
                              <span className="lt-chip" style={{ '--c': info.color, '--s': info.soft }}><i />{info.label}</span>
                            </div>
                            <div style={{ fontSize: 12.5, lineHeight: 1.55 }}>
                              <div><b>Now:</b> {info.activity}</div>
                              <div><b>Shift:</b> {employee.shift?.label || 'N/A'}{employee.isLate ? ` · late ${employee.lateMinutes || ''}m` : ''}</div>
                              {employee.currentLocation?.address && <div><b>Near:</b> {employee.currentLocation.address}</div>}
                              <div><b>Updated:</b> {agoText(info.age)}{isNum(employee.currentLocation?.accuracy) ? ` · ±${Math.round(employee.currentLocation.accuracy)} m` : ''}</div>
                            </div>
                            <div className="d-flex gap-2 mt-2">
                              <a className="lt-btn" href={googleMapsUrl(info.position[0], info.position[1])} target="_blank" rel="noopener noreferrer">Google Maps</a>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                )}
                {!loading && located.length === 0 && (
                  <div className="lt-legend" style={{ left: '50%', bottom: '50%', transform: 'translate(-50%, 50%)', fontSize: '.85rem', fontWeight: 600 }}>
                    No positions to show. Locations appear when employees punch in from the app.
                  </div>
                )}
                {!loading && (
                  <div className="lt-legend">
                    {['moving', 'onsite', 'outside', 'offline', 'offduty'].map((key) => (
                      <span key={key}><i style={{ background: STATUS[key].color }} />{STATUS[key].label}</span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="lt-table">
                  <thead>
                    <tr>
                      <th>Employee</th><th>Status</th><th>Doing now</th><th>Shift</th><th>Punch in</th><th>Hours</th><th>Today</th><th>Last update</th><th>Tasks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map(({ employee, info }) => (
                      <tr key={employee._id} onClick={() => selectEmployee(employee._id)}>
                        <td>
                          <strong>{employee.name}</strong>
                          <div className="small text-muted">{employee.employeeId} · {employee.position || employee.department || '—'}</div>
                        </td>
                        <td><span className="lt-chip" style={{ '--c': info.color, '--s': info.soft }}><i />{info.label}</span></td>
                        <td style={{ maxWidth: 260 }}>{info.activity}</td>
                        <td>
                          <span style={{ color: employee.shift?.color || '#0f172a', fontWeight: 700 }}>{employee.shift?.name || '—'}</span>
                          {employee.isLate && <div className="small" style={{ color: '#d97706' }}>Late {employee.lateMinutes || ''}m</div>}
                        </td>
                        <td>{formatClock(employee.punchIn)}</td>
                        <td>{(Number(employee.hoursWorked) || 0).toFixed(1)} h</td>
                        <td>{formatDistance(trailLength(trails[employee._id] || []))}</td>
                        <td>{agoText(info.age)}</td>
                        <td>{employee.todaysTasks?.length || 0}</td>
                      </tr>
                    ))}
                    {visible.length === 0 && <tr><td colSpan={9} className="text-center text-muted py-4">No employees match this filter.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ---------- selected employee ---------- */}
          {selected && (
            <div className="lt-card">
              <div className="lt-card-head">
                <div className="d-flex align-items-center gap-2">
                  <div className="lt-avatar" style={{ '--c': selected.info.color }}>
                    {selected.employee.profilePhoto ? <img src={selected.employee.profilePhoto} alt="" /> : initials(selected.employee.name)}
                  </div>
                  <div>
                    <strong>{selected.employee.name}</strong>
                    <div className="small text-muted">{selected.employee.employeeId} · {selected.employee.shift?.label || 'No shift'}</div>
                  </div>
                  <span className="lt-chip ms-1" style={{ '--c': selected.info.color, '--s': selected.info.soft }}><i />{selected.info.label}</span>
                </div>
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <input type="date" className="lt-input" style={{ width: 'auto' }} value={routeDate} max={todayKey()} onChange={(e) => changeRouteDate(e.target.value)} />
                  <button type="button" className={`lt-btn ${follow ? 'active' : ''}`} onClick={() => setFollow(!follow)}>{follow ? 'Following' : 'Follow'}</button>
                  {selected.info.position && <a className="lt-btn" href={googleMapsUrl(selected.info.position[0], selected.info.position[1])} target="_blank" rel="noopener noreferrer">Google Maps</a>}
                  <button type="button" className="lt-btn" onClick={clearSelection}>Close</button>
                </div>
              </div>
              <div className="lt-detail">
                <div className="lt-detail-grid">
                  <div className="lt-stat"><span>Doing now</span><b>{selected.info.activity}</b></div>
                  <div className="lt-stat"><span>Punch in</span><b>{formatClock(selected.employee.punchIn)}{selected.employee.isLate ? ` · late ${selected.employee.lateMinutes || ''}m` : ''}</b></div>
                  <div className="lt-stat"><span>Worked</span><b>{(Number(selected.employee.hoursWorked) || 0).toFixed(1)} h</b></div>
                  <div className="lt-stat"><span>Last update</span><b>{agoText(selected.info.age)}</b></div>
                  <div className="lt-stat"><span>Route {routeDate === todayKey() ? 'today' : routeDate}</span><b>{routeLoading ? 'Loading…' : route ? `${formatDistance(route.totalDistance)} · ${route.totalPoints} pts` : '—'}</b></div>
                  <div className="lt-stat"><span>First / last seen</span><b>{route ? `${formatClock(route.firstSeen)} – ${formatClock(route.lastSeen)}` : '—'}</b></div>
                  <div className="lt-stat"><span>Punch area</span><b>{selected.employee.geofence?.label || '—'}{isNum(selected.employee.distanceFromZone) ? ` · ${formatDistance(selected.employee.distanceFromZone)}` : ''}</b></div>
                  <div className="lt-stat"><span>Battery / GPS</span><b>{isNum(selected.employee.currentLocation?.batteryLevel) ? `${selected.employee.currentLocation.batteryLevel}%` : '—'}{isNum(selected.employee.currentLocation?.accuracy) ? ` · ±${Math.round(selected.employee.currentLocation.accuracy)} m` : ''}</b></div>
                </div>
                {selected.employee.currentLocation?.address && <div className="small"><b>Near:</b> {selected.employee.currentLocation.address}</div>}
                {selected.employee.todaysTasks?.length > 0 && (
                  <div className="small"><b>Today's tasks:</b> {selected.employee.todaysTasks.map((task) => `${task.title} (${task.status})`).join(' · ')}</div>
                )}
                {routeError && <div className="alert alert-danger mb-0 py-2">{routeError}</div>}
                {route && !route.totalPoints && !routeLoading && <div className="small text-muted">No locations recorded for this employee on this date.</div>}
                {route?.totalPoints > 0 && (
                  <div className="lt-timeline">
                    {[...route.route].reverse().slice(0, 40).map((p) => (
                      <div key={p.sequence} className="lt-tl-row">
                        <b>{formatClock(p.timestamp)}</b>
                        <span>{p.address || `${Number(p.latitude).toFixed(5)}, ${Number(p.longitude).toFixed(5)}`}{isNum(p.speed) && p.speed >= 1 ? ` · ${Math.round(p.speed * 3.6)} km/h` : ''}</span>
                        <a href={googleMapsUrl(p.latitude, p.longitude)} target="_blank" rel="noopener noreferrer">Map</a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ---------- right column: radar + roster ---------- */}
        <div className="d-grid gap-3">
          <div className="lt-card lt-radar-card">
            <div className="lt-card-head">
              <strong style={{ color: '#fff' }}>Radar</strong>
              <span style={{ fontSize: '.74rem', color: '#94a3b8' }}>centre: {radarCenter?.label || '—'} · range {formatDistance(effectiveRange)}</span>
            </div>
            <Radar
              center={radarCenter}
              centerLabel={radarCenter?.label || 'Centre'}
              blips={blips}
              range={effectiveRange}
              selectedId={selectedId}
              onSelect={selectEmployee}
            />
            <div className="lt-radar-meta">
              {[['auto', 'Auto'], [1000, '1 km'], [5000, '5 km'], [25000, '25 km'], [100000, '100 km']].map(([value, label]) => (
                <button key={value} type="button" className={String(radarRange) === String(value) ? 'active' : ''} onClick={() => setRadarRange(value)}>{label}</button>
              ))}
            </div>
          </div>

          <div className="lt-card">
            <div className="lt-card-head">
              <strong>Team right now</strong>
              <span className="small text-muted">{visible.length} of {counts.total}</span>
            </div>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #f0f2f7' }}>
              <input className="lt-input" placeholder="Search name, ID, shift…" value={query} onChange={(e) => setQuery(e.target.value)} />
              <div className="d-flex flex-wrap gap-1 mt-2">
                {FILTERS.map(([key, label]) => (
                  <button key={key} type="button" className={`lt-btn ${filter === key ? 'active' : ''}`} style={{ padding: '4px 9px', fontSize: '.72rem' }} onClick={() => setFilter(key)}>{label}</button>
                ))}
              </div>
            </div>
            <div className="lt-roster">
              {loading && <div className="p-3 text-muted small">Loading…</div>}
              {!loading && visible.length === 0 && <div className="p-3 text-muted small">No employees match this filter.</div>}
              {visible.map(({ employee, info }) => (
                <button key={employee._id} type="button" className={`lt-row ${employee._id === selectedId ? 'selected' : ''}`} onClick={() => selectEmployee(employee._id)}>
                  <div className="lt-avatar" style={{ '--c': info.color }}>
                    {employee.profilePhoto ? <img src={employee.profilePhoto} alt="" /> : initials(employee.name)}
                  </div>
                  <div className="lt-row-main">
                    <strong>{employee.name}</strong>
                    <small>{info.activity}</small>
                    <small>{employee.shift?.name || 'No shift'}{employee.isActive ? ` · in ${formatClock(employee.punchIn)}` : ''}{employee.todaysTasks?.[0] ? ` · ${employee.todaysTasks[0].title}` : ''}</small>
                  </div>
                  <span className="lt-chip" style={{ '--c': info.color, '--s': info.soft }}><i />{info.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EmployeeTracking;
