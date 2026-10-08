import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Circle, CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import TrackingRadar, {
  MAX_RADAR_KM,
  RADAR_PRESETS,
  bearingBetween,
  compassOf,
  formatDistance,
  isNum,
  metersBetween,
  niceRange,
  radarStyles,
} from './TrackingRadar';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const API = process.env.REACT_APP_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const LIVE_WINDOW_MIN = 15; // a GPS point newer than this counts as live

const STATUS = {
  moving: { label: 'Moving', color: '#2563eb', soft: '#dbeafe', rank: 1 },
  field: { label: 'On field', color: '#7c3aed', soft: '#ede9fe', rank: 2 },
  office: { label: 'At office', color: '#16a34a', soft: '#dcfce7', rank: 3 },
  outside: { label: 'Outside area', color: '#dc2626', soft: '#fee2e2', rank: 0 },
  nosignal: { label: 'No location', color: '#d97706', soft: '#fef3c7', rank: 4 },
  offduty: { label: 'Off duty', color: '#94a3b8', soft: '#f1f5f9', rank: 5 },
};

const TILES = {
  light: { label: 'Streets', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap contributors' },
  dark: { label: 'Dark', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attribution: '&copy; OpenStreetMap contributors &copy; CARTO' },
  satellite: { label: 'Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Tiles &copy; Esri' },
};

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

const formatClock = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
};

const formatDuration = (minutes) => {
  const value = Math.max(0, Math.round(Number(minutes) || 0));
  if (value < 60) return `${value} min`;
  return `${Math.floor(value / 60)}h ${String(value % 60).padStart(2, '0')}m`;
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
const shortAddress = (address) => String(address || '').split(',').slice(0, 2).join(',').trim();

const pathLength = (points) => {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += metersBetween([points[i - 1].latitude, points[i - 1].longitude], [points[i].latitude, points[i].longitude]);
  }
  return total;
};

// Within this distance of the office point someone counts as "at office".
const presenceRadius = (office) => {
  const radius = Number(office?.radiusMeters);
  return Number.isFinite(radius) && radius > 0 && radius <= 2000 ? Math.max(radius, 150) : 300;
};

/**
 * Where an employee is and what they are doing, from attendance + latest position.
 */
const describe = (employee, trail, now, office) => {
  const position = positionOf(employee);
  const source = employee.currentLocation?.source || (position ? 'saved' : null);
  const age = minutesAgo(lastSeenOf(employee), now);
  const live = Boolean(position) && source !== 'punch' && source !== 'saved' && age !== null && age <= LIVE_WINDOW_MIN;
  const speed = Number(employee.currentLocation?.speed);

  let moving = live && Number.isFinite(speed) && speed >= 1;
  let kmh = moving ? speed * 3.6 : 0;
  if (live && !moving && trail && trail.length >= 2) {
    const a = trail[trail.length - 2];
    const b = trail[trail.length - 1];
    const seconds = (new Date(b.timestamp) - new Date(a.timestamp)) / 1000;
    const meters = metersBetween([a.latitude, a.longitude], [b.latitude, b.longitude]);
    if (seconds > 0 && seconds <= 300 && meters >= 30) {
      moving = true;
      kmh = (meters / seconds) * 3.6;
    }
  }

  const officePoint = office && isNum(office.latitude) ? [Number(office.latitude), Number(office.longitude)] : null;
  const fromOffice = position && officePoint ? metersBetween(officePoint, position) : null;
  const bearing = position && officePoint ? bearingBetween(officePoint, position) : null;
  const ownZone = employee.geofence?.source === 'employee' && Number(employee.geofence.radiusMeters) <= 5000;
  const atBase = ownZone ? employee.insideZone === true : (fromOffice !== null && fromOffice <= presenceRadius(office));

  let key;
  if (!employee.isActive) key = 'offduty';
  else if (!position) key = 'nosignal';
  else if (employee.insideZone === false) key = 'outside';
  else if (moving) key = 'moving';
  else if (atBase) key = 'office';
  else key = 'field';

  const zone = ownZone ? (employee.geofence?.label || 'assigned site') : (office?.label || 'office');
  const away = fromOffice !== null ? `${formatDistance(fromOffice)} ${compassOf(bearing)} of office` : '';
  const near = shortAddress(employee.currentLocation?.address);
  let activity;
  if (key === 'offduty') activity = employee.punchOut ? `Punched out at ${formatClock(employee.punchOut)}` : 'Not punched in today';
  else if (key === 'nosignal') activity = `Punched in at ${formatClock(employee.punchIn)} · location not shared`;
  else if (key === 'outside') activity = `${formatDistance(employee.distanceFromZone)} outside ${employee.geofence?.label || 'punch area'}`;
  else if (key === 'moving') activity = `Moving ${Math.round(kmh)} km/h · ${away}`;
  else if (key === 'office') activity = `At ${zone} since ${formatClock(employee.punchIn)}`;
  else activity = `${away}${near ? ` · ${near}` : ''}`;

  let signal;
  if (!position) signal = 'No location';
  else if (live) signal = 'Live GPS';
  else if (source === 'punch') signal = `Punch location · ${formatClock(employee.currentLocation?.timestamp)}`;
  else signal = `Last GPS ${agoText(age)}`;

  return { key, ...STATUS[key], position, age, live, moving, kmh, activity, signal, fromOffice, bearing, source };
};

/**
 * Turns a day's points into a readable story: punch in, stays, journeys, punch out.
 */
