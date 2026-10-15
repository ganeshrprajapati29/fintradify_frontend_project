import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Spinner } from 'react-bootstrap';
import moment from 'moment';
import api from '../utils/axios';
import 'bootstrap/dist/css/bootstrap.min.css';

// Day codes come from the server and match payroll / the attendance report.
const CODE_STYLE = {
  P: { label: 'Present', short: 'P', color: '#047857', soft: '#d1fae5' },
  WFH: { label: 'Work from home', short: 'WFH', color: '#0e7490', soft: '#cffafe' },
  HD: { label: 'Half day', short: 'HD', color: '#b45309', soft: '#fef3c7' },
  L: { label: 'Paid leave', short: 'L', color: '#6d28d9', soft: '#ede9fe' },
  HL: { label: 'Half-day leave', short: 'HL', color: '#7c3aed', soft: '#f3e8ff' },
  LWP: { label: 'Leave without pay', short: 'LWP', color: '#be123c', soft: '#ffe4e6' },
  A: { label: 'Absent', short: 'A', color: '#b91c1c', soft: '#fee2e2' },
  WO: { label: 'Weekly off', short: 'WO', color: '#475569', soft: '#e2e8f0' },
  H: { label: 'Holiday', short: 'H', color: '#0369a1', soft: '#e0f2fe' },
};
const NEUTRAL = { label: '', short: '', color: '#64748b', soft: '#f1f5f9' };
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const APPROVAL = {
  approved: { label: 'Approved', color: '#047857', soft: '#d1fae5' },
  pending: { label: 'Pending approval', color: '#b45309', soft: '#fef3c7' },
  rejected: { label: 'Rejected', color: '#b91c1c', soft: '#fee2e2' },
};

const time = (value) => (value ? moment(value).format('hh:mm A') : '—');
const hoursText = (hours) => {
  const minutes = Math.round((Number(hours) || 0) * 60);
  if (!minutes) return '0h';
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
};
const styleOf = (day) => CODE_STYLE[day?.code] || NEUTRAL;

/**
 * Monthly attendance calendar. Employees see their own month; pass `employeeId`
 * (admin views) to show another employee.
 */
