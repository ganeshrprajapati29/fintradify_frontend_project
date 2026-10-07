import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../utils/axios';
import TrackingRadar, { bearingBetween, formatDistance, isNum, metersBetween, niceRange, radarStyles } from './TrackingRadar';

const formatTime = (value) => (value
  ? new Date(value).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })
  : '—');
const initials = (name) => String(name || 'E').trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();

const presenceRadius = (office) => {
  const radius = Number(office?.radiusMeters);
  return Number.isFinite(radius) && radius > 0 && radius <= 2000 ? Math.max(radius, 150) : 300;
};

/**
 * Dashboard strip: today's live picture (radar, who is in, approvals waiting).
 * onNavigate(tab) opens another admin tab.
 */
const DashboardLiveOps = ({ onNavigate }) => {
  const [tracking, setTracking] = useState({ employees: [], office: null });
  const [queue, setQueue] = useState({ data: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    const [trackingRes, queueRes] = await Promise.allSettled([
      api.get('/tracking'),
      api.get('/attendance/review-queue', { params: { status: 'pending', limit: 6 } }),
    ]);
    if (trackingRes.status === 'fulfilled') {
      setTracking({ employees: trackingRes.value.data?.data || [], office: trackingRes.value.data?.office || null });
    }
    if (queueRes.status === 'fulfilled') {
      setQueue({ data: queueRes.value.data?.data || [], summary: queueRes.value.data?.summary || {} });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
    window.addEventListener('attendanceUpdated', load);
    return () => {
      clearInterval(timer);
      window.removeEventListener('attendanceUpdated', load);
    };
  }, [load]);

  const review = async (id, action) => {
    setBusy(id);
    try {
      await api.put(`/attendance/admin/${action}/${id}`, {});
      await load();
    } catch (err) {
      // The row stays in the list; the admin can retry from the approvals page.
    } finally {
      setBusy('');
    }
  };

  const { office, employees } = tracking;
  const officePoint = office && isNum(office.latitude) ? [Number(office.latitude), Number(office.longitude)] : null;

  const stats = useMemo(() => {
    const onDuty = employees.filter((e) => e.isActive);
    const radius = presenceRadius(office);
    let atOffice = 0;
    let onField = 0;
    let live = 0;
    const blips = [];
    onDuty.forEach((e) => {
      const loc = e.currentLocation;
      if (!loc || !isNum(loc.latitude) || !officePoint) return;
      const point = [Number(loc.latitude), Number(loc.longitude)];
      const distance = metersBetween(officePoint, point);
      const isLive = loc.source !== 'punch' && e.minutesSinceUpdate !== null && e.minutesSinceUpdate <= 15;
      if (isLive) live += 1;
      const inside = distance <= radius;
      if (inside) atOffice += 1; else onField += 1;
      blips.push({
        id: e._id,
        name: e.name,
        label: inside ? 'At office' : 'On field',
        color: inside ? '#16a34a' : '#7c3aed',
        live: isLive,
        distance,
        bearing: bearingBetween(officePoint, point),
      });
    });
    const punchedToday = employees.filter((e) => e.punchIn).sort((a, b) => new Date(b.punchIn) - new Date(a.punchIn));
    return {
      total: employees.length,
      onDuty: onDuty.length,
      atOffice,
      onField,
      live,
      late: onDuty.filter((e) => e.isLate).length,
      notIn: employees.filter((e) => !e.punchIn).length,
      blips,
      recent: punchedToday.slice(0, 7),
    };
  }, [employees, office, officePoint]);

  const range = niceRange(Math.max(1000, ...stats.blips.map((b) => b.distance)) * 1.1);
  const pending = queue.summary.pending ?? 0;

  const tiles = [
    ['On duty', stats.onDuty, '#0a1f8f', 'tracking'],
    ['At office', stats.atOffice, '#16a34a', 'tracking'],
    ['On field', stats.onField, '#7c3aed', 'tracking'],
    ['Late today', stats.late, '#dc2626', 'attendance-approvals'],
    ['Not punched in', stats.notIn, '#64748b', 'attendance'],
    ['Awaiting approval', pending, '#d97706', 'attendance-approvals'],
  ];

  return (
    <section className="dlo">
      <style>{radarStyles}</style>
      <style>{`
        .dlo { display: grid; gap: 14px; margin-bottom: 18px; }
        .dlo-tiles { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; }
        .dlo-tile { text-align: left; background: #fff; border: 1px solid #e6e9f2; border-radius: 14px; padding: 12px 14px; box-shadow: 0 6px 18px rgba(15,23,42,.05); cursor: pointer; position: relative; overflow: hidden; }
        .dlo-tile::after { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--c); }
        .dlo-tile b { display: block; font-size: 1.6rem; font-weight: 800; color: var(--c); line-height: 1.1; }
        .dlo-tile span { font-size: .72rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: .05em; }
        .dlo-grid { display: grid; grid-template-columns: 340px minmax(0, 1fr) minmax(0, 1fr); gap: 14px; align-items: stretch; }
        .dlo-card { background: #fff; border: 1px solid #e6e9f2; border-radius: 16px; box-shadow: 0 6px 18px rgba(15,23,42,.05); overflow: hidden; display: flex; flex-direction: column; }
        .dlo-card.dark { background: linear-gradient(180deg, #04131f, #020b14); border-color: #0f2a3d; color: #e2e8f0; }
        .dlo-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 12px 14px; border-bottom: 1px solid #f0f2f7; }
        .dlo-card.dark .dlo-head { border-bottom-color: rgba(255,255,255,.07); }
        .dlo-head strong { font-size: .95rem; }
        .dlo-link { border: none; background: none; color: #0a1f8f; font-weight: 800; font-size: .8rem; cursor: pointer; padding: 0; }
        .dlo-card.dark .dlo-link { color: #86efac; }
        .dlo-live { display: inline-flex; align-items: center; gap: 6px; font-size: .72rem; font-weight: 700; color: #86efac; }
        .dlo-live i { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 8px #22c55e; }
        .dlo-list { display: grid; }
        .dlo-item { display: flex; gap: 10px; align-items: center; padding: 9px 14px; border-bottom: 1px solid #f3f5f9; }
        .dlo-avatar { width: 34px; height: 34px; border-radius: 50%; background: #0a1f8f; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: .74rem; overflow: hidden; flex: 0 0 auto; }
        .dlo-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .dlo-main { min-width: 0; flex: 1; }
        .dlo-main strong { display: block; font-size: .86rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dlo-main small { display: block; font-size: .74rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dlo-tag { display: inline-flex; padding: 2px 8px; border-radius: 999px; font-size: .68rem; font-weight: 800; }
        .dlo-tag.late { background: #fee2e2; color: #b91c1c; }
        .dlo-tag.ok { background: #dcfce7; color: #15803d; }
        .dlo-tag.out { background: #f1f5f9; color: #475569; }
        .dlo-btn { border: 1px solid #dbe3ef; background: #fff; border-radius: 8px; padding: 3px 9px; font-size: .74rem; font-weight: 700; cursor: pointer; }
        .dlo-btn.ok { background: #16a34a; border-color: #16a34a; color: #fff; }
        .dlo-btn.no { color: #dc2626; border-color: #fecaca; }
        .dlo-btn:disabled { opacity: .5; }
        .dlo-empty { padding: 26px 14px; text-align: center; color: #64748b; font-size: .86rem; }
        .dlo-foot { margin-top: auto; padding: 10px 14px; font-size: .78rem; color: #64748b; border-top: 1px solid #f0f2f7; }
        .dlo-card.dark .dlo-foot { border-top-color: rgba(255,255,255,.07); color: #4d7c63; font-family: ui-monospace, Menlo, Consolas, monospace; }
        @media (max-width: 1280px) { .dlo-grid { grid-template-columns: 1fr 1fr; } .dlo-grid > .dlo-card.dark { grid-column: 1 / -1; } .dlo-tiles { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width: 760px) { .dlo-grid { grid-template-columns: 1fr; } .dlo-tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      `}</style>

      <div className="dlo-tiles">
        {tiles.map(([label, value, color, tab]) => (
          <button key={label} type="button" className="dlo-tile" style={{ '--c': color }} onClick={() => onNavigate && onNavigate(tab)}>
            <b>{loading ? '…' : value}</b>
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="dlo-grid">
        <div className="dlo-card dark">
          <div className="dlo-head">
            <strong style={{ color: '#fff' }}>Live radar</strong>
            <span className="dlo-live"><i />{stats.live} live GPS</span>
          </div>
          <div style={{ padding: '4px 8px 0', maxWidth: 340, margin: '0 auto', width: '100%' }}>
            <TrackingRadar blips={stats.blips} range={range} scale="log" compact centerLabel={office?.label || 'Office'} onSelect={() => onNavigate && onNavigate('tracking')} />
          </div>
          <div className="dlo-foot d-flex justify-content-between align-items-center">
            <span>{stats.blips.length} on radar · range {formatDistance(range)}</span>
            <button type="button" className="dlo-link" onClick={() => onNavigate && onNavigate('tracking')}>Open live tracking →</button>
          </div>
        </div>

        <div className="dlo-card">
          <div className="dlo-head">
            <strong>Waiting for approval {pending ? `(${pending})` : ''}</strong>
            <button type="button" className="dlo-link" onClick={() => onNavigate && onNavigate('attendance-approvals')}>View all →</button>
          </div>
          <div className="dlo-list">
            {!loading && queue.data.length === 0 && <div className="dlo-empty">All attendance is approved. Nothing pending.</div>}
            {queue.data.map((record) => (
              <div key={record._id} className="dlo-item">
                <div className="dlo-avatar">{record.employee?.profilePhoto ? <img src={record.employee.profilePhoto} alt="" /> : initials(record.employee?.name)}</div>
                <div className="dlo-main">
                  <strong>{record.employee?.name || 'Employee'}</strong>
                  <small>
                    {new Date(record.punchIn).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short' })}
                    {' · '}{formatTime(record.punchIn)} – {record.punchOut ? formatTime(record.punchOut) : 'working'}
                    {record.isLate ? ' · late' : ''}
                  </small>
                </div>
                <button type="button" className="dlo-btn ok" disabled={busy === record._id} onClick={() => review(record._id, 'approve')}>Approve</button>
                <button type="button" className="dlo-btn no" disabled={busy === record._id} onClick={() => review(record._id, 'reject')}>Reject</button>
              </div>
            ))}
          </div>
          <div className="dlo-foot">{queue.summary.pendingToday ?? 0} from today · {queue.summary.approvedToday ?? 0} approved today</div>
        </div>

        <div className="dlo-card">
          <div className="dlo-head">
            <strong>Latest punch-ins</strong>
            <button type="button" className="dlo-link" onClick={() => onNavigate && onNavigate('active-attendance')}>Active attendance →</button>
          </div>
          <div className="dlo-list">
            {!loading && stats.recent.length === 0 && <div className="dlo-empty">No one has punched in yet today.</div>}
            {stats.recent.map((e) => (
              <div key={e._id} className="dlo-item">
                <div className="dlo-avatar">{e.profilePhoto ? <img src={e.profilePhoto} alt="" /> : initials(e.name)}</div>
                <div className="dlo-main">
                  <strong>{e.name}</strong>
                  <small>{e.shift?.name || 'Shift'} · {e.currentLocation?.address ? String(e.currentLocation.address).split(',').slice(0, 2).join(',') : 'location pending'}</small>
                </div>
                <div className="text-end">
                  <div style={{ fontWeight: 800, fontSize: '.84rem' }}>{formatTime(e.punchIn)}</div>
                  {e.isActive
                    ? <span className={`dlo-tag ${e.isLate ? 'late' : 'ok'}`}>{e.isLate ? `Late ${e.lateMinutes || ''}m` : 'On time'}</span>
                    : <span className="dlo-tag out">Out {formatTime(e.punchOut)}</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="dlo-foot">{stats.onDuty} of {stats.total} employees on duty right now</div>
        </div>
      </div>
    </section>
  );
};

export default DashboardLiveOps;
