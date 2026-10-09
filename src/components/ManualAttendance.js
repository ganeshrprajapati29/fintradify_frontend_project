import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import api from '../utils/axios';

/* ------------------------------------------------------------------ */
/* Time helpers (everything is shown and entered in IST)               */
/* ------------------------------------------------------------------ */
const TZ = 'Asia/Kolkata';
// 'YYYY-MM-DDTHH:mm' in IST for a date
const istLocal = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('sv-SE', { timeZone: TZ, hour12: false }).slice(0, 16).replace(' ', 'T');
};
const todayKey = () => istLocal(new Date()).slice(0, 10);
const addDays = (key, days) => {
  const d = new Date(`${key}T12:00:00+05:30`);
  d.setUTCDate(d.getUTCDate() + days);
  return istLocal(d).slice(0, 10);
};
const fmtTime = (value) => (value ? new Date(value).toLocaleTimeString('en-IN', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }) : '—');
const fmtDay = (key) => (key ? new Date(`${key}T12:00:00+05:30`).toLocaleDateString('en-IN', { timeZone: TZ, weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const dayOf = (value) => istLocal(value).slice(0, 10);
const hoursBetween = (a, b) => (a && b ? Math.max(0, (new Date(b) - new Date(a)) / 36e5) : 0);
const hm = (hours) => {
  const m = Math.round((Number(hours) || 0) * 60);
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
};
const to12h = (hhmm) => {
  const [h, m] = String(hhmm || '00:00').split(':').map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
const asList = (body) => (Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : body?.attendances || []);
const shiftIdsOf = (emp) => (Array.isArray(emp?.shifts) && emp.shifts.length ? emp.shifts.map(String) : emp?.shift ? [String(emp.shift)] : []);
const workingDayOf = (r) => r.shiftDate || dayOf(r.punchIn || r.date);

const emptyForm = () => ({
  employeeId: '',
  date: todayKey(),
  shiftId: '',
  inTime: '',
  outTime: '',
  outNextDay: false,
  mode: 'office',
  status: 'approved',
  remark: '',
  asNewSession: false,
});

const SOURCE_LABEL = { app: 'App', manual: 'Admin', bulk: 'Bulk' };

const ManualAttendance = () => {
  const [tab, setTab] = useState('entry');
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [notice, setNotice] = useState(null); // { type, text }
  const [saving, setSaving] = useState(false);

  // entry
  const [form, setForm] = useState(emptyForm());
  const [daySessions, setDaySessions] = useState([]);

  // bulk
  const [bulk, setBulk] = useState({ date: todayKey(), type: 'holiday', all: true, shiftId: '', mode: 'office', remark: '' });
  const [bulkPick, setBulkPick] = useState([]);
  const [bulkQuery, setBulkQuery] = useState('');

  // missed punch-outs
  const [missed, setMissed] = useState([]);
  const [missedOut, setMissedOut] = useState({});
  const [missedLoading, setMissedLoading] = useState(false);

  // records
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState({ employee: '', startDate: addDays(todayKey(), -6), endDate: todayKey() });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // edit
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});

  const say = (type, text) => setNotice({ type, text });
  const failText = (err, fallback) => err.response?.data?.message || fallback;

  useEffect(() => {
    Promise.all([api.get('/employees'), api.get('/shifts')])
      .then(([empRes, shiftRes]) => {
        setEmployees(asList(empRes.data).filter((e) => e.role !== 'admin').sort((a, b) => String(a.name).localeCompare(String(b.name))));
        setShifts(asList(shiftRes.data).filter((s) => s.isActive !== false));
      })
      .catch((err) => say('danger', failText(err, 'Could not load employees and shifts')));
  }, []);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 25 };
      if (filters.startDate && filters.endDate) Object.assign(params, { startDate: filters.startDate, endDate: filters.endDate });
      if (filters.employee) params.employee = filters.employee;
      const res = await api.get('/attendance', { params });
      setRecords(asList(res.data));
      setPages(res.data?.pagination?.totalPages || 1);
      setTotal(res.data?.pagination?.total || 0);
    } catch (err) {
      say('danger', failText(err, 'Could not load attendance'));
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  const loadMissed = useCallback(async () => {
    setMissedLoading(true);
    try {
      const res = await api.get('/attendance/admin/missed-punch-out');
      const rows = asList(res.data);
      setMissed(rows);
      setMissedOut(Object.fromEntries(rows.map((r) => [r._id, istLocal(r.suggestedPunchOut || r.punchOut)])));
    } catch (err) {
      say('danger', failText(err, 'Could not load missed punch-outs'));
    } finally {
      setMissedLoading(false);
    }
  }, []);

  useEffect(() => { loadRecords(); }, [loadRecords]);
  useEffect(() => { loadMissed(); }, [loadMissed]);

  // Sessions the selected employee already has on the chosen day (avoid duplicates).
  const loadDaySessions = useCallback(async () => {
    if (!form.employeeId || !form.date) { setDaySessions([]); return; }
    try {
      const res = await api.get('/attendance', { params: { employee: form.employeeId, startDate: addDays(form.date, -1), endDate: addDays(form.date, 1), page: 1, limit: 50 } });
      setDaySessions(asList(res.data).filter((r) => workingDayOf(r) === form.date).sort((a, b) => new Date(a.punchIn || a.date) - new Date(b.punchIn || b.date)));
    } catch (err) {
      setDaySessions([]);
    }
  }, [form.employeeId, form.date]);
  useEffect(() => { loadDaySessions(); }, [loadDaySessions]);

  const refreshAll = () => { loadRecords(); loadMissed(); loadDaySessions(); };

  /* ---------------- entry ---------------- */
  const selectedEmployee = employees.find((e) => e._id === form.employeeId);
  const employeeShifts = useMemo(() => {
    const ids = shiftIdsOf(selectedEmployee);
    const own = ids.map((id) => shifts.find((s) => s._id === id)).filter(Boolean);
    return own.length ? own : shifts.filter((s) => s.isDefault);
  }, [selectedEmployee, shifts]);
  const formShift = shifts.find((s) => s._id === form.shiftId) || employeeShifts[0];

  const setField = (key, value) => setForm((prev) => {
    const next = { ...prev, [key]: value };
    // Punch out earlier than punch in means the next morning (night shift).
    if ((key === 'inTime' || key === 'outTime') && next.inTime && next.outTime) next.outNextDay = next.outTime <= next.inTime;
    return next;
  });

  const fillFromShift = () => {
    if (!formShift) return;
    setForm((prev) => ({ ...prev, shiftId: prev.shiftId || formShift._id, inTime: formShift.startTime, outTime: formShift.endTime, outNextDay: formShift.endTime <= formShift.startTime }));
  };

  const punchInValue = form.inTime ? `${form.date}T${form.inTime}` : '';
  const punchOutValue = form.outTime ? `${form.outNextDay ? addDays(form.date, 1) : form.date}T${form.outTime}` : '';
  const previewHours = punchInValue && punchOutValue ? hoursBetween(`${punchInValue}:00+05:30`, `${punchOutValue}:00+05:30`) : 0;

  const submitEntry = async (event) => {
    event.preventDefault();
    if (!form.employeeId || !form.date || !form.inTime) { say('danger', 'Choose the employee, the day and the punch-in time.'); return; }
    if (punchOutValue && previewHours <= 0) { say('danger', 'Punch out must be after punch in. Tick "next day" for a night shift.'); return; }
    setSaving(true);
    try {
      const res = await api.post('/attendance/admin/punch', {
        employeeId: form.employeeId,
        date: form.date,
        shiftId: form.shiftId || undefined,
        punchIn: punchInValue,
        punchOut: punchOutValue || undefined,
        mode: form.mode,
        status: form.status,
        remark: form.remark,
        asNewSession: form.asNewSession,
      });
      say('success', res.data?.message || 'Attendance saved');
      setForm((prev) => ({ ...emptyForm(), employeeId: prev.employeeId, date: prev.date }));
      refreshAll();
    } catch (err) {
      say('danger', failText(err, 'Could not save attendance'));
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- bulk ---------------- */
  const bulkList = useMemo(() => {
    const q = bulkQuery.trim().toLowerCase();
    return employees.filter((e) => e.status === 'active' || !e.status)
      .filter((e) => !q || [e.name, e.employeeId, e.department].some((v) => String(v || '').toLowerCase().includes(q)));
  }, [employees, bulkQuery]);

  const submitBulk = async () => {
    const who = bulk.all ? 'all active employees' : `${bulkPick.length} employee(s)`;
    const labels = { holiday: 'mark a holiday for', halfDay: 'mark a half day for', present: 'mark present (at their shift time)', clearHoliday: 'remove the holiday for' };
    if (!bulk.all && !bulkPick.length) { say('danger', 'Select at least one employee.'); return; }
    if (!window.confirm(`Do you want to ${labels[bulk.type]} ${who} on ${fmtDay(bulk.date)}?`)) return;
    setSaving(true);
    try {
      const res = await api.post('/attendance/admin/bulk', {
        date: bulk.date,
        type: bulk.type,
        all: bulk.all,
        employeeIds: bulk.all ? undefined : bulkPick,
        shiftId: bulk.shiftId || undefined,
        mode: bulk.mode,
        remark: bulk.remark,
      });
      say('success', res.data?.message || 'Done');
      refreshAll();
    } catch (err) {
      say('danger', failText(err, 'Could not mark attendance'));
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- missed punch-outs ---------------- */
  const fixMissed = async (row) => {
    const value = missedOut[row._id];
    if (!value) { say('danger', 'Enter the punch-out time.'); return; }
    setSaving(true);
    try {
      await api.put(`/attendance/admin/edit/${row._id}`, { punchOut: value, status: 'approved', remark: row.adminRemark || 'Punch out added by admin' });
      say('success', `${row.employee?.name}: punch out set to ${value.replace('T', ' ')} and approved`);
      refreshAll();
    } catch (err) {
      say('danger', failText(err, 'Could not update the punch out'));
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- edit / delete ---------------- */
  const openEdit = (record) => {
    setEditing(record);
    setEditForm({
      punchIn: istLocal(record.punchIn),
      punchOut: istLocal(record.punchOut),
      shiftId: record.shift?.id ? String(record.shift.id) : '',
      mode: record.mode || 'office',
      status: record.status || 'pending',
      holiday: Boolean(record.holiday),
      halfDay: Boolean(record.halfDay),
      remark: record.adminRemark || '',
    });
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    if (editForm.punchIn && editForm.punchOut && editForm.punchOut <= editForm.punchIn) { say('danger', 'Punch out must be after punch in.'); return; }
    setSaving(true);
    try {
      await api.put(`/attendance/admin/edit/${editing._id}`, {
        punchIn: editForm.punchIn || null,
        punchOut: editForm.punchOut || null,
        shiftId: editForm.shiftId || undefined,
        mode: editForm.mode,
        status: editForm.status,
        holiday: editForm.holiday,
        halfDay: editForm.halfDay,
        remark: editForm.remark,
      });
      say('success', 'Attendance updated. Late, early-out and overtime were worked out again.');
      setEditing(null);
      refreshAll();
    } catch (err) {
      say('danger', failText(err, 'Could not update attendance'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (record) => {
    if (!window.confirm(`Delete this attendance of ${record.employee?.name || 'employee'} (${fmtDay(workingDayOf(record))})?`)) return;
    try {
      await api.delete(`/attendance/admin/delete/${record._id}`);
      say('success', 'Attendance deleted');
      refreshAll();
    } catch (err) {
      say('danger', failText(err, 'Could not delete attendance'));
    }
  };

  const recordTag = (r) => {
    if (r.holiday) return <span className="ma-tag holiday">Holiday</span>;
    if (r.halfDay && !r.punchIn) return <span className="ma-tag half">Half day</span>;
    return null;
  };

  const shiftOptions = (list) => list.map((s) => (
    <option key={s._id} value={s._id}>{s.name} · {to12h(s.startTime)}–{to12h(s.endTime)}{s.endTime <= s.startTime ? ' (+1)' : ''}</option>
  ));

  return (
    <div className="ma-page">
      <style>{`
        .ma-page { display: grid; gap: 14px; color: #0f172a; }
        .ma-hero { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; align-items: center; padding: 18px 20px; border-radius: 18px; color: #fff; background: linear-gradient(135deg, #06135c 0%, #0a1f8f 60%, #2563eb 100%); box-shadow: 0 16px 36px rgba(10,31,143,.2); }
        .ma-hero h3 { margin: 2px 0 4px; font-weight: 800; font-size: 1.4rem; }
        .ma-hero p { margin: 0; color: rgba(255,255,255,.82); font-size: .88rem; max-width: 720px; }
        .ma-eyebrow { font-size: .72rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #bfdbfe; }
        .ma-tabs { display: inline-flex; flex-wrap: wrap; gap: 4px; background: #f1f5f9; border-radius: 14px; padding: 4px; }
        .ma-tabs button { border: none; background: transparent; padding: 8px 14px; border-radius: 10px; font-weight: 700; font-size: .85rem; color: #475569; }
        .ma-tabs button.active { background: #fff; color: #0a1f8f; box-shadow: 0 2px 8px rgba(15,23,42,.1); }
        .ma-count { display: inline-flex; min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px; background: #dc2626; color: #fff; font-size: .7rem; align-items: center; justify-content: center; margin-left: 6px; }
        .ma-panel { background: #fff; border: 1px solid #e6e9f2; border-radius: 16px; box-shadow: 0 6px 18px rgba(15,23,42,.05); padding: 18px; }
        .ma-panel h4 { font-size: 1rem; font-weight: 800; margin: 0 0 4px; }
        .ma-panel .sub { color: #64748b; font-size: .84rem; margin-bottom: 14px; }
        .ma-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
        .ma-grid .span2 { grid-column: span 2; } .ma-grid .span4 { grid-column: 1 / -1; }
        .ma-field label { display: block; font-size: .74rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 4px; }
        .ma-input { width: 100%; border: 1px solid #dbe3ef; border-radius: 10px; padding: 8px 11px; font-size: .88rem; background: #fff; }
        .ma-input:focus { outline: none; border-color: #0a1f8f; box-shadow: 0 0 0 3px rgba(10,31,143,.12); }
        .ma-btn { border: 1px solid #dbe3ef; background: #fff; color: #0f172a; border-radius: 10px; padding: 8px 14px; font-size: .84rem; font-weight: 700; cursor: pointer; }
        .ma-btn:disabled { opacity: .55; cursor: not-allowed; }
        .ma-btn.primary { background: #0a1f8f; border-color: #0a1f8f; color: #fff; }
        .ma-btn.green { background: #16a34a; border-color: #16a34a; color: #fff; }
        .ma-btn.danger { color: #dc2626; border-color: #fecaca; }
        .ma-btn.sm { padding: 4px 10px; font-size: .76rem; }
        .ma-check { display: flex; align-items: center; gap: 8px; font-size: .86rem; font-weight: 600; color: #334155; }
        .ma-preview { margin-top: 12px; padding: 10px 12px; border-radius: 12px; background: #eef2ff; color: #0a1f8f; font-size: .86rem; font-weight: 700; }
        .ma-existing { margin-top: 12px; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 10px 12px; font-size: .84rem; }
        .ma-existing .row-x { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 4px 0; }
        .ma-tag { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 999px; font-size: .7rem; font-weight: 800; white-space: nowrap; }
        .ma-tag.extra { background: #ede9fe; color: #6d28d9; } .ma-tag.late { background: #fee2e2; color: #b91c1c; }
        .ma-tag.holiday { background: #dcfce7; color: #15803d; } .ma-tag.half { background: #fef3c7; color: #b45309; }
        .ma-tag.src { background: #f1f5f9; color: #475569; } .ma-tag.auto { background: #fae8ff; color: #a21caf; }
        .ma-tag.pending { background: #fef3c7; color: #b45309; } .ma-tag.approved { background: #dcfce7; color: #15803d; } .ma-tag.rejected { background: #fee2e2; color: #b91c1c; }
        .ma-table { width: 100%; border-collapse: collapse; font-size: .84rem; }
        .ma-table th { text-align: left; padding: 9px 10px; font-size: .7rem; text-transform: uppercase; letter-spacing: .05em; color: #64748b; background: #f8fafc; border-bottom: 1px solid #e6e9f2; white-space: nowrap; }
        .ma-table td { padding: 9px 10px; border-bottom: 1px solid #f0f2f7; vertical-align: middle; }
        .ma-pick { max-height: 260px; overflow-y: auto; border: 1px solid #e6e9f2; border-radius: 12px; padding: 6px 10px; }
        .ma-foot { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding-top: 12px; color: #64748b; font-size: .84rem; }
        @media (max-width: 992px) { .ma-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 576px) { .ma-grid { grid-template-columns: 1fr; } .ma-grid .span2 { grid-column: auto; } }
      `}</style>

      <section className="ma-hero">
        <div>
          <div className="ma-eyebrow">Attendance</div>
          <h3>Manual Attendance</h3>
          <p>Add or correct punches (including night shifts that end the next day and extra sessions), mark holidays or half days for many employees at once, and fix forgotten punch-outs.</p>
        </div>
        <div className="ma-tabs">
          <button type="button" className={tab === 'entry' ? 'active' : ''} onClick={() => setTab('entry')}>Add / correct</button>
          <button type="button" className={tab === 'bulk' ? 'active' : ''} onClick={() => setTab('bulk')}>Mark many employees</button>
          <button type="button" className={tab === 'missed' ? 'active' : ''} onClick={() => setTab('missed')}>
            Missed punch-outs{missed.length > 0 && <span className="ma-count">{missed.length}</span>}
          </button>
        </div>
      </section>

      {notice && <div className={`alert alert-${notice.type} mb-0`} role="alert" onClick={() => setNotice(null)}>{notice.text}</div>}

      {tab === 'entry' && (
        <form className="ma-panel" onSubmit={submitEntry}>
          <h4>Add or correct attendance</h4>
          <div className="sub">Saving the same employee, day and shift again corrects that record. Turn on "Add as a new session" to add another shift on the same day.</div>
          <div className="ma-grid">
            <div className="ma-field span2">
              <label htmlFor="ma-emp">Employee</label>
              <select id="ma-emp" className="ma-input" value={form.employeeId} onChange={(e) => setForm({ ...emptyForm(), employeeId: e.target.value, date: form.date })} required>
                <option value="">Select employee</option>
                {employees.map((e) => <option key={e._id} value={e._id}>{e.name} ({e.employeeId || 'no ID'}){e.status && e.status !== 'active' ? ` - ${e.status}` : ''}</option>)}
              </select>
            </div>
            <div className="ma-field">
              <label htmlFor="ma-date">Working day</label>
              <input id="ma-date" type="date" className="ma-input" value={form.date} max={todayKey()} onChange={(e) => setField('date', e.target.value)} required />
            </div>
            <div className="ma-field">
              <label htmlFor="ma-shift">Shift</label>
              <select id="ma-shift" className="ma-input" value={form.shiftId} onChange={(e) => setField('shiftId', e.target.value)}>
                <option value="">Auto ({employeeShifts.map((s) => s.name).join(' / ') || 'employee shift'})</option>
                {employeeShifts.length > 0 && <optgroup label="Employee's shifts">{shiftOptions(employeeShifts)}</optgroup>}
                <optgroup label="Other shifts">{shiftOptions(shifts.filter((s) => !employeeShifts.some((own) => own._id === s._id)))}</optgroup>
              </select>
            </div>
            <div className="ma-field">
              <label htmlFor="ma-in">Punch in</label>
              <input id="ma-in" type="time" className="ma-input" value={form.inTime} onChange={(e) => setField('inTime', e.target.value)} required />
            </div>
            <div className="ma-field">
              <label htmlFor="ma-out">Punch out <span style={{ textTransform: 'none', fontWeight: 600 }}>(leave empty if still working)</span></label>
              <input id="ma-out" type="time" className="ma-input" value={form.outTime} onChange={(e) => setField('outTime', e.target.value)} />
            </div>
            <div className="ma-field">
              <label htmlFor="ma-mode">Work mode</label>
              <select id="ma-mode" className="ma-input" value={form.mode} onChange={(e) => setField('mode', e.target.value)}>
                <option value="office">Office</option>
                <option value="wfh">Work from home</option>
                <option value="field">Field</option>
              </select>
            </div>
            <div className="ma-field">
              <label htmlFor="ma-status">Status</label>
              <select id="ma-status" className="ma-input" value={form.status} onChange={(e) => setField('status', e.target.value)}>
                <option value="approved">Approved</option>
                <option value="pending">Pending approval</option>
              </select>
            </div>
            <div className="ma-field span2">
              <label htmlFor="ma-remark">Reason / note</label>
              <input id="ma-remark" className="ma-input" maxLength={300} placeholder="e.g. Phone not working, approved by manager" value={form.remark} onChange={(e) => setField('remark', e.target.value)} />
            </div>
            <div className="ma-field span2" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 8 }}>
              <label className="ma-check" htmlFor="ma-next"><input id="ma-next" type="checkbox" checked={form.outNextDay} onChange={(e) => setField('outNextDay', e.target.checked)} /> Punch out is on the next day (night shift)</label>
              <label className="ma-check" htmlFor="ma-new"><input id="ma-new" type="checkbox" checked={form.asNewSession} onChange={(e) => setField('asNewSession', e.target.checked)} /> Add as a new session (keep the existing sessions of this day)</label>
            </div>
          </div>

          {form.employeeId && (
            <div className="ma-existing">
              <strong>{selectedEmployee?.name} on {fmtDay(form.date)}:</strong>{' '}
              {daySessions.length === 0 ? <span className="text-muted">no attendance yet</span> : `${daySessions.length} record(s)`}
              {daySessions.map((r) => (
                <div key={r._id} className="row-x">
                  <span className="ma-tag src">Session {r.session || 1}</span>
                  {recordTag(r)}
                  <span>{r.shift?.name || 'Shift'} · {fmtTime(r.punchIn)} – {r.punchOut ? `${fmtTime(r.punchOut)}${dayOf(r.punchOut) !== workingDayOf(r) ? ' (+1)' : ''}` : 'working'}</span>
                  {r.extraShift && <span className="ma-tag extra">Extra shift</span>}
                  {r.isLate && <span className="ma-tag late">Late {r.lateMinutes}m</span>}
                  <button type="button" className="ma-btn sm" onClick={() => openEdit({ ...r, employee: r.employee || selectedEmployee })}>Edit</button>
                </div>
              ))}
            </div>
          )}

          <div className="ma-preview">
            {form.employeeId && form.inTime
              ? `${selectedEmployee?.name || ''} · ${formShift ? formShift.name : 'Shift'} · ${fmtDay(form.date)} · in ${to12h(form.inTime)}${form.outTime ? ` → out ${to12h(form.outTime)}${form.outNextDay ? ' next day' : ''} · ${hm(previewHours)}` : ' · still working'}${form.asNewSession ? ' · new session' : ''}`
              : 'Choose the employee, day and times. Late, early-out and overtime are worked out from the shift automatically.'}
          </div>
          <div className="d-flex flex-wrap gap-2 mt-3">
            <button type="button" className="ma-btn" onClick={fillFromShift} disabled={!formShift}>Use shift timing{formShift ? ` (${to12h(formShift.startTime)}–${to12h(formShift.endTime)})` : ''}</button>
            <button type="submit" className="ma-btn primary" disabled={saving}>{saving ? 'Saving…' : 'Save attendance'}</button>
          </div>
        </form>
      )}

      {tab === 'bulk' && (
        <div className="ma-panel">
          <h4>Mark many employees for one day</h4>
          <div className="sub">For festivals, office closures or a day when the app was down. Present uses each employee's own shift timing and skips anyone who already punched.</div>
          <div className="ma-grid">
            <div className="ma-field">
              <label htmlFor="mb-date">Day</label>
              <input id="mb-date" type="date" className="ma-input" value={bulk.date} onChange={(e) => setBulk({ ...bulk, date: e.target.value })} />
            </div>
            <div className="ma-field">
              <label htmlFor="mb-type">Mark as</label>
              <select id="mb-type" className="ma-input" value={bulk.type} onChange={(e) => setBulk({ ...bulk, type: e.target.value })}>
                <option value="holiday">Holiday (paid day)</option>
                <option value="halfDay">Half day</option>
                <option value="present">Present at shift time</option>
                <option value="clearHoliday">Remove holiday</option>
              </select>
            </div>
            {bulk.type === 'present' && (
              <>
                <div className="ma-field">
                  <label htmlFor="mb-shift">Shift</label>
                  <select id="mb-shift" className="ma-input" value={bulk.shiftId} onChange={(e) => setBulk({ ...bulk, shiftId: e.target.value })}>
                    <option value="">Each employee's own shift</option>
                    {shiftOptions(shifts)}
                  </select>
                </div>
                <div className="ma-field">
                  <label htmlFor="mb-mode">Work mode</label>
                  <select id="mb-mode" className="ma-input" value={bulk.mode} onChange={(e) => setBulk({ ...bulk, mode: e.target.value })}>
                    <option value="office">Office</option>
                    <option value="wfh">Work from home</option>
                <option value="field">Field</option>
                  </select>
                </div>
              </>
            )}
            <div className="ma-field span2">
              <label htmlFor="mb-remark">Note</label>
              <input id="mb-remark" className="ma-input" maxLength={300} placeholder="e.g. Diwali" value={bulk.remark} onChange={(e) => setBulk({ ...bulk, remark: e.target.value })} />
            </div>
            <div className="ma-field span4">
              <label>Employees</label>
              <div className="d-flex flex-wrap gap-3 mb-2">
                <label className="ma-check"><input type="radio" checked={bulk.all} onChange={() => setBulk({ ...bulk, all: true })} /> All active employees ({employees.filter((e) => e.status === 'active' || !e.status).length})</label>
                <label className="ma-check"><input type="radio" checked={!bulk.all} onChange={() => setBulk({ ...bulk, all: false })} /> Selected employees ({bulkPick.length})</label>
              </div>
              {!bulk.all && (
                <>
                  <div className="d-flex gap-2 mb-2">
                    <input className="ma-input" placeholder="Search employee" value={bulkQuery} onChange={(e) => setBulkQuery(e.target.value)} />
                    <button type="button" className="ma-btn sm" onClick={() => setBulkPick([...new Set([...bulkPick, ...bulkList.map((e) => e._id)])])}>Select shown</button>
                    <button type="button" className="ma-btn sm" onClick={() => setBulkPick([])}>Clear</button>
                  </div>
                  <div className="ma-pick">
                    {bulkList.map((e) => (
                      <label key={e._id} className="ma-check py-1">
                        <input type="checkbox" checked={bulkPick.includes(e._id)} onChange={(ev) => setBulkPick(ev.target.checked ? [...bulkPick, e._id] : bulkPick.filter((id) => id !== e._id))} />
                        {e.name} <span className="text-muted small">{e.employeeId} · {e.department || e.position}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="d-flex gap-2 mt-3">
            <button type="button" className="ma-btn primary" onClick={submitBulk} disabled={saving}>{saving ? 'Saving…' : 'Apply'}</button>
          </div>
        </div>
      )}

      {tab === 'missed' && (
        <div className="ma-panel">
          <div className="d-flex flex-wrap justify-content-between gap-2">
            <div>
              <h4>Missed punch-outs</h4>
              <div className="sub">Employees who forgot to punch out. Nothing is punched out automatically: enter the real punch-out time (the shift end is suggested) and save.</div>
            </div>
            <button type="button" className="ma-btn sm" onClick={loadMissed}>Refresh</button>
          </div>
          <div className="table-responsive">
            <table className="ma-table">
              <thead><tr><th>Employee</th><th>Working day</th><th>Shift</th><th>Punch in</th><th>Now</th><th>Set punch out</th><th /></tr></thead>
              <tbody>
                {missedLoading && <tr><td colSpan={7} className="text-center text-muted py-4">Loading…</td></tr>}
                {!missedLoading && missed.length === 0 && <tr><td colSpan={7} className="text-center text-muted py-4">No missed punch-outs. Everyone punched out properly.</td></tr>}
                {!missedLoading && missed.map((r) => (
                  <tr key={r._id}>
                    <td><strong>{r.employee?.name}</strong><div className="small text-muted">{r.employee?.employeeId}</div></td>
                    <td>{fmtDay(r.dateKey)}</td>
                    <td>{r.shift?.name ? `${r.shift.name} (${to12h(r.shift.startTime)}–${to12h(r.shift.endTime)})` : '—'}</td>
                    <td>{fmtTime(r.punchIn)}</td>
                    <td>{r.autoClosed ? <span className="ma-tag auto">Closed by system earlier {fmtTime(r.punchOut)}</span> : <span className="ma-tag late">Still open</span>}</td>
                    <td><input type="datetime-local" className="ma-input" style={{ minWidth: 190 }} value={missedOut[r._id] || ''} onChange={(e) => setMissedOut({ ...missedOut, [r._id]: e.target.value })} /></td>
                    <td className="text-end"><button type="button" className="ma-btn green sm" disabled={saving} onClick={() => fixMissed(r)}>Save &amp; approve</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="ma-panel">
        <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-2">
          <div>
            <h4>Attendance records</h4>
            <div className="sub mb-0">{total} record(s) · every session is a separate row</div>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <select className="ma-input" style={{ width: 230 }} value={filters.employee} onChange={(e) => { setFilters({ ...filters, employee: e.target.value }); setPage(1); }}>
              <option value="">All employees</option>
              {employees.map((e) => <option key={e._id} value={e._id}>{e.name} ({e.employeeId})</option>)}
            </select>
            <input type="date" className="ma-input" style={{ width: 150 }} value={filters.startDate} onChange={(e) => { setFilters({ ...filters, startDate: e.target.value }); setPage(1); }} />
            <input type="date" className="ma-input" style={{ width: 150 }} value={filters.endDate} onChange={(e) => { setFilters({ ...filters, endDate: e.target.value }); setPage(1); }} />
          </div>
        </div>
        <div className="table-responsive">
          <table className="ma-table">
            <thead><tr><th>Employee</th><th>Working day</th><th>Shift</th><th>Punch in</th><th>Punch out</th><th>Hours</th><th>Details</th><th>Status</th><th /></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={9} className="text-center text-muted py-4">Loading…</td></tr>}
              {!loading && records.length === 0 && <tr><td colSpan={9} className="text-center text-muted py-4">No attendance for these filters.</td></tr>}
              {!loading && records.map((r) => (
                <tr key={r._id}>
                  <td><strong>{r.employee?.name || 'Removed employee'}</strong><div className="small text-muted">{r.employee?.employeeId}</div></td>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmtDay(workingDayOf(r))}</td>
                  <td>{r.shift?.name || '—'}</td>
                  <td>{fmtTime(r.punchIn)}</td>
                  <td>{r.punchOut ? `${fmtTime(r.punchOut)}${dayOf(r.punchOut) !== workingDayOf(r) ? ' (+1)' : ''}` : r.punchIn ? <span className="ma-tag late">Working</span> : '—'}</td>
                  <td>{r.punchIn ? hm(hoursBetween(r.punchIn, r.punchOut || new Date())) : '—'}</td>
                  <td>
                    <div className="d-flex flex-wrap gap-1">
                      {recordTag(r)}
                      {(r.session || 1) > 1 && <span className="ma-tag src">Session {r.session}</span>}
                      {r.extraShift && <span className="ma-tag extra">Extra shift</span>}
                      {r.isLate && <span className="ma-tag late">Late {r.lateMinutes}m</span>}
                      {r.autoClosed && <span className="ma-tag auto">Auto-closed</span>}
                      {r.halfDay && r.punchIn && <span className="ma-tag half">Half day</span>}
                      <span className="ma-tag src">{SOURCE_LABEL[r.source] || 'App'}</span>
                    </div>
                    {r.adminRemark && <div className="small text-muted mt-1">{r.adminRemark}</div>}
                  </td>
                  <td><span className={`ma-tag ${r.status}`}>{r.status}</span></td>
                  <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                    <button type="button" className="ma-btn sm me-1" onClick={() => openEdit(r)}>Edit</button>
                    <button type="button" className="ma-btn danger sm" onClick={() => remove(r)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ma-foot">
          <span>Page {page} of {pages}</span>
          <div className="d-flex gap-2">
            <button type="button" className="ma-btn sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <button type="button" className="ma-btn sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>
      </div>

      <Modal show={Boolean(editing)} onHide={() => !saving && setEditing(null)} centered size="lg">
        <form onSubmit={saveEdit}>
          <Modal.Header closeButton>
            <Modal.Title style={{ fontSize: '1.05rem' }}>Edit attendance · {editing?.employee?.name} · {editing ? fmtDay(workingDayOf(editing)) : ''}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="ma-grid">
              <div className="ma-field span2">
                <label htmlFor="me-in">Punch in (date and time)</label>
                <input id="me-in" type="datetime-local" className="ma-input" value={editForm.punchIn || ''} onChange={(e) => setEditForm({ ...editForm, punchIn: e.target.value })} />
              </div>
              <div className="ma-field span2">
                <label htmlFor="me-out">Punch out (date and time)</label>
                <input id="me-out" type="datetime-local" className="ma-input" value={editForm.punchOut || ''} onChange={(e) => setEditForm({ ...editForm, punchOut: e.target.value })} />
              </div>
              <div className="ma-field span2">
                <label htmlFor="me-shift">Shift</label>
                <select id="me-shift" className="ma-input" value={editForm.shiftId || ''} onChange={(e) => setEditForm({ ...editForm, shiftId: e.target.value })}>
                  <option value="">Keep current ({editing?.shift?.name || 'none'})</option>
                  {shiftOptions(shifts)}
                </select>
              </div>
              <div className="ma-field">
                <label htmlFor="me-mode">Work mode</label>
                <select id="me-mode" className="ma-input" value={editForm.mode} onChange={(e) => setEditForm({ ...editForm, mode: e.target.value })}>
                  <option value="office">Office</option>
                  <option value="wfh">Work from home</option>
                <option value="field">Field</option>
                </select>
              </div>
              <div className="ma-field">
                <label htmlFor="me-status">Status</label>
                <select id="me-status" className="ma-input" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="ma-field span4">
                <label htmlFor="me-remark">Note</label>
                <input id="me-remark" className="ma-input" maxLength={300} value={editForm.remark || ''} onChange={(e) => setEditForm({ ...editForm, remark: e.target.value })} />
              </div>
              <div className="ma-field span4 d-flex flex-wrap gap-4">
                <label className="ma-check"><input type="checkbox" checked={Boolean(editForm.holiday)} onChange={(e) => setEditForm({ ...editForm, holiday: e.target.checked })} /> Holiday</label>
                <label className="ma-check"><input type="checkbox" checked={Boolean(editForm.halfDay)} onChange={(e) => setEditForm({ ...editForm, halfDay: e.target.checked })} /> Half day</label>
              </div>
            </div>
            <div className="small text-muted mt-2">For a night shift set the punch-out date to the next day. Late, early-out and overtime are worked out again when you save.</div>
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="ma-btn" onClick={() => setEditing(null)} disabled={saving}>Cancel</button>
            <button type="submit" className="ma-btn primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
};

export default ManualAttendance;
