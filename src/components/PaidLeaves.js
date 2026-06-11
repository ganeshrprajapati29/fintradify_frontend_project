import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Col, Form, Row, Spinner, Table } from 'react-bootstrap';
import moment from 'moment';
import api from '../utils/axios';
import PaginationControls from './PaginationControls';
import 'bootstrap/dist/css/bootstrap.min.css';

const getArrayPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const getStatusMeta = (status) => {
  const normalized = String(status || 'pending').toLowerCase();
  if (normalized === 'approved') return { label: 'Approved', variant: 'success' };
  if (normalized === 'rejected') return { label: 'Rejected', variant: 'danger' };
  return { label: 'Pending', variant: 'warning' };
};

const getLeaveDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const start = moment(startDate);
  const end = moment(endDate);
  if (!start.isValid() || !end.isValid() || end.isBefore(start)) return 0;
  return end.diff(start, 'days') + 1;
};

const getEmployeeName = (leave) => leave.employee?.name || leave.name || 'N/A';
const getEmployeeCode = (leave) => leave.employee?.employeeId || leave.employeeId || 'N/A';

const PaidLeaves = ({ isAdmin }) => {
  const [leaves, setLeaves] = useState([]);
  const [leaveData, setLeaveData] = useState([]);
  const [formData, setFormData] = useState({ startDate: '', endDate: '', reason: '' });
  const [leaveBalances, setLeaveBalances] = useState({ paidLeaveBalance: 0, halfDayLeaveBalance: 0 });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const requestedDays = getLeaveDays(formData.startDate, formData.endDate);

  const fetchLeaveData = async () => {
    const url = isAdmin ? '/leaves/employee-data' : '/leaves/my-employee-data';
    const res = await api.get(url);
    setLeaveData(isAdmin ? getArrayPayload(res.data) : [res.data].filter(Boolean));
  };

  const fetchLeaves = async () => {
    const url = isAdmin ? '/leaves' : '/leaves/my-leaves';
    const res = await api.get(url);
    const paidLeaves = getArrayPayload(res.data)
      .filter((leave) => String(leave.type || 'paid').toLowerCase() === 'paid')
      .sort((a, b) => new Date(b.appliedAt || b.createdAt || b.startDate || 0) - new Date(a.appliedAt || a.createdAt || a.startDate || 0));
    setLeaves(paidLeaves);
  };

  const fetchLeaveBalances = async () => {
    if (isAdmin) return;
    const res = await api.get('/leaves/my-balances');
    setLeaveBalances(res.data || { paidLeaveBalance: 0, halfDayLeaveBalance: 0 });
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchLeaveData(), fetchLeaves(), fetchLeaveBalances()]);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching paid leave data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [isAdmin]);

  const summary = useMemo(() => {
    return leaves.reduce((acc, leave) => {
      const status = String(leave.status || 'pending').toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      acc.days += getLeaveDays(leave.startDate, leave.endDate);
      return acc;
    }, { pending: 0, approved: 0, rejected: 0, days: 0 });
  }, [leaves]);

  const employeeSummary = useMemo(() => {
    return leaveData.reduce((acc, employee) => {
      if (employee.isEligible) acc.eligible += 1;
      acc.remaining += Number(employee.remainingLeaves || 0);
      acc.used += Number(employee.usedPaidLeaves || 0);
      return acc;
    }, { eligible: 0, remaining: 0, used: 0 });
  }, [leaveData]);

  const filteredLeaves = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leaves.filter((leave) => {
      const status = String(leave.status || 'pending').toLowerCase();
      const text = `${getEmployeeName(leave)} ${getEmployeeCode(leave)} ${leave.reason || ''}`.toLowerCase();
      return (statusFilter === 'all' || status === statusFilter) && (!query || text.includes(query));
    });
  }, [leaves, search, statusFilter]);

  const paginatedLeaves = filteredLeaves.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, limit]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isAdmin) {
      setError('Admins cannot request paid leaves');
      return;
    }

    if (!requestedDays) {
      setError('Please select a valid date range.');
      return;
    }

    if (requestedDays > Number(leaveBalances.paidLeaveBalance || 0)) {
      setError(`Insufficient paid leave balance. Available: ${leaveBalances.paidLeaveBalance}, requested: ${requestedDays}.`);
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/leaves', { ...formData, type: 'paid' });
      setSuccess('Paid leave requested successfully');
      setError('');
      setFormData({ startDate: '', endDate: '', reason: '' });
      await refreshData();
    } catch (err) {
      setSuccess('');
      setError(err.response?.data?.message || 'Error requesting paid leave');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await api.put(`/leaves/${id}`, { status });
      setSuccess(`Paid leave ${status} successfully`);
      setError('');
      await refreshData();
    } catch (err) {
      setSuccess('');
      setError(err.response?.data?.message || `Error ${status === 'approved' ? 'approving' : 'rejecting'} paid leave`);
    }
  };

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  return (
    <div className="paid-page">
      <style>
        {`
          .paid-page {
            color: #0f172a;
            display: grid;
            gap: 1rem;
          }
          .paid-hero,
          .paid-panel,
          .paid-stat,
          .paid-employee-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 0.85rem;
            box-shadow: 0 14px 34px rgba(15, 23, 42, 0.07);
          }
          .paid-hero {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            align-items: center;
            gap: 1rem;
            padding: 1.15rem;
            background: linear-gradient(135deg, #ffffff, #f8fbff);
            border-color: #dbeafe;
          }
          .paid-eyebrow {
            margin: 0;
            color: #64748b;
            font-size: 0.76rem;
            font-weight: 900;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .paid-title {
            margin: 0.25rem 0;
            color: #0f172a;
            font-size: clamp(1.45rem, 3vw, 2.1rem);
            font-weight: 900;
            line-height: 1.15;
          }
          .paid-subtitle {
            margin: 0;
            color: #64748b;
            font-weight: 600;
          }
          .paid-request-card {
            min-width: 210px;
            padding: 0.9rem;
            border-radius: 0.75rem;
            background: #eff6ff;
            border: 1px solid #bfdbfe;
          }
          .paid-request-card strong {
            display: block;
            color: #0f172a;
            font-size: 1.75rem;
            line-height: 1;
          }
          .paid-stat-grid {
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 0.85rem;
          }
          .paid-stat {
            padding: 0.95rem;
          }
          .paid-stat span {
            display: block;
            color: #64748b;
            font-size: 0.75rem;
            font-weight: 900;
            text-transform: uppercase;
          }
          .paid-stat strong {
            display: block;
            margin-top: 0.28rem;
            color: #0f172a;
            font-size: 1.5rem;
          }
          .paid-grid {
            display: grid;
            grid-template-columns: minmax(300px, 0.86fr) minmax(0, 1.14fr);
            gap: 1rem;
            align-items: start;
          }
          .paid-panel {
            padding: 1rem;
          }
          .paid-panel-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            margin-bottom: 1rem;
          }
          .paid-panel-title {
            margin: 0;
            color: #0f172a;
            font-size: 1.05rem;
            font-weight: 900;
          }
          .paid-controls {
            display: grid;
            grid-template-columns: minmax(180px, 1fr) 160px;
            gap: 0.75rem;
            margin-bottom: 1rem;
          }
          .paid-page .form-label {
            color: #334155;
            font-size: 0.76rem;
            font-weight: 900;
            text-transform: uppercase;
          }
          .paid-page .form-control,
          .paid-page .form-select {
            border: 1px solid #dbe3ef;
            border-radius: 0.65rem;
            color: #0f172a;
            font-weight: 600;
          }
          .paid-page .form-control:focus,
          .paid-page .form-select:focus {
            border-color: #93c5fd;
            box-shadow: 0 0 0 0.2rem rgba(37, 99, 235, 0.1);
          }
          .paid-table-wrap {
            border: 1px solid #e2e8f0;
            border-radius: 0.8rem;
            overflow: hidden;
          }
          .paid-table-wrap table {
            margin: 0;
          }
          .paid-table-wrap thead th {
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
          .paid-table-wrap td {
            color: #334155;
            vertical-align: middle;
            padding: 0.9rem 0.85rem;
          }
          .paid-employee-list {
            display: grid;
            gap: 0.75rem;
            max-height: 560px;
            overflow: auto;
            padding-right: 0.25rem;
          }
          .paid-employee-card {
            box-shadow: none;
            padding: 0.85rem;
          }
          .paid-person {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .paid-avatar {
            width: 42px;
            height: 42px;
            border-radius: 50%;
            display: grid;
            place-items: center;
            flex: 0 0 auto;
            color: #1d4ed8;
            background: #dbeafe;
            font-weight: 900;
          }
          .paid-person strong {
            display: block;
            color: #0f172a;
          }
          .paid-person span,
          .paid-meta {
            color: #64748b;
            font-size: 0.85rem;
            font-weight: 600;
          }
          .paid-mini-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.65rem;
            margin-top: 0.85rem;
          }
          .paid-mini {
            border: 1px solid #e2e8f0;
            border-radius: 0.65rem;
            background: #f8fafc;
            padding: 0.65rem;
          }
          .paid-mini span {
            display: block;
            color: #64748b;
            font-size: 0.72rem;
            font-weight: 900;
            text-transform: uppercase;
          }
          .paid-mini strong {
            color: #0f172a;
          }
          .paid-empty {
            min-height: 220px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #64748b;
            border: 1px dashed #cbd5e1;
            border-radius: 0.8rem;
            background: #f8fafc;
            font-weight: 700;
            text-align: center;
            padding: 1rem;
          }
          @media (max-width: 1150px) {
            .paid-grid,
            .paid-hero {
              grid-template-columns: 1fr;
            }
            .paid-stat-grid {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }
          }
          @media (max-width: 760px) {
            .paid-stat-grid,
            .paid-mini-grid,
            .paid-controls {
              grid-template-columns: 1fr;
            }
            .paid-panel-head {
              align-items: flex-start;
              flex-direction: column;
            }
          }
          @media (max-width: 560px) {
            .paid-panel,
            .paid-hero {
              padding: 0.85rem;
            }
            .paid-table-wrap {
              overflow-x: auto;
            }
          }
        `}
      </style>

      <section className="paid-hero">
        <div>
          <p className="paid-eyebrow">{isAdmin ? 'Paid leave control' : 'Paid leave balance'}</p>
          <h2 className="paid-title">{isAdmin ? 'Paid Leaves' : 'My Paid Leaves'}</h2>
          <p className="paid-subtitle">Review eligibility, balances, and approval status from live HR records.</p>
        </div>
        {!isAdmin && (
          <div className="paid-request-card">
            <p className="paid-eyebrow">Requested days</p>
            <strong>{requestedDays}</strong>
            <p className="paid-subtitle">Available balance: {leaveBalances.paidLeaveBalance || 0}</p>
          </div>
        )}
      </section>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <section className="paid-stat-grid">
        <div className="paid-stat"><span>Total Paid Requests</span><strong>{leaves.length}</strong></div>
        <div className="paid-stat"><span>Pending</span><strong>{summary.pending || 0}</strong></div>
        <div className="paid-stat"><span>Approved</span><strong>{summary.approved || 0}</strong></div>
        <div className="paid-stat"><span>Eligible Employees</span><strong>{isAdmin ? employeeSummary.eligible : (leaveData[0]?.isEligible ? 1 : 0)}</strong></div>
        <div className="paid-stat"><span>{isAdmin ? 'Remaining Balance' : 'My Balance'}</span><strong>{isAdmin ? employeeSummary.remaining : leaveBalances.paidLeaveBalance}</strong></div>
      </section>

      <section className="paid-grid">
        <div className="paid-panel">
          <div className="paid-panel-head">
            <h3 className="paid-panel-title">{isAdmin ? 'Employee eligibility' : 'Paid leave request'}</h3>
            <Button variant="outline-primary" size="sm" onClick={refreshData} disabled={loading}>Refresh</Button>
          </div>

          {!isAdmin && (
            <Form onSubmit={handleSubmit} className="mb-4">
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Start Date</Form.Label>
                    <Form.Control type="date" name="startDate" value={formData.startDate} onChange={handleChange} min={moment().format('YYYY-MM-DD')} required />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>End Date</Form.Label>
                    <Form.Control type="date" name="endDate" value={formData.endDate} onChange={handleChange} min={formData.startDate || moment().format('YYYY-MM-DD')} required />
                  </Form.Group>
                </Col>
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label>Reason</Form.Label>
                    <Form.Control as="textarea" rows={4} name="reason" value={formData.reason} onChange={handleChange} placeholder="Enter reason for paid leave" required />
                  </Form.Group>
                </Col>
                <Col xs={12}>
                  <Button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Request Paid Leave'}</Button>
                </Col>
              </Row>
            </Form>
          )}

          {loading ? (
            <div className="paid-empty"><Spinner animation="border" size="sm" className="me-2" /> Loading paid leave data...</div>
          ) : (
            <div className="paid-employee-list">
              {leaveData.length ? leaveData.map((employee) => (
                <article className="paid-employee-card" key={employee.employeeId || employee._id || employee.name}>
                  <div className="paid-person">
                    <div className="paid-avatar">{String(employee.name || 'E').charAt(0).toUpperCase()}</div>
                    <div>
                      <strong>{employee.name || 'Employee'}</strong>
                      <span>ID: {employee.employeeId || 'N/A'}</span>
                    </div>
                    <Badge bg={employee.isEligible ? 'success' : 'warning'} className="ms-auto">
                      {employee.isEligible ? 'Eligible' : 'Not Eligible'}
                    </Badge>
                  </div>
                  <div className="paid-mini-grid">
                    <div className="paid-mini"><span>Remaining</span><strong>{employee.remainingLeaves ?? 0}</strong></div>
                    <div className="paid-mini"><span>Used</span><strong>{employee.usedPaidLeaves || 0}</strong></div>
                    <div className="paid-mini"><span>Joining</span><strong>{employee.joiningDate ? moment(employee.joiningDate).format('DD MMM YYYY') : 'N/A'}</strong></div>
                    <div className="paid-mini"><span>Eligible From</span><strong>{employee.eligibilityDate ? moment(employee.eligibilityDate).format('DD MMM YYYY') : 'N/A'}</strong></div>
                  </div>
                </article>
              )) : (
                <div className="paid-empty">No employee paid leave data available</div>
              )}
            </div>
          )}
        </div>

        <div className="paid-panel">
          <div className="paid-panel-head">
            <h3 className="paid-panel-title">Paid leave pipeline</h3>
            <span className="paid-meta">{filteredLeaves.length} records</span>
          </div>
          <div className="paid-controls">
            <Form.Control value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employee or reason" />
            <Form.Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </Form.Select>
          </div>

          {loading ? (
            <div className="paid-empty"><Spinner animation="border" size="sm" className="me-2" /> Loading paid leave requests...</div>
          ) : (
            <>
              <div className="paid-table-wrap table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Date Range</th>
                      <th>Days</th>
                      <th>Reason</th>
                      <th>Status</th>
                      {isAdmin && <th>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLeaves.length ? paginatedLeaves.map((leave) => {
                      const statusMeta = getStatusMeta(leave.status);
                      return (
                        <tr key={leave._id}>
                          <td><strong>{getEmployeeName(leave)}</strong><br /><span className="paid-meta">{getEmployeeCode(leave)}</span></td>
                          <td>{moment(leave.startDate).format('DD MMM YYYY')} - {moment(leave.endDate).format('DD MMM YYYY')}</td>
                          <td>{getLeaveDays(leave.startDate, leave.endDate)}</td>
                          <td>{leave.reason || '-'}</td>
                          <td><Badge bg={statusMeta.variant}>{statusMeta.label}</Badge></td>
                          {isAdmin && (
                            <td>
                              <Button variant="success" size="sm" className="me-2" onClick={() => handleStatus(leave._id, 'approved')} disabled={leave.status !== 'pending'}>Approve</Button>
                              <Button variant="danger" size="sm" onClick={() => handleStatus(leave._id, 'rejected')} disabled={leave.status !== 'pending'}>Reject</Button>
                            </td>
                          )}
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan={isAdmin ? 6 : 5} className="text-center text-muted py-4">No paid leave requests found</td></tr>
                    )}
                  </tbody>
                </Table>
              </div>

              {filteredLeaves.length > limit && (
                <PaginationControls
                  page={page}
                  limit={limit}
                  total={filteredLeaves.length}
                  label="paid leave requests"
                  onPageChange={setPage}
                  onLimitChange={(nextLimit) => {
                    setLimit(nextLimit);
                    setPage(1);
                  }}
                />
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default PaidLeaves;
