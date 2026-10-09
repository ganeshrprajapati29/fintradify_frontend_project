import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../utils/axios';
import { formatDistance, isNum, metersBetween } from './TrackingRadar';

/**
 * Admin: one employee at a time. The list shows who has shared location from the app
 * (live now / today); clicking one shows their live position and the exact route of
 * the chosen day, updated as new points arrive.
 */

const API = process.env.REACT_APP_API_URL;
const TZ = 'Asia/Kolkata';
const LIVE_MIN = 15;
const MAX_ZOOM = 21;
const TILES = {
  streets: { label: 'Streets', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap contributors', native: 19 },
  satellite: { label: 'Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Tiles &copy; Esri', native: 19 },
};

const todayKey = () => new Date().toLocaleDateString('en-CA', { timeZone: TZ });
const clock = (v) => (v ? new Date(v).toLocaleTimeString('en-IN', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }) : '—');
const clockSec = (v) => (v ? new Date(v).toLocaleTimeString('en-IN', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—');
const ago = (v, now) => {
  if (!v) return 'never';
  const m = Math.max(0, Math.round((now - new Date(v).getTime()) / 60000));
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ${m % 60}m ago`;
  return `${Math.floor(m / 1440)}d ago`;
};
const initials = (name) => String(name || 'E').trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
const esc = (v) => String(v || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const mapsUrl = (lat, lng) => `https://www.google.com/maps?q=${lat},${lng}`;

const liveIcon = (emp, live) => L.divIcon({
  className: 'elt-pin-wrap',
  iconSize: [48, 58],
  iconAnchor: [24, 54],
  html: `<div class="elt-pin ${live ? 'live' : ''}">${live ? '<i></i>' : ''}<div class="face">${emp.profilePhoto ? `<img src="${esc(emp.profilePhoto)}" alt="" />` : esc(initials(emp.name))}</div><b></b></div>`,
});
const startIcon = L.divIcon({ className: 'elt-pin-wrap', iconSize: [36, 20], iconAnchor: [18, 10], html: '<div class="elt-flag start">START</div>' });

const Fit = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    if (target.bounds && target.bounds.length > 1) map.flyToBounds(target.bounds, { padding: [40, 40], maxZoom: 18, duration: 0.7 });
    else if (target.point) map.flyTo(target.point, target.zoom || 18, { duration: 0.7 });
  }, [target, map]);
  return null;
};

