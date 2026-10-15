import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../utils/axios';
import {
  ACTIVITY,
  Avatar,
  Chip,
  LOCATION_STATUS,
  PUNCH_STATUS,
  SourceTag,
  agoText,
  downloadCsv,
  handOff,
  hoursText,
  mapsUrl,
  monitoringStyles,
  shortAddress,
  timeOf,
  todayKey,
  useLiveStream,
} from './monitoringShared';

// KPI cards double as filters.
const FILTERS = {
  all: { label: 'All employees', test: () => true },
  on_duty: { label: 'On duty', test: (r) => r.punch.status === 'on_duty' },
  punched_out: { label: 'Punched out', test: (r) => r.punch.status === 'punched_out' },
  not_punched: { label: 'Not punched in', test: (r) => r.punch.status === 'not_punched' },
  late: { label: 'Late today', test: (r) => r.punch.late },
  live: { label: 'App location live', test: (r) => r.location.status === 'live' },
  location_off: { label: 'Location off', test: (r) => ['gps_off', 'permission_off'].includes(r.location.status) },
  signal_lost: { label: 'Phone silent', test: (r) => r.location.status === 'signal_lost' },
  no_app: { label: 'Logged out / no app', test: (r) => ['logged_out', 'no_app'].includes(r.location.status) },
  web: { label: 'Punched via website', test: (r) => r.punch.inClient === 'web' || r.punch.outClient === 'web' },
  app_open: { label: 'App open now', test: (r) => r.online?.app },
  issues: {
    label: 'Needs attention',
    test: (r) => ['gps_off', 'permission_off', 'signal_lost'].includes(r.location.status)
      || r.punch.status === 'missed_out'
      || (r.punch.status === 'on_duty' && ['logged_out', 'no_app', 'stale'].includes(r.location.status)),
  },
};

const SORTS = {
  attention: 'Needs attention first',
  name: 'Name',
  punchIn: 'Punch-in time',
  lastSeen: 'Last location',
};

const severity = (row) => {
  if (['gps_off', 'permission_off'].includes(row.location.status)) return 0;
  if (row.location.status === 'signal_lost') return 1;
  if (row.punch.status === 'missed_out') return 2;
  if (row.punch.status === 'on_duty' && row.location.status !== 'live') return 3;
  if (row.punch.status === 'not_punched') return 4;
  if (row.punch.status === 'on_duty') return 5;
  return 6;
};

/**
 * Admin -> Employee Monitor: one live screen with every employee's punch state
 * (and whether it came from the app or the website), location / app status,
 * battery and last activity. onOpenActivity(employeeId) opens the activity page.
 */
