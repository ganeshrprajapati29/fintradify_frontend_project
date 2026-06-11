import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Pagination, Spinner, Table } from 'react-bootstrap';
import axios from '../utils/axios';
import moment from 'moment';

const getRows = (payload) => payload?.data || payload?.attendances || (Array.isArray(payload) ? payload : []);

const getPagination = (payload, fallbackPage, fallbackLimit) => {
  const pagination = payload?.pagination || {};
  const total = Number(pagination.total || payload?.total || getRows(payload).length || 0);
  const limit = Number(pagination.limit || fallbackLimit || 10);
  return {
    page: Number(pagination.page || payload?.currentPage || fallbackPage || 1),
    limit,
    total,
    totalPages: Math.max(Number(pagination.totalPages || payload?.totalPages || Math.ceil(total / limit) || 1), 1),
  };
};

const formatDateTime = (value) => (value ? moment(value).format('DD MMM YYYY, hh:mm A') : 'N/A');

const getCurrentHours = (attendance) => {
  if (!attendance?.punchIn) return 0;
  const end = attendance.timerStatus === 'paused' && attendance.pausedAt ? new Date(attendance.pausedAt) : new Date();
  const total = end - new Date(attendance.punchIn) - (attendance.totalPausedDuration || 0);
  return Math.max(total / 36e5, 0);
};