const EmployeeLocationTracker = () => {
  const [employees, setEmployees] = useState([]);
  const [trails, setTrails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('shared');
  const [now, setNow] = useState(Date.now());
  const [connected, setConnected] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [date, setDate] = useState(todayKey());
  const [route, setRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [follow, setFollow] = useState(true);
  const [target, setTarget] = useState(null);
  const [tiles, setTiles] = useState('streets');
  const selectedRef = useRef(null);
  const dateRef = useRef(todayKey());
  const followRef = useRef(true);

  const loadList = async () => {
    try {
      const [t, tr] = await Promise.all([api.get('/tracking'), api.get('/tracking/trails', { params: { hours: 24 } })]);
      setEmployees(Array.isArray(t.data?.data) ? t.data.data : []);
      setTrails(tr.data?.data || {});
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load employee locations');
    } finally {
      setLoading(false);
    }
  };

  const loadRoute = async (id, day, fit = true) => {
    if (!id) return;
    setRouteLoading(true);
    try {
      const res = await api.get(`/tracking/route/${id}`, { params: { date: day } });
      if (selectedRef.current !== id) return;
      setRoute(res.data);
      const pts = (res.data?.route || []).map((p) => [p.latitude, p.longitude]);
      if (fit && pts.length) setTarget(pts.length > 1 ? { bounds: pts, at: Date.now() } : { point: pts[0], zoom: 18, at: Date.now() });
    } catch (err) {
      if (selectedRef.current === id) setError(err.response?.data?.message || 'Could not load the route');
    } finally {
      setRouteLoading(false);
    }
  };

  // A point pushed by the live stream.
  const onLivePoint = (d) => {
    if (!d?.employeeId || !isNum(d.latitude) || !isNum(d.longitude)) return;
    const stamp = d.timestamp || new Date().toISOString();
    setEmployees((prev) => prev.map((e) => (e._id === d.employeeId ? {
      ...e,
      currentLocation: { ...(e.currentLocation || {}), latitude: d.latitude, longitude: d.longitude, accuracy: d.accuracy, speed: d.speed, address: d.address || e.currentLocation?.address || '', batteryLevel: d.batteryLevel ?? e.currentLocation?.batteryLevel, timestamp: stamp, source: d.source || 'gps' },
      isLive: true,
      minutesSinceUpdate: 0,
    } : e)));
    setTrails((prev) => ({ ...prev, [d.employeeId]: [...(prev[d.employeeId] || []), { latitude: d.latitude, longitude: d.longitude, timestamp: stamp }] }));
    if (selectedRef.current === d.employeeId && dateRef.current === todayKey()) {
      setRoute((prev) => {
        if (!prev) return prev;
        const points = prev.route || [];
        const last = points[points.length - 1];
        const step = last ? metersBetween([last.latitude, last.longitude], [d.latitude, d.longitude]) : 0;
        return {
          ...prev,
          route: [...points, { latitude: d.latitude, longitude: d.longitude, accuracy: d.accuracy, speed: d.speed, address: d.address || '', batteryLevel: d.batteryLevel, timestamp: stamp, source: 'gps', sequence: points.length + 1 }],
          totalPoints: points.length + 1,
          totalDistance: (prev.totalDistance || 0) + Math.round(step),
          lastSeen: stamp,
        };
      });
      if (followRef.current) setTarget({ point: [d.latitude, d.longitude], zoom: 18, at: Date.now() });
    }
  };

  useEffect(() => {
    loadList();
    const poll = setInterval(loadList, 30000);
    const tick = setInterval(() => setNow(Date.now()), 15000);
    let source = null;
    let retry = null;
    let closed = false;
    const connect = async () => {
      if (closed || typeof window.EventSource === 'undefined') return;
      try {
        const res = await api.post('/tracking/stream-ticket', {});
        if (closed) return;
        source = new window.EventSource(`${API}/tracking/stream?ticket=${res.data.ticket}`);
        source.addEventListener('ready', () => setConnected(true));
        source.addEventListener('location', (ev) => { try { onLivePoint(JSON.parse(ev.data)); } catch (e) { /* ignore */ } });
        source.onerror = () => {
          setConnected(false);
          if (source) source.close();
          source = null;
          if (!closed) retry = setTimeout(connect, 5000);
        };
      } catch (e) {
        setConnected(false);
        if (!closed) retry = setTimeout(connect, 10000);
      }
    };
    connect();
    return () => {
      closed = true;
      clearInterval(poll);
      clearInterval(tick);
      if (retry) clearTimeout(retry);
      if (source) source.close();
    };
  }, []);

  // Sharing status of each employee, from their phone's GPS points.
  const rows = useMemo(() => employees.map((e) => {
    const gpsPoints = (trails[e._id] || []).length;
    const last = e.currentLocation?.timestamp;
    const minutes = last ? (now - new Date(last).getTime()) / 60000 : null;
    const live = Boolean(last) && e.currentLocation?.source !== 'punch' && minutes <= LIVE_MIN;
    const status = live ? 'live' : gpsPoints > 0 ? 'today' : 'off';
    return { e, live, status, gpsPoints, last };
  }).sort((a, b) => ({ live: 0, today: 1, off: 2 }[a.status] - { live: 0, today: 1, off: 2 }[b.status]) || String(a.e.name).localeCompare(String(b.e.name))), [employees, trails, now]);

  const counts = useMemo(() => ({
    live: rows.filter((r) => r.status === 'live').length,
    today: rows.filter((r) => r.status !== 'off').length,
    all: rows.length,
  }), [rows]);

  const shown = rows.filter((r) => {
    const q = query.trim().toLowerCase();
    const matches = !q || [r.e.name, r.e.employeeId, r.e.department, r.e.position].some((v) => String(v || '').toLowerCase().includes(q));
    const inFilter = filter === 'all' || (filter === 'live' ? r.status === 'live' : r.status !== 'off');
    return matches && inFilter;
  });

  const selected = rows.find((r) => r.e._id === selectedId) || null;
  const points = (route?.route || []).filter((p) => isNum(p.latitude));
  const line = points.map((p) => [p.latitude, p.longitude]);
  const livePos = selected?.e.currentLocation && isNum(selected.e.currentLocation.latitude)
    ? [Number(selected.e.currentLocation.latitude), Number(selected.e.currentLocation.longitude)]
    : null;
  const lastPoint = points[points.length - 1];
  const avgAcc = (() => {
    const a = points.filter((p) => isNum(p.accuracy));
    return a.length ? a.reduce((s, p) => s + Number(p.accuracy), 0) / a.length : null;
  })();

  const select = (id) => {
    selectedRef.current = id;
    dateRef.current = todayKey();
    setSelectedId(id);
    setDate(todayKey());
    setRoute(null);
    loadRoute(id, todayKey());
  };
  const changeDate = (d) => {
    if (!d) return;
    dateRef.current = d;
    setDate(d);
    setRoute(null);
    loadRoute(selectedRef.current, d);
  };
  const toggleFollow = () => { followRef.current = !follow; setFollow(!follow); };
  const tile = TILES[tiles];
  const isToday = date === todayKey();

  return (
    <div className="elt">
      <style>{`
        .elt { display: grid; gap: 14px; color: #0f172a; }
        .elt-hero { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; padding: 18px 20px; border-radius: 18px; color: #fff; background: linear-gradient(135deg, #04122e, #0a1f8f 60%, #0ea5e9); box-shadow: 0 16px 36px rgba(10,31,143,.2); }
        .elt-hero h3 { margin: 2px 0 4px; font-weight: 800; font-size: 1.4rem; }
        .elt-hero p { margin: 0; color: rgba(255,255,255,.82); font-size: .88rem; }
        .elt-eyebrow { font-size: .72rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #bae6fd; }
        .elt-conn { display: inline-flex; align-items: center; gap: 8px; padding: 7px 12px; border-radius: 999px; font-size: .8rem; font-weight: 700; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2); }
        .elt-dot { width: 9px; height: 9px; border-radius: 50%; background: #34d399; box-shadow: 0 0 0 4px rgba(52,211,153,.25); }
        .elt-dot.off { background: #fbbf24; box-shadow: none; }
        .elt-grid { display: grid; grid-template-columns: 340px minmax(0, 1fr); gap: 14px; align-items: start; }
        .elt-card { background: #fff; border: 1px solid #e6e9f2; border-radius: 16px; box-shadow: 0 6px 18px rgba(15,23,42,.05); overflow: hidden; }
        .elt-head { padding: 12px 14px; border-bottom: 1px solid #f0f2f7; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between; }
        .elt-input { border: 1px solid #dbe3ef; border-radius: 10px; padding: 8px 11px; font-size: .86rem; width: 100%; }
        .elt-input:focus { outline: none; border-color: #0a1f8f; box-shadow: 0 0 0 3px rgba(10,31,143,.12); }
        .elt-tabs { display: flex; gap: 4px; margin-top: 8px; }
        .elt-tabs button { flex: 1; border: 1px solid #dbe3ef; background: #fff; border-radius: 9px; padding: 5px 6px; font-size: .74rem; font-weight: 800; color: #475569; }
        .elt-tabs button.active { background: #0a1f8f; border-color: #0a1f8f; color: #fff; }
        .elt-list { max-height: 640px; overflow-y: auto; }
        .elt-row { display: flex; gap: 10px; align-items: center; width: 100%; text-align: left; border: none; background: #fff; padding: 10px 14px; border-bottom: 1px solid #f0f2f7; }
        .elt-row:hover { background: #f8fafc; } .elt-row.sel { background: #eef2ff; box-shadow: inset 3px 0 0 #0a1f8f; }
        .elt-av { position: relative; width: 38px; height: 38px; border-radius: 50%; background: #0a1f8f; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: .76rem; overflow: hidden; flex: 0 0 auto; }
        .elt-av img { width: 100%; height: 100%; object-fit: cover; }
        .elt-av i { position: absolute; right: 1px; bottom: 1px; width: 11px; height: 11px; border-radius: 50%; border: 2px solid #fff; }
        .elt-main { flex: 1; min-width: 0; }
        .elt-main strong { display: block; font-size: .88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .elt-main small { display: block; color: #64748b; font-size: .74rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .elt-chip { font-size: .68rem; font-weight: 800; border-radius: 999px; padding: 3px 8px; white-space: nowrap; }
        .elt-chip.live { background: #dcfce7; color: #15803d; } .elt-chip.today { background: #e0f2fe; color: #0369a1; } .elt-chip.off { background: #f1f5f9; color: #94a3b8; }
        .elt-btn { border: 1px solid #dbe3ef; background: #fff; color: #0f172a; border-radius: 10px; padding: 6px 11px; font-size: .8rem; font-weight: 700; text-decoration: none; }
        .elt-btn.active { background: #0a1f8f; border-color: #0a1f8f; color: #fff; }
        .elt-map { height: 560px; position: relative; } .elt-map .leaflet-container { height: 100%; width: 100%; }
        .elt-empty { height: 100%; display: flex; align-items: center; justify-content: center; text-align: center; color: #64748b; padding: 30px; background: #f8fafc; }
        .elt-stats { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 10px; padding: 12px 14px; border-bottom: 1px solid #f0f2f7; }
        .elt-stat { background: #f8fafc; border: 1px solid #eef1f6; border-radius: 12px; padding: 8px 10px; }
        .elt-stat span { display: block; font-size: .66rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: .04em; }
        .elt-stat b { font-size: .9rem; }
        .elt-points { max-height: 300px; overflow-y: auto; }
        .elt-pt { display: grid; grid-template-columns: 26px 86px 1fr auto; gap: 10px; align-items: center; padding: 7px 14px; border-bottom: 1px solid #f5f7fb; font-size: .82rem; cursor: pointer; }
        .elt-pt:hover { background: #f5f7fb; }
        .elt-pt .n { width: 22px; height: 22px; border-radius: 50%; background: #e0e7ff; color: #3730a3; font-size: .66rem; font-weight: 800; display: flex; align-items: center; justify-content: center; }
        .elt-pin-wrap { background: none; border: none; }
        .elt-pin { position: relative; width: 48px; height: 58px; }
        .elt-pin .face { position: absolute; left: 4px; top: 0; width: 40px; height: 40px; border-radius: 50%; background: #2563eb; border: 3px solid #fff; box-shadow: 0 4px 12px rgba(15,23,42,.35); color: #fff; font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .elt-pin .face img { width: 100%; height: 100%; object-fit: cover; }
        .elt-pin b { position: absolute; left: 18px; top: 37px; width: 12px; height: 12px; background: #2563eb; transform: rotate(45deg); border-right: 3px solid #fff; border-bottom: 3px solid #fff; }
        .elt-pin i { position: absolute; left: 4px; top: 0; width: 40px; height: 40px; border-radius: 50%; background: #22c55e; opacity: .5; animation: elt-ring 1.8s ease-out infinite; }
        .elt-pin.live .face, .elt-pin.live b { background: #16a34a; }
        @keyframes elt-ring { 0% { transform: scale(1); opacity: .5; } 100% { transform: scale(2.4); opacity: 0; } }
        .elt-flag { padding: 2px 6px; border-radius: 6px; background: #16a34a; color: #fff; font-size: 10px; font-weight: 800; border: 2px solid #fff; box-shadow: 0 2px 6px rgba(15,23,42,.35); text-align: center; }
        @media (max-width: 1100px) { .elt-grid { grid-template-columns: 1fr; } .elt-stats { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
      `}</style>

      <section className="elt-hero">
        <div>
          <div className="elt-eyebrow">Location tracking</div>
          <h3>Employee Locations</h3>
          <p>Everyone who shares location from the app. Click a person to see where they are now and the exact route they took.</p>
        </div>
        <span className="elt-conn"><span className={`elt-dot ${connected ? '' : 'off'}`} />{connected ? 'Live' : 'Connecting'} · {counts.live} sharing now</span>
      </section>

      {error && <div className="alert alert-danger mb-0" onClick={() => setError('')}>{error}</div>}

      <section className="elt-grid">
        <div className="elt-card">
          <div className="elt-head" style={{ display: 'block' }}>
            <input className="elt-input" placeholder="Search employee" value={query} onChange={(e) => setQuery(e.target.value)} />
            <div className="elt-tabs">
              <button type="button" className={filter === 'live' ? 'active' : ''} onClick={() => setFilter('live')}>Live now ({counts.live})</button>
              <button type="button" className={filter === 'shared' ? 'active' : ''} onClick={() => setFilter('shared')}>Last 24 h ({counts.today})</button>
              <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All ({counts.all})</button>
            </div>
          </div>
          <div className="elt-list">
            {loading && <div className="p-3 small text-muted">Loading…</div>}
            {!loading && shown.length === 0 && (
              <div className="p-3 small text-muted">
                {filter === 'live' ? 'Nobody is sharing location right now.' : 'No one has shared location in the last 24 hours.'} Location is shared from the AeroAttendance app while an employee is punched in.
              </div>
            )}
            {shown.map(({ e, status, gpsPoints, last }) => (
              <button key={e._id} type="button" className={`elt-row ${e._id === selectedId ? 'sel' : ''}`} onClick={() => select(e._id)}>
                <div className="elt-av">
                  {e.profilePhoto ? <img src={e.profilePhoto} alt="" /> : initials(e.name)}
                  <i style={{ background: status === 'live' ? '#22c55e' : status === 'today' ? '#0ea5e9' : '#cbd5e1' }} />
                </div>
                <div className="elt-main">
                  <strong>{e.name}</strong>
                  <small>{e.employeeId} · {e.isActive ? 'On duty' : 'Off duty'}{gpsPoints ? ` · ${gpsPoints} points` : ''}</small>
                  <small>{last ? `Last location ${ago(last, now)}` : 'No location shared'}</small>
                </div>
                <span className={`elt-chip ${status}`}>{status === 'live' ? 'Live' : status === 'today' ? 'Shared' : 'Off'}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="elt-card">
          <div className="elt-head">
            <strong>{selected ? `${selected.e.name} · ${selected.e.employeeId}` : 'Select an employee'}</strong>
            <div className="d-flex flex-wrap gap-2 align-items-center">
              {selected && <input type="date" className="elt-input" style={{ width: 'auto' }} value={date} max={todayKey()} onChange={(e) => changeDate(e.target.value)} />}
              {selected && isToday && <button type="button" className={`elt-btn ${follow ? 'active' : ''}`} onClick={toggleFollow}>{follow ? 'Following live' : 'Follow live'}</button>}
              {line.length > 1 && <button type="button" className="elt-btn" onClick={() => setTarget({ bounds: line, at: Date.now() })}>Zoom to route</button>}
              {selected && livePos && isToday && <button type="button" className="elt-btn" onClick={() => setTarget({ point: livePos, zoom: 19, at: Date.now() })}>Zoom to live position</button>}
              <select className="elt-input" style={{ width: 'auto' }} value={tiles} onChange={(e) => setTiles(e.target.value)} aria-label="Map style">
                {Object.entries(TILES).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {selected && (
            <div className="elt-stats">
              <div className="elt-stat"><span>Status</span><b>{selected.live ? 'Sharing live' : selected.last ? `Last ${ago(selected.last, now)}` : 'Not shared'}</b></div>
              <div className="elt-stat"><span>Distance {isToday ? 'today' : ''}</span><b>{routeLoading ? '…' : formatDistance(route?.totalDistance || 0)}</b></div>
              <div className="elt-stat"><span>Points</span><b>{routeLoading ? '…' : points.length}</b></div>
              <div className="elt-stat"><span>First – last</span><b>{points.length ? `${clock(points[0].timestamp)} – ${clock(lastPoint.timestamp)}` : '—'}</b></div>
              <div className="elt-stat"><span>Speed / battery</span><b>{isNum(selected.e.currentLocation?.speed) && selected.e.currentLocation.speed >= 1 ? `${Math.round(selected.e.currentLocation.speed * 3.6)} km/h` : 'Still'}{isNum(selected.e.currentLocation?.batteryLevel) ? ` · ${selected.e.currentLocation.batteryLevel}%` : ''}</b></div>
              <div className="elt-stat"><span>GPS accuracy</span><b>{avgAcc !== null ? `±${Math.round(avgAcc)} m` : '—'}</b></div>
            </div>
          )}

          <div className="elt-map">
            {!selected ? (
              <div className="elt-empty">Choose an employee from the list to see their live location and route.</div>
            ) : (
              <MapContainer center={livePos || [28.5512, 77.132]} zoom={14} maxZoom={MAX_ZOOM} zoomSnap={0.5} scrollWheelZoom>
                <TileLayer key={tiles} url={tile.url} attribution={tile.attribution} maxZoom={MAX_ZOOM} maxNativeZoom={tile.native} />
                <Fit target={target} />
                {line.length > 1 && (
                  <>
                    <Polyline positions={line} pathOptions={{ color: '#ffffff', weight: 9, opacity: 0.9 }} />
                    <Polyline positions={line} pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.95 }} />
                  </>
                )}
                {points.map((p, i) => (
                  <CircleMarker key={`${p.timestamp}-${i}`} center={[p.latitude, p.longitude]} radius={3.5} pathOptions={{ color: '#1d4ed8', fillColor: '#ffffff', fillOpacity: 1, weight: 1.5 }}>
                    <Tooltip>{clockSec(p.timestamp)}{isNum(p.speed) && p.speed >= 1 ? ` · ${Math.round(p.speed * 3.6)} km/h` : ''}{p.address ? ` · ${p.address}` : ''}</Tooltip>
                  </CircleMarker>
                ))}
                {points.length > 0 && (
                  <Marker position={[points[0].latitude, points[0].longitude]} icon={startIcon}>
                    <Tooltip direction="top">Start · {clock(points[0].timestamp)}</Tooltip>
                  </Marker>
                )}
                {isToday && livePos ? (
                  <Marker position={livePos} icon={liveIcon(selected.e, selected.live)} zIndexOffset={1000}>
                    <Tooltip direction="top" offset={[0, -48]}>{selected.e.name} · {ago(selected.last, now)}</Tooltip>
                  </Marker>
                ) : lastPoint && (
                  <Marker position={[lastPoint.latitude, lastPoint.longitude]} icon={liveIcon(selected.e, false)} zIndexOffset={1000}>
                    <Tooltip direction="top" offset={[0, -48]}>Last point · {clock(lastPoint.timestamp)}</Tooltip>
                  </Marker>
                )}
              </MapContainer>
            )}
            {selected && !routeLoading && route && points.length === 0 && (
              <div style={{ position: 'absolute', left: 12, bottom: 12, zIndex: 500, background: '#fff', border: '1px solid #e6e9f2', borderRadius: 10, padding: '8px 12px', fontSize: '.84rem' }}>
                No location points on this day.
              </div>
            )}
          </div>

          {selected && points.length > 0 && (
            <>
              <div className="elt-head"><strong style={{ fontSize: '.92rem' }}>Route points ({points.length})</strong>
                {lastPoint && <a className="elt-btn" href={mapsUrl(lastPoint.latitude, lastPoint.longitude)} target="_blank" rel="noopener noreferrer">Open last point in Google Maps</a>}
              </div>
              <div className="elt-points">
                {[...points].reverse().map((p, idx) => (
                  <div key={`pt-${p.timestamp}-${idx}`} className="elt-pt" role="button" tabIndex={0} onClick={() => setTarget({ point: [p.latitude, p.longitude], zoom: 19, at: Date.now() })}>
                    <span className="n">{points.length - idx}</span>
                    <b>{clockSec(p.timestamp)}</b>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#334155' }}>
                      {p.address || `${Number(p.latitude).toFixed(5)}, ${Number(p.longitude).toFixed(5)}`}
                      {p.source === 'punch' ? ' · punch' : ''}
                    </span>
                    <span className="small text-muted">{isNum(p.speed) && p.speed >= 1 ? `${Math.round(p.speed * 3.6)} km/h` : ''}{isNum(p.accuracy) ? ` ±${Math.round(p.accuracy)} m` : ''}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default EmployeeLocationTracker;