const STAY_RADIUS = 120;
const buildTimeline = (points, events) => {
  const items = [];
  const clusters = [];
  let current = null;
  points.forEach((p) => {
    const at = [p.latitude, p.longitude];
    if (current && metersBetween(current.anchor, at) <= STAY_RADIUS) {
      current.points.push(p);
      current.end = p.timestamp;
    } else {
      current = { anchor: at, points: [p], start: p.timestamp, end: p.timestamp };
      clusters.push(current);
    }
  });

  let journey = null;
  let previous = null;
  const closeJourney = (end) => {
    if (journey && journey.distance >= 60) {
      const minutes = (new Date(end) - new Date(journey.start)) / 60000;
      items.push({ type: 'move', start: journey.start, end, distance: journey.distance, minutes, points: journey.points });
    }
    journey = null;
  };
  clusters.forEach((cluster, index) => {
    const minutes = (new Date(cluster.end) - new Date(cluster.start)) / 60000;
    // A place counts as a stop after 3 minutes; the first and last place of the day always do.
    const isStay = minutes >= 3 || index === 0 || index === clusters.length - 1;
    const first = cluster.points[0];
    if (previous) {
      if (!journey) journey = { start: previous.timestamp, distance: 0, points: [[previous.latitude, previous.longitude]] };
      journey.distance += metersBetween([previous.latitude, previous.longitude], [first.latitude, first.longitude]);
      journey.points.push([first.latitude, first.longitude]);
    }
    if (isStay) {
      closeJourney(cluster.start);
      items.push({
        type: 'stay',
        start: cluster.start,
        end: cluster.end,
        minutes,
        latitude: cluster.anchor[0],
        longitude: cluster.anchor[1],
        address: (cluster.points.find((p) => p.address) || {}).address || '',
      });
    } else {
      if (!journey) journey = { start: cluster.start, distance: 0, points: [] };
      journey.distance += pathLength(cluster.points);
      cluster.points.forEach((p) => journey.points.push([p.latitude, p.longitude]));
    }
    previous = cluster.points[cluster.points.length - 1];
  });
  if (previous) closeJourney(previous.timestamp);

  (events || []).forEach((event) => items.push({ ...event, start: event.timestamp, end: event.timestamp }));
  const order = { 'punch-in': 0, stay: 1, move: 1, 'punch-out': 2 };
  items.sort((a, b) => new Date(a.start) - new Date(b.start) || order[a.type] - order[b.type]);
  return items;
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
      <div class="lt-marker ${selected ? 'is-selected' : ''} ${info.live ? '' : 'is-stale'}" style="--c:${info.color}">
        ${info.live ? '<i class="lt-marker-pulse"></i>' : ''}
        <div class="lt-marker-face">${photo}</div>
        <b class="lt-marker-tip"></b>
      </div>`,
  });
};

const officeIcon = L.divIcon({
  className: 'lt-marker-wrap',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  html: '<div class="lt-office"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" stroke-width="2.2"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/></svg></div>',
});

const punchIcon = (type) => L.divIcon({
  className: 'lt-marker-wrap',
  iconSize: [34, 20],
  iconAnchor: [17, 10],
  html: `<div class="lt-punch ${type === 'punch-in' ? 'in' : 'out'}">${type === 'punch-in' ? 'IN' : 'OUT'}</div>`,
});

const stayIcon = (number) => L.divIcon({
  className: 'lt-marker-wrap',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  html: `<div class="lt-stay">${number}</div>`,
});

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

// Keeps the route-replay marker in view without the long fly animation.
const PanTo = ({ point }) => {
  const map = useMap();
  useEffect(() => {
    if (point) map.panTo(point, { animate: true, duration: 0.35 });
  }, [point, map]);
  return null;
};

const readTheme = () => {
  try { return localStorage.getItem('lt-theme') === 'dark' ? 'dark' : 'light'; } catch (e) { return 'light'; }
};

// Genuineness of a day's route: impossible jumps (fake GPS / bad fix), long gaps and accuracy.
const checkRoute = (route) => {
  const pts = (route?.route || []).filter((p) => p.source !== 'punch' && isNum(p.latitude));
  if (pts.length < 2) return null;
  const jumps = [];
  const gaps = [];
  let accSum = 0;
  let accN = 0;
  let poor = 0;
  pts.forEach((p) => {
    if (isNum(p.accuracy)) {
      accSum += Number(p.accuracy);
      accN += 1;
      if (Number(p.accuracy) > 100) poor += 1;
    }
  });
  for (let i = 1; i < pts.length; i += 1) {
    const a = pts[i - 1];
    const b = pts[i];
    const seconds = (new Date(b.timestamp) - new Date(a.timestamp)) / 1000;
    const meters = metersBetween([a.latitude, a.longitude], [b.latitude, b.longitude]);
    const kmh = seconds > 0 ? (meters / seconds) * 3.6 : Infinity;
    if (meters > 1000 && kmh > 150) jumps.push({ from: a, to: b, kmh, meters });
    if (seconds > 30 * 60) gaps.push({ from: a, to: b, minutes: seconds / 60 });
  }
  let verdict = 'ok';
  if (jumps.length) verdict = 'review';
  else if (gaps.length > 2 || poor / pts.length > 0.3) verdict = 'partial';
  return { points: pts.length, avgAccuracy: accN ? accSum / accN : null, poor, jumps, gaps, verdict };
};

const FlyTo = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target.point, Math.max(map.getZoom(), target.zoom || 16), { duration: 0.8 });
  }, [target, map]);
  return null;
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
const FILTERS = [
  ['all', 'All'],
  ['onduty', 'On duty'],
  ['office', 'At office'],
  ['field', 'On field'],
  ['moving', 'Moving'],
  ['live', 'Live GPS'],
  ['outside', 'Outside area'],
  ['nosignal', 'No location'],
  ['offduty', 'Off duty'],
];

const EmployeeTracking = () => {
  const [employees, setEmployees] = useState([]);
  const [office, setOffice] = useState(null);
  const [trails, setTrails] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('onduty');
  const [query, setQuery] = useState('');
  const [view, setView] = useState('map');
  const [mapStyle, setMapStyle] = useState(() => (readTheme() === 'dark' ? 'dark' : 'light'));
  const [showTrails, setShowTrails] = useState(true);
  const [radarRange, setRadarRange] = useState('auto');
  const [customKm, setCustomKm] = useState('');
  const [radarScale, setRadarScale] = useState('log');
  const [liveConnected, setLiveConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const [now, setNow] = useState(Date.now());

  const [selectedId, setSelectedId] = useState(null);
  const [follow, setFollow] = useState(true);
  const [flyTarget, setFlyTarget] = useState(null);
  const [route, setRoute] = useState(null);
  const [routeDate, setRouteDate] = useState(todayKey());
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');
  const selectedRef = useRef(null);
  const routeDateRef = useRef(todayKey());
  const followRef = useRef(true);
  const [theme, setTheme] = useState(readTheme);
  const [presenting, setPresenting] = useState(false);
  const [tour, setTour] = useState(false);
  const [replay, setReplay] = useState({ index: -1, playing: false, speed: 1 });
  const [addresses, setAddresses] = useState({});
  const pageRef = useRef(null);
  const tourRef = useRef(-1);

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
      if (selectedRef.current === employeeId) setRouteError(err.response?.data?.message || 'Could not load the route');
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
      // Routes are a visual extra; the page still works without them.
    }
  };

  // First load shows the loader; later refreshes are silent so the map never flickers.
  const fetchTracking = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await axios.get(`${API}/tracking`, { headers: authHeaders() });
      setEmployees(Array.isArray(res.data?.data) ? res.data.data : []);
      if (res.data?.office) setOffice(res.data.office);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load live tracking');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // A point pushed live: move the marker, extend the trail and the open route.
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
      if (followRef.current) setFlyTarget({ point: [data.latitude, data.longitude], zoom: 15, at: Date.now() });
      if (routeDateRef.current === todayKey()) {
        setRoute((prev) => {
          if (!prev) return prev;
          const points = prev.route || [];
          const last = points[points.length - 1];
          const step = last ? metersBetween([last.latitude, last.longitude], [data.latitude, data.longitude]) : 0;
          return {
            ...prev,
            route: [...points, { latitude: data.latitude, longitude: data.longitude, accuracy: data.accuracy, timestamp: stamp, address: data.address || '', speed: data.speed, distance: Math.round(step), sequence: points.length + 1, source: 'gps' }],
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
    const trailPoll = setInterval(fetchTrails, 120000);
    const clock = setInterval(() => setNow(Date.now()), 10000);

    // Live stream: a one-time ticket is exchanged first, then the stream reconnects on its own.
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
    info: describe(employee, trails[employee._id], now, office),
  })), [employees, trails, now, office]);

  const counts = useMemo(() => {
    const base = { total: rows.length, onduty: 0, live: 0, moving: 0, office: 0, field: 0, outside: 0, nosignal: 0, offduty: 0, late: 0, distance: 0 };
    rows.forEach(({ employee, info }) => {
      base[info.key] += 1;
      if (employee.isActive) base.onduty += 1;
      if (info.live) base.live += 1;
      if (employee.isActive && employee.isLate) base.late += 1;
      if (employee.isActive) base.distance += pathLength(trails[employee._id] || []);
    });
    return base;
  }, [rows, trails]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter(({ employee, info }) => {
        const matchFilter = filter === 'all'
          || (filter === 'onduty' && employee.isActive)
          || (filter === 'live' && info.live)
          || info.key === filter;
        const matchQuery = !q || [employee.name, employee.employeeId, employee.position, employee.department, employee.team, employee.shift?.name, employee.currentLocation?.address]
          .some((value) => String(value || '').toLowerCase().includes(q));
        return matchFilter && matchQuery;
      })
      .sort((a, b) => a.info.rank - b.info.rank || String(a.employee.name).localeCompare(String(b.employee.name)));
  }, [rows, filter, query]);

  const located = visible.filter(({ info }) => info.position);
  const selected = rows.find(({ employee }) => employee._id === selectedId) || null;
  const routePoints = (route?.route || []).map((p) => [p.latitude, p.longitude]);
  const timeline = useMemo(() => buildTimeline(route?.route || [], route?.events || []), [route]);
  const stays = timeline.filter((item) => item.type === 'stay');
  const movingMinutes = timeline.filter((item) => item.type === 'move').reduce((sum, item) => sum + item.minutes, 0);
  const routeCheck = useMemo(() => checkRoute(route), [route]);
  const replayPoint = replay.index >= 0 ? routePoints[Math.min(replay.index, routePoints.length - 1)] : null;
  const replayRow = replay.index >= 0 ? (route?.route || [])[Math.min(replay.index, (route?.route || []).length - 1)] : null;

  // Route replay: walks the marker along the day's route.
  useEffect(() => {
    if (!replay.playing) return undefined;
    const timer = setInterval(() => {
      setReplay((prev) => {
        const last = routePoints.length - 1;
        if (prev.index >= last) return { ...prev, playing: false };
        return { ...prev, index: Math.min(last, prev.index + prev.speed) };
      });
    }, 400);
    return () => clearInterval(timer);
  }, [replay.playing, routePoints.length]);
  useEffect(() => { setReplay({ index: -1, playing: false, speed: 1 }); }, [selectedId, routeDate]);

  const officeLat = office && isNum(office.latitude) ? Number(office.latitude) : null;
  const officeLng = office && isNum(office.longitude) ? Number(office.longitude) : null;
  const officePoint = useMemo(() => (officeLat !== null && officeLng !== null ? [officeLat, officeLng] : null), [officeLat, officeLng]);

  const blips = useMemo(() => {
    if (!officePoint) return [];
    return visible
      .filter(({ info }) => info.position)
      .map(({ employee, info }) => ({
        id: employee._id,
        name: employee.name,
        label: info.label,
        color: info.color,
        live: info.live,
        distance: info.fromOffice ?? metersBetween(officePoint, info.position),
        bearing: info.bearing ?? bearingBetween(officePoint, info.position),
      }));
  }, [visible, officePoint]);

  const effectiveRange = (() => {
    if (radarRange === 'custom') {
      const km = Math.min(Math.max(Number(customKm) || 0, 0.1), MAX_RADAR_KM);
      return km * 1000;
    }
    if (radarRange !== 'auto') return Number(radarRange);
    const farthest = Math.max(1000, ...blips.map((b) => b.distance));
    return niceRange(farthest * 1.1);
  })();

  const contacts = [...blips].sort((a, b) => a.distance - b.distance);

  // Distinct punch areas to draw once (the company-wide area only when it is a real area).
  const zones = useMemo(() => Object.values(rows.reduce((acc, { employee }) => {
    const zone = employee.geofence;
    if (!zone || !isNum(zone.latitude) || !isNum(zone.longitude) || Number(zone.radiusMeters) > 20000) return acc;
    const key = `${zone.latitude},${zone.longitude},${zone.radiusMeters}`;
    acc[key] = acc[key] || { ...zone, key, count: 0 };
    acc[key].count += 1;
    return acc;
  }, {})), [rows]);

  /* ---------------- actions ---------------- */
  const selectEmployee = (employeeId) => {
    if (selectedRef.current === employeeId) return;
    selectedRef.current = employeeId;
    routeDateRef.current = todayKey();
    setRouteDate(todayKey());
    setSelectedId(employeeId);
    setRoute(null);
    setRouteError('');
    setView('map');
    fetchRoute(employeeId, false, todayKey());
  };

  const clearSelection = () => {
    selectedRef.current = null;
    setSelectedId(null);
    setRoute(null);
    setRouteError('');
  };

  const changeRouteDate = (date) => {
    if (!date) return;
    routeDateRef.current = date;
    setRouteDate(date);
    setRoute(null);
    fetchRoute(selectedRef.current, false, date);
  };

  const toggleFollow = () => {
    followRef.current = !follow;
    setFollow(!follow);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try { localStorage.setItem('lt-theme', next); } catch (e) { /* not stored */ }
    if (mapStyle !== 'satellite') setMapStyle(next === 'dark' ? 'dark' : 'light');
  };

  // Client view: full screen, larger map and plain-language legend.
  const togglePresenting = async () => {
    const el = pageRef.current;
    if (!presenting) {
      setPresenting(true);
      try { if (el && el.requestFullscreen && !document.fullscreenElement) await el.requestFullscreen(); } catch (e) { /* browser refused; the page view still works */ }
    } else {
      setPresenting(false);
      setTour(false);
      try { if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen(); } catch (e) { /* ignore */ }
    }
  };

  useEffect(() => {
    const onChange = () => { if (!document.fullscreenElement) { setPresenting(false); setTour(false); } };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const lookupAddress = async (lat, lng) => {
    const key = `${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`;
    if (addresses[key]) return;
    setAddresses((prev) => ({ ...prev, [key]: 'Finding address…' }));
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=17&lat=${lat}&lon=${lng}`, { headers: { 'Accept-Language': 'en' } });
      const data = await res.json();
      setAddresses((prev) => ({ ...prev, [key]: data.display_name || 'Address not found' }));
    } catch (e) {
      setAddresses((prev) => ({ ...prev, [key]: 'Address not found' }));
    }
  };
  const addressOf = (lat, lng) => addresses[`${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`];

  const focusOn = (lat, lng) => {
    if (isNum(lat) && isNum(lng)) setFlyTarget({ point: [Number(lat), Number(lng)], zoom: 17, at: Date.now() });
  };

  const fitKey = `${filter}|${query}|${located.length > 0}|${selectedId || ''}|${routePoints.length ? 'r' : ''}|${routeDate}`;
  const fitPoints = selectedId
    ? (routePoints.length ? routePoints : (selected?.info.position ? [selected.info.position] : []))
    : located.map(({ info }) => info.position);
  const tiles = TILES[mapStyle];

  // Auto tour (client view): focuses each on-duty employee in turn.
  const tourIds = located.filter(({ employee }) => employee.isActive).map(({ employee }) => employee._id).join(',');
  useEffect(() => {
    if (!tour) return undefined;
    const ids = tourIds ? tourIds.split(',') : [];
    if (!ids.length) return undefined;
    const next = () => {
      tourRef.current = (tourRef.current + 1) % ids.length;
      selectEmployee(ids[tourRef.current]);
    };
    next();
    const timer = setInterval(next, 10000);
    return () => clearInterval(timer);
  }, [tour, tourIds]);

  const kpis = [
    ['onduty', 'On duty', counts.onduty, '#0a1f8f', `${counts.late} late today`],
    ['office', 'At office', counts.office, STATUS.office.color, 'inside office area'],
    ['field', 'On field', counts.field, STATUS.field.color, 'away from office'],
    ['moving', 'Moving', counts.moving, STATUS.moving.color, 'travelling now'],
    ['live', 'Live GPS', counts.live, '#0891b2', 'phones sending location'],
    ['offduty', 'Off duty', counts.offduty, STATUS.offduty.color, 'not punched in'],
  ];

  /* ---------------- render ---------------- */
  return (
    <div ref={pageRef} className={`lt-page theme-${theme} ${presenting ? 'lt-present' : ''}`}>
      <style>{radarStyles}</style>
      <style>{`
        .lt-page { display: grid; gap: 14px; color: #0f172a; }
        .lt-hero { display: flex; flex-wrap: wrap; gap: 14px; justify-content: space-between; align-items: center; padding: 18px 20px; border-radius: 18px; color: #fff; background: radial-gradient(circle at 85% 20%, rgba(34,197,94,.25), transparent 40%), linear-gradient(135deg, #04122e 0%, #0a1f8f 60%, #1d4ed8 100%); box-shadow: 0 16px 36px rgba(10,31,143,.22); }
        .lt-hero h3 { margin: 2px 0 4px; font-weight: 800; font-size: 1.45rem; }
        .lt-hero p { margin: 0; color: rgba(255,255,255,.78); font-size: .88rem; }
        .lt-eyebrow { font-size: .72rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #86efac; }
        .lt-conn { display: inline-flex; align-items: center; gap: 8px; padding: 7px 12px; border-radius: 999px; font-size: .8rem; font-weight: 700; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2); }
        .lt-dot { width: 9px; height: 9px; border-radius: 50%; background: #34d399; animation: lt-pulse 1.6s infinite; }
        .lt-dot.off { background: #fbbf24; animation: none; }
        @keyframes lt-pulse { 0% { box-shadow: 0 0 0 0 rgba(52,211,153,.6); } 70% { box-shadow: 0 0 0 9px rgba(52,211,153,0); } 100% { box-shadow: 0 0 0 0 rgba(52,211,153,0); } }
        .lt-btn { border: 1px solid #dbe3ef; background: #fff; color: #0f172a; border-radius: 10px; padding: 7px 12px; font-size: .82rem; font-weight: 700; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
        .lt-btn:hover { border-color: #0a1f8f; color: #0a1f8f; }
        .lt-btn.active { background: #0a1f8f; border-color: #0a1f8f; color: #fff; }
        .lt-btn.ghost { background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.25); color: #fff; }
        .lt-btn.sm { padding: 4px 9px; font-size: .72rem; }
        .lt-kpis { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; }
        .lt-kpi { background: #fff; border: 1px solid #e6e9f2; border-radius: 14px; padding: 12px 14px; cursor: pointer; box-shadow: 0 6px 18px rgba(15,23,42,.05); border-left: 4px solid var(--c, #0a1f8f); text-align: left; }
        .lt-kpi.active { outline: 2px solid var(--c, #0a1f8f); }
        .lt-kpi b { display: block; font-size: 1.6rem; font-weight: 800; line-height: 1.1; }
        .lt-kpi span { display: block; font-size: .74rem; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: .05em; }
        .lt-kpi small { color: #94a3b8; font-size: .72rem; }
        .lt-grid { display: grid; grid-template-columns: minmax(0, 1fr) 400px; gap: 14px; align-items: start; }
        .lt-card { background: #fff; border: 1px solid #e6e9f2; border-radius: 16px; box-shadow: 0 6px 18px rgba(15,23,42,.05); overflow: hidden; }
        .lt-card-head { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid #f0f2f7; }
        .lt-card-head strong { font-size: .95rem; }
        .lt-map { height: 620px; position: relative; }
        .lt-map .leaflet-container { height: 100%; width: 100%; font-family: inherit; }
        .lt-map-empty { height: 100%; display: flex; align-items: center; justify-content: center; text-align: center; padding: 24px; color: #64748b; background: #f8fafc; }
        .lt-legend { position: absolute; left: 12px; bottom: 12px; z-index: 500; display: flex; flex-wrap: wrap; gap: 8px; padding: 8px 10px; border-radius: 12px; background: rgba(255,255,255,.94); border: 1px solid #e6e9f2; font-size: .72rem; font-weight: 700; }
        .lt-legend i { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 5px; }
        .lt-marker-wrap { background: none; border: none; }
        .lt-marker { position: relative; width: 46px; height: 56px; }
        .lt-marker-face { position: absolute; left: 3px; top: 0; width: 40px; height: 40px; border-radius: 50%; background: var(--c); border: 3px solid #fff; box-shadow: 0 4px 12px rgba(15,23,42,.35); display: flex; align-items: center; justify-content: center; overflow: hidden; color: #fff; font-weight: 800; font-size: 13px; }
        .lt-marker.is-stale .lt-marker-face { border-style: dashed; }
        .lt-marker.is-selected .lt-marker-face { border-color: #facc15; border-style: solid; box-shadow: 0 0 0 3px rgba(250,204,21,.5), 0 4px 12px rgba(15,23,42,.35); }
        .lt-marker-face img { width: 100%; height: 100%; object-fit: cover; }
        .lt-marker-tip { position: absolute; left: 17px; top: 37px; width: 12px; height: 12px; background: var(--c); transform: rotate(45deg); border-right: 3px solid #fff; border-bottom: 3px solid #fff; }
        .lt-marker-pulse { position: absolute; left: 3px; top: 0; width: 40px; height: 40px; border-radius: 50%; background: var(--c); opacity: .45; animation: lt-ring 1.8s ease-out infinite; }
        @keyframes lt-ring { 0% { transform: scale(1); opacity: .45; } 100% { transform: scale(2.3); opacity: 0; } }
        .lt-office { width: 34px; height: 34px; border-radius: 10px; background: #0a1f8f; border: 3px solid #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(15,23,42,.35); }
        .lt-punch { padding: 2px 6px; border-radius: 6px; color: #fff; font-size: 10px; font-weight: 800; text-align: center; border: 2px solid #fff; box-shadow: 0 2px 6px rgba(15,23,42,.35); }
        .lt-punch.in { background: #16a34a; } .lt-punch.out { background: #dc2626; }
        .lt-stay { width: 24px; height: 24px; border-radius: 50%; background: #0a1f8f; color: #fff; border: 2px solid #fff; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(15,23,42,.35); }
        .lt-radar-card { background: linear-gradient(180deg, #04131f, #020b14); color: #e2e8f0; border-color: #0f2a3d; }
        .lt-radar-card .lt-card-head { border-bottom-color: rgba(255,255,255,.07); }
        .lt-radar-title { color: #fff; }
        .lt-radar-sub { font-size: .72rem; color: #86efac; font-family: ui-monospace, Menlo, Consolas, monospace; }
        .lt-radar-dim { color: #4d7c63; }
        .lt-radar-card.theme-light { background: linear-gradient(180deg, #ffffff, #f3f6ff); color: #0f172a; border-color: #dbe3ef; }
        .lt-radar-card.theme-light .lt-card-head { border-bottom-color: #e6e9f2; }
        .theme-light .lt-radar-title { color: #0a1f8f; }
        .theme-light .lt-radar-sub { color: #1d4ed8; }
        .theme-light .lt-radar-dim { color: #64748b; }
        .theme-light .lt-radar-controls { border-top-color: #e6e9f2; }
        .theme-light .lt-radar-controls button { border-color: #c7d2fe; color: #1e3a8a; }
        .theme-light .lt-radar-controls button.active { background: #0a1f8f; border-color: #0a1f8f; color: #fff; }
        .theme-light .lt-radar-controls input { background: #fff; border-color: #c7d2fe; color: #0f172a; }
        .theme-light .lt-radar-controls label { color: #64748b; }
        .theme-light .lt-contacts { border-top-color: #e6e9f2; }
        .theme-light .lt-contact { color: #334155; }
        .theme-light .lt-contact:hover, .theme-light .lt-contact.selected { background: #eef2ff; color: #0a1f8f; }
        .lt-dist { color: #86efac; } .theme-light .lt-dist { color: #15803d; } .lt-dist.far { color: #f87171; }
        .lt-page.lt-present { position: fixed; inset: 0; z-index: 3000; overflow-y: auto; padding: 18px; background: #eef2f9; }
        .lt-page.lt-present.theme-dark { background: #020b14; }
        .lt-present .lt-map { height: calc(100vh - 360px); min-height: 460px; }
        .lt-guide { display: flex; flex-wrap: wrap; gap: 10px 18px; align-items: center; padding: 12px 16px; border-radius: 14px; background: #fff; border: 1px solid #e6e9f2; font-size: .86rem; color: #334155; }
        .theme-dark .lt-guide { background: #04131f; border-color: #0f2a3d; color: #cbd5e1; }
        .lt-guide i { display: inline-block; width: 11px; height: 11px; border-radius: 50%; margin-right: 6px; vertical-align: -1px; }
        .lt-guide strong { font-size: .92rem; }
        .lt-clock { font-size: 1.6rem; font-weight: 800; letter-spacing: .02em; font-variant-numeric: tabular-nums; }
        .lt-check { border-radius: 12px; padding: 10px 12px; font-size: .84rem; border: 1px solid #e6e9f2; background: #f8fafc; }
        .lt-check.ok { background: #f0fdf4; border-color: #bbf7d0; } .lt-check.partial { background: #fffbeb; border-color: #fde68a; } .lt-check.review { background: #fef2f2; border-color: #fecaca; }
        .lt-check ul { margin: 6px 0 0; padding-left: 18px; }
        .lt-check li { cursor: pointer; }
        .lt-replay { display: grid; grid-template-columns: auto 1fr auto auto; gap: 10px; align-items: center; padding: 10px 12px; border-radius: 12px; background: #eef2ff; }
        .lt-replay input[type=range] { width: 100%; accent-color: #0a1f8f; }
        .lt-addr-btn { border: none; background: none; color: #1d4ed8; font-weight: 700; font-size: .74rem; padding: 0; }
        .lt-radar-wrap { padding: 6px 10px 0; }
        .lt-radar-controls { display: grid; gap: 8px; padding: 10px 14px 12px; border-top: 1px solid rgba(255,255,255,.06); }
        .lt-radar-controls .row-line { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
        .lt-radar-controls button { border: 1px solid rgba(134,239,172,.25); background: transparent; color: #a7f3d0; border-radius: 999px; font-size: .7rem; font-weight: 700; padding: 3px 9px; cursor: pointer; font-family: ui-monospace, Menlo, Consolas, monospace; }
        .lt-radar-controls button.active { background: #22c55e; border-color: #22c55e; color: #03101c; }
        .lt-radar-controls input { width: 86px; background: #031320; border: 1px solid rgba(134,239,172,.3); color: #e2e8f0; border-radius: 8px; padding: 3px 8px; font-size: .75rem; }
        .lt-radar-controls label { font-size: .68rem; color: #4d7c63; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; margin-right: 4px; }
        .lt-contacts { border-top: 1px solid rgba(255,255,255,.06); max-height: 220px; overflow-y: auto; }
        .lt-contact { display: grid; grid-template-columns: 10px 1fr auto auto; gap: 10px; align-items: center; width: 100%; border: none; background: transparent; color: #cbd5e1; padding: 7px 14px; font-size: .78rem; text-align: left; cursor: pointer; font-family: ui-monospace, Menlo, Consolas, monospace; }
        .lt-contact:hover, .lt-contact.selected { background: rgba(34,197,94,.1); color: #fff; }
        .lt-contact i { width: 9px; height: 9px; border-radius: 50%; }
        .lt-contact span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: inherit; }
        .lt-roster { max-height: 520px; overflow-y: auto; }
        .lt-row { display: flex; gap: 10px; align-items: center; width: 100%; text-align: left; border: none; background: #fff; padding: 10px 14px; border-bottom: 1px solid #f0f2f7; cursor: pointer; }
        .lt-row:hover { background: #f8fafc; }
        .lt-row.selected { background: #eef1fc; box-shadow: inset 3px 0 0 #0a1f8f; }
        .lt-avatar { position: relative; width: 38px; height: 38px; border-radius: 50%; flex: 0 0 auto; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: .78rem; color: #fff; background: var(--c); overflow: hidden; }
        .lt-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .lt-avatar .live { position: absolute; right: 1px; bottom: 1px; width: 10px; height: 10px; border-radius: 50%; background: #22c55e; border: 2px solid #fff; }
        .lt-row-main { min-width: 0; flex: 1; }
        .lt-row-main strong { display: block; font-size: .88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .lt-row-main small { display: block; color: #64748b; font-size: .74rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .lt-chip { display: inline-flex; align-items: center; gap: 5px; padding: 3px 8px; border-radius: 999px; font-size: .7rem; font-weight: 800; white-space: nowrap; color: var(--c); background: var(--s); }
        .lt-chip i { width: 7px; height: 7px; border-radius: 50%; background: var(--c); }
        .lt-input { border: 1px solid #dbe3ef; border-radius: 10px; padding: 8px 11px; font-size: .86rem; width: 100%; background: #fff; }
        .lt-input:focus { outline: none; border-color: #0a1f8f; box-shadow: 0 0 0 3px rgba(10,31,143,.12); }
        .lt-select { border: 1px solid #dbe3ef; border-radius: 10px; padding: 6px 10px; font-size: .82rem; font-weight: 700; background: #fff; }
        .lt-detail { padding: 14px; display: grid; gap: 12px; }
        .lt-detail-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
        .lt-stat { background: #f8fafc; border: 1px solid #eef1f6; border-radius: 12px; padding: 9px 10px; }
        .lt-stat span { display: block; font-size: .68rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .04em; }
        .lt-stat b { font-size: .9rem; }
        .lt-timeline { max-height: 360px; overflow-y: auto; padding-left: 6px; }
        .lt-tl { position: relative; display: grid; grid-template-columns: 30px 1fr auto; gap: 10px; padding: 8px 4px; cursor: pointer; border-radius: 10px; }
        .lt-tl:hover { background: #f5f7fb; }
        .lt-tl::before { content: ''; position: absolute; left: 18px; top: 0; bottom: 0; width: 2px; background: #e2e8f0; }
        .lt-tl:first-child::before { top: 20px; } .lt-tl:last-child::before { bottom: calc(100% - 20px); }
        .lt-tl-icon { position: relative; z-index: 1; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: .62rem; font-weight: 800; border: 2px solid #fff; box-shadow: 0 0 0 1px #e2e8f0; }
        .lt-tl-body strong { display: block; font-size: .86rem; }
        .lt-tl-body small { display: block; color: #64748b; font-size: .76rem; }
        .lt-tl-time { font-size: .76rem; font-weight: 700; color: #0a1f8f; white-space: nowrap; text-align: right; }
        .lt-table { width: 100%; border-collapse: collapse; font-size: .84rem; }
        .lt-table th { text-align: left; padding: 10px 12px; font-size: .7rem; text-transform: uppercase; letter-spacing: .05em; color: #64748b; background: #f8fafc; border-bottom: 1px solid #e6e9f2; white-space: nowrap; }
        .lt-table td { padding: 10px 12px; border-bottom: 1px solid #f0f2f7; vertical-align: middle; }
        .lt-table tr:hover td { background: #f8fafc; cursor: pointer; }
        @media (max-width: 1320px) { .lt-grid { grid-template-columns: 1fr; } .lt-kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); } .lt-detail-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .lt-radar-wrap { max-width: 520px; margin: 0 auto; } }
        @media (max-width: 640px) { .lt-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } .lt-map { height: 440px; } }
      `}</style>

      {/* ---------- header ---------- */}
      <section className="lt-hero">
        <div>
          <div className="lt-eyebrow">Live operations centre</div>
          <h3>Employee Live Tracking</h3>
          <p>Where every employee is, what they are doing and the route they took today.</p>
        </div>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          {presenting && <span className="lt-clock">{new Date(now).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}</span>}
          <button type="button" className="lt-btn ghost" onClick={toggleTheme} title="Switch radar and map theme">{theme === 'dark' ? 'Light theme' : 'Dark theme'}</button>
          <button type="button" className="lt-btn ghost" onClick={togglePresenting}>{presenting ? 'Exit client view' : 'Client view'}</button>
          {presenting && <button type="button" className={`lt-btn ghost ${tour ? 'active' : ''}`} onClick={() => setTour(!tour)}>{tour ? 'Stop tour' : 'Auto tour'}</button>}
          <span className="lt-conn">
            <span className={`lt-dot ${liveConnected ? '' : 'off'}`} />
            {liveConnected ? 'Live' : 'Connecting'} · {counts.live} on live GPS
            {lastEvent ? ` · last update ${lastEvent.toLocaleTimeString('en-IN')}` : ''}
          </span>
          <button type="button" className="lt-btn ghost" onClick={() => { fetchTracking(true); fetchTrails(); if (selectedRef.current) fetchRoute(selectedRef.current, true); }} disabled={loading || refreshing}>
            {loading || refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </section>

      {error && <div className="alert alert-danger mb-0">{error}</div>}

      {presenting && (
        <section className="lt-guide" aria-label="How to read this screen">
          <strong>How to read this screen:</strong>
          <span><i style={{ background: STATUS.office.color }} />At office</span>
          <span><i style={{ background: STATUS.field.color }} />Working on field</span>
          <span><i style={{ background: STATUS.moving.color }} />Travelling now</span>
          <span><i style={{ background: STATUS.outside.color }} />Outside allowed area</span>
          <span><i style={{ background: STATUS.offduty.color }} />Not on duty</span>
          <span>Pulsing photo = live GPS · lines = route taken · radar centre = office</span>
        </section>
      )}

      {/* ---------- KPIs (click to filter) ---------- */}
      <section className="lt-kpis">
        {kpis.map(([key, label, value, color, note]) => (
          <button key={key} type="button" className={`lt-kpi ${filter === key ? 'active' : ''}`} style={{ '--c': color }} onClick={() => setFilter(filter === key ? 'all' : key)}>
            <b style={{ color }}>{value}</b>
            <span>{label}</span>
            <small>{note}</small>
          </button>
        ))}
      </section>

      <section className="lt-grid">
        {/* ---------- map / table ---------- */}
        <div className="d-grid gap-3">
          <div className="lt-card">
            <div className="lt-card-head">
              <strong>{view === 'map' ? 'Live map' : 'All employees'} <span className="text-muted fw-normal">· {visible.length} shown · {formatDistance(counts.distance)} travelled in 12h</span></strong>
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <button type="button" className={`lt-btn ${view === 'map' ? 'active' : ''}`} onClick={() => setView('map')}>Map</button>
                <button type="button" className={`lt-btn ${view === 'table' ? 'active' : ''}`} onClick={() => setView('table')}>Table</button>
                {view === 'map' && (
                  <>
                    <button type="button" className={`lt-btn ${showTrails ? 'active' : ''}`} onClick={() => setShowTrails(!showTrails)}>Routes</button>
                    <select className="lt-select" value={mapStyle} onChange={(e) => setMapStyle(e.target.value)} aria-label="Map style">
                      {Object.entries(TILES).map(([key, tile]) => <option key={key} value={key}>{tile.label}</option>)}
                    </select>
                  </>
                )}
              </div>
            </div>

            {view === 'map' ? (
              <div className="lt-map">
                {loading ? (
                  <div className="lt-map-empty">Loading live positions…</div>
                ) : (
                  <MapContainer center={officePoint || [28.5512, 77.132]} zoom={12} scrollWheelZoom>
                    <TileLayer key={mapStyle} url={tiles.url} attribution={tiles.attribution} />
                    <FitBounds points={fitPoints} fitKey={fitKey} />
                    <FlyTo target={flyTarget} />

                    {officePoint && (
                      <Marker position={officePoint} icon={officeIcon} zIndexOffset={-100}>
                        <Tooltip direction="top" offset={[0, -14]}>{office?.label || 'Office'}</Tooltip>
                      </Marker>
                    )}

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
                          pathOptions={{ color: info.color, weight: 3, opacity: 0.6 }}
                        />
                      );
                    })}

                    {/* selected employee's route for the chosen day */}
                    {selectedId && routePoints.length > 1 && (
                      <>
                        <Polyline positions={routePoints} pathOptions={{ color: '#ffffff', weight: 8, opacity: 0.9 }} />
                        <Polyline positions={routePoints} pathOptions={{ color: '#d0142a', weight: 4, opacity: 0.95 }} />
                        {route.route.map((p) => (
                          <CircleMarker key={`p-${p.sequence}`} center={[p.latitude, p.longitude]} radius={2.5} pathOptions={{ color: '#d0142a', fillColor: '#ffffff', fillOpacity: 1, weight: 1.2 }}>
                            <Tooltip>{formatClock(p.timestamp)}{isNum(p.speed) && p.speed >= 1 ? ` · ${Math.round(p.speed * 3.6)} km/h` : ''}</Tooltip>
                          </CircleMarker>
                        ))}
                      </>
                    )}
                    {/* suspicious jumps */}
                    {selectedId && routeCheck?.jumps.map((jump) => (
                      <Polyline key={`jump-${jump.to.timestamp}`} positions={[[jump.from.latitude, jump.from.longitude], [jump.to.latitude, jump.to.longitude]]} pathOptions={{ color: '#f59e0b', weight: 4, dashArray: '8 8' }}>
                        <Tooltip>Possible fake / wrong GPS: {formatDistance(jump.meters)} in {formatDuration((new Date(jump.to.timestamp) - new Date(jump.from.timestamp)) / 60000)} ({Math.round(jump.kmh)} km/h)</Tooltip>
                      </Polyline>
                    ))}
                    {/* route replay */}
                    {selectedId && replayPoint && (
                      <>
                        <Polyline positions={routePoints.slice(0, replay.index + 1)} pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.95 }} />
                        <CircleMarker center={replayPoint} radius={9} pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }}>
                          <Tooltip permanent direction="top" offset={[0, -10]}>{formatClock(replayRow?.timestamp)}</Tooltip>
                        </CircleMarker>
                        {replay.playing && <PanTo point={replayPoint} />}
                      </>
                    )}
                    {selectedId && stays.map((stay, index) => (
                      <Marker key={`stay-${stay.start}`} position={[stay.latitude, stay.longitude]} icon={stayIcon(index + 1)} zIndexOffset={200}>
                        <Tooltip>Stop {index + 1} · {formatClock(stay.start)}–{formatClock(stay.end)} · {formatDuration(stay.minutes)}{stay.address ? ` · ${shortAddress(stay.address)}` : ''}</Tooltip>
                      </Marker>
                    ))}
                    {selectedId && (route?.events || []).filter((e) => isNum(e.latitude)).map((event) => (
                      <Marker key={`${event.type}-${event.timestamp}`} position={[event.latitude, event.longitude]} icon={punchIcon(event.type)} zIndexOffset={300}>
                        <Tooltip>{event.type === 'punch-in' ? 'Punch in' : 'Punch out'} · {formatClock(event.timestamp)}{event.address ? ` · ${shortAddress(event.address)}` : ''}</Tooltip>
                      </Marker>
                    ))}

                    {located.map(({ employee, info }) => (
                      <Marker
                        key={employee._id}
                        position={info.position}
                        icon={markerIcon(employee, info, employee._id === selectedId)}
                        zIndexOffset={employee._id === selectedId ? 1000 : info.live ? 500 : 0}
                        eventHandlers={{ click: () => selectEmployee(employee._id) }}
                      >
                        <Popup>
                          <div style={{ minWidth: 220 }}>
                            <strong style={{ fontSize: 14 }}>{employee.name}</strong>
                            <div style={{ color: '#64748b', fontSize: 12 }}>{employee.employeeId} · {employee.position || employee.department || 'Employee'}</div>
                            <div style={{ margin: '8px 0' }}>
                              <span className="lt-chip" style={{ '--c': info.color, '--s': info.soft }}><i />{info.label}</span>
                            </div>
                            <div style={{ fontSize: 12.5, lineHeight: 1.55 }}>
                              <div><b>Now:</b> {info.activity}</div>
                              <div><b>Shift:</b> {employee.shift?.label || '—'}{employee.isLate ? ` · late ${employee.lateMinutes || ''}m` : ''}</div>
                              {employee.currentLocation?.address && <div><b>Near:</b> {employee.currentLocation.address}</div>}
                              <div><b>Location:</b> {info.signal}{isNum(employee.currentLocation?.accuracy) ? ` · ±${Math.round(employee.currentLocation.accuracy)} m` : ''}</div>
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
                    Nobody to show for this filter. Positions appear when employees punch in from the app.
                  </div>
                )}
                {!loading && (
                  <div className="lt-legend">
                    {['office', 'field', 'moving', 'outside', 'offduty'].map((key) => (
                      <span key={key}><i style={{ background: STATUS[key].color }} />{STATUS[key].label}</span>
                    ))}
                    <span style={{ color: '#64748b' }}>dashed ring = no live GPS</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="lt-table">
                  <thead>
                    <tr>
                      <th>Employee</th><th>Status</th><th>Doing now</th><th>Location</th><th>Shift</th><th>Punch in</th><th>Hours</th><th>Travelled</th><th>Tasks</th>
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
                        <td style={{ maxWidth: 220 }}>
                          <div className="small">{shortAddress(employee.currentLocation?.address) || '—'}</div>
                          <div className="small text-muted">{info.signal}</div>
                        </td>
                        <td>
                          <span style={{ color: employee.shift?.color || '#0f172a', fontWeight: 700 }}>{employee.shift?.name || '—'}</span>
                          {employee.isLate && <div className="small" style={{ color: '#d97706' }}>Late {employee.lateMinutes || ''}m</div>}
                        </td>
                        <td>{formatClock(employee.punchIn)}</td>
                        <td>{(Number(employee.hoursWorked) || 0).toFixed(1)} h</td>
                        <td>{formatDistance(pathLength(trails[employee._id] || []))}</td>
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
                    {selected.info.live && <span className="live" />}
                  </div>
                  <div>
                    <strong>{selected.employee.name}</strong>
                    <div className="small text-muted">{selected.employee.employeeId} · {selected.employee.shift?.label || 'No shift'}</div>
                  </div>
                  <span className="lt-chip ms-1" style={{ '--c': selected.info.color, '--s': selected.info.soft }}><i />{selected.info.label}</span>
                </div>
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <input type="date" className="lt-input" style={{ width: 'auto' }} value={routeDate} max={todayKey()} onChange={(e) => changeRouteDate(e.target.value)} />
                  <button type="button" className={`lt-btn ${follow ? 'active' : ''}`} onClick={toggleFollow}>{follow ? 'Following live' : 'Follow live'}</button>
                  {selected.info.position && <a className="lt-btn" href={googleMapsUrl(selected.info.position[0], selected.info.position[1])} target="_blank" rel="noopener noreferrer">Google Maps</a>}
                  <button type="button" className="lt-btn" onClick={clearSelection}>Close</button>
                </div>
              </div>
              <div className="lt-detail">
                <div className="lt-detail-grid">
                  <div className="lt-stat"><span>Doing now</span><b>{selected.info.activity}</b></div>
                  <div className="lt-stat"><span>Location</span><b>{selected.info.signal}</b></div>
                  <div className="lt-stat"><span>Punch in</span><b>{formatClock(selected.employee.punchIn)}{selected.employee.isLate ? ` · late ${selected.employee.lateMinutes || ''}m` : ''}</b></div>
                  <div className="lt-stat"><span>Worked</span><b>{(Number(selected.employee.hoursWorked) || 0).toFixed(1)} h</b></div>
                  <div className="lt-stat"><span>Travelled {routeDate === todayKey() ? 'today' : routeDate}</span><b>{routeLoading ? 'Loading…' : route ? formatDistance(route.totalDistance) : '—'}</b></div>
                  <div className="lt-stat"><span>Stops / moving</span><b>{route ? `${stays.length} stops · ${formatDuration(movingMinutes)} moving` : '—'}</b></div>
                  <div className="lt-stat"><span>From office</span><b>{selected.info.fromOffice !== null ? `${formatDistance(selected.info.fromOffice)} ${compassOf(selected.info.bearing)}` : '—'}</b></div>
                  <div className="lt-stat"><span>Battery / accuracy</span><b>{isNum(selected.employee.currentLocation?.batteryLevel) ? `${selected.employee.currentLocation.batteryLevel}%` : '—'}{isNum(selected.employee.currentLocation?.accuracy) ? ` · ±${Math.round(selected.employee.currentLocation.accuracy)} m` : ''}</b></div>
                </div>
                {selected.employee.currentLocation?.address && <div className="small"><b>Near:</b> {selected.employee.currentLocation.address}</div>}
                {selected.employee.todaysTasks?.length > 0 && (
                  <div className="small"><b>Today's tasks:</b> {selected.employee.todaysTasks.map((task) => `${task.title} (${task.status})`).join(' · ')}</div>
                )}
                {!selected.info.live && selected.employee.isActive && selected.info.position && (
                  <div className="small" style={{ color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '8px 10px' }}>
                    This employee's phone is not sending live location right now, so the map shows their {selected.info.source === 'punch' ? 'punch-in location' : 'last known location'}. Live movement appears when they use the latest AeroAttendance app with location allowed.
                  </div>
                )}
                {routeError && <div className="alert alert-danger mb-0 py-2">{routeError}</div>}

                {routeCheck && (
                  <div className={`lt-check ${routeCheck.verdict}`}>
                    <strong>
                      {routeCheck.verdict === 'ok' && 'Route check: looks genuine'}
                      {routeCheck.verdict === 'partial' && 'Route check: partly tracked'}
                      {routeCheck.verdict === 'review' && 'Route check: needs review'}
                    </strong>
                    <span className="text-muted"> · {routeCheck.points} GPS points{routeCheck.avgAccuracy !== null ? ` · average accuracy ±${Math.round(routeCheck.avgAccuracy)} m` : ''}{routeCheck.poor ? ` · ${routeCheck.poor} weak fixes` : ''}</span>
                    {(routeCheck.jumps.length > 0 || routeCheck.gaps.length > 0) && (
                      <ul>
                        {routeCheck.jumps.map((jump) => (
                          <li key={`j-${jump.to.timestamp}`} onClick={() => focusOn(jump.to.latitude, jump.to.longitude)}>
                            {formatClock(jump.from.timestamp)} → {formatClock(jump.to.timestamp)}: jumped {formatDistance(jump.meters)} ({Math.round(jump.kmh)} km/h) - possible fake location or wrong GPS fix
                          </li>
                        ))}
                        {routeCheck.gaps.map((gap) => (
                          <li key={`g-${gap.to.timestamp}`} onClick={() => focusOn(gap.from.latitude, gap.from.longitude)}>
                            {formatClock(gap.from.timestamp)} → {formatClock(gap.to.timestamp)}: no location for {formatDuration(gap.minutes)} (phone off, no network or app closed)
                          </li>
                        ))}
                      </ul>
                    )}
                    {routeCheck.verdict === 'ok' && <div className="small text-muted mt-1">Every point follows the previous one at a realistic speed, with no long gaps.</div>}
                  </div>
                )}

                {routePoints.length > 1 && (
                  <div className="lt-replay">
                    <button type="button" className="lt-btn active" onClick={() => setReplay((prev) => ({ ...prev, index: prev.index >= routePoints.length - 1 ? 0 : Math.max(prev.index, 0), playing: !prev.playing }))}>
                      {replay.playing ? 'Pause' : replay.index >= 0 ? 'Play' : 'Play route'}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max={routePoints.length - 1}
                      value={Math.max(replay.index, 0)}
                      onChange={(e) => setReplay((prev) => ({ ...prev, index: Number(e.target.value), playing: false }))}
                      aria-label="Route replay position"
                    />
                    <select className="lt-select" value={replay.speed} onChange={(e) => setReplay((prev) => ({ ...prev, speed: Number(e.target.value) }))} aria-label="Replay speed">
                      <option value={1}>1x</option>
                      <option value={3}>3x</option>
                      <option value={10}>10x</option>
                    </select>
                    <span className="small fw-bold" style={{ minWidth: 120, textAlign: 'right' }}>
                      {replayRow ? `${formatClock(replayRow.timestamp)}${isNum(replayRow.speed) && replayRow.speed >= 1 ? ` · ${Math.round(replayRow.speed * 3.6)} km/h` : ''}` : 'Replay the day'}
                    </span>
                  </div>
                )}

                <div className="d-flex justify-content-between align-items-center">
                  <strong style={{ fontSize: '.92rem' }}>Route timeline</strong>
                  <span className="small text-muted">{route ? `${route.totalPoints} location points` : ''}</span>
                </div>
                {routeLoading && <div className="small text-muted">Loading route…</div>}
                {route && !timeline.length && !routeLoading && <div className="small text-muted">No punches or locations recorded on this date.</div>}
                {timeline.length > 0 && (
                  <div className="lt-timeline">
                    {timeline.map((item, index) => {
                      const key = `${item.type}-${item.start}-${index}`;
                      if (item.type === 'punch-in' || item.type === 'punch-out') {
                        const isIn = item.type === 'punch-in';
                        return (
                          <div key={key} className="lt-tl" onClick={() => focusOn(item.latitude, item.longitude)} role="button" tabIndex={0}>
                            <span className="lt-tl-icon" style={{ background: isIn ? '#16a34a' : '#dc2626' }}>{isIn ? 'IN' : 'OUT'}</span>
                            <div className="lt-tl-body">
                              <strong>{isIn ? 'Punched in' : 'Punched out'}{item.mode === 'wfh' ? ' (Work from home)' : ''}</strong>
                              <small>{item.address || (isNum(item.latitude) ? `${Number(item.latitude).toFixed(5)}, ${Number(item.longitude).toFixed(5)}` : 'Location not recorded')}</small>
                            </div>
                            <span className="lt-tl-time">{formatClock(item.start)}</span>
                          </div>
                        );
                      }
                      if (item.type === 'stay') {
                        const number = stays.indexOf(item) + 1;
                        const atOffice = officePoint && metersBetween(officePoint, [item.latitude, item.longitude]) <= presenceRadius(office);
                        return (
                          <div key={key} className="lt-tl" onClick={() => focusOn(item.latitude, item.longitude)} role="button" tabIndex={0}>
                            <span className="lt-tl-icon" style={{ background: atOffice ? '#16a34a' : '#0a1f8f' }}>{number}</span>
                            <div className="lt-tl-body">
                              <strong>{item.minutes >= 1 ? `Stayed ${formatDuration(item.minutes)}` : 'Located'}{atOffice ? ' at office' : ''}</strong>
                              <small>
                                {item.address || addressOf(item.latitude, item.longitude) || `${item.latitude.toFixed(5)}, ${item.longitude.toFixed(5)}`}
                                {!item.address && !addressOf(item.latitude, item.longitude) && (
                                  <>{' · '}<button type="button" className="lt-addr-btn" onClick={(e) => { e.stopPropagation(); lookupAddress(item.latitude, item.longitude); }}>Find address</button></>
                                )}
                              </small>
                            </div>
                            <span className="lt-tl-time">{formatClock(item.start)}{item.minutes >= 1 ? ` – ${formatClock(item.end)}` : ''}</span>
                          </div>
                        );
                      }
                      const kmh = item.minutes > 0 ? (item.distance / 1000) / (item.minutes / 60) : 0;
                      const lastPoint = item.points?.length ? item.points[item.points.length - 1] : null;
                      return (
                        <div key={key} className="lt-tl" onClick={() => lastPoint && focusOn(lastPoint[0], lastPoint[1])} role="button" tabIndex={0}>
                          <span className="lt-tl-icon" style={{ background: '#2563eb' }}>
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#fff" strokeWidth="2.6"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                          </span>
                          <div className="lt-tl-body">
                            <strong>Travelled {formatDistance(item.distance)}</strong>
                            <small>{formatDuration(item.minutes)}{kmh >= 1 ? ` · avg ${Math.round(kmh)} km/h` : ''}</small>
                          </div>
                          <span className="lt-tl-time">{formatClock(item.start)} – {formatClock(item.end)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ---------- right column: radar + roster ---------- */}
        <div className="d-grid gap-3">
          <div className={`lt-card lt-radar-card theme-${theme}`}>
            <div className="lt-card-head">
              <strong className="lt-radar-title">Radar</strong>
              <span className="lt-radar-sub">
                {officePoint ? `${office?.label || 'Office'} · ${officePoint[0].toFixed(4)}, ${officePoint[1].toFixed(4)}` : 'Office location not set'}
              </span>
            </div>
            <div className="lt-radar-wrap">
              <TrackingRadar
                blips={blips}
                range={effectiveRange}
                scale={radarScale}
                selectedId={selectedId}
                onSelect={selectEmployee}
                centerLabel={office?.label || 'Office'}
                theme={theme}
              />
            </div>
            <div className="lt-radar-controls">
              <div className="row-line">
                <label>Range</label>
                <button type="button" className={radarRange === 'auto' ? 'active' : ''} onClick={() => setRadarRange('auto')}>AUTO</button>
                {RADAR_PRESETS.map((value) => (
                  <button key={value} type="button" className={String(radarRange) === String(value) ? 'active' : ''} onClick={() => setRadarRange(value)}>{formatDistance(value).toUpperCase()}</button>
                ))}
              </div>
              <div className="row-line">
                <label>Custom</label>
                <input
                  type="number"
                  min="0.1"
                  max={MAX_RADAR_KM}
                  step="1"
                  placeholder="km"
                  value={customKm}
                  onChange={(e) => { setCustomKm(e.target.value); setRadarRange('custom'); }}
                />
                <span className="lt-radar-dim" style={{ fontSize: '.7rem' }}>km, up to {MAX_RADAR_KM.toLocaleString('en-IN')}</span>
                <span style={{ flex: 1 }} />
                <label>Scale</label>
                <button type="button" className={radarScale === 'log' ? 'active' : ''} onClick={() => setRadarScale('log')}>LOG</button>
                <button type="button" className={radarScale === 'linear' ? 'active' : ''} onClick={() => setRadarScale('linear')}>LINEAR</button>
              </div>
            </div>
            <div className="lt-contacts">
              {contacts.length === 0 && <div className="p-3 small lt-radar-dim">No contacts on the radar for this filter.</div>}
              {contacts.slice(0, 60).map((blip) => (
                <button key={blip.id} type="button" className={`lt-contact ${blip.id === selectedId ? 'selected' : ''}`} onClick={() => selectEmployee(blip.id)}>
                  <i style={{ background: blip.color, boxShadow: blip.live ? `0 0 8px ${blip.color}` : 'none' }} />
                  <span>{blip.name}</span>
                  <span>{String(Math.round(blip.bearing)).padStart(3, '0')}° {compassOf(blip.bearing)}</span>
                  <span className={`lt-dist ${blip.distance > effectiveRange ? 'far' : ''}`}>{formatDistance(blip.distance)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="lt-card">
            <div className="lt-card-head">
              <strong>Team right now</strong>
              <span className="small text-muted">{visible.length} of {counts.total}</span>
            </div>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #f0f2f7' }}>
              <input className="lt-input" placeholder="Search name, ID, shift, area…" value={query} onChange={(e) => setQuery(e.target.value)} />
              <div className="d-flex flex-wrap gap-1 mt-2">
                {FILTERS.map(([key, label]) => (
                  <button key={key} type="button" className={`lt-btn sm ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}>{label}</button>
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
                    {info.live && <span className="live" />}
                  </div>
                  <div className="lt-row-main">
                    <strong>{employee.name}</strong>
                    <small>{info.activity}</small>
                    <small>{employee.shift?.name || 'No shift'}{employee.isActive ? ` · in ${formatClock(employee.punchIn)}` : ''} · {info.signal}</small>
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
