import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import api from '../utils/axios';

const STATUS_TABS = [
  ['pending', 'Pending'],
  ['approved', 'Approved'],
  ['rejected', 'Rejected'],
];

const FLAGS = [
  ['', 'All'],
  ['open', 'Still working'],
  ['late', 'Late'],
  ['autoClosed', 'Auto-closed'],
  ['wfh', 'Work from home'],
  ['outside', 'Outside area'],
];

const formatTime = (value) => (value
  ? new Date(value).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })
  : '—');
const formatDate = (value) => (value
  ? new Date(value).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' })
  : '—');
const formatHours = (hours) => {
  const minutes = Math.max(0, Math.round((Number(hours) || 0) * 60));
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
};
const formatDistance = (meters) => {
  const value = Number(meters);
  if (!Number.isFinite(value)) return '';
  return value >= 1000 ? `${(value / 1000).toFixed(1)} km` : `${Math.round(value)} m`;
};
const mapsUrl = (point) => `https://www.google.com/maps?q=${point.latitude},${point.longitude}`;
const initials = (name) => String(name || 'E').trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();

const AttendanceApprovals = () => {
  const [status, setStatus] = useState('pending');
  const [flag, setFlag] = useState('');
  const [date, setDate] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState('');
  const [rejecting, setRejecting] = useState(null); // { ids: [], label }
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance/review-queue', { params: { status, flag, date, search, page, limit } });
      setRecords(Array.isArray(res.data?.data) ? res.data.data : []);
      setSummary(res.data?.summary || {});
      setPagination(res.data?.pagination || { total: 0, totalPages: 1 });
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load attendance approvals');
    } finally {
      setLoading(false);
    }
  }, [status, flag, date, search, page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setSelected([]);
  }, [status, flag, date, search, page, limit]);

  // Search after the admin stops typing.
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const allSelected = records.length > 0 && selected.length === records.length;
  const toggleAll = () => setSelected(allSelected ? [] : records.map((r) => r._id));
  const toggleOne = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const review = async (ids, action, rejectReason = '') => {
    if (!ids.length) return;
    setBusy(`${action}:${ids.length === 1 ? ids[0] : 'bulk'}`);
    try {
      const res = ids.length === 1
        ? await api.put(`/attendance/admin/${action}/${ids[0]}`, { reason: rejectReason })
        : await api.put('/attendance/admin/review-bulk', { ids, action, reason: rejectReason });
      setNotice(res.data?.message || (action === 'approve' ? 'Attendance approved' : 'Attendance rejected'));
      setSelected([]);
      window.dispatchEvent(new Event('attendanceUpdated'));
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed, please try again');
    } finally {
      setBusy('');
    }
  };

  const openReject = (ids, label) => {
    setReason('');
    setRejecting({ ids, label });
  };

  const confirmReject = async () => {
    const target = rejecting;
    setRejecting(null);
    await review(target.ids, 'reject', reason.trim());
  };

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  const cards = useMemo(() => [
    ['Pending approval', summary.pending ?? 0, '#d97706', () => { setStatus('pending'); setFlag(''); setDate(''); setPage(1); }],
    ['Pending today', summary.pendingToday ?? 0, '#0a1f8f', () => { setStatus('pending'); setFlag(''); setDate(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })); setPage(1); }],
    ['Still working', summary.pendingOpen ?? 0, '#2563eb', () => { setStatus('pending'); setFlag('open'); setPage(1); }],
    ['Late punch in', summary.pendingLate ?? 0, '#dc2626', () => { setStatus('pending'); setFlag('late'); setPage(1); }],
    ['Outside area', summary.pendingOutside ?? 0, '#b91c1c', () => { setStatus('pending'); setFlag('outside'); setPage(1); }],
    ['Approved today', summary.approvedToday ?? 0, '#16a34a', () => { setStatus('approved'); setFlag(''); setDate(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })); setPage(1); }],
  ], [summary]);

  return (
    <div className="aa-page">
      <style>{`
        .aa-page { display: grid; gap: 14px; color: #0f172a; }
        .aa-hero { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; padding: 18px 20px; border-radius: 18px; color: #fff; background: linear-gradient(135deg, #06135c 0%, #0a1f8f 60%, #2563eb 100%); box-shadow: 0 16px 36px rgba(10,31,143,.2); }
        .aa-hero h3 { margin: 2px 0 4px; font-weight: 800; font-size: 1.4rem; }
        .aa-hero p { margin: 0; color: rgba(255,255,255,.8); font-size: .88rem; }
        .aa-eyebrow { font-size: .72rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #bfdbfe; }
        .aa-cards { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; }
        .aa-card { text-align: left; background: #fff; border: 1px solid #e6e9f2; border-left: 4px solid var(--c); border-radius: 14px; padding: 12px 14px; box-shadow: 0 6px 18px rgba(15,23,42,.05); cursor: pointer; }
        .aa-card b { display: block; font-size: 1.6rem; font-weight: 800; color: var(--c); line-height: 1.1; }
        .aa-card span { font-size: .74rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: .05em; }
        .aa-panel { background: #fff; border: 1px solid #e6e9f2; border-radius: 16px; box-shadow: 0 6px 18px rgba(15,23,42,.05); overflow: hidden; }
        .aa-toolbar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid #f0f2f7; }
        .aa-tabs { display: inline-flex; background: #f1f5f9; border-radius: 12px; padding: 3px; }
        .aa-tabs button { border: none; background: transparent; padding: 7px 14px; border-radius: 9px; font-weight: 700; font-size: .84rem; color: #475569; }
        .aa-tabs button.active { background: #fff; color: #0a1f8f; box-shadow: 0 2px 8px rgba(15,23,42,.1); }
        .aa-btn { border: 1px solid #dbe3ef; background: #fff; color: #0f172a; border-radius: 10px; padding: 7px 12px; font-size: .82rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; }
        .aa-btn:disabled { opacity: .55; cursor: not-allowed; }
        .aa-btn.sm { padding: 4px 10px; font-size: .76rem; }
        .aa-btn.approve { background: #16a34a; border-color: #16a34a; color: #fff; }
        .aa-btn.reject { background: #fff; border-color: #fecaca; color: #dc2626; }
        .aa-btn.chip.active { background: #0a1f8f; border-color: #0a1f8f; color: #fff; }
        .aa-input { border: 1px solid #dbe3ef; border-radius: 10px; padding: 7px 11px; font-size: .85rem; background: #fff; }
        .aa-input:focus { outline: none; border-color: #0a1f8f; box-shadow: 0 0 0 3px rgba(10,31,143,.12); }
        .aa-bulk { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between; padding: 10px 14px; background: #eef2ff; border-bottom: 1px solid #c7d2fe; font-weight: 700; font-size: .86rem; color: #0a1f8f; }
        .aa-table { width: 100%; border-collapse: collapse; font-size: .84rem; }
        .aa-table th { text-align: left; padding: 10px 12px; font-size: .7rem; text-transform: uppercase; letter-spacing: .05em; color: #64748b; background: #f8fafc; border-bottom: 1px solid #e6e9f2; white-space: nowrap; }
        .aa-table td { padding: 10px 12px; border-bottom: 1px solid #f0f2f7; vertical-align: middle; }
        .aa-table tr.is-selected td { background: #f5f7ff; }
        .aa-emp { display: flex; gap: 10px; align-items: center; min-width: 190px; }
        .aa-avatar { width: 36px; height: 36px; border-radius: 50%; background: #0a1f8f; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: .76rem; overflow: hidden; flex: 0 0 auto; }
        .aa-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .aa-tag { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 999px; font-size: .7rem; font-weight: 800; white-space: nowrap; }
        .aa-tag.late { background: #fee2e2; color: #b91c1c; }
        .aa-tag.open { background: #dbeafe; color: #1d4ed8; }
        .aa-tag.auto { background: #ede9fe; color: #6d28d9; }
        .aa-tag.wfh { background: #fef3c7; color: #b45309; }
        .aa-tag.office { background: #dcfce7; color: #15803d; }
        .aa-tag.pending { background: #fef3c7; color: #b45309; }
        .aa-tag.approved { background: #dcfce7; color: #15803d; }
        .aa-tag.rejected { background: #fee2e2; color: #b91c1c; }
        .aa-loc { max-width: 240px; font-size: .78rem; }
        .aa-loc a { font-weight: 700; }
        .aa-foot { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between; padding: 12px 14px; font-size: .84rem; color: #64748b; }
        .aa-empty { padding: 40px 16px; text-align: center; color: #64748b; }
        @media (max-width: 1200px) { .aa-cards { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width: 640px) { .aa-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      `}</style>

      <section className="aa-hero">
        <div>
          <div className="aa-eyebrow">Attendance</div>
          <h3>Attendance Approvals</h3>
          <p>Review every punch with its time, location and hours, then approve or reject in one click.</p>
        </div>
        {status === 'pending' && records.length > 0 && (
          <button
            type="button"
            className="aa-btn approve"
            disabled={Boolean(busy)}
            onClick={() => {
              if (window.confirm(`Approve all ${records.length} records shown on this page?`)) review(records.map((r) => r._id), 'approve');
            }}
          >
            Approve all {records.length} on this page
          </button>
        )}
      </section>

      <section className="aa-cards">
        {cards.map(([label, value, color, onClick]) => (
          <button key={label} type="button" className="aa-card" style={{ '--c': color }} onClick={onClick}>
            <b>{value}</b>
            <span>{label}</span>
          </button>
        ))}
      </section>

      {error && <div className="alert alert-danger mb-0" onClick={() => setError('')}>{error}</div>}
      {notice && <div className="alert alert-success mb-0">{notice}</div>}

      <section className="aa-panel">
        <div className="aa-toolbar">
          <div className="aa-tabs">
            {STATUS_TABS.map(([key, label]) => (
              <button key={key} type="button" className={status === key ? 'active' : ''} onClick={() => { setStatus(key); setPage(1); }}>
                {label}{key === 'pending' && summary.pending ? ` (${summary.pending})` : ''}
              </button>
            ))}
          </div>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <input className="aa-input" placeholder="Search name or Employee ID" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} style={{ minWidth: 220 }} />
            <input className="aa-input" type="date" value={date} onChange={(e) => { setDate(e.target.value); setPage(1); }} />
            {date && <button type="button" className="aa-btn sm" onClick={() => { setDate(''); setPage(1); }}>All dates</button>}
          </div>
        </div>
        <div className="aa-toolbar" style={{ paddingTop: 8, paddingBottom: 8 }}>
          <div className="d-flex flex-wrap gap-1">
            {FLAGS.map(([key, label]) => (
              <button key={key || 'all'} type="button" className={`aa-btn sm chip ${flag === key ? 'active' : ''}`} onClick={() => { setFlag(key); setPage(1); }}>{label}</button>
            ))}
          </div>
          <span className="small text-muted">{pagination.total} record(s)</span>
        </div>

        {selected.length > 0 && (
          <div className="aa-bulk">
            <span>{selected.length} selected</span>
            <div className="d-flex gap-2">
              {status !== 'approved' && <button type="button" className="aa-btn approve sm" disabled={Boolean(busy)} onClick={() => review(selected, 'approve')}>Approve selected</button>}
              {status !== 'rejected' && <button type="button" className="aa-btn reject sm" disabled={Boolean(busy)} onClick={() => openReject(selected, `${selected.length} records`)}>Reject selected</button>}
              <button type="button" className="aa-btn sm" onClick={() => setSelected([])}>Clear</button>
            </div>
          </div>
        )}

        <div className="table-responsive">
          <table className="aa-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" /></th>
                <th>Employee</th>
                <th>Date</th>
                <th>Punch in</th>
                <th>Punch out</th>
                <th>Worked</th>
                <th>Shift</th>
                <th>Punch location</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={10} className="aa-empty">Loading…</td></tr>
              )}
              {!loading && records.length === 0 && (
                <tr><td colSpan={10} className="aa-empty">{status === 'pending' ? 'Nothing waiting for approval. All caught up!' : 'No records for this filter.'}</td></tr>
              )}
              {!loading && records.map((record) => {
                const employee = record.employee || {};
                const inPoint = record.punchInLocation && Number.isFinite(Number(record.punchInLocation.latitude)) ? record.punchInLocation : null;
                const outPoint = record.punchOutLocation && Number.isFinite(Number(record.punchOutLocation.latitude)) ? record.punchOutLocation : null;
                const isSelected = selected.includes(record._id);
                return (
                  <tr key={record._id} className={isSelected ? 'is-selected' : ''}>
                    <td><input type="checkbox" checked={isSelected} onChange={() => toggleOne(record._id)} aria-label={`Select ${employee.name || 'record'}`} /></td>
                    <td>
                      <div className="aa-emp">
                        <div className="aa-avatar">{employee.profilePhoto ? <img src={employee.profilePhoto} alt="" /> : initials(employee.name)}</div>
                        <div>
                          <strong>{employee.name || 'Removed employee'}</strong>
                          <div className="small text-muted">{employee.employeeId || '—'}{employee.position ? ` · ${employee.position}` : ''}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(record.punchIn || record.date)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <strong>{formatTime(record.punchIn)}</strong>
                      {record.isLate && <div><span className="aa-tag late">Late {record.lateMinutes ? `${record.lateMinutes}m` : ''}</span></div>}
                      {record.extraShift && <div><span className="aa-tag auto">Extra shift</span></div>}
                      {(record.outsideIn || record.outsideOut) && <div><span className="aa-tag late" title={record.outsideArea}>Outside area ({record.outsideIn ? `in ${record.outsideInMeters} m` : ''}{record.outsideIn && record.outsideOut ? ', ' : ''}{record.outsideOut ? `out ${record.outsideOutMeters} m` : ''})</span></div>}
                      {(record.session || 1) > 1 && !record.extraShift && <div><span className="aa-tag office">Session {record.session}</span></div>}
                      {(record.source === 'manual' || record.source === 'bulk') && <div><span className="aa-tag wfh">Entered by admin</span></div>}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {record.punchOut ? <strong>{formatTime(record.punchOut)}</strong> : <span className="aa-tag open">Still working</span>}
                      {record.autoClosed && <div><span className="aa-tag auto">Auto-closed</span></div>}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatHours(record.hoursWorked)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{record.shift?.name || '—'}</td>
                    <td className="aa-loc">
                      <span className={`aa-tag ${record.mode === 'wfh' ? 'wfh' : 'office'}`}>{record.mode === 'wfh' ? 'Work from home' : record.mode === 'field' ? 'Field' : 'Office'}</span>
                      <div className="text-muted mt-1">{record.locationAddress || 'Address not available'}</div>
                      <div className="d-flex gap-2 mt-1">
                        {inPoint && <a href={mapsUrl(inPoint)} target="_blank" rel="noopener noreferrer">In on map</a>}
                        {outPoint && <a href={mapsUrl(outPoint)} target="_blank" rel="noopener noreferrer">Out on map</a>}
                        {record.geofence?.distanceMeters !== undefined && record.geofence?.distanceMeters !== null && (
                          <span className="text-muted">{formatDistance(record.geofence.distanceMeters)} from {record.geofence.label || 'office'}</span>
                        )}
                      </div>
                    </td>
                    <td><span className={`aa-tag ${record.status}`}>{record.status}</span></td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {record.status !== 'approved' && (
                        <button type="button" className="aa-btn approve sm me-1" disabled={Boolean(busy)} onClick={() => review([record._id], 'approve')}>
                          {busy === `approve:${record._id}` ? '…' : 'Approve'}
                        </button>
                      )}
                      {record.status !== 'rejected' && (
                        <button type="button" className="aa-btn reject sm" disabled={Boolean(busy)} onClick={() => openReject([record._id], employee.name || 'this record')}>
                          {busy === `reject:${record._id}` ? '…' : 'Reject'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="aa-foot">
          <div className="d-flex align-items-center gap-2">
            <span>Rows</span>
            <select className="aa-input" value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
              {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button type="button" className="aa-btn sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <span>Page {page} of {pagination.totalPages || 1}</span>
            <button type="button" className="aa-btn sm" disabled={page >= (pagination.totalPages || 1)} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>
      </section>

      <Modal show={Boolean(rejecting)} onHide={() => setRejecting(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1.05rem' }}>Reject attendance · {rejecting?.label}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <label className="form-label small fw-bold" htmlFor="aa-reason">Reason (sent to the employee)</label>
          <textarea id="aa-reason" className="form-control" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Punched in from outside the office" />
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="aa-btn" onClick={() => setRejecting(null)}>Cancel</button>
          <button type="button" className="aa-btn approve" style={{ background: '#dc2626', borderColor: '#dc2626' }} onClick={confirmReject}>Reject</button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AttendanceApprovals;
