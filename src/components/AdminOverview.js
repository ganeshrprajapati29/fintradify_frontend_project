import React, { useCallback, useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import api from '../utils/axios';
import DashboardLiveOps from './DashboardLiveOps';
import { handOff } from './monitoringShared';

ChartJS.register(ArcElement, BarElement, CategoryScale, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip);

const C = {
  ink: '#0f172a',
  muted: '#64748b',
  line: '#e6e9f2',
  brand: '#0a1f8f',
  present: '#2563eb',
  absent: '#ef4444',
  leave: '#8b5cf6',
  late: '#f59e0b',
  good: '#16a34a',
  warn: '#d97706',
  bad: '#dc2626',
  teal: '#0d9488',
};
const DEPT_COLORS = ['#2563eb', '#0d9488', '#f59e0b', '#8b5cf6', '#ef4444', '#0891b2', '#64748b', '#db2777'];

const istNow = () => new Date();
const clock = (date) => date.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' });
const longDate = (date) => date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const timeOf = (value) => (value ? new Date(value).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }) : '—');
const money = (value) => `₹${Math.round(Number(value) || 0).toLocaleString('en-IN')}`;
const initials = (name) => String(name || 'E').trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
const greeting = () => {
  const hour = Number(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false }));
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};
const agoText = (value) => {
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
};

/** Ring showing a 0-100 value. */
const Ring = ({ value, color, size = 76 }) => {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#eef2f7" strokeWidth="8" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * circumference} ${circumference}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize="16" fontWeight="800" fill={C.ink}>{Math.round(pct)}%</text>
    </svg>
  );
};

const Avatar = ({ person, size = 34 }) => (
  <span className="ov-avatar" style={{ width: size, height: size }}>
    {person?.profilePhoto ? <img src={person.profilePhoto} alt="" /> : initials(person?.name)}
  </span>
);

/**
 * Admin home: today's attendance, what needs action, live tracking health,
 * a 14-day trend, people and payroll. Data: GET /dashboard/overview (IST).
 * props: profile, onNavigate(tab), canOpen(tab) -> bool
 */
