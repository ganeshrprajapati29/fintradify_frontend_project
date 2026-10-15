import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../utils/axios';
import {
  ACTIVITY,
  Avatar,
  Chip,
  LOCATION_STATUS,
  PUNCH_STATUS,
  SOURCE,
  SourceTag,
  agoText,
  dateTimeOf,
  distanceText,
  downloadCsv,
  handOff,
  hoursText,
  mapsUrl,
  monitoringStyles,
  timeOf,
  todayKey,
  useLiveStream,
} from './monitoringShared';

const shiftDay = (key, days) => {
  const date = new Date(`${key}T12:00:00+05:30`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
};
const dayLabel = (key) => new Date(`${key}T12:00:00+05:30`).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const Stat = ({ label, value, color }) => (
  <div style={{ background: '#f8fafc', border: '1px solid #eef1f6', borderRadius: 12, padding: '9px 11px' }}>
    <div style={{ fontSize: '.66rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
    <div style={{ fontWeight: 800, fontSize: '1rem', color: color || '#0f172a' }}>{value}</div>
  </div>
);

/**
 * Admin -> Activity Tracking: everything one employee did on a day (punches from
 * the app or website, sign-ins, location on/off, phone silent, approvals), their
 * movement summary — or the activity log of all employees.
 */
const EmployeeActivity = () => {
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState(() => handOff.take('activity-employee') || '');
  const [date, setDate] = useState(todayKey());
  const [detail, setDetail] = useState(null);
  const [log, setLog] = useState({ data: [], counts: {}, pagination: { page: 1, totalPages: 1, total: 0 } });
  const [types, setTypes] = useState('');
  const [source, setSource] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [now, setNow] = useState(Date.now());
  const requestRef = useRef(0);

  useEffect(() => {
    api.get('/monitoring/employees')
      .then((res) => setEmployees(res.data?.data || []))
      .catch(() => setEmployees([]));
    const clock = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(clock);
  }, []);

  const load = useCallback(async (silent = false) => {
    // Only the newest request may update the page (filters can change quickly).
    requestRef.current += 1;
    const request = requestRef.current;
    if (!silent) setLoading(true);
    try {
      if (employeeId) {
        const res = await api.get(`/monitoring/employee/${employeeId}`, { params: { date } });
        if (request !== requestRef.current) return;
        setDetail(res.data);
      } else {
        const res = await api.get('/monitoring/activity', { params: { from: date, to: date, types: types || undefined, source: source || undefined, page, limit: 50 } });
        if (request !== requestRef.current) return;
        setLog(res.data);
      }
      setError('');
    } catch (err) {
      if (request === requestRef.current) setError(err.response?.data?.message || 'Could not load activity');
    } finally {
      if (!silent && request === requestRef.current) setLoading(false);
    }
  }, [employeeId, date, types, source, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [employeeId, date, types, source]);
  // Never show the previous employee's details while the next one loads.
  useEffect(() => { setDetail(null); }, [employeeId]);

  // Today's view follows new activity live.
  useLiveStream({
    activity: (event) => {
      if (date !== todayKey()) return;
      if (employeeId && event.employeeId !== employeeId) return;
      load(true);
    },
    attendance: (event) => {
      if (date === todayKey() && employeeId && event.employeeId === employeeId) load(true);
    },
  });

  const timeline = useMemo(() => {
    if (!detail) return [];
    const items = (detail.activity || [])
      .filter((a) => (!types || types.split(',').includes(a.type)) && (!source || a.source === source));
    return [...items].reverse();
  }, [detail, types, source]);

  const pickList = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => !q || [e.name, e.employeeId, e.department].some((v) => String(v || '').toLowerCase().includes(q)));
  }, [employees, search]);

  const exportDay = () => {
    const rows = employeeId ? (detail?.activity || []) : (log.data || []);
    downloadCsv(`activity-${employeeId ? (detail?.employee?.employeeId || 'employee') : 'all'}-${date}.csv`,
      ['Time', 'Employee ID', 'Employee', 'Event', 'Source', 'Details', 'Address', 'Latitude', 'Longitude'],
      rows.map((a) => {
        const who = employeeId ? detail?.employee : a.employee;
        return [
          new Date(a.at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          who?.employeeId || '', who?.name || '',
          ACTIVITY[a.type]?.label || a.type, SOURCE[a.source]?.label || a.source, a.message,
          a.location?.address || '', a.location?.latitude ?? '', a.location?.longitude ?? '',
        ];
      }));
  };

  const emp = detail?.employee;
  const tracking = detail?.tracking;
  const isToday = date === todayKey();

  return (
    <div className="mn">
      <style>{monitoringStyles}</style>
      <section className="mn-hero">
        <div>
          <div className="mn-eyebrow">Activity tracking</div>
          <h3>{emp && employeeId ? emp.name : 'All employees'}</h3>
          <p>{dayLabel(date)} · punches, sign-ins and location events from the app and website</p>
        </div>
        <div className="mn-toolbar">
          <button type="button" className="mn-btn ghost" onClick={() => setDate(shiftDay(date, -1))}>‹ Previous day</button>
          <input type="date" className="mn-input" value={date} max={todayKey()} onChange={(e) => e.target.value && setDate(e.target.value)} />
          <button type="button" className="mn-btn ghost" onClick={() => setDate(shiftDay(date, 1))} disabled={isToday}>Next day ›</button>
          <button type="button" className="mn-btn ghost" onClick={exportDay}>Export CSV</button>
        </div>
      </section>

      {error && <div className="mn-alert err">{error}</div>}

      <section style={{ display: 'grid', gridTemplateColumns: '280px minmax(0, 1fr)', gap: 16, alignItems: 'start' }} className="mn-act-layout">
        <style>{'@media (max-width: 1100px) { .mn-act-layout { grid-template-columns: 1fr !important; } }'}</style>
        <div className="mn-card">
          <div className="mn-card-head"><h4>Employees</h4><span className="mn-muted">{employees.length}</span></div>
          <div className="mn-card-body" style={{ paddingBottom: 6 }}>
            <input className="mn-input w-100" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div style={{ maxHeight: 640, overflowY: 'auto' }}>
            <button type="button" onClick={() => setEmployeeId('')} className="w-100 text-start border-0" style={{ padding: '10px 14px', background: !employeeId ? '#eef1fc' : '#fff', boxShadow: !employeeId ? 'inset 3px 0 0 #0a1f8f' : 'none', fontWeight: 700 }}>
              All employees
            </button>
            {pickList.map((e) => {
              const loc = LOCATION_STATUS[e.location.status];
              return (
                <button key={e._id} type="button" onClick={() => setEmployeeId(String(e._id))} className="w-100 text-start border-0 d-flex gap-2 align-items-center"
                  style={{ padding: '8px 14px', background: employeeId === String(e._id) ? '#eef1fc' : '#fff', boxShadow: employeeId === String(e._id) ? 'inset 3px 0 0 #0a1f8f' : 'none', borderBottom: '1px solid #f5f6fa' }}>
                  <Avatar person={e} size={30} />
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span className="d-block mn-strong text-truncate" style={{ fontSize: '.84rem' }}>{e.name}</span>
                    <span className="d-block mn-muted text-truncate">{e.employeeId} · {PUNCH_STATUS[e.punch.status]?.label}</span>
                  </span>
                  <span title={loc?.label} style={{ width: 9, height: 9, borderRadius: '50%', background: loc?.color || '#94a3b8', flex: '0 0 auto' }} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="d-grid gap-3" style={{ minWidth: 0 }}>
          <div className="mn-card">
            <div className="mn-card-body mn-toolbar">
              <span className="mn-muted mn-strong">Filter:</span>
              <select className="mn-select" value={types} onChange={(e) => setTypes(e.target.value)} aria-label="Event">
                <option value="">All events</option>
                <option value="punch_in,punch_out">Punch in / out</option>
                <option value="logged_in,logged_out">Sign in / out</option>
                <option value="location_off,permission_denied,location_on">Location on / off</option>
                <option value="signal_lost,signal_restored">Phone silent / back</option>
                <option value="attendance_approved">Approvals</option>
              </select>
              <select className="mn-select" value={source} onChange={(e) => setSource(e.target.value)} aria-label="Source">
                <option value="">App + website + system</option>
                <option value="app">Mobile app only</option>
                <option value="web">Website only</option>
                <option value="system">System only</option>
                <option value="admin">HR actions</option>
              </select>
              {loading && <span className="mn-muted">Loading…</span>}
            </div>
          </div>

          {employeeId && emp && (
            <>
              <div className="mn-card">
                <div className="mn-card-body">
                  <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between">
                    <div className="d-flex gap-3 align-items-center">
                      <Avatar person={emp} size={54} />
                      <div>
                        <div className="mn-strong" style={{ fontSize: '1.1rem' }}>{emp.name}</div>
                        <div className="mn-muted">{emp.employeeId} · {emp.position || '—'}{emp.department ? ` · ${emp.department}` : ''}</div>
                        {emp.shift && <div className="mn-muted">{emp.shift.name} {emp.shift.startTime}–{emp.shift.endTime}</div>}
                      </div>
                    </div>
                    {!emp.inactive && (
                      <div className="d-flex flex-wrap gap-2">
                        <Chip meta={PUNCH_STATUS[emp.punch.status]} />
                        <Chip meta={LOCATION_STATUS[emp.location.status]} />
                      </div>
                    )}
                  </div>
                  {!emp.inactive && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginTop: 14 }}>
                      <Stat label="Battery" value={emp.app.batteryLevel != null ? `${emp.app.batteryLevel}%` : '—'} color={emp.app.batteryLevel != null && emp.app.batteryLevel <= 15 ? '#dc2626' : undefined} />
                      <Stat label="App version" value={emp.app.appVersion || '—'} />
                      <Stat label="Device" value={emp.app.device || '—'} />
                      <Stat label="App last used" value={agoText(emp.app.lastSeenAt, now)} />
                      <Stat label="Website last used" value={emp.web.lastSeenAt ? agoText(emp.web.lastSeenAt, now) : 'never'} />
                      <Stat label="Last location" value={emp.location.latest ? `${agoText(emp.location.latest.at, now)} (${emp.location.latest.client === 'web' ? 'website' : 'app'})` : '—'} />
                    </div>
                  )}
                  {emp.location?.latest?.address && (
                    <div className="mn-muted mt-2">
                      Now near: {emp.location.latest.address}{' '}
                      <a href={mapsUrl(emp.location.latest.latitude, emp.location.latest.longitude)} target="_blank" rel="noopener noreferrer">Open map</a>
                    </div>
                  )}
                </div>
              </div>

              <div className="mn-card">
                <div className="mn-card-head"><div><h4>Day summary</h4><p>Movement from the app's GPS on this day</p></div></div>
                <div className="mn-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                  <Stat label="Sessions" value={detail.sessions.length} />
                  <Stat label="Worked" value={hoursText(detail.sessions.reduce((sum, s) => sum + (s.hours || 0), 0))} />
                  <Stat label="Distance (app GPS)" value={distanceText(tracking.distanceMeters)} />
                  <Stat label="App location points" value={tracking.appPoints} />
                  <Stat label="Website points" value={tracking.webPoints} />
                  <Stat label="First / last GPS" value={tracking.firstAt ? `${timeOf(tracking.firstAt)} – ${timeOf(tracking.lastAt)}` : '—'} />
                  <Stat label="Gaps (30+ min)" value={tracking.gaps.length} color={tracking.gaps.length ? '#ea580c' : undefined} />
                  <Stat label="Fake GPS points" value={tracking.mockedPoints} color={tracking.mockedPoints ? '#dc2626' : '#15803d'} />
                </div>
                {tracking.gaps.length > 0 && (
                  <div className="mn-card-body pt-0">
                    <div className="mn-alert warn">
                      No app location: {tracking.gaps.map((g) => `${timeOf(g.from)}–${timeOf(g.to)} (${g.minutes} min)`).join(', ')}
                    </div>
                  </div>
                )}
              </div>

              <div className="mn-card">
                <div className="mn-card-head"><div><h4>Punches</h4><p>Each session and where it was punched from</p></div></div>
                <div className="table-responsive">
                  <table className="mn-table">
                    <thead><tr><th>Punch in</th><th>Punch out</th><th>Hours</th><th>Mode</th><th>Status</th><th>Place</th></tr></thead>
                    <tbody>
                      {!detail.sessions.length && <tr><td colSpan={6} className="mn-empty">No punch on this day.</td></tr>}
                      {detail.sessions.map((s) => (
                        <tr key={s._id}>
                          <td>{timeOf(s.punchIn)}<SourceTag source={s.inClient} />{s.isLate && <div className="mn-muted" style={{ color: '#d97706' }}>Late {s.lateMinutes} min</div>}</td>
                          <td>{s.punchOut ? <>{timeOf(s.punchOut)}<SourceTag source={s.outClient} /></> : <span style={{ color: '#15803d', fontWeight: 700 }}>Working</span>}</td>
                          <td>{hoursText(s.hours)}</td>
                          <td>{({ wfh: 'WFH', field: 'Field' })[s.mode] || 'Office'}{s.outside && <div className="mn-muted" style={{ color: '#dc2626' }}>Outside area</div>}</td>
                          <td>{s.status === 'approved' ? (s.approvalSource === 'auto' ? 'Auto-approved' : 'Approved') : s.status}</td>
                          <td className="mn-muted" style={{ maxWidth: 260 }}>
                            {s.address || '—'}
                            {s.punchInLocation?.latitude != null && <> · <a href={mapsUrl(s.punchInLocation.latitude, s.punchInLocation.longitude)} target="_blank" rel="noopener noreferrer">In</a></>}
                            {s.punchOutLocation?.latitude != null && <> · <a href={mapsUrl(s.punchOutLocation.latitude, s.punchOutLocation.longitude)} target="_blank" rel="noopener noreferrer">Out</a></>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          <div className="mn-card">
            <div className="mn-card-head">
              <div>
                <h4>{employeeId ? 'Activity timeline' : 'Activity log'}</h4>
                <p>{employeeId ? `${timeline.length} event(s)` : `${log.pagination?.total || 0} event(s)`} · newest first</p>
              </div>
              {!employeeId && log.pagination?.totalPages > 1 && (
                <div className="mn-toolbar">
                  <button type="button" className="mn-btn sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
                  <span className="mn-muted">Page {page} of {log.pagination.totalPages}</span>
                  <button type="button" className="mn-btn sm" disabled={page >= log.pagination.totalPages} onClick={() => setPage(page + 1)}>›</button>
                </div>
              )}
            </div>
            <div className="mn-feed" style={{ maxHeight: 'none' }}>
              {(employeeId ? timeline : log.data || []).length === 0 && !loading && (
                <div className="mn-empty">No activity recorded for this {employeeId ? 'employee on this day' : 'day'}.</div>
              )}
              {(employeeId ? timeline : log.data || []).map((item) => {
                const meta = ACTIVITY[item.type] || { label: item.type, color: '#475569', icon: '•' };
                return (
                  <div key={item._id} className="mn-feed-row" style={{ gridTemplateColumns: employeeId ? '34px 1fr auto' : '34px 1fr auto' }}>
                    <span className="mn-ev" style={{ '--c': meta.color }}>{meta.icon}</span>
                    <div style={{ minWidth: 0 }}>
                      <div className="mn-strong" style={{ fontSize: '.86rem' }}>
                        {!employeeId && <><button type="button" className="border-0 bg-transparent p-0 mn-strong" style={{ color: '#0a1f8f' }} onClick={() => setEmployeeId(String(item.employee?._id || ''))}>{item.employee?.name || 'Employee'}</button> · </>}
                        {meta.label} <SourceTag source={item.source} />
                      </div>
                      <div className="mn-muted">{item.message}</div>
                      {item.location?.latitude != null && (
                        <div className="mn-muted">
                          {item.location.address || `${item.location.latitude.toFixed(5)}, ${item.location.longitude.toFixed(5)}`}{' '}
                          <a href={mapsUrl(item.location.latitude, item.location.longitude)} target="_blank" rel="noopener noreferrer">Map</a>
                        </div>
                      )}
                      {item.meta?.device && <div className="mn-muted">{item.meta.device}{item.meta.batteryLevel != null ? ` · ${item.meta.batteryLevel}% battery` : ''}</div>}
                    </div>
                    <div className="mn-muted" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div className="mn-strong" style={{ color: '#0a1f8f' }}>{timeOf(item.at)}</div>
                      {!isToday && <div>{dateTimeOf(item.at).split(',')[0]}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EmployeeActivity;