const ActiveAttendance = () => {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [tick, setTick] = useState(0);

  const fetchAttendances = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/attendance/active', { params: { page, limit } });
      const rows = [...getRows(response.data)].sort((a, b) => new Date(b.punchIn || 0) - new Date(a.punchIn || 0));
      const meta = getPagination(response.data, page, limit);
      setAttendances(rows);
      setPage(meta.page);
      setLimit(meta.limit);
      setTotal(meta.total);
      setTotalPages(meta.totalPages);
      setError('');
    } catch (err) {
      console.error('Error fetching active attendances:', err);
      setError(err.response?.data?.message || 'Error fetching active attendances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendances();
  }, [page, limit]);

  useEffect(() => {
    const interval = setInterval(() => setTick((value) => value + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const handlePause = async (id) => {
    setActionId(id);
    setSuccess('');
    setError('');
    try {
      await axios.put(`/attendance/admin/pause/${id}`);
      setSuccess('Timer paused successfully.');
      fetchAttendances();
      window.dispatchEvent(new CustomEvent('attendanceUpdated'));
    } catch (err) {
      console.error('Error pausing timer:', err);
      setError(err.response?.data?.message || 'Error pausing timer');
    } finally {
      setActionId('');
    }
  };

  const handleResume = async (id) => {
    setActionId(id);
    setSuccess('');
    setError('');
    try {
      await axios.put(`/attendance/admin/resume/${id}`);
      setSuccess('Timer resumed successfully.');
      fetchAttendances();
      window.dispatchEvent(new CustomEvent('attendanceUpdated'));
    } catch (err) {
      console.error('Error resuming timer:', err);
      setError(err.response?.data?.message || 'Error resuming timer');
    } finally {
      setActionId('');
    }
  };

  const filteredAttendances = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return attendances.filter((attendance) => {
      const status = attendance.timerStatus || 'active';
      const matchesFilter = filter === 'all' || status === filter;
      const matchesQuery = !normalizedQuery || [
        attendance.employee?.employeeId,
        attendance.employee?.name,
        attendance.employee?.position,
        attendance.employee?.department,
        attendance.locationAddress,
      ].some((value) => String(value || '').toLowerCase().includes(normalizedQuery));
      return matchesFilter && matchesQuery;
    });
  }, [attendances, filter, query, tick]);

  const summary = useMemo(() => {
    const active = attendances.filter((attendance) => (attendance.timerStatus || 'active') === 'active').length;
    const paused = attendances.filter((attendance) => attendance.timerStatus === 'paused').length;
    const hours = attendances.reduce((sum, attendance) => sum + getCurrentHours(attendance), 0);
    return { active, paused, hours };
  }, [attendances, tick]);

  const renderPagination = () => {
    const pages = [];
    const start = Math.max(1, Math.min(page - 2, Math.max(totalPages - 4, 1)));
    const end = Math.min(totalPages, start + 4);

    for (let item = start; item <= end; item += 1) {
      pages.push(
        <Pagination.Item key={item} active={item === page} onClick={() => setPage(item)} disabled={loading}>
          {item}
        </Pagination.Item>
      );
    }

    return (
      <Pagination className="active-pagination">
        <Pagination.First disabled={page === 1 || loading} onClick={() => setPage(1)} />
        <Pagination.Prev disabled={page === 1 || loading} onClick={() => setPage(page - 1)} />
        {start > 1 && <Pagination.Ellipsis disabled />}
        {pages}
        {end < totalPages && <Pagination.Ellipsis disabled />}
        <Pagination.Next disabled={page >= totalPages || loading} onClick={() => setPage(page + 1)} />
        <Pagination.Last disabled={page >= totalPages || loading} onClick={() => setPage(totalPages)} />
      </Pagination>
    );
  };

  return (
    <div className="active-page">
      <style>
        {`
          .active-page {
            color: #0f172a;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }
          .active-hero,
          .active-panel,
          .active-kpi-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 0.85rem;
            box-shadow: 0 12px 30px rgba(15, 23, 42, 0.07);
          }
          .active-hero {
            background:
              radial-gradient(circle at 92% 8%, rgba(14, 165, 233, 0.14), transparent 30%),
              linear-gradient(135deg, #ffffff 0%, #f8fbff 55%, #eef7ff 100%);
            border-color: #dbeafe;
            padding: 1.35rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
          }
          .active-eyebrow,
          .active-kpi-label {
            margin: 0;
            color: #64748b;
            font-size: 0.76rem;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .active-title {
            margin: 0.2rem 0 0;
            color: #0f172a;
            font-size: clamp(1.45rem, 3vw, 2.1rem);
            font-weight: 850;
            line-height: 1.15;
          }
          .active-subtitle {
            margin: 0.45rem 0 0;
            color: #64748b;
            font-size: 0.95rem;
          }
          .active-kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 1rem;
          }
          .active-kpi-card {
            padding: 1rem;
            position: relative;
            overflow: hidden;
          }
          .active-kpi-card::after {
            content: '';
            position: absolute;
            right: -24px;
            top: -24px;
            width: 70px;
            height: 70px;
            border-radius: 50%;
            background: var(--accent, #dbeafe);
            opacity: 0.55;
          }
          .active-kpi-value {
            margin: 0.35rem 0 0.15rem;
            color: #0f172a;
            font-size: 1.8rem;
            font-weight: 850;
          }
          .active-kpi-note {
            margin: 0;
            color: #64748b;
            font-size: 0.86rem;
          }
          .active-action,
          .active-filter-btn {
            border: 1px solid #bfdbfe;
            background: #ffffff;
            color: #1d4ed8;
            border-radius: 0.65rem;
            padding: 0.62rem 0.85rem;
            font-weight: 800;
            transition: all 0.2s ease;
          }
          .active-action:hover,
          .active-filter-btn:hover,
          .active-filter-btn.active {
            background: #eff6ff;
            border-color: #93c5fd;
            transform: translateY(-1px);
          }
          .active-panel {
            padding: 1.1rem;
          }
          .active-toolbar {
            display: grid;
            grid-template-columns: minmax(220px, 1fr) auto auto;
            gap: 0.75rem;
            align-items: center;
            margin-bottom: 1rem;
          }
          .active-search,
          .active-select {
            width: 100%;
            min-height: 44px;
            border: 1px solid #cbd5e1;
            border-radius: 0.75rem;
            background: #ffffff;
            color: #0f172a;
            padding: 0.65rem 0.85rem;
            font-weight: 700;
          }
          .active-search:focus,
          .active-select:focus {
            outline: none;
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
          }
          .active-filter-group {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            justify-content: flex-end;
          }
          .active-table {
            margin: 0;
            border: 1px solid #e2e8f0;
            border-radius: 0.75rem;
            overflow: hidden;
            background: #ffffff;
          }
          .active-table thead {
            background: #f8fafc;
            color: #475569;
          }
          .active-table thead th {
            border-bottom: 1px solid #e2e8f0;
            font-size: 0.76rem;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            white-space: nowrap;
          }
          .active-table th,
          .active-table td {
            padding: 0.95rem;
            border-color: #e2e8f0;
            color: #334155;
            vertical-align: middle;
            white-space: nowrap;
          }
          .active-table tbody tr:hover {
            background: #f8fafc;
          }
          .active-person {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            min-width: 220px;
          }
          .active-avatar {
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background: linear-gradient(135deg, #2563eb, #14b8a6);
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            overflow: hidden;
            flex: 0 0 auto;
          }
          .active-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .active-person strong,
          .active-person span {
            display: block;
          }
          .active-person strong {
            color: #0f172a;
            font-weight: 850;
          }
          .active-person span {
            color: #64748b;
            font-size: 0.82rem;
            margin-top: 0.1rem;
          }
          .active-status {
            border-radius: 999px;
            padding: 0.35rem 0.65rem;
            font-size: 0.75rem;
            font-weight: 850;
            text-transform: capitalize;
          }
          .active-status.active {
            color: #047857;
            background: #d1fae5;
          }
          .active-status.paused {
            color: #92400e;
            background: #fef3c7;
          }
          .active-status.pending {
            color: #1d4ed8;
            background: #dbeafe;
          }
          .active-empty {
            min-height: 160px;
            border: 1px dashed #cbd5e1;
            border-radius: 0.75rem;
            background: #f8fafc;
            color: #64748b;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 1rem;
            font-weight: 700;
          }
          .active-pagination-wrap {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            margin-top: 1rem;
            flex-wrap: wrap;
          }
          .active-pagination {
            margin: 0;
          }
          .active-pagination .page-link {
            color: #1d4ed8;
            border-color: #dbe3ef;
            font-weight: 800;
          }
          .active-pagination .active .page-link {
            background: #1d4ed8;
            border-color: #1d4ed8;
          }
          @media (max-width: 1200px) {
            .active-kpi-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .active-toolbar {
              grid-template-columns: 1fr;
            }
            .active-filter-group {
              justify-content: flex-start;
            }
          }
          @media (max-width: 768px) {
            .active-hero {
              flex-direction: column;
              align-items: flex-start;
            }
            .active-kpi-grid {
              grid-template-columns: 1fr;
            }
            .active-action,
            .active-filter-btn {
              width: 100%;
            }
            .active-pagination-wrap {
              align-items: stretch;
              flex-direction: column;
            }
          }
        `}
      </style>

      <section className="active-hero">
        <div>
          <p className="active-eyebrow">Live attendance control</p>
          <h3 className="active-title">Active Attendances</h3>
          <p className="active-subtitle">Monitor employees currently punched in, pause or resume running timers, and review live hours.</p>
        </div>
        <Button type="button" className="active-action" onClick={fetchAttendances} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </section>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <section className="active-kpi-grid">
        <div className="active-kpi-card" style={{ '--accent': '#bfdbfe' }}>
          <p className="active-kpi-label">Active Records</p>
          <h4 className="active-kpi-value">{total}</h4>
          <p className="active-kpi-note">Punched in, not punched out</p>
        </div>
        <div className="active-kpi-card" style={{ '--accent': '#bbf7d0' }}>
          <p className="active-kpi-label">Running</p>
          <h4 className="active-kpi-value">{summary.active}</h4>
          <p className="active-kpi-note">Timers currently active</p>
        </div>
        <div className="active-kpi-card" style={{ '--accent': '#fed7aa' }}>
          <p className="active-kpi-label">Paused</p>
          <h4 className="active-kpi-value">{summary.paused}</h4>
          <p className="active-kpi-note">Waiting to resume</p>
        </div>
        <div className="active-kpi-card" style={{ '--accent': '#fecdd3' }}>
          <p className="active-kpi-label">Live Hours</p>
          <h4 className="active-kpi-value">{summary.hours.toFixed(1)}</h4>
          <p className="active-kpi-note">Visible page total</p>
        </div>
      </section>

      <section className="active-panel">
        <div className="active-toolbar">
          <input
            className="active-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search employee, ID, department, or location"
          />
          <div className="active-filter-group">
            {[
              ['all', 'All'],
              ['active', 'Running'],
              ['paused', 'Paused'],
            ].map(([key, label]) => (
              <button key={key} type="button" className={`active-filter-btn ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}>
                {label}
              </button>
            ))}
          </div>
          <select className="active-select" value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }}>
            {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size} rows</option>)}
          </select>
        </div>

        {loading ? (
          <div className="active-empty"><Spinner animation="border" size="sm" className="me-2" /> Loading active attendances...</div>
        ) : filteredAttendances.length ? (
          <div className="table-responsive">
            <Table className="active-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Punch In</th>
                  <th>Live Hours</th>
                  <th>Paused Duration</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendances.map((attendance) => {
                  const status = attendance.timerStatus || 'active';
                  const pausedHours = ((attendance.totalPausedDuration || 0) / 36e5).toFixed(2);
                  return (
                    <tr key={attendance._id}>
                      <td>
                        <div className="active-person">
                          <div className="active-avatar">
                            {attendance.employee?.profilePhoto ? (
                              <img src={attendance.employee.profilePhoto} alt={attendance.employee?.name || 'Employee'} />
                            ) : (
                              (attendance.employee?.name || 'E')[0].toUpperCase()
                            )}
                          </div>
                          <div>
                            <strong>{attendance.employee?.name || 'N/A'}</strong>
                            <span>{attendance.employee?.employeeId || 'N/A'} | {attendance.employee?.position || attendance.employee?.department || 'Team member'}</span>
                          </div>
                        </div>
                      </td>
                      <td>{formatDateTime(attendance.punchIn)}</td>
                      <td>{getCurrentHours(attendance).toFixed(2)} hrs</td>
                      <td>{pausedHours} hrs</td>
                      <td>{attendance.locationAddress || 'N/A'}</td>
                      <td><span className={`active-status ${status}`}>{status}</span></td>
                      <td>
                        {status === 'active' ? (
                          <Button type="button" size="sm" className="active-filter-btn" onClick={() => handlePause(attendance._id)} disabled={actionId === attendance._id}>
                            {actionId === attendance._id ? 'Pausing...' : 'Pause'}
                          </Button>
                        ) : (
                          <Button type="button" size="sm" className="active-action" onClick={() => handleResume(attendance._id)} disabled={actionId === attendance._id}>
                            {actionId === attendance._id ? 'Resuming...' : 'Resume'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        ) : (
          <div className="active-empty">No active attendance records match this view.</div>
        )}

        <div className="active-pagination-wrap">
          <span className="text-muted">
            Page {page} of {totalPages} | Showing {total ? ((page - 1) * limit) + 1 : 0}-{Math.min(page * limit, total)} of {total.toLocaleString('en-IN')}
          </span>
          {renderPagination()}
        </div>
      </section>
    </div>
  );
};

export default ActiveAttendance;