const EmployeeMonitor = ({ onOpenActivity }) => {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [feed, setFeed] = useState([]);
  const [fresh, setFresh] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState(() => handOff.take('monitor-filter') || 'all');
  const [query, setQuery] = useState(() => handOff.take('monitor-search') || '');
  const [department, setDepartment] = useState('');
  const [sort, setSort] = useState('attention');
  const [connected, setConnected] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [deviceOf, setDeviceOf] = useState(null);
  const refreshTimer = useRef(null);

  const load = useCallback(async () => {
    try {
      const [statusRes, feedRes] = await Promise.all([
        api.get('/monitoring/employees'),
        api.get('/monitoring/activity', { params: { from: todayKey(), to: todayKey(), limit: 60 } }),
      ]);
      setRows(statusRes.data?.data || []);
      setSummary(statusRes.data?.summary || {});
      setFeed(feedRes.data?.data || []);
      setUpdatedAt(new Date());
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load employee status');
    } finally {
      setLoading(false);
    }
  }, []);

  // Many events can arrive together; refresh once shortly after the last one.
  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(load, 1500);
  }, [load]);

  useEffect(() => {
    load();
    const poll = setInterval(load, 30000);
    const clock = setInterval(() => setNow(Date.now()), 15000);
    return () => {
      clearInterval(poll);
      clearInterval(clock);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [load]);

  useLiveStream({
    activity: (event) => {
      setFeed((prev) => {
        if (prev.some((item) => item._id === event._id)) return prev;
        const employee = rows.find((r) => String(r._id) === event.employeeId);
        const item = { ...event, employee: employee ? { _id: employee._id, name: employee.name, employeeId: employee.employeeId, profilePhoto: employee.profilePhoto } : { _id: event.employeeId, name: 'Employee' } };
        return [item, ...prev].slice(0, 120);
      });
      setFresh((prev) => ({ ...prev, [event._id]: true }));
      scheduleRefresh();
    },
    attendance: scheduleRefresh,
    status: scheduleRefresh,
    presence: (data) => setRows((prev) => prev.map((row) => (String(row._id) === data.employeeId ? { ...row, online: { app: Boolean(data.app), web: Boolean(data.web) } } : row))),
    presenceSnapshot: (snapshot) => setRows((prev) => prev.map((row) => ({ ...row, online: snapshot[String(row._id)] || { app: false, web: false } }))),
    device: (data) => setRows((prev) => prev.map((row) => (String(row._id) === data.employeeId ? { ...row, device: { ...(row.device || {}), [data.client === 'web' ? 'web' : 'app']: data.details } } : row))),
    location: (point) => {
      // Moves the "last location" without a full reload.
      setRows((prev) => prev.map((row) => {
        if (String(row._id) !== point.employeeId) return row;
        const latest = { at: point.timestamp, latitude: point.latitude, longitude: point.longitude, accuracy: point.accuracy, address: point.address || row.location.latest?.address || '', batteryLevel: point.batteryLevel, client: point.client || 'app' };
        const isApp = latest.client !== 'web';
        return {
          ...row,
          location: {
            ...row.location,
            latest,
            [isApp ? 'app' : 'web']: latest,
            status: isApp && !['gps_off', 'permission_off'].includes(row.location.status) ? 'live' : row.location.status === 'no_app' && !isApp ? 'web_only' : row.location.status,
          },
          app: isApp && point.batteryLevel != null ? { ...row.app, batteryLevel: point.batteryLevel } : row.app,
        };
      }));
    },
  }, setConnected);

  const departments = useMemo(() => [...new Set(rows.map((r) => r.department).filter(Boolean))].sort(), [rows]);
  const lastEventByEmployee = useMemo(() => {
    const map = {};
    feed.forEach((item) => {
      const id = String(item.employee?._id || item.employeeId || '');
      if (id && !map[id]) map[id] = item;
    });
    return map;
  }, [feed]);

  const counts = useMemo(() => Object.fromEntries(Object.entries(FILTERS).map(([key, f]) => [key, rows.filter(f.test).length])), [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const test = FILTERS[filter]?.test || FILTERS.all.test;
    const list = rows.filter((row) => test(row)
      && (!department || row.department === department)
      && (!q || [row.name, row.employeeId, row.department, row.position, row.phone, row.location.latest?.address].some((v) => String(v || '').toLowerCase().includes(q))));
    const by = {
      attention: (a, b) => severity(a) - severity(b) || a.name.localeCompare(b.name),
      name: (a, b) => a.name.localeCompare(b.name),
      punchIn: (a, b) => new Date(a.punch.firstIn || 8e15) - new Date(b.punch.firstIn || 8e15),
      lastSeen: (a, b) => new Date(b.location.latest?.at || 0) - new Date(a.location.latest?.at || 0),
    };
    return list.sort(by[sort] || by.attention);
  }, [rows, filter, query, department, sort]);

  const openActivity = (id) => {
    handOff.set('activity-employee', String(id));
    if (onOpenActivity) onOpenActivity(String(id));
  };

  const exportCsv = () => {
    downloadCsv(`employee-monitor-${todayKey()}.csv`, [
      'Employee ID', 'Name', 'Department', 'Attendance', 'First in', 'Punched in via', 'Last out', 'Punched out via', 'Hours', 'Late (min)',
      'Location', 'Last location at', 'Last location from', 'Address', 'Latitude', 'Longitude', 'App version', 'Battery %', 'Device', 'App last used', 'Website last used',
    ], visible.map((r) => [
      r.employeeId, r.name, r.department,
      PUNCH_STATUS[r.punch.status]?.label || r.punch.status,
      r.punch.firstIn ? timeOf(r.punch.firstIn) : '', r.punch.inClient || '',
      r.punch.lastOut ? timeOf(r.punch.lastOut) : '', r.punch.outClient || '',
      r.punch.hours, r.punch.lateMinutes || '',
      LOCATION_STATUS[r.location.status]?.label || r.location.status,
      r.location.latest?.at ? new Date(r.location.latest.at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '',
      r.location.latest?.client || '', r.location.latest?.address || '', r.location.latest?.latitude ?? '', r.location.latest?.longitude ?? '',
      r.app.appVersion, r.app.batteryLevel ?? '', r.app.device,
      r.app.lastSeenAt ? new Date(r.app.lastSeenAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '',
      r.web.lastSeenAt ? new Date(r.web.lastSeenAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '',
    ]));
  };

  const kpis = [
    ['all', 'Employees', summary.total, '#0a1f8f', 'active'],
    ['on_duty', 'On duty', summary.onDuty, '#15803d', 'punched in now'],
    ['punched_out', 'Punched out', summary.punchedOut, '#1d4ed8', 'done for today'],
    ['not_punched', 'Not punched in', summary.notPunched, '#b91c1c', 'working day'],
    ['late', 'Late', summary.late, '#d97706', 'after grace'],
    ['live', 'App live', summary.live, '#16a34a', 'GPS in last 10 min'],
    ['location_off', 'Location off', summary.locationOff, '#dc2626', 'GPS / permission'],
    ['signal_lost', 'Phone silent', summary.signalLost, '#ea580c', 'no location coming'],
    ['no_app', 'Logged out / no app', (summary.loggedOut || 0) + (summary.noApp || 0), '#64748b', 'not tracking'],
    ['web', 'Via website', counts.web, '#0e7490', 'punched on website'],
    ['app_open', 'App open now', counts.app_open, '#15803d', 'connected live'],
  ];

  return (
    <div className="mn">
      <style>{monitoringStyles}</style>
      <section className="mn-hero">
        <div>
          <div className="mn-eyebrow">Live monitoring</div>
          <h3>Employee Monitor</h3>
          <p>Who is in, who is out, whose location is on — from the mobile app and the website, updated live.</p>
        </div>
        <div className="mn-toolbar">
          <span className="mn-conn"><span className={`mn-dot ${connected ? '' : 'off'}`} />{connected ? 'Live' : 'Connecting'}{updatedAt ? ` · updated ${agoText(updatedAt, now)}` : ''}</span>
          <button type="button" className="mn-btn ghost" onClick={exportCsv} disabled={!visible.length}>Export CSV</button>
          <button type="button" className="mn-btn ghost" onClick={load} disabled={loading}>Refresh</button>
        </div>
      </section>

      {error && <div className="mn-alert err">{error}</div>}

      <section className="mn-kpis">
        {kpis.map(([key, label, value, color, note]) => (
          <button key={key} type="button" className={`mn-kpi ${filter === key ? 'active' : ''}`} style={{ '--c': color }} onClick={() => setFilter(filter === key && key !== 'all' ? 'all' : key)}>
            <b>{loading && !rows.length ? '—' : value ?? 0}</b>
            <span>{label}</span>
            <small>{note}</small>
          </button>
        ))}
      </section>

      {counts.issues > 0 && filter !== 'issues' && (
        <div className="mn-alert warn d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span><strong>{counts.issues} employee(s) need attention</strong> — location off, phone silent, missed punch-out, or on duty without app tracking.</span>
          <button type="button" className="mn-btn sm" onClick={() => setFilter('issues')}>Show them</button>
        </div>
      )}

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 16, alignItems: 'start' }} className="mn-layout">
        <style>{'@media (max-width: 1280px) { .mn-layout { grid-template-columns: 1fr !important; } }'}</style>
        <div className="mn-card">
          <div className="mn-card-head">
            <div>
              <h4>{FILTERS[filter]?.label || 'All employees'}</h4>
              <p>{visible.length} of {rows.length} shown</p>
            </div>
            <div className="mn-toolbar">
              <input className="mn-input" placeholder="Search name, ID, place…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: 210 }} />
              <select className="mn-select" value={department} onChange={(e) => setDepartment(e.target.value)} aria-label="Department">
                <option value="">All departments</option>
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select className="mn-select" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter">
                {Object.entries(FILTERS).map(([key, f]) => <option key={key} value={key}>{f.label} ({counts[key] ?? 0})</option>)}
              </select>
              <select className="mn-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
                {Object.entries(SORTS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
          </div>
          <div className="table-responsive" style={{ maxHeight: 720 }}>
            <table className="mn-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Attendance today</th>
                  <th>Location</th>
                  <th>Phone / app</th>
                  <th>Last activity</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {loading && !rows.length && <tr><td colSpan={6} className="mn-empty">Loading employees…</td></tr>}
                {!loading && !visible.length && <tr><td colSpan={6} className="mn-empty">No employees match this filter.</td></tr>}
                {visible.map((row) => {
                  const punch = PUNCH_STATUS[row.punch.status] || PUNCH_STATUS.not_punched;
                  const loc = LOCATION_STATUS[row.location.status] || LOCATION_STATUS.stale;
                  const latest = row.location.latest;
                  const lastEvent = lastEventByEmployee[String(row._id)];
                  return (
                    <tr key={row._id}>
                      <td style={{ minWidth: 200 }}>
                        <div className="d-flex gap-2 align-items-center">
                          <Avatar person={row} />
                          <div style={{ minWidth: 0 }}>
                            <div className="mn-strong">{row.name}</div>
                            <div className="mn-muted">{row.employeeId}{row.department ? ` · ${row.department}` : ''}</div>
                            {row.shift && <div className="mn-muted">{row.shift.name} {row.shift.startTime}–{row.shift.endTime}</div>}
                            <div className="d-flex gap-1 mt-1">
                              {row.online?.app && <span className="mn-src" style={{ '--c': '#15803d', '--s': '#dcfce7', marginLeft: 0 }}>● App open</span>}
                              {row.online?.web && <span className="mn-src" style={{ '--c': '#0e7490', '--s': '#cffafe', marginLeft: 0 }}>● Website open</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ minWidth: 190 }}>
                        <Chip meta={punch} />
                        {row.punch.firstIn && (
                          <div className="mn-muted mt-1">
                            In {timeOf(row.punch.firstIn)}<SourceTag source={row.punch.inClient} />
                            {row.punch.lastOut && <> · Out {timeOf(row.punch.lastOut)}<SourceTag source={row.punch.outClient} /></>}
                          </div>
                        )}
                        {row.punch.firstIn && (
                          <div className="mn-muted">
                            {hoursText(row.punch.hours)}{row.punch.sessions > 1 ? ` · ${row.punch.sessions} sessions` : ''}
                            {row.punch.late ? <span style={{ color: '#d97706', fontWeight: 700 }}> · late {row.punch.lateMinutes}m</span> : ''}
                            {row.punch.outside ? <span style={{ color: '#dc2626', fontWeight: 700 }}> · outside area</span> : ''}
                            {row.punch.mode && row.punch.mode !== 'office' ? ` · ${row.punch.mode.toUpperCase()}` : ''}
                          </div>
                        )}
                      </td>
                      <td style={{ minWidth: 220, maxWidth: 300 }}>
                        <Chip meta={loc} title={row.app.message || loc.label} />
                        {latest ? (
                          <>
                            <div className="mn-muted mt-1">
                              {agoText(latest.at, now)} <SourceTag source={latest.client === 'web' ? 'web' : 'app'} />
                              {latest.accuracy != null ? ` · ±${Math.round(latest.accuracy)} m` : ''}
                            </div>
                            {latest.address && <div className="mn-muted" title={latest.address}>{shortAddress(latest.address)}</div>}
                          </>
                        ) : <div className="mn-muted mt-1">No location yet</div>}
                        {row.location.status === 'signal_lost' && row.app.signalLostAt && <div className="mn-muted" style={{ color: '#ea580c' }}>Silent since {timeOf(row.app.signalLostAt)}</div>}
                      </td>
                      <td style={{ minWidth: 160 }}>
                        <div className="mn-muted">
                          {row.app.batteryLevel != null ? <span style={{ color: row.app.batteryLevel <= 15 ? '#dc2626' : '#334155', fontWeight: 700 }}>{row.app.batteryLevel}% battery</span> : 'Battery —'}
                        </div>
                        <div className="mn-muted">{row.app.appVersion ? `App v${row.app.appVersion}` : 'App version —'}</div>
                        <div className="mn-muted">App used {agoText(row.app.lastSeenAt, now)}</div>
                        <div className="mn-muted">Website {row.web.lastSeenAt ? agoText(row.web.lastSeenAt, now) : 'never'}</div>
                      </td>
                      <td style={{ minWidth: 170, maxWidth: 240 }}>
                        {lastEvent ? (
                          <>
                            <div className="mn-strong" style={{ color: ACTIVITY[lastEvent.type]?.color, fontSize: '.8rem' }}>{ACTIVITY[lastEvent.type]?.label || lastEvent.type}</div>
                            <div className="mn-muted">{timeOf(lastEvent.at)} · {lastEvent.message}</div>
                          </>
                        ) : <span className="mn-muted">No activity today</span>}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div className="d-grid gap-1">
                          <button type="button" className="mn-btn sm primary" onClick={() => openActivity(row._id)}>Activity</button>
                          <button type="button" className="mn-btn sm" onClick={() => setDeviceOf(row)}>Device</button>
                          {latest && <a className="mn-btn sm" href={mapsUrl(latest.latitude, latest.longitude)} target="_blank" rel="noopener noreferrer">Map</a>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mn-card">
          <div className="mn-card-head">
            <div>
              <h4>Live activity</h4>
              <p>Today, newest first · App, website and system</p>
            </div>
          </div>
          <div className="mn-feed">
            {!feed.length && <div className="mn-empty">No activity yet today.</div>}
            {feed.map((item) => {
              const meta = ACTIVITY[item.type] || { label: item.type, color: '#475569', icon: '•' };
              return (
                <div key={item._id} className={`mn-feed-row ${fresh[item._id] ? 'fresh' : ''}`}>
                  <span className="mn-ev" style={{ '--c': meta.color }}>{meta.icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className="mn-strong" style={{ fontSize: '.84rem' }}>
                      {item.employee?.name || 'Employee'} <SourceTag source={item.source} />
                    </div>
                    <div className="mn-muted">{meta.label} · {item.message}</div>
                  </div>
                  <div className="mn-muted" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{timeOf(item.at)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {deviceOf && (
        <DevicePanel
          row={rows.find((r) => String(r._id) === String(deviceOf._id)) || deviceOf}
          now={now}
          onClose={() => setDeviceOf(null)}
        />
      )}
    </div>
  );
};

const DEVICE_LABELS = [
  ['manufacturer', 'Manufacturer'], ['brand', 'Brand'], ['model', 'Model'], ['os', 'OS'], ['osVersion', 'OS version'], ['sdk', 'Android SDK'],
  ['appVersion', 'App version'], ['batteryLevel', 'Battery'], ['charging', 'Charging'], ['network', 'Network'], ['carrier', 'Mobile operator'],
  ['locationEnabled', 'Location (GPS)'], ['backgroundPermission', 'Location "all the time"'], ['batteryOptimized', 'Battery optimisation'],
  ['powerSave', 'Battery saver'], ['intervalSeconds', 'Report interval'], ['browser', 'Browser'], ['platform', 'Platform'],
  ['screen', 'Screen'], ['locale', 'Language'], ['timezone', 'Time zone'],
];
const deviceValue = (key, value) => {
  if (value === undefined || value === null || value === '') return null;
  if (key === 'batteryLevel') return `${value}%`;
  if (key === 'intervalSeconds') return `${value} s`;
  if (key === 'locationEnabled') return value ? 'On' : 'Off';
  if (key === 'backgroundPermission') return value ? 'Allowed' : 'Not allowed';
  if (key === 'batteryOptimized') return value ? 'On (may stop tracking)' : 'Off (good)';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
};
// Values that put tracking at risk are shown in red.
const WARN = { locationEnabled: false, backgroundPermission: false, batteryOptimized: true, powerSave: true };

/** Side panel with everything known about the employee's phone and browser. */
const DevicePanel = ({ row, now, onClose }) => {
  const blocks = [
    ['Mobile app (phone)', row.device?.app, row.online?.app, 'updated app'],
    ['Website (browser)', row.device?.web, row.online?.web, 'employee website'],
  ];
  return (
    <div role="dialog" aria-modal="true" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: 4000, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(440px, 100%)', height: '100%', background: '#fff', overflowY: 'auto', padding: 18, boxShadow: '-12px 0 30px rgba(15,23,42,.2)' }}>
        <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
          <div className="d-flex gap-2 align-items-center">
            <Avatar person={row} size={42} />
            <div>
              <div className="mn-strong">{row.name}</div>
              <div className="mn-muted">{row.employeeId} · device details</div>
            </div>
          </div>
          <button type="button" className="mn-btn sm" onClick={onClose}>Close</button>
        </div>
        <div className="mn-alert info mb-3" style={{ fontSize: '.8rem' }}>
          Tracker: <strong>{LOCATION_STATUS[row.location.status]?.label}</strong>{row.app.message ? ` — ${row.app.message}` : ''}. App used {agoText(row.app.lastSeenAt, now)}.
        </div>
        {blocks.map(([title, details, isOnline, from]) => (
          <div key={title} className="mn-card mb-3">
            <div className="mn-card-head">
              <h4 style={{ fontSize: '.9rem' }}>{title}</h4>
              <span className="mn-chip" style={{ '--c': isOnline ? '#15803d' : '#64748b', '--s': isOnline ? '#dcfce7' : '#f1f5f9' }}><i />{isOnline ? 'Open now' : 'Not open'}</span>
            </div>
            {!details ? <div className="mn-empty">No report yet. It arrives when the employee opens the {from}.</div> : (
              <table className="mn-table">
                <tbody>
                  {DEVICE_LABELS.map(([key, label]) => {
                    const value = deviceValue(key, details[key]);
                    if (value === null) return null;
                    const bad = Object.prototype.hasOwnProperty.call(WARN, key) && details[key] === WARN[key];
                    return (
                      <tr key={key}>
                        <td className="mn-muted" style={{ width: '45%' }}>{label}</td>
                        <td className="mn-strong" style={{ color: bad ? '#dc2626' : undefined }}>{value}</td>
                      </tr>
                    );
                  })}
                  <tr><td className="mn-muted">Reported</td><td>{agoText(details.updatedAt, now)}</td></tr>
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmployeeMonitor;