const AdminOverview = ({ profile, onNavigate, canOpen, showLiveOps }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(istNow);
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/dashboard/overview');
      setData(res.data);
      setError('');
      setUpdatedAt(new Date());
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load the dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const refresh = setInterval(load, 60000);
    const tick = setInterval(() => setNow(istNow()), 1000);
    window.addEventListener('attendanceUpdated', load);
    return () => {
      clearInterval(refresh);
      clearInterval(tick);
      window.removeEventListener('attendanceUpdated', load);
    };
  }, [load]);

  const go = (tab) => { if (!canOpen || canOpen(tab)) onNavigate(tab); };
  // Opens Employee Monitor already filtered, so every number can be checked name by name.
  const monitor = (filter) => {
    if (canOpen && !canOpen('employee-monitor')) return;
    handOff.set('monitor-filter', filter);
    onNavigate('employee-monitor');
  };
  const today = data?.today || {};
  const queue = data?.queue || {};
  const tracking = data?.tracking || {};
  const people = data?.people || {};
  const payroll = data?.payroll || {};
  const trend = data?.trend || [];

  const kpis = [
    { key: 'present', label: 'Present today', value: `${today.present ?? 0}`, sub: `of ${today.expected ?? 0} expected`, color: C.present, open: () => monitor('all') },
    { key: 'onDuty', label: 'On duty now', value: today.onDuty ?? 0, sub: today.field ? `${today.field} on field` : 'punched in, working', color: C.good, open: () => monitor('on_duty') },
    { key: 'late', label: 'Late arrivals', value: today.late ?? 0, sub: 'after grace time', color: C.late, open: () => monitor('late') },
    { key: 'notPunched', label: 'Not punched in', value: today.notPunched ?? 0, sub: 'expected, no punch yet', color: C.bad, open: () => monitor('not_punched') },
    { key: 'leave', label: 'On leave', value: today.onLeave ?? 0, sub: 'approved leave', color: C.leave, open: () => go('leaves') },
    { key: 'wfh', label: 'Work from home', value: today.wfh ?? 0, sub: 'approved WFH', color: C.teal, open: () => go('wfh') },
  ];

  const attention = [
    { label: 'Attendance approvals', count: queue.attendancePending, tab: 'attendance-approvals', note: 'Auto-approved after 5 min', color: C.warn },
    { label: 'Leave requests', count: queue.leavePending, tab: 'leaves', color: C.leave },
    { label: 'WFH requests', count: queue.wfhPending, tab: 'wfh', color: C.teal },
    { label: 'Reimbursement claims', count: queue.reimbursementPending, tab: 'reimbursements', color: C.present },
    { label: 'Missed punch-outs', count: queue.missedPunchOut, tab: 'manual-attendance', note: 'Need the real punch-out time', color: C.bad },
    { label: 'Overdue tasks', count: queue.tasksOverdue, tab: 'tasks', note: `${queue.tasksOpen || 0} open in total`, color: C.bad },
    { label: 'Phones with location off', count: tracking.gpsOff, tab: 'employee-monitor', filter: 'location_off', note: 'GPS or permission switched off', color: C.bad },
    { label: 'Phones silent', count: tracking.signalLost, tab: 'employee-monitor', filter: 'signal_lost', note: 'No location coming from the phone', color: C.warn },
  ].filter((item) => !canOpen || canOpen(item.tab));
  const attentionTotal = attention.reduce((sum, item) => sum + (Number(item.count) || 0), 0);

  const trendData = {
    labels: trend.map((d) => `${d.weekday} ${d.label}`),
    datasets: [
      { type: 'line', label: 'Attendance %', data: trend.map((d) => d.rate), yAxisID: 'rate', borderColor: C.brand, backgroundColor: C.brand, tension: 0.35, pointRadius: 3, borderWidth: 2, spanGaps: true },
      { type: 'bar', label: 'Present', data: trend.map((d) => d.present), backgroundColor: C.present, borderRadius: 4, stack: 'day', maxBarThickness: 26 },
      { type: 'bar', label: 'On leave', data: trend.map((d) => d.onLeave), backgroundColor: C.leave, borderRadius: 4, stack: 'day', maxBarThickness: 26 },
      { type: 'bar', label: 'Absent', data: trend.map((d) => d.absent), backgroundColor: '#fca5a5', borderRadius: 4, stack: 'day', maxBarThickness: 26 },
    ],
  };
  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, color: C.muted, font: { weight: 600 } } },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
        callbacks: {
          afterBody: (items) => {
            const day = trend[items[0]?.dataIndex];
            return day ? [`Late: ${day.late}`, `Avg hours: ${day.avgHours}`] : [];
          },
        },
      },
    },
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { color: C.muted, font: { size: 11 } } },
      y: { stacked: true, beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { color: C.muted, precision: 0 }, title: { display: true, text: 'Employees', color: C.muted } },
      rate: { position: 'right', min: 0, max: 100, grid: { display: false }, ticks: { color: C.muted, callback: (v) => `${v}%` } },
    },
  };

  const departments = people.departments || [];
  const deptData = {
    labels: departments.map((d) => d.name),
    datasets: [{ data: departments.map((d) => d.count), backgroundColor: departments.map((_, i) => DEPT_COLORS[i % DEPT_COLORS.length]), borderWidth: 2, borderColor: '#fff' }],
  };
  const maxPayroll = Math.max(1, ...(payroll.trend || []).map((p) => p.total));
  const liveShare = tracking.total ? Math.round((tracking.live / tracking.total) * 100) : 0;

  return (
    <div className="ov">
      <style>{`
        .ov { display: grid; gap: 18px; color: ${C.ink}; }
        .ov-hero { position: relative; overflow: hidden; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 18px; align-items: center; padding: 24px 26px; border-radius: 20px; color: #fff; background: radial-gradient(circle at 92% 0%, rgba(56,189,248,.28), transparent 42%), radial-gradient(circle at 0% 100%, rgba(208,20,42,.22), transparent 40%), linear-gradient(135deg, #040d3a 0%, #0a1f8f 58%, #2b45c4 100%); box-shadow: 0 18px 40px rgba(10,31,143,.22); }
        .ov-hero h1 { margin: 4px 0 6px; font-size: clamp(1.4rem, 2.6vw, 2rem); font-weight: 800; letter-spacing: -.01em; }
        .ov-hero p { margin: 0; color: rgba(255,255,255,.78); font-size: .92rem; }
        .ov-eyebrow { font-size: .72rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: #93c5fd; }
        .ov-clock { text-align: right; }
        .ov-clock b { display: block; font-size: 2rem; font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: .02em; }
        .ov-clock small { color: rgba(255,255,255,.75); font-weight: 600; }
        .ov-actions { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 8px; }
        .ov-actions button { border: 1px solid rgba(255,255,255,.25); background: rgba(255,255,255,.1); color: #fff; border-radius: 999px; padding: 7px 14px; font-weight: 700; font-size: .82rem; backdrop-filter: blur(4px); }
        .ov-actions button:hover { background: rgba(255,255,255,.2); }
        .ov-live { display: inline-flex; align-items: center; gap: 7px; font-size: .78rem; font-weight: 700; color: rgba(255,255,255,.85); margin-top: 6px; }
        .ov-live i { width: 8px; height: 8px; border-radius: 50%; background: #34d399; box-shadow: 0 0 0 0 rgba(52,211,153,.6); animation: ov-pulse 1.8s infinite; }
        @keyframes ov-pulse { 70% { box-shadow: 0 0 0 8px rgba(52,211,153,0); } 100% { box-shadow: 0 0 0 0 rgba(52,211,153,0); } }
        .ov-kpis { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; }
        .ov-kpi { position: relative; text-align: left; background: #fff; border: 1px solid ${C.line}; border-radius: 16px; padding: 14px 16px; box-shadow: 0 8px 20px rgba(15,23,42,.04); transition: transform .15s ease, box-shadow .15s ease; overflow: hidden; }
        .ov-kpi::before { content: ''; position: absolute; inset: 0 auto 0 0; width: 4px; background: var(--c); }
        .ov-kpi:hover { transform: translateY(-2px); box-shadow: 0 14px 28px rgba(15,23,42,.08); }
        .ov-kpi span { display: block; font-size: .72rem; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; color: ${C.muted}; }
        .ov-kpi b { display: block; font-size: 1.9rem; font-weight: 800; line-height: 1.15; color: var(--c); margin-top: 4px; }
        .ov-kpi small { color: #94a3b8; font-size: .76rem; font-weight: 600; }
        .ov-grid { display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(0, 1fr); gap: 16px; align-items: start; }
        .ov-grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; align-items: start; }
        .ov-card { background: #fff; border: 1px solid ${C.line}; border-radius: 18px; padding: 18px; box-shadow: 0 8px 20px rgba(15,23,42,.04); min-width: 0; }
        .ov-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 14px; }
        .ov-head h2 { margin: 0; font-size: 1.02rem; font-weight: 800; }
        .ov-head p { margin: 2px 0 0; color: ${C.muted}; font-size: .8rem; }
        .ov-link { border: none; background: #eef2ff; color: ${C.brand}; border-radius: 999px; padding: 5px 12px; font-size: .76rem; font-weight: 800; white-space: nowrap; }
        .ov-link:hover { background: #e0e7ff; }
        .ov-chart { height: 300px; }
        .ov-today { display: grid; grid-template-columns: auto 1fr; gap: 16px; align-items: center; }
        .ov-today-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
        .ov-mini { background: #f8fafc; border: 1px solid #eef1f6; border-radius: 12px; padding: 8px 10px; }
        button.ov-mini { width: 100%; cursor: pointer; font: inherit; color: inherit; }
        button.ov-mini:hover { border-color: #c7d2fe; background: #eef2ff; }
        .ov-mini span { display: block; font-size: .7rem; color: ${C.muted}; font-weight: 700; }
        .ov-mini b { font-size: 1.05rem; }
        .ov-attn { display: grid; gap: 6px; }
        .ov-attn button { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center; width: 100%; text-align: left; border: 1px solid #eef1f6; background: #fff; border-radius: 12px; padding: 9px 12px; transition: background .15s ease, border-color .15s ease; }
        .ov-attn button:hover { background: #f8fafc; border-color: #dbe3ef; }
        .ov-attn strong { display: block; font-size: .86rem; }
        .ov-attn small { display: block; color: ${C.muted}; font-size: .74rem; }
        .ov-count { min-width: 34px; text-align: center; padding: 3px 9px; border-radius: 999px; font-weight: 800; font-size: .85rem; color: var(--c); background: color-mix(in srgb, var(--c) 12%, white); }
        .ov-count.zero { color: #94a3b8; background: #f1f5f9; }
        .ov-allclear { padding: 14px; border-radius: 12px; background: #f0fdf4; color: #15803d; font-weight: 700; font-size: .88rem; text-align: center; }
        .ov-track { display: grid; gap: 12px; }
        .ov-bar { height: 10px; border-radius: 999px; background: #eef2f7; overflow: hidden; display: flex; }
        .ov-bar i { display: block; height: 100%; }
        .ov-feed { display: grid; gap: 2px; max-height: 420px; overflow-y: auto; }
        .ov-feed-row { display: grid; grid-template-columns: auto 1fr auto; gap: 10px; align-items: center; padding: 8px 6px; border-radius: 10px; }
        .ov-feed-row:hover { background: #f8fafc; }
        .ov-feed-row strong { display: block; font-size: .86rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ov-feed-row small { display: block; color: ${C.muted}; font-size: .74rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ov-avatar { position: relative; flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: linear-gradient(135deg, #0a1f8f, #2b45c4); color: #fff; font-weight: 800; font-size: .72rem; overflow: hidden; }
        .ov-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .ov-tag { display: inline-flex; padding: 2px 8px; border-radius: 999px; font-size: .68rem; font-weight: 800; }
        .ov-tag.in { background: #dcfce7; color: #15803d; } .ov-tag.out { background: #fee2e2; color: #b91c1c; }
        .ov-time { text-align: right; font-size: .76rem; font-weight: 700; color: ${C.brand}; white-space: nowrap; }
        .ov-time small { display: block; color: #94a3b8; font-weight: 600; }
        .ov-rank { display: grid; gap: 8px; }
        .ov-rank-row { display: grid; grid-template-columns: auto 1fr auto; gap: 10px; align-items: center; }
        .ov-rank-row strong { font-size: .86rem; display: block; }
        .ov-rank-row small { color: ${C.muted}; font-size: .74rem; }
        .ov-pay { display: flex; align-items: flex-end; gap: 8px; height: 120px; margin-top: 8px; }
        .ov-pay div { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end; }
        .ov-pay i { display: block; width: 100%; max-width: 34px; border-radius: 6px 6px 3px 3px; background: linear-gradient(180deg, #6366f1, #0a1f8f); min-height: 4px; }
        .ov-pay span { font-size: .68rem; color: ${C.muted}; font-weight: 700; }
        .ov-empty { padding: 22px; text-align: center; color: ${C.muted}; background: #f8fafc; border-radius: 12px; font-size: .86rem; }
        .ov-skel { height: 96px; border-radius: 16px; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%); background-size: 400% 100%; animation: ov-shimmer 1.3s ease infinite; }
        @keyframes ov-shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }
        @media (max-width: 1400px) { .ov-kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width: 1200px) { .ov-grid, .ov-grid-3 { grid-template-columns: 1fr; } }
        @media (max-width: 640px) {
          .ov-hero { grid-template-columns: 1fr; padding: 18px; }
          .ov-clock { text-align: left; }
          .ov-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .ov-kpi b { font-size: 1.5rem; }
          .ov-today { grid-template-columns: 1fr; justify-items: center; }
          .ov-today-list { width: 100%; }
          .ov-chart { height: 260px; }
        }
      `}</style>

      <section className="ov-hero">
        <div>
          <div className="ov-eyebrow">Admin dashboard</div>
          <h1>{greeting()}, {profile?.name || 'Admin'}</h1>
          <p>{people.active ?? '—'} active employees · {today.present ?? '—'} present today · {tracking.live ?? '—'} live on map</p>
          <span className="ov-live"><i />Live · updated {updatedAt ? agoText(updatedAt) : '…'}</span>
        </div>
        <div className="ov-clock">
          <b>{clock(now)}</b>
          <small>{longDate(now)}</small>
        </div>
        <div className="ov-actions">
          {[['tracking', 'Live map'], ['attendance-approvals', 'Approvals'], ['add-employee', 'Add employee'], ['manual-attendance', 'Manual attendance'], ['reports-center', 'Reports'], ['salary', 'Payroll']]
            .filter(([tab]) => !canOpen || canOpen(tab))
            .map(([tab, label]) => <button key={tab} type="button" onClick={() => go(tab)}>{label}</button>)}
        </div>
      </section>

      {error && <div className="alert alert-danger mb-0">{error}</div>}

      <section className="ov-kpis">
        {loading && !data
          ? Array.from({ length: 6 }, (_, i) => <div key={i} className="ov-skel" />)
          : kpis.map((kpi) => (
            <button key={kpi.key} type="button" className="ov-kpi" style={{ '--c': kpi.color }} onClick={kpi.open} title="Show the employees behind this number">
              <span>{kpi.label}</span>
              <b>{kpi.value}</b>
              <small>{kpi.sub}</small>
            </button>
          ))}
      </section>

      <section className="ov-grid">
        <div className="ov-card">
          <div className="ov-head">
            <div>
              <h2>Attendance — last 14 days</h2>
              <p>Present, on leave and absent per working day, with the attendance rate</p>
            </div>
            <button type="button" className="ov-link" onClick={() => go('reports-center')}>Reports</button>
          </div>
          <div className="ov-chart">
            {trend.length ? <Bar data={trendData} options={trendOptions} /> : <div className="ov-empty">The trend appears once attendance is recorded.</div>}
          </div>
        </div>

        <div className="ov-card">
          <div className="ov-head">
            <div>
              <h2>Needs your attention</h2>
              <p>{attentionTotal ? `${attentionTotal} item(s) waiting` : 'Nothing waiting right now'}</p>
            </div>
          </div>
          {attentionTotal === 0 && data ? <div className="ov-allclear">All clear — no approvals or issues pending.</div> : null}
          <div className="ov-attn" style={{ marginTop: attentionTotal === 0 && data ? 10 : 0 }}>
            {attention.map((item) => (
              <button key={item.label} type="button" onClick={() => (item.filter ? monitor(item.filter) : go(item.tab))}>
                <span>
                  <strong>{item.label}</strong>
                  {item.note && <small>{item.note}</small>}
                </span>
                <span className={`ov-count ${Number(item.count) ? '' : 'zero'}`} style={{ '--c': item.color }}>{item.count ?? 0}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="ov-grid-3">
        <div className="ov-card">
          <div className="ov-head">
            <div>
              <h2>Today at a glance</h2>
              <p>{today.hours ?? 0} hours worked so far</p>
            </div>
          </div>
          <div className="ov-today">
            <Ring value={today.rate ?? 0} color={(today.rate ?? 0) >= 85 ? C.good : (today.rate ?? 0) >= 60 ? C.warn : C.bad} size={96} />
            <div className="ov-today-list">
              <div className="ov-mini"><span>Present</span><b>{today.present ?? 0}/{today.expected ?? 0}</b></div>
              <div className="ov-mini"><span>Outside area</span><b style={{ color: today.outside ? C.bad : undefined }}>{today.outside ?? 0}</b></div>
              <div className="ov-mini"><span>Auto-approved</span><b>{today.autoApproved ?? 0}</b></div>
              <div className="ov-mini"><span>Field work</span><b>{today.field ?? 0}</b></div>
            </div>
          </div>
        </div>

        <div className="ov-card">
          <div className="ov-head">
            <div>
              <h2>Live tracking</h2>
              <p>Phones sending app GPS in the last 10 minutes</p>
            </div>
            <button type="button" className="ov-link" onClick={() => monitor('all')}>Monitor</button>
          </div>
          <div className="ov-track">
            <div className="d-flex align-items-baseline gap-2">
              <b style={{ fontSize: '2rem', fontWeight: 800, color: C.good }}>{tracking.live ?? 0}</b>
              <span style={{ color: C.muted, fontWeight: 700 }}>of {tracking.total ?? 0} employees live ({liveShare}%)</span>
            </div>
            <div className="ov-bar">
              <i style={{ width: `${liveShare}%`, background: C.good }} />
              <i style={{ width: `${tracking.total ? (tracking.gpsOff / tracking.total) * 100 : 0}%`, background: C.bad }} />
            </div>
            <div className="ov-today-list">
              <button type="button" className="ov-mini text-start" onClick={() => monitor('location_off')}><span>GPS / permission off</span><b style={{ color: tracking.gpsOff ? C.bad : undefined }}>{tracking.gpsOff ?? 0}</b></button>
              <button type="button" className="ov-mini text-start" onClick={() => monitor('signal_lost')}><span>Phone silent</span><b style={{ color: tracking.signalLost ? C.warn : undefined }}>{tracking.signalLost ?? 0}</b></button>
              <button type="button" className="ov-mini text-start" onClick={() => monitor('no_app')}><span>Logged out / no app</span><b>{(tracking.loggedOut || 0) + (tracking.noApp || 0)}</b></button>
              <button type="button" className="ov-mini text-start" onClick={() => monitor('web')}><span>Punched via website</span><b>{tracking.punchedViaWeb ?? 0}</b></button>
            </div>
          </div>
        </div>

        <div className="ov-card">
          <div className="ov-head">
            <div>
              <h2>People</h2>
              <p>{people.active ?? 0} active · {people.joinedThisMonth ?? 0} joined this month</p>
            </div>
            <button type="button" className="ov-link" onClick={() => go('employee-list')}>Employees</button>
          </div>
          {departments.length ? (
            <div style={{ height: 190 }}>
              <Doughnut
                data={deptData}
                options={{ responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 8, color: C.muted, font: { size: 11, weight: 600 } } } } }}
              />
            </div>
          ) : <div className="ov-empty">Departments appear after employees are added.</div>}
          {(people.blocked > 0 || people.terminated > 0) && (
            <p className="small text-muted mt-2 mb-0">{people.blocked || 0} blocked · {people.terminated || 0} terminated</p>
          )}
        </div>
      </section>

      {showLiveOps && <DashboardLiveOps onNavigate={onNavigate} />}

      <section className="ov-grid">
        <div className="ov-card">
          <div className="ov-head">
            <div>
              <h2>Live punch activity</h2>
              <p>Latest punch-ins and punch-outs (app and website)</p>
            </div>
            <button type="button" className="ov-link" onClick={() => go('activity-log')}>Activity log</button>
          </div>
          {(data?.activity || []).length ? (
            <div className="ov-feed">
              {data.activity.map((item) => (
                <div key={`${item.attendanceId}-${item.type}`} className="ov-feed-row">
                  <Avatar person={item.employee} />
                  <div style={{ minWidth: 0 }}>
                    <strong>
                      {item.employee.name}{' '}
                      <span className={`ov-tag ${item.type}`}>{item.type === 'in' ? 'IN' : 'OUT'}</span>
                    </strong>
                    <small>
                      {item.employee.employeeId}
                      {' · '}{{ wfh: 'WFH', field: 'Field' }[item.mode] || 'Office'}
                      {item.client ? ` · via ${{ app: 'app', web: 'website', admin: 'HR' }[item.client] || item.client}` : ''}
                      {item.late ? ` · late ${item.lateMinutes}m` : ''}
                      {item.outside ? ' · outside area' : ''}
                      {item.status === 'approved' ? (item.approvalSource === 'auto' ? ' · auto-approved' : ' · approved') : item.status === 'pending' ? ' · pending' : item.status === 'rejected' ? ' · rejected' : ''}
                    </small>
                  </div>
                  <div className="ov-time">{timeOf(item.at)}<small>{agoText(item.at)}</small></div>
                </div>
              ))}
            </div>
          ) : <div className="ov-empty">No punches in the last 36 hours.</div>}
        </div>

        <div className="d-grid gap-3">
          <div className="ov-card">
            <div className="ov-head">
              <div>
                <h2>Most late (14 days)</h2>
                <p>Employees who arrived late most often</p>
              </div>
            </div>
            {(data?.lateLeaders || []).length ? (
              <div className="ov-rank">
                {data.lateLeaders.map((row) => (
                  <div key={row._id} className="ov-rank-row">
                    <Avatar person={row} size={30} />
                    <div style={{ minWidth: 0 }}>
                      <strong>{row.name}</strong>
                      <small>{row.employeeId} · avg {row.avgMinutes} min late</small>
                    </div>
                    <span className="ov-count" style={{ '--c': C.late }}>{row.days}d</span>
                  </div>
                ))}
              </div>
            ) : <div className="ov-empty">No late arrivals in the last 14 days.</div>}
          </div>

          <div className="ov-card">
            <div className="ov-head">
              <div>
                <h2>Payroll</h2>
                <p>{money(payroll.total)} net this month · {payroll.slips || 0} slips</p>
              </div>
              <button type="button" className="ov-link" onClick={() => go('salary')}>Salary slips</button>
            </div>
            {(payroll.trend || []).length ? (
              <div className="ov-pay">
                {payroll.trend.map((p) => (
                  <div key={p.month} title={`${p.label}: ${money(p.total)} (${p.slips} slips)`}>
                    <i style={{ height: `${Math.max(4, (p.total / maxPayroll) * 100)}%` }} />
                    <span>{p.label}</span>
                  </div>
                ))}
              </div>
            ) : <div className="ov-empty">Payroll trend appears after salary slips are generated.</div>}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminOverview;
