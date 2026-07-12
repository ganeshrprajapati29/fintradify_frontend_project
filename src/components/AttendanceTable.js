import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Col, Form, Pagination, Row, Spinner, Table } from 'react-bootstrap';
import moment from 'moment';
import api from '../utils/axios';
import 'bootstrap/dist/css/bootstrap.min.css';

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

const formatTime = (value) => value ? moment(value).format('hh:mm A') : '-';
const formatDate = (value) => value ? moment(value).format('DD MMM YYYY') : '-';

const getLatestTimestamp = (attendance) => {
  const value = attendance?.date || attendance?.punchIn || attendance?.createdAt || attendance?._id;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const getHoursWorked = (attendance) => {
  if (!attendance.punchIn || !attendance.punchOut) return '0.00';
  const total = new Date(attendance.punchOut) - new Date(attendance.punchIn) - (attendance.totalPausedDuration || 0);
  return Math.max(total / 36e5, 0).toFixed(2);
};

const getStatusMeta = (status) => {
  const normalized = String(status || 'pending').toLowerCase();
  if (normalized === 'approved') return { label: 'Approved', variant: 'success', className: 'approved' };
  if (normalized === 'rejected') return { label: 'Rejected', variant: 'danger', className: 'rejected' };
  return { label: 'Pending', variant: 'warning', className: 'pending' };
};

const AttendanceTable = ({ isEmployee }) => {
  const [attendances, setAttendances] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [punchStatus, setPunchStatus] = useState({ canPunchIn: true, canPunchOut: false });

  const endpoint = isEmployee ? '/attendance/my-attendance' : '/attendance';

  const filters = useMemo(() => {
    const params = { page, limit };
    if (startDate && endDate) {
      params.startDate = startDate;
      params.endDate = endDate;
    }
    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }
    return params;
  }, [page, limit, startDate, endDate, statusFilter]);

  const fetchPunchStatus = async () => {
    if (!isEmployee) return;
    const today = moment().format('YYYY-MM-DD');
    const response = await api.get('/attendance/my-attendance', {
      params: { startDate: today, endDate: today, page: 1, limit: 1 },
    });
    const todayAttendance = getRows(response.data)[0];
    setPunchStatus({
      canPunchIn: !todayAttendance || !todayAttendance.punchIn,
      canPunchOut: !!todayAttendance?.punchIn && !todayAttendance?.punchOut,
    });
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const response = await api.get(endpoint, { params: filters });
      const rows = [...getRows(response.data)].sort((a, b) => getLatestTimestamp(b) - getLatestTimestamp(a));
      const meta = getPagination(response.data, page, limit);
      setAttendances(rows);
      setPage(meta.page);
      setLimit(meta.limit);
      setTotal(meta.total);
      setTotalPages(meta.totalPages);
      setError('');
      await fetchPunchStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [filters, endpoint]);

  const summary = useMemo(() => {
    return attendances.reduce((acc, attendance) => {
      const status = String(attendance.status || 'pending').toLowerCase();
      acc.hours += Number(getHoursWorked(attendance));
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, { hours: 0, approved: 0, pending: 0, rejected: 0 });
  }, [attendances]);

  const handleFilter = (event) => {
    event.preventDefault();
    if ((startDate && !endDate) || (!startDate && endDate)) {
      setError('Please select both start and end dates.');
      return;
    }
    setPage(1);
    setSuccess('');
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
    setPage(1);
    setSuccess('');
  };

  const handlePunch = async (type) => {
    try {
      const response = await api.post('/attendance/punch', { type });
      setSuccess(response.data.message || `Punch ${type} recorded successfully`);
      setError('');
      fetchAttendance();
    } catch (err) {
      setSuccess('');
      setError(err.response?.data?.message || 'Error recording punch');
    }
  };

  const handleDownload = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates before downloading.');
      return;
    }
    try {
      const downloadEndpoint = isEmployee ? '/attendance/download/my-attendance' : '/attendance/download';
      const response = await api.get(downloadEndpoint, {
        params: { startDate, endDate },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/csv; charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${isEmployee ? 'my-' : ''}attendance-${startDate}-${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSuccess('Attendance CSV downloaded successfully');
      setError('');
    } catch (err) {
      setSuccess('');
      setError(err.response?.data?.message || 'Error downloading attendance CSV');
    }
  };

  const renderPagination = () => {
    const pages = [];
    const start = Math.max(1, Math.min(page - 2, Math.max(totalPages - 4, 1)));
    const end = Math.min(totalPages, start + 4);

    for (let item = start; item <= end; item += 1) {
      pages.push(
        <Pagination.Item key={item} active={item === page} onClick={() => setPage(item)}>
          {item}
        </Pagination.Item>
      );
    }

    return (
      <Pagination className="attendance-pagination">
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

  const renderStatus = (status) => {
    const meta = getStatusMeta(status);
    return <Badge bg={meta.variant} className="attendance-status-badge">{meta.label}</Badge>;
  };

  return (
    <div className="attendance-shell">
      <style>
        {`
          .attendance-shell {
            color: #0f172a;
            display: grid;
            gap: 1rem;
          }
          .attendance-hero {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 1rem;
            align-items: center;
            padding: 1.15rem;
            background:
              radial-gradient(circle at 92% 8%, rgba(14, 165, 233, 0.14), transparent 30%),
              linear-gradient(135deg, #ffffff 0%, #f8fbff 55%, #eef7ff 100%);
            border: 1px solid #dbeafe;
            border-radius: 0.9rem;
            box-shadow: 0 16px 36px rgba(15, 23, 42, 0.07);
          }
          .attendance-eyebrow {
            margin: 0;
            color: #64748b;
            font-size: 0.78rem;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .attendance-title {
            margin: 0.25rem 0;
            color: #0f172a;
            font-size: clamp(1.45rem, 3vw, 2.1rem);
            font-weight: 900;
            line-height: 1.15;
          }
          .attendance-subtitle {
            margin: 0;
            color: #64748b;
            font-weight: 600;
          }
          .attendance-punch-card {
            min-width: 280px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 0.85rem;
            padding: 0.85rem;
            box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
          }
          .attendance-punch-status {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 0.75rem;
          }
          .attendance-punch-status strong {
            color: #0f172a;
            font-size: 0.95rem;
          }
          .attendance-punch-actions {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.55rem;
          }
          .attendance-button {
            border-radius: 0.65rem;
            font-weight: 800;
            min-height: 42px;
          }
          .attendance-summary-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 0.85rem;
          }
          .attendance-summary-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 0.8rem;
            padding: 0.95rem;
            box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
          }
          .attendance-summary-card span {
            display: block;
            color: #64748b;
            font-size: 0.76rem;
            font-weight: 800;
            text-transform: uppercase;
          }
          .attendance-summary-card strong {
            display: block;
            margin-top: 0.28rem;
            color: #0f172a;
            font-size: 1.5rem;
            line-height: 1.1;
          }
          .attendance-filter-panel,
          .attendance-table-panel {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 0.9rem;
            padding: 1rem;
            box-shadow: 0 14px 34px rgba(15, 23, 42, 0.07);
          }
          .attendance-toolbar {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 1rem;
            align-items: end;
          }
          .attendance-toolbar .form-label {
            color: #334155;
            font-weight: 800;
            font-size: 0.78rem;
            text-transform: uppercase;
          }
          .attendance-toolbar .form-control,
          .attendance-toolbar .form-select {
            border-radius: 0.65rem;
            border: 1px solid #dbe3ef;
            min-height: 42px;
            color: #0f172a;
            font-weight: 600;
          }
          .attendance-actions {
            display: flex;
            gap: 0.55rem;
            flex-wrap: wrap;
            justify-content: flex-end;
          }
          .attendance-table-wrap {
            border: 1px solid #e2e8f0;
            border-radius: 0.8rem;
            overflow: hidden;
          }
          .attendance-table-wrap table {
            margin: 0;
          }
          .attendance-table-wrap thead th {
            background: #f8fafc;
            color: #475569;
            border-bottom: 1px solid #e2e8f0;
            font-size: 0.74rem;
            font-weight: 900;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            white-space: nowrap;
            padding: 0.85rem;
          }
          .attendance-table-wrap td {
            color: #334155;
            vertical-align: middle;
            white-space: nowrap;
            padding: 0.9rem 0.85rem;
          }
          .attendance-employee-cell {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            min-width: 220px;
          }
          .attendance-avatar {
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
          .attendance-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .attendance-employee-cell strong,
          .attendance-employee-cell span {
            display: block;
          }
          .attendance-employee-cell strong {
            color: #0f172a;
            font-weight: 850;
          }
          .attendance-employee-cell span {
            color: #64748b;
            font-size: 0.82rem;
            margin-top: 0.1rem;
          }
          .attendance-table-wrap tbody tr:hover {
            background: #f8fafc;
          }
          .attendance-status-badge {
            border-radius: 999px;
            padding: 0.42rem 0.62rem;
            text-transform: capitalize;
          }
          .attendance-location {
            max-width: 260px;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .attendance-mobile-list {
            display: none;
            gap: 0.75rem;
          }
          .attendance-mobile-card {
            border: 1px solid #e2e8f0;
            border-radius: 0.8rem;
            background: #ffffff;
            padding: 0.9rem;
            box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06);
          }
          .attendance-mobile-head {
            display: flex;
            justify-content: space-between;
            gap: 1rem;
            margin-bottom: 0.75rem;
          }
          .attendance-mobile-date {
            color: #0f172a;
            font-weight: 900;
          }
          .attendance-mobile-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.55rem;
          }
          .attendance-mobile-field {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 0.65rem;
            padding: 0.65rem;
          }
          .attendance-mobile-field span {
            display: block;
            color: #64748b;
            font-size: 0.72rem;
            font-weight: 800;
            text-transform: uppercase;
          }
          .attendance-mobile-field strong {
            display: block;
            color: #0f172a;
            margin-top: 0.2rem;
            font-size: 0.9rem;
          }
          .attendance-empty {
            text-align: center;
            color: #64748b;
            padding: 2rem !important;
            font-weight: 700;
          }
          .attendance-pagination-wrap {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            margin-top: 1rem;
            flex-wrap: wrap;
          }
          .attendance-pagination {
            margin: 0;
          }
          .attendance-pagination .page-link {
            color: #1d4ed8;
            border-color: #dbe3ef;
            font-weight: 800;
          }
          .attendance-pagination .active .page-link {
            background: #1d4ed8;
            border-color: #1d4ed8;
          }
          @media (max-width: 992px) {
            .attendance-hero,
            .attendance-toolbar {
              grid-template-columns: 1fr;
            }
            .attendance-punch-card {
              min-width: 0;
            }
            .attendance-actions {
              justify-content: flex-start;
            }
            .attendance-summary-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }
          @media (max-width: 720px) {
            .attendance-table-wrap {
              display: none;
            }
            .attendance-mobile-list {
              display: grid;
            }
          }
          @media (max-width: 560px) {
            .attendance-filter-panel,
            .attendance-table-panel,
            .attendance-hero {
              padding: 0.85rem;
            }
            .attendance-summary-grid,
            .attendance-punch-actions,
            .attendance-mobile-grid {
              grid-template-columns: 1fr;
            }
            .attendance-actions .btn {
              width: 100%;
            }
            .attendance-pagination-wrap {
              align-items: stretch;
              flex-direction: column;
            }
            .attendance-pagination {
              flex-wrap: wrap;
            }
          }
        `}
      </style>

      <section className="attendance-hero">
        <div>
          <p className="attendance-eyebrow">{isEmployee ? 'Employee attendance' : 'Attendance management'}</p>
          <h2 className="attendance-title">{isEmployee ? 'My Attendance' : 'All Attendance Records'}</h2>
          <p className="attendance-subtitle">
            {total.toLocaleString('en-IN')} records found. Use date filters for precise reports and CSV export.
          </p>
        </div>
        {isEmployee && (
          <div className="attendance-punch-card">
            <div className="attendance-punch-status">
              <div>
                <p className="attendance-eyebrow">Today status</p>
                <strong>{punchStatus.canPunchIn ? 'Ready to punch in' : punchStatus.canPunchOut ? 'Working session active' : 'Punch completed'}</strong>
              </div>
              <Badge bg={punchStatus.canPunchOut ? 'success' : punchStatus.canPunchIn ? 'primary' : 'secondary'}>
                {moment().format('DD MMM')}
              </Badge>
            </div>
            <div className="attendance-punch-actions">
              <Button className="attendance-button" variant="success" onClick={() => handlePunch('in')} disabled={!punchStatus.canPunchIn || loading}>
                Punch In
              </Button>
              <Button className="attendance-button" variant="danger" onClick={() => handlePunch('out')} disabled={!punchStatus.canPunchOut || loading}>
                Punch Out
              </Button>
            </div>
          </div>
        )}
      </section>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <section className="attendance-summary-grid">
        <div className="attendance-summary-card"><span>Page Records</span><strong>{attendances.length}</strong></div>
        <div className="attendance-summary-card"><span>Approved</span><strong>{summary.approved || 0}</strong></div>
        <div className="attendance-summary-card"><span>Pending</span><strong>{summary.pending || 0}</strong></div>
        <div className="attendance-summary-card"><span>Total Hours</span><strong>{summary.hours.toFixed(1)}</strong></div>
      </section>

      <section className="attendance-filter-panel">
        <Form onSubmit={handleFilter} className="attendance-toolbar">
          <Row className="g-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Start Date</Form.Label>
                <Form.Control type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>End Date</Form.Label>
                <Form.Control type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Rows Per Page</Form.Label>
                <Form.Select value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }}>
                  {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <div className="attendance-actions">
            <Button type="submit" className="attendance-button" variant="primary">Apply</Button>
            <Button type="button" className="attendance-button" variant="outline-secondary" onClick={handleClear}>Clear</Button>
            <Button type="button" className="attendance-button" variant="outline-primary" onClick={handleDownload}>Download CSV</Button>
          </div>
        </Form>
      </section>

      <section className="attendance-table-panel">
        <div className="attendance-table-wrap table-responsive">
          <Table hover>
            <thead>
              <tr>
                {!isEmployee && <th>Employee ID</th>}
                {!isEmployee && <th>Employee</th>}
                <th>Date</th>
                <th>Punch In</th>
                <th>Punch Out</th>
                <th>Hours</th>
                <th>Status</th>
                <th>Mode</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="attendance-empty" colSpan={isEmployee ? 7 : 9}>
                    <Spinner animation="border" size="sm" className="me-2" /> Loading attendance...
                  </td>
                </tr>
              ) : attendances.length > 0 ? (
                attendances.map((attendance) => (
                  <tr key={attendance._id}>
                    {!isEmployee && <td>{attendance.employee?.employeeId || 'N/A'}</td>}
                    {!isEmployee && (
                      <td>
                        <div className="attendance-employee-cell">
                          <div className="attendance-avatar">
                            {attendance.employee?.profilePhoto ? (
                              <img src={attendance.employee.profilePhoto} alt={attendance.employee?.name || 'Employee'} />
                            ) : (
                              (attendance.employee?.name || 'E')[0].toUpperCase()
                            )}
                          </div>
                          <div>
                            <strong>{attendance.employee?.name || 'N/A'}</strong>
                            <span>{attendance.employee?.position || attendance.employee?.department || 'Team member'}</span>
                          </div>
                        </div>
                      </td>
                    )}
                    <td>{formatDate(attendance.date)}</td>
                    <td>{formatTime(attendance.punchIn)}</td>
                    <td>{formatTime(attendance.punchOut)}</td>
                    <td>{getHoursWorked(attendance)}</td>
                    <td>{renderStatus(attendance.status)}</td>
                    <td>
                      <Badge bg={attendance.mode === 'wfh' ? 'info' : 'secondary'}>
                        {attendance.mode === 'wfh' ? 'WFH' : 'Office'}
                      </Badge>
                    </td>
                    <td className="attendance-location" title={attendance.locationAddress || ''}>{attendance.locationAddress || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="attendance-empty" colSpan={isEmployee ? 7 : 9}>No attendance records found</td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        <div className="attendance-mobile-list">
          {loading ? (
            <div className="attendance-empty">
              <Spinner animation="border" size="sm" className="me-2" /> Loading attendance...
            </div>
          ) : attendances.length > 0 ? (
            attendances.map((attendance) => (
              <article className="attendance-mobile-card" key={attendance._id}>
                <div className="attendance-mobile-head">
                  <div>
                    <div className="attendance-mobile-date">{formatDate(attendance.date)}</div>
                    {!isEmployee && <div className="text-muted small">{attendance.employee?.name || 'N/A'} ({attendance.employee?.employeeId || 'N/A'})</div>}
                  </div>
                  <div className="d-flex gap-2 align-items-center">
                    <Badge bg={attendance.mode === 'wfh' ? 'info' : 'secondary'}>
                      {attendance.mode === 'wfh' ? 'WFH' : 'Office'}
                    </Badge>
                    {renderStatus(attendance.status)}
                  </div>
                </div>
                <div className="attendance-mobile-grid">
                  <div className="attendance-mobile-field"><span>Punch In</span><strong>{formatTime(attendance.punchIn)}</strong></div>
                  <div className="attendance-mobile-field"><span>Punch Out</span><strong>{formatTime(attendance.punchOut)}</strong></div>
                  <div className="attendance-mobile-field"><span>Hours</span><strong>{getHoursWorked(attendance)}</strong></div>
                  <div className="attendance-mobile-field"><span>Location</span><strong>{attendance.locationAddress || '-'}</strong></div>
                </div>
              </article>
            ))
          ) : (
            <div className="attendance-empty">No attendance records found</div>
          )}
        </div>

        <div className="attendance-pagination-wrap">
          <span className="text-muted">
            Page {page} of {totalPages} | Showing {total ? ((page - 1) * limit) + 1 : 0}-{Math.min(page * limit, total)} of {total.toLocaleString('en-IN')}
          </span>
          {renderPagination()}
        </div>
      </section>
    </div>
  );
};

export default AttendanceTable;