const AttendanceCalendar = ({ employeeId }) => {
  const [month, setMonth] = useState(() => moment().format('YYYY-MM'));
  const [data, setData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => moment().format('YYYY-MM-DD'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/attendance/my-calendar', { params: { month, employee: employeeId || undefined } });
      setData(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load the attendance calendar');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [month, employeeId]);

  useEffect(() => { load(); }, [load]);

  // Stays current while open: approvals and punches made elsewhere show up on their own.
  useEffect(() => {
    const timer = setInterval(() => load(true), 60000);
    const onUpdate = () => load(true);
    window.addEventListener('attendanceUpdated', onUpdate);
    return () => {
      clearInterval(timer);
      window.removeEventListener('attendanceUpdated', onUpdate);
    };
  }, [load]);

  const days = data?.days || [];
  const summary = data?.summary || {};
  const first = moment(`${month}-01`, 'YYYY-MM-DD');
  const leading = first.day();
  const selected = days.find((d) => d.date === selectedDate) || null;
  const isCurrentMonth = month === moment().format('YYYY-MM');
  const workingDayNames = (data?.workingDays || [])
    .slice()
    .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
    .map((d) => WEEKDAYS[d]);

  const changeMonth = (amount) => {
    const next = first.clone().add(amount, 'month');
    setMonth(next.format('YYYY-MM'));
    setSelectedDate(next.isSame(moment(), 'month') ? moment().format('YYYY-MM-DD') : next.startOf('month').format('YYYY-MM-DD'));
  };
  const goToday = () => {
    setMonth(moment().format('YYYY-MM'));
    setSelectedDate(moment().format('YYYY-MM-DD'));
  };

  const attendancePercent = useMemo(() => {
    const counted = (summary.workedDays || 0) + (summary.absent || 0) + (summary.lwp || 0) + (summary.leave || 0);
    if (!counted) return null;
    return Math.round((((summary.present || 0) + (summary.wfh || 0) + (summary.halfDay || 0) * 0.5) / counted) * 100);
  }, [summary]);

  const stats = [
    ['Present', (summary.present || 0) + (summary.wfh || 0), '#047857', summary.wfh ? `${summary.wfh} WFH` : 'days worked'],
    ['Absent', summary.absent || 0, '#b91c1c', 'working days missed'],
    ['Leave', (summary.leave || 0) + (summary.lwp || 0), '#6d28d9', summary.lwp ? `${summary.lwp} without pay` : 'approved leave'],
    ['Half day', summary.halfDay || 0, '#b45309', 'marked by HR'],
    ['Late days', summary.lateDays || 0, '#c2410c', 'after grace time'],
    ['Hours', hoursText(summary.hours), '#0a1f8f', attendancePercent !== null ? `${attendancePercent}% attendance` : 'this month'],
  ];

  return (
    <div className="ac-page">
      <style>{`
        .ac-page { display: grid; gap: 16px; color: #0f172a; font-family: inherit; }
        .ac-hero { display: flex; flex-wrap: wrap; gap: 14px; justify-content: space-between; align-items: center; padding: 20px 22px; border-radius: 18px; color: #fff; background: radial-gradient(circle at 90% 10%, rgba(255,255,255,.16), transparent 40%), linear-gradient(135deg, #06135c, #0a1f8f 55%, #2b45c4); box-shadow: 0 16px 34px rgba(10,31,143,.2); }
        .ac-hero small { color: rgba(255,255,255,.7); font-weight: 800; letter-spacing: .12em; text-transform: uppercase; font-size: .7rem; }
        .ac-hero h2 { margin: 2px 0 4px; font-size: 1.6rem; font-weight: 800; }
        .ac-hero p { margin: 0; color: rgba(255,255,255,.8); font-size: .88rem; }
        .ac-nav { display: flex; gap: 8px; align-items: center; }
        .ac-nav button { border: 1px solid rgba(255,255,255,.28); background: rgba(255,255,255,.12); color: #fff; border-radius: 10px; padding: 8px 14px; font-weight: 700; font-size: .85rem; }
        .ac-nav button:hover:not(:disabled) { background: rgba(255,255,255,.22); }
        .ac-nav button:disabled { opacity: .45; }
        .ac-stats { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; }
        .ac-stat { background: #fff; border: 1px solid #e6e9f2; border-radius: 14px; padding: 12px 14px; box-shadow: 0 6px 18px rgba(15,23,42,.04); border-top: 3px solid var(--c); }
        .ac-stat span { display: block; font-size: .7rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: .05em; }
        .ac-stat b { display: block; font-size: 1.5rem; font-weight: 800; line-height: 1.2; color: var(--c); }
        .ac-stat small { color: #94a3b8; font-size: .72rem; }
        .ac-layout { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 16px; align-items: start; }
        .ac-card { background: #fff; border: 1px solid #e6e9f2; border-radius: 16px; padding: 16px; box-shadow: 0 6px 18px rgba(15,23,42,.04); }
        .ac-week, .ac-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; }
        .ac-week div { text-align: center; font-size: .72rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: .06em; padding: 4px 0 8px; }
        .ac-week div.off { color: #94a3b8; }
        .ac-day { position: relative; min-height: 96px; border: 1px solid #e6e9f2; border-radius: 12px; background: #fff; padding: 8px; text-align: left; display: flex; flex-direction: column; gap: 4px; cursor: pointer; transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease; }
        .ac-day:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(15,23,42,.08); }
        .ac-day.blank { background: transparent; border: none; cursor: default; box-shadow: none; transform: none; }
        .ac-day.weekly { background: #f8fafc; }
        .ac-day.upcoming { background: #fcfdff; }
        .ac-day.selected { border-color: #0a1f8f; box-shadow: 0 0 0 2px rgba(10,31,143,.18); }
        .ac-day.today .ac-num { background: #0a1f8f; color: #fff; }
        .ac-num { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 50%; font-weight: 800; font-size: .85rem; }
        .ac-code { display: inline-flex; align-self: flex-start; padding: 2px 8px; border-radius: 999px; font-size: .68rem; font-weight: 800; color: var(--c); background: var(--s); }
        .ac-meta { font-size: .72rem; color: #64748b; font-weight: 600; line-height: 1.3; }
        .ac-flags { position: absolute; top: 8px; right: 8px; display: flex; gap: 3px; }
        .ac-flags i { width: 8px; height: 8px; border-radius: 50%; }
        .ac-legend { display: flex; flex-wrap: wrap; gap: 8px 14px; margin-top: 14px; font-size: .76rem; font-weight: 700; color: #475569; }
        .ac-legend span { display: inline-flex; align-items: center; gap: 6px; }
        .ac-legend b { display: inline-flex; min-width: 30px; justify-content: center; padding: 1px 6px; border-radius: 999px; font-size: .66rem; }
        .ac-legend i { width: 8px; height: 8px; border-radius: 50%; }
        .ac-detail h3 { font-size: 1.05rem; font-weight: 800; margin: 2px 0 10px; }
        .ac-detail .eyebrow { font-size: .7rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: .08em; }
        .ac-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; font-size: .74rem; font-weight: 800; color: var(--c); background: var(--s); }
        .ac-rows { display: grid; gap: 8px; margin-top: 12px; }
        .ac-row { display: flex; justify-content: space-between; gap: 10px; padding: 9px 11px; border-radius: 10px; background: #f8fafc; border: 1px solid #eef1f6; font-size: .84rem; color: #475569; font-weight: 600; }
        .ac-row b { color: #0f172a; text-align: right; }
        .ac-session { border: 1px solid #e6e9f2; border-radius: 12px; padding: 10px 12px; display: grid; gap: 6px; }
        .ac-session-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-weight: 800; font-size: .84rem; }
        .ac-session small { color: #64748b; font-size: .76rem; }
        .ac-tags { display: flex; flex-wrap: wrap; gap: 5px; }
        .ac-tag { padding: 2px 8px; border-radius: 999px; font-size: .68rem; font-weight: 800; background: #f1f5f9; color: #475569; }
        .ac-tag.warn { background: #fff7ed; color: #c2410c; } .ac-tag.info { background: #eff6ff; color: #1d4ed8; }
        .ac-empty { padding: 14px; border-radius: 12px; background: #f8fafc; color: #64748b; font-size: .85rem; text-align: center; }
        .ac-loading { min-height: 380px; display: flex; align-items: center; justify-content: center; gap: 10px; color: #0a1f8f; font-weight: 700; }
        @media (max-width: 1200px) { .ac-layout { grid-template-columns: 1fr; } .ac-stats { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width: 640px) {
          .ac-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .ac-week, .ac-grid { gap: 4px; }
          .ac-day { min-height: 62px; padding: 5px; border-radius: 9px; }
          .ac-meta { display: none; }
          .ac-code { font-size: .6rem; padding: 1px 5px; }
          .ac-num { width: 22px; height: 22px; font-size: .75rem; }
          .ac-hero h2 { font-size: 1.3rem; }
        }
      `}</style>

      <section className="ac-hero">
        <div>
          <small>{data?.employee && employeeId ? `${data.employee.name} · ${data.employee.employeeId}` : 'My attendance'}</small>
          <h2>{first.format('MMMM YYYY')}</h2>
          <p>
            {(data?.shifts || []).map((s) => s.label).join(' · ') || 'Loading shift…'}
            {workingDayNames.length ? ` · Working days: ${workingDayNames.join(', ')}` : ''}
          </p>
        </div>
        <div className="ac-nav">
          <button type="button" onClick={() => changeMonth(-1)}>‹ Prev</button>
          <button type="button" onClick={goToday} disabled={isCurrentMonth}>Today</button>
          <button type="button" onClick={() => changeMonth(1)} disabled={isCurrentMonth}>Next ›</button>
        </div>
      </section>

      {error && <Alert variant="danger" className="mb-0">{error}</Alert>}

      <section className="ac-stats">
        {stats.map(([label, value, color, note]) => (
          <div key={label} className="ac-stat" style={{ '--c': color }}>
            <span>{label}</span>
            <b>{value}</b>
            <small>{note}</small>
          </div>
        ))}
      </section>

      <section className="ac-layout">
        <div className="ac-card">
          {loading && !data ? (
            <div className="ac-loading"><Spinner animation="border" size="sm" /> Loading calendar…</div>
          ) : (
            <>
              <div className="ac-week">
                {WEEKDAYS.map((name, index) => (
                  <div key={name} className={data && !(data.workingDays || []).includes(index) ? 'off' : ''}>{name}</div>
                ))}
              </div>
              <div className="ac-grid">
                {Array.from({ length: leading }, (_, i) => <div key={`b${i}`} className="ac-day blank" />)}
                {days.map((day) => {
                  const look = styleOf(day);
                  const label = day.code !== '-' ? look.short : day.isToday ? 'Today' : day.upcoming && day.weeklyOff ? 'WO' : '';
                  const meta = day.sessions.length
                    ? `${time(day.firstIn)}${day.lastOut ? ` – ${time(day.lastOut)}` : day.open ? ' · working' : ''}`
                    : day.leave && day.leave.status === 'pending' ? 'Leave requested' : day.code === 'WO' || (day.upcoming && day.weeklyOff) ? 'Weekly off' : day.code === 'A' ? 'No punch' : '';
                  return (
                    <button
                      key={day.date}
                      type="button"
                      className={`ac-day ${day.weeklyOff ? 'weekly' : ''} ${day.upcoming ? 'upcoming' : ''} ${day.isToday ? 'today' : ''} ${selectedDate === day.date ? 'selected' : ''}`}
                      onClick={() => setSelectedDate(day.date)}
                      title={day.label}
                    >
                      <span className="ac-num">{moment(day.date).date()}</span>
                      {label && <span className="ac-code" style={{ '--c': look.color, '--s': look.soft }}>{label}</span>}
                      <span className="ac-meta">{meta}</span>
                      {day.hours > 0 && <span className="ac-meta">{hoursText(day.hours)}</span>}
                      <span className="ac-flags">
                        {day.status === 'pending' && <i style={{ background: '#f59e0b' }} title="Pending approval" />}
                        {day.status === 'rejected' && <i style={{ background: '#ef4444' }} title="Rejected" />}
                        {day.late && <i style={{ background: '#ea580c' }} title="Late" />}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="ac-legend">
                {['P', 'WFH', 'HD', 'L', 'LWP', 'A', 'WO', 'H'].map((code) => (
                  <span key={code}><b style={{ color: CODE_STYLE[code].color, background: CODE_STYLE[code].soft }}>{code}</b>{CODE_STYLE[code].label}</span>
                ))}
                <span><i style={{ background: '#f59e0b' }} />Pending</span>
                <span><i style={{ background: '#ea580c' }} />Late</span>
              </div>
            </>
          )}
        </div>

        <aside className="ac-card ac-detail">
          <div className="eyebrow">Selected day</div>
          <h3>{moment(selectedDate).format('dddd, DD MMM YYYY')}</h3>
          {!selected ? (
            <div className="ac-empty">Choose a day in the calendar.</div>
          ) : (
            <>
              <div className="d-flex flex-wrap gap-2">
                <span className="ac-pill" style={{ '--c': styleOf(selected).color, '--s': styleOf(selected).soft }}>{selected.label}</span>
                {selected.status && APPROVAL[selected.status] && (
                  <span className="ac-pill" style={{ '--c': APPROVAL[selected.status].color, '--s': APPROVAL[selected.status].soft }}>{APPROVAL[selected.status].label}</span>
                )}
              </div>
              <div className="ac-rows">
                <div className="ac-row"><span>First punch in</span><b>{time(selected.firstIn)}</b></div>
                <div className="ac-row"><span>Last punch out</span><b>{selected.lastOut ? time(selected.lastOut) : selected.open ? 'Still working' : '—'}</b></div>
                <div className="ac-row"><span>Worked</span><b>{selected.sessions.length ? hoursText(selected.hours) : '—'}</b></div>
                {selected.late && <div className="ac-row"><span>Late by</span><b>{selected.lateMinutes} min</b></div>}
                {selected.leave && (
                  <div className="ac-row"><span>Leave ({selected.leave.type}, {selected.leave.status})</span><b>{selected.leave.reason || '—'}</b></div>
                )}
              </div>

              <div className="eyebrow mt-3 mb-2">Sessions</div>
              {selected.sessions.length === 0 ? (
                <div className="ac-empty">
                  {selected.upcoming ? 'This day has not started yet.' : selected.code === 'WO' ? 'Weekly off — no attendance needed.' : selected.code === 'H' ? 'Holiday.' : 'No punch recorded for this day.'}
                </div>
              ) : (
                <div className="d-grid gap-2">
                  {selected.sessions.map((session) => (
                    <div key={session._id} className="ac-session">
                      <div className="ac-session-head">
                        <span>{session.extraShift ? 'Extra shift' : session.shiftName || 'Shift'} · #{session.session}</span>
                        {APPROVAL[session.status] && (
                          <span className="ac-pill" style={{ '--c': APPROVAL[session.status].color, '--s': APPROVAL[session.status].soft }}>
                            {session.status === 'approved' && session.approvalSource === 'auto' ? 'Auto-approved' : APPROVAL[session.status].label}
                          </span>
                        )}
                      </div>
                      <small>{time(session.punchIn)} – {session.punchOut ? time(session.punchOut) : 'working'} · {hoursText(session.hours)}</small>
                      {session.address && <small>{session.address}</small>}
                      <div className="ac-tags">
                        <span className="ac-tag info">{{ wfh: 'WFH', field: 'Field' }[session.mode] || 'Office'}</span>
                        {session.isLate && <span className="ac-tag warn">Late {session.lateMinutes}m</span>}
                        {session.earlyOutMinutes > 0 && <span className="ac-tag warn">Early out {session.earlyOutMinutes}m</span>}
                        {session.overtimeMinutes > 0 && <span className="ac-tag">Overtime {session.overtimeMinutes}m</span>}
                        {session.outside && <span className="ac-tag warn">Outside area</span>}
                        {session.autoClosed && <span className="ac-tag warn">Missed punch-out</span>}
                      </div>
                      {session.remark && <small>Note: {session.remark}</small>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </aside>
      </section>
    </div>
  );
};

export default AttendanceCalendar;
