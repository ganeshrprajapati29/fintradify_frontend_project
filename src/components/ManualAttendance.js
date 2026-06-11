import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Col, Form, Modal, Pagination, Row, Spinner, Table } from 'react-bootstrap';
import axios from 'axios';
import moment from 'moment';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css';

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

const formatDate = (value) => (value ? moment(value).format('DD MMM YYYY') : '-');
const formatTime = (value) => (value ? moment(value).format('hh:mm A') : '-');

const getHoursWorked = (attendance) => {
  if (!attendance?.punchIn || !attendance?.punchOut) return '0.00';
  const total = new Date(attendance.punchOut) - new Date(attendance.punchIn) - (attendance.totalPausedDuration || 0);
  return Math.max(total / 36e5, 0).toFixed(2);
};

const getLatestTimestamp = (attendance) => {
  const timestamp = new Date(attendance?.date || attendance?.punchIn || attendance?.createdAt || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const ManualAttendance = () => {
  const [employees, setEmployees] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [startDate, setStartDate] = useState(moment().format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(moment().format('YYYY-MM-DD'));
  const [formData, setFormData] = useState({
    employeeId: '',
    date: moment().format('YYYY-MM-DD'),
    punchIn: '',
    punchOut: '',
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [editForm, setEditForm] = useState({ punchIn: '', punchOut: '', holiday: false, halfDay: false });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const authHeaders = { Authorization: `Bearer ${localStorage.getItem('token')}` };

  const selectedEmployee = employees.find((employee) => employee._id === formData.employeeId);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/employees`, { headers: authHeaders });
      setEmployees(Array.isArray(res.data) ? res.data : getRows(res.data));
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError(err.response?.data?.message || 'Failed to fetch employees');
    }
  };

  const fetchAttendances = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/attendance`, {
        headers: authHeaders,
        params: { startDate, endDate, page, limit },
      });
      const rows = [...getRows(res.data)].sort((a, b) => getLatestTimestamp(b) - getLatestTimestamp(a));
      const meta = getPagination(res.data, page, limit);
      setAttendances(rows);
      setPage(meta.page);
      setLimit(meta.limit);
      setTotal(meta.total);
      setTotalPages(meta.totalPages);
      setError('');
    } catch (err) {
      console.error('Error fetching attendances:', err);
      setError(err.response?.data?.message || 'Failed to fetch attendances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchAttendances();
  }, [startDate, endDate, page, limit]);

  const summary = useMemo(() => {
    return attendances.reduce((acc, attendance) => {
      acc.hours += Number(getHoursWorked(attendance));
      if (attendance.holiday) acc.holidays += 1;
      if (attendance.halfDay) acc.halfDays += 1;
      if (attendance.punchIn) acc.marked += 1;
      return acc;
    }, { hours: 0, holidays: 0, halfDays: 0, marked: 0 });
  }, [attendances]);

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
    setError('');
    setSuccess('');
  };

  const validateTimes = (date, punchIn, punchOut) => {
    if (punchIn && punchOut && moment(`${date}T${punchOut}`).isBefore(moment(`${date}T${punchIn}`))) {
      return 'Punch out time cannot be before punch in time.';
    }
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.employeeId || !formData.date) {
      setError('Employee and date are required.');
      return;
    }

    const timeError = validateTimes(formData.date, formData.punchIn, formData.punchOut);
    if (timeError) {
      setError(timeError);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        employeeId: formData.employeeId,
        date: formData.date,
        punchIn: formData.punchIn ? `${formData.date}T${formData.punchIn}:00` : undefined,
        punchOut: formData.punchOut ? `${formData.date}T${formData.punchOut}:00` : undefined,
      };

      await axios.post(`${process.env.REACT_APP_API_URL}/attendance/admin/punch`, payload, { headers: authHeaders });
      setSuccess('Manual attendance recorded successfully.');
      setFormData({ employeeId: '', date: moment().format('YYYY-MM-DD'), punchIn: '', punchOut: '' });
      setPage(1);
      fetchAttendances();
    } catch (err) {
      console.error('Error recording manual attendance:', err);
      setError(err.response?.data?.message || 'Failed to record manual attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (attendance) => {
    setEditingAttendance(attendance);
    setEditForm({
      punchIn: attendance.punchIn ? moment(attendance.punchIn).format('HH:mm') : '',
      punchOut: attendance.punchOut ? moment(attendance.punchOut).format('HH:mm') : '',
      holiday: attendance.holiday || false,
      halfDay: attendance.halfDay || false,
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/attendance/admin/delete/${id}`, { headers: authHeaders });
      setSuccess('Attendance record deleted successfully.');
      fetchAttendances();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.message || 'Failed to delete attendance');
    }
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editingAttendance) return;

    const date = moment(editingAttendance.date).format('YYYY-MM-DD');
    const timeError = validateTimes(date, editForm.punchIn, editForm.punchOut);
    if (timeError) {
      setError(timeError);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        punchIn: editForm.punchIn ? `${date}T${editForm.punchIn}:00` : null,
        punchOut: editForm.punchOut ? `${date}T${editForm.punchOut}:00` : null,
        holiday: editForm.holiday,
        halfDay: editForm.halfDay,
      };

      await axios.put(`${process.env.REACT_APP_API_URL}/attendance/admin/edit/${editingAttendance._id}`, payload, { headers: authHeaders });
      setSuccess('Attendance updated successfully.');
      setShowEditModal(false);
      fetchAttendances();
    } catch (err) {
      console.error('Edit error:', err);
      setError(err.response?.data?.message || 'Failed to update attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setStartDate(moment().format('YYYY-MM-DD'));
    setEndDate(moment().format('YYYY-MM-DD'));
    setPage(1);
  };

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
      <Pagination className="manual-pagination">
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
    <div className="manual-page">
      <style>
        {`
          .manual-page {
            color: #0f172a;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }
          .manual-hero,
          .manual-panel,
          .manual-kpi-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 0.85rem;
            box-shadow: 0 12px 30px rgba(15, 23, 42, 0.07);
          }
          .manual-hero {
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
          .manual-eyebrow,
          .manual-kpi-label,
          .manual-section-eyebrow {
            margin: 0;
            color: #64748b;
            font-size: 0.76rem;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .manual-title {
            margin: 0.2rem 0 0;
            color: #0f172a;
            font-size: clamp(1.45rem, 3vw, 2.1rem);
            font-weight: 850;
            line-height: 1.15;
          }
          .manual-subtitle {
            margin: 0.45rem 0 0;
            color: #64748b;
            font-size: 0.95rem;
          }
          .manual-kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 1rem;
          }
          .manual-kpi-card {
            padding: 1rem;
            position: relative;
            overflow: hidden;
          }
          .manual-kpi-card::after {
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
          .manual-kpi-value {
            margin: 0.35rem 0 0.15rem;
            color: #0f172a;
            font-size: 1.8rem;
            font-weight: 850;
          }
          .manual-kpi-note {
            margin: 0;
            color: #64748b;
            font-size: 0.86rem;
          }
          .manual-panel {
            padding: 1.1rem;
          }
          .manual-panel-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 1rem;
            margin-bottom: 1rem;
          }
          .manual-panel-title {
            margin: 0.2rem 0 0;
            color: #0f172a;
            font-size: 1.1rem;
            font-weight: 850;
          }
          .manual-form-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 1rem;
            align-items: end;
          }
          .manual-page .form-label {
            color: #334155;
            font-size: 0.78rem;
            font-weight: 850;
            text-transform: uppercase;
          }
          .manual-page .form-control,
          .manual-page .form-select {
            border: 1px solid #cbd5e1;
            border-radius: 0.7rem;
            background: #ffffff;
            color: #0f172a;
            min-height: 44px;
            font-weight: 700;
          }
          .manual-page .form-control:focus,
          .manual-page .form-select:focus {
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
          }
          .manual-action-row {
            display: flex;
            gap: 0.55rem;
            flex-wrap: wrap;
            justify-content: flex-end;
          }
          .manual-primary,
          .manual-secondary,
          .manual-danger {
            border-radius: 0.65rem !important;
            min-height: 42px;
            font-weight: 850 !important;
            box-shadow: none !important;
          }
          .manual-primary {
            background: #2563eb !important;
            border-color: #2563eb !important;
            color: #ffffff !important;
          }
          .manual-secondary {
            background: #eff6ff !important;
            border-color: #bfdbfe !important;
            color: #1d4ed8 !important;
          }
          .manual-danger {
            background: #fef2f2 !important;
            border-color: #fecaca !important;
            color: #b91c1c !important;
          }
          .manual-table {
            margin: 0;
            border: 1px solid #e2e8f0;
            border-radius: 0.75rem;
            overflow: hidden;
            background: #ffffff;
          }
          .manual-table thead {
            background: #f8fafc;
            color: #475569;
          }
          .manual-table thead th {
            border-bottom: 1px solid #e2e8f0;
            font-size: 0.76rem;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            white-space: nowrap;
          }
          .manual-table th,
          .manual-table td {
            padding: 0.95rem;
            border-color: #e2e8f0;
            color: #334155;
            vertical-align: middle;
            white-space: nowrap;
          }
          .manual-table tbody tr:hover {
            background: #f8fafc;
          }
          .manual-person {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            min-width: 220px;
          }
          .manual-avatar {
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
          .manual-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .manual-person strong,
          .manual-person span {
            display: block;
          }
          .manual-person strong {
            color: #0f172a;
            font-weight: 850;
          }
          .manual-person span {
            color: #64748b;
            font-size: 0.82rem;
            margin-top: 0.1rem;
          }
          .manual-status {
            border-radius: 999px;
            padding: 0.35rem 0.65rem;
            font-size: 0.75rem;
            font-weight: 850;
            text-transform: capitalize;
          }
          .manual-status.yes,
          .manual-status.approved {
            color: #047857;
            background: #d1fae5;
          }
          .manual-status.no,
          .manual-status.pending {
            color: #92400e;
            background: #fef3c7;
          }
          .manual-empty {
            min-height: 150px;
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
          .manual-pagination-wrap {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            margin-top: 1rem;
            flex-wrap: wrap;
          }
          .manual-pagination {
            margin: 0;
          }
          .manual-pagination .page-link {
            color: #1d4ed8;
            border-color: #dbe3ef;
            font-weight: 800;
          }
          .manual-pagination .active .page-link {
            background: #1d4ed8;
            border-color: #1d4ed8;
          }
          @media (max-width: 1200px) {
            .manual-form-grid,
            .manual-kpi-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }
          @media (max-width: 768px) {
            .manual-hero,
            .manual-panel-header {
              flex-direction: column;
              align-items: flex-start;
            }
            .manual-form-grid,
            .manual-kpi-grid {
              grid-template-columns: 1fr;
            }
            .manual-action-row,
            .manual-action-row .btn {
              width: 100%;
            }
            .manual-pagination-wrap {
              align-items: stretch;
              flex-direction: column;
            }
          }
        `}
      </style>

      <section className="manual-hero">
        <div>
          <p className="manual-eyebrow">Admin attendance control</p>
          <h3 className="manual-title">Manual Attendance</h3>
          <p className="manual-subtitle">Create, correct, and review employee attendance records with date-safe pagination.</p>
        </div>
        <Button type="button" className="manual-secondary" onClick={fetchAttendances} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </section>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <section className="manual-kpi-grid">
        <div className="manual-kpi-card" style={{ '--accent': '#bfdbfe' }}>
          <p className="manual-kpi-label">Records</p>
          <h4 className="manual-kpi-value">{total}</h4>
          <p className="manual-kpi-note">In selected date range</p>
        </div>
        <div className="manual-kpi-card" style={{ '--accent': '#bbf7d0' }}>
          <p className="manual-kpi-label">Marked</p>
          <h4 className="manual-kpi-value">{summary.marked}</h4>
          <p className="manual-kpi-note">On this page</p>
        </div>
        <div className="manual-kpi-card" style={{ '--accent': '#fed7aa' }}>
          <p className="manual-kpi-label">Hours</p>
          <h4 className="manual-kpi-value">{summary.hours.toFixed(1)}</h4>
          <p className="manual-kpi-note">Visible total hours</p>
        </div>
        <div className="manual-kpi-card" style={{ '--accent': '#fecdd3' }}>
          <p className="manual-kpi-label">Special Days</p>
          <h4 className="manual-kpi-value">{summary.holidays + summary.halfDays}</h4>
          <p className="manual-kpi-note">{summary.holidays} holidays / {summary.halfDays} half days</p>
        </div>
      </section>

      <section className="manual-panel">
        <div className="manual-panel-header">
          <div>
            <p className="manual-section-eyebrow">Create or update</p>
            <h4 className="manual-panel-title">Manual attendance entry</h4>
          </div>
          {selectedEmployee && <span className="manual-status approved">{selectedEmployee.employeeId} selected</span>}
        </div>
        <Form onSubmit={handleSubmit}>
          <div className="manual-form-grid">
            <Form.Group>
              <Form.Label>Employee</Form.Label>
              <Form.Select name="employeeId" value={formData.employeeId} onChange={handleChange} required>
                <option value="">Choose employee</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.employeeId} - {employee.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Date</Form.Label>
              <Form.Control type="date" name="date" value={formData.date} onChange={handleChange} required />
            </Form.Group>
            <Form.Group>
              <Form.Label>Punch In</Form.Label>
              <Form.Control type="time" name="punchIn" value={formData.punchIn} onChange={handleChange} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Punch Out</Form.Label>
              <Form.Control type="time" name="punchOut" value={formData.punchOut} onChange={handleChange} />
            </Form.Group>
          </div>
          <div className="manual-action-row mt-3">
            <Button type="button" className="manual-secondary" onClick={() => setFormData({ employeeId: '', date: moment().format('YYYY-MM-DD'), punchIn: '', punchOut: '' })}>
              Reset
            </Button>
            <Button type="submit" className="manual-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Record Attendance'}
            </Button>
          </div>
        </Form>
      </section>

      <section className="manual-panel">
        <div className="manual-panel-header">
          <div>
            <p className="manual-section-eyebrow">Attendance records</p>
            <h4 className="manual-panel-title">Latest records first</h4>
          </div>
          <div className="manual-action-row">
            <Form.Control type="date" value={startDate} onChange={(event) => { setStartDate(event.target.value); setPage(1); }} />
            <Form.Control type="date" value={endDate} onChange={(event) => { setEndDate(event.target.value); setPage(1); }} />
            <Form.Select value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }} style={{ maxWidth: 120 }}>
              {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
            </Form.Select>
            <Button type="button" className="manual-secondary" onClick={handleClear}>Today</Button>
          </div>
        </div>

        {loading ? (
          <div className="manual-empty"><Spinner animation="border" size="sm" className="me-2" /> Loading attendance records...</div>
        ) : attendances.length ? (
          <div className="table-responsive">
            <Table className="manual-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Punch In</th>
                  <th>Punch Out</th>
                  <th>Hours</th>
                  <th>Holiday</th>
                  <th>Half Day</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attendances.map((attendance) => (
                  <tr key={attendance._id}>
                    <td>
                      <div className="manual-person">
                        <div className="manual-avatar">
                          {attendance.employee?.profilePhoto ? (
                            <img src={attendance.employee.profilePhoto} alt={attendance.employee?.name || 'Employee'} />
                          ) : (
                            (attendance.employee?.name || 'E')[0].toUpperCase()
                          )}
                        </div>
                        <div>
                          <strong>{attendance.employee?.name || 'N/A'}</strong>
                          <span>{attendance.employee?.employeeId || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td>{formatDate(attendance.date)}</td>
                    <td>{formatTime(attendance.punchIn)}</td>
                    <td>{formatTime(attendance.punchOut)}</td>
                    <td>{getHoursWorked(attendance)} hrs</td>
                    <td><span className={`manual-status ${attendance.holiday ? 'yes' : 'no'}`}>{attendance.holiday ? 'Yes' : 'No'}</span></td>
                    <td><span className={`manual-status ${attendance.halfDay ? 'yes' : 'no'}`}>{attendance.halfDay ? 'Yes' : 'No'}</span></td>
                    <td><span className={`manual-status ${attendance.status || 'pending'}`}>{attendance.status || 'pending'}</span></td>
                    <td>
                      <Button type="button" size="sm" className="manual-secondary me-2" onClick={() => handleEdit(attendance)}>Edit</Button>
                      <Button type="button" size="sm" className="manual-danger" onClick={() => handleDelete(attendance._id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ) : (
          <div className="manual-empty">No attendance records found for the selected date range.</div>
        )}

        <div className="manual-pagination-wrap">
          <span className="text-muted">
            Page {page} of {totalPages} | Showing {total ? ((page - 1) * limit) + 1 : 0}-{Math.min(page * limit, total)} of {total.toLocaleString('en-IN')}
          </span>
          {renderPagination()}
        </div>
      </section>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Attendance</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditSubmit}>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Punch In</Form.Label>
                  <Form.Control type="time" value={editForm.punchIn} onChange={(event) => setEditForm({ ...editForm, punchIn: event.target.value })} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Punch Out</Form.Label>
                  <Form.Control type="time" value={editForm.punchOut} onChange={(event) => setEditForm({ ...editForm, punchOut: event.target.value })} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Check type="checkbox" label="Holiday" checked={editForm.holiday} onChange={(event) => setEditForm({ ...editForm, holiday: event.target.checked })} />
              </Col>
              <Col md={6}>
                <Form.Check type="checkbox" label="Half Day" checked={editForm.halfDay} onChange={(event) => setEditForm({ ...editForm, halfDay: event.target.checked })} />
              </Col>
            </Row>
            <div className="manual-action-row mt-4">
              <Button type="button" className="manual-secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button type="submit" className="manual-primary" disabled={saving}>{saving ? 'Updating...' : 'Update Attendance'}</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ManualAttendance;
