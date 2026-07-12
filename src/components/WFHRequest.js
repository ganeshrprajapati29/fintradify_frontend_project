import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Col, Form, Row, Spinner, Table } from 'react-bootstrap';
import moment from 'moment';
import api from '../utils/axios';
import PaginationControls from './PaginationControls';
import 'bootstrap/dist/css/bootstrap.min.css';

const getStatusMeta = (status) => {
  const normalized = String(status || 'pending').toLowerCase();
  if (normalized === 'approved') return { label: 'Approved', variant: 'success' };
  if (normalized === 'rejected') return { label: 'Rejected', variant: 'danger' };
  return { label: 'Pending', variant: 'warning' };
};

const getDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const start = moment(startDate);
  const end = moment(endDate);
  if (!start.isValid() || !end.isValid() || end.isBefore(start)) return 0;
  return end.diff(start, 'days') + 1;
};

const WFHRequest = ({ isAdmin }) => {
  const [requests, setRequests] = useState([]);
  const [formData, setFormData] = useState({ startDate: '', endDate: '', reason: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const requestedDays = getDays(formData.startDate, formData.endDate);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const url = isAdmin ? '/wfh' : '/wfh/my-requests';
      const res = await api.get(url);
      const sorted = (Array.isArray(res.data) ? res.data : [])
        .sort((a, b) => new Date(b.appliedAt || b.createdAt || b.startDate || 0) - new Date(a.appliedAt || a.createdAt || a.startDate || 0));
      setRequests(sorted);
      setPage(1);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching Work From Home requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [isAdmin]);

  const summary = useMemo(() => {
    return requests.reduce((acc, request) => {
      const status = String(request.status || 'pending').toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      acc.days += getDays(request.startDate, request.endDate);
      return acc;
    }, { pending: 0, approved: 0, rejected: 0, days: 0 });
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return requests.filter((request) => {
      const status = String(request.status || 'pending').toLowerCase();
      const text = `${request.employee?.name || ''} ${request.employee?.employeeId || ''} ${request.reason || ''}`.toLowerCase();
      return (statusFilter === 'all' || status === statusFilter) && (!query || text.includes(query));
    });
  }, [requests, search, statusFilter]);

  const paginatedRequests = filteredRequests.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, limit]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isAdmin) {
      setError('Admins cannot submit Work From Home requests');
      return;
    }

    if (!requestedDays) {
      setError('Please select a valid date range.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/wfh', formData);
      setSuccess('Work From Home request submitted successfully');
      setError('');
      setFormData({ startDate: '', endDate: '', reason: '' });
      await fetchRequests();
    } catch (err) {
      setSuccess('');
      setError(err.response?.data?.message || 'Error submitting Work From Home request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await api.put(`/wfh/${id}`, { status });
      setSuccess(`Work From Home request ${status} successfully`);
      setError('');
      fetchRequests();
    } catch (err) {
      setSuccess('');
      setError(err.response?.data?.message || `Error ${status === 'approved' ? 'approving' : 'rejecting'} request`);
    }
  };

  const handleCancel = async (id) => {
    try {
      await api.delete(`/wfh/${id}`);
      setSuccess('Work From Home request cancelled');
      setError('');
      fetchRequests();
    } catch (err) {
      setSuccess('');
      setError(err.response?.data?.message || 'Error cancelling request');
    }
  };

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  return (
    <div className="leave-page">
      <style>
        {`
          .leave-page {
            color: #0f172a;
            display: grid;
            gap: 1rem;
          }
          .leave-hero {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 1rem;
            align-items: center;
            padding: 1.15rem;
            background: linear-gradient(135deg, #ffffff, #f8fbff);
            border: 1px solid #dbeafe;
            border-radius: 0.9rem;
            box-shadow: 0 16px 36px rgba(15, 23, 42, 0.07);
          }
          .leave-eyebrow {
            margin: 0;
            color: #64748b;
            font-size: 0.78rem;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .leave-title {
            margin: 0.25rem 0;
            color: #0f172a;
            font-size: clamp(1.45rem, 3vw, 2.1rem);
            font-weight: 900;
            line-height: 1.15;
          }
          .leave-subtitle {
            margin: 0;
            color: #64748b;
            font-weight: 600;
          }
          .leave-days-card {
            min-width: 240px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 0.85rem;
            padding: 0.9rem;
            box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
          }
          .leave-days-card strong {
            display: block;
            color: #0f172a;
            font-size: 1.8rem;
            line-height: 1;
          }
          .leave-summary-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 0.85rem;
          }
          .leave-summary-card,
          .leave-panel {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 0.85rem;
            box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
          }
          .leave-summary-card {
            padding: 0.95rem;
          }
          .leave-summary-card span {
            display: block;
            color: #64748b;
            font-size: 0.76rem;
            font-weight: 800;
            text-transform: uppercase;
          }
          .leave-summary-card strong {
            display: block;
            margin-top: 0.28rem;
            color: #0f172a;
            font-size: 1.55rem;
            line-height: 1.1;
          }
          .leave-content-grid {
            display: grid;
            grid-template-columns: minmax(320px, 0.82fr) minmax(0, 1.18fr);
            gap: 1rem;
            align-items: start;
          }
          .leave-content-grid.admin-mode {
            grid-template-columns: 1fr;
          }
          .leave-panel {
            padding: 1rem;
          }
          .leave-panel-title {
            margin: 0 0 1rem;
            color: #0f172a;
            font-size: 1.05rem;
            font-weight: 900;
          }
          .leave-panel-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            margin-bottom: 1rem;
          }
          .leave-panel-head .leave-panel-title {
            margin: 0;
          }
          .leave-controls {
            display: grid;
            grid-template-columns: minmax(180px, 1fr) 160px;
            gap: 0.75rem;
            margin-bottom: 1rem;
          }
          .leave-form .form-label {
            color: #334155;
            font-weight: 800;
            font-size: 0.78rem;
            text-transform: uppercase;
          }
          .leave-form .form-control {
            border-radius: 0.65rem;
            border: 1px solid #dbe3ef;
            color: #0f172a;
            font-weight: 600;
          }
          .leave-form .form-select,
          .leave-controls .form-control,
          .leave-controls .form-select {
            border-radius: 0.65rem;
            border: 1px solid #dbe3ef;
            color: #0f172a;
            font-weight: 600;
          }
          .leave-form .form-control:focus {
            border-color: #93c5fd;
            box-shadow: 0 0 0 0.2rem rgba(37, 99, 235, 0.1);
          }
          .leave-action-btn {
            border-radius: 0.65rem;
            font-weight: 800;
            min-height: 42px;
          }
          .leave-table-wrap {
            border: 1px solid #e2e8f0;
            border-radius: 0.8rem;
            overflow: hidden;
          }
          .leave-table-wrap table {
            margin: 0;
          }
          .leave-table-wrap thead th {
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
          .leave-table-wrap td {
            color: #334155;
            vertical-align: middle;
            padding: 0.9rem 0.85rem;
          }
          .leave-reason {
            max-width: 260px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .leave-mobile-list {
            display: none;
            gap: 0.75rem;
          }
          .leave-mobile-card {
            border: 1px solid #e2e8f0;
            border-radius: 0.8rem;
            background: #ffffff;
            padding: 0.9rem;
            box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06);
          }
          .leave-mobile-head {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 1rem;
            margin-bottom: 0.75rem;
          }
          .leave-date-range {
            color: #0f172a;
            font-weight: 900;
          }
          .leave-mobile-meta {
            color: #64748b;
            font-size: 0.86rem;
            font-weight: 600;
          }
          .leave-empty {
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
          @media (max-width: 1100px) {
            .leave-content-grid,
            .leave-hero {
              grid-template-columns: 1fr;
            }
            .leave-days-card {
              min-width: 0;
            }
            .leave-summary-grid {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }
          }
          @media (max-width: 760px) {
            .leave-summary-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .leave-controls {
              grid-template-columns: 1fr;
            }
            .leave-table-wrap {
              display: none;
            }
            .leave-mobile-list {
              display: grid;
            }
          }
          @media (max-width: 560px) {
            .leave-summary-grid {
              grid-template-columns: 1fr;
            }
            .leave-panel,
            .leave-hero {
              padding: 0.85rem;
            }
            .leave-action-btn {
              width: 100%;
            }
          }
        `}
      </style>

      <section className="leave-hero">
        <div>
          <p className="leave-eyebrow">{isAdmin ? 'Work From Home approvals' : 'Work From Home'}</p>
          <h2 className="leave-title">{isAdmin ? 'Work From Home Requests' : 'My Work From Home Requests'}</h2>
          <p className="leave-subtitle">Submit, track, and review Work From Home requests using live HR records.</p>
        </div>
        {!isAdmin && (
          <div className="leave-days-card">
            <p className="leave-eyebrow">Requested days</p>
            <strong>{requestedDays}</strong>
            <p className="leave-subtitle">Based on selected date range</p>
          </div>
        )}
      </section>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <section className="leave-summary-grid">
        <div className="leave-summary-card"><span>Total Requests</span><strong>{requests.length}</strong></div>
        <div className="leave-summary-card"><span>Pending</span><strong>{summary.pending || 0}</strong></div>
        <div className="leave-summary-card"><span>Approved</span><strong>{summary.approved || 0}</strong></div>
        <div className="leave-summary-card"><span>Rejected</span><strong>{summary.rejected || 0}</strong></div>
      </section>

      <section className={`leave-content-grid ${isAdmin ? 'admin-mode' : ''}`}>
        {!isAdmin && (
          <div className="leave-panel">
            <h3 className="leave-panel-title">Request Work From Home</h3>
            <Form className="leave-form" onSubmit={handleSubmit}>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Start Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      required
                      min={moment().format('YYYY-MM-DD')}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>End Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      required
                      min={formData.startDate || moment().format('YYYY-MM-DD')}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label>Reason</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      required
                      rows={4}
                      placeholder="Write a short reason for working from home"
                    />
                  </Form.Group>
                </Col>
                <Col xs={12}>
                  <Button className="leave-action-btn" type="submit" variant="primary" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Work From Home Request'}
                  </Button>
                </Col>
              </Row>
            </Form>
          </div>
        )}

        <div className="leave-panel">
          <div className="leave-panel-head">
            <h3 className="leave-panel-title">{isAdmin ? 'All requests' : 'Request history'}</h3>
            <span className="leave-mobile-meta">{filteredRequests.length} records</span>
          </div>
          <div className="leave-controls">
            <Form.Control
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee or reason"
            />
            <Form.Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </Form.Select>
          </div>
          {loading ? (
            <div className="leave-empty">
              <Spinner animation="border" size="sm" className="me-2" /> Loading Work From Home requests...
            </div>
          ) : (
            <>
              <div className="leave-table-wrap table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      {isAdmin && <th>Employee</th>}
                      <th>Date Range</th>
                      <th>Days</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRequests.length > 0 ? (
                      paginatedRequests.map((request) => {
                        const statusMeta = getStatusMeta(request.status);
                        return (
                          <tr key={request._id}>
                            {isAdmin && <td>{request.employee?.name || 'N/A'}<br /><span className="text-muted small">{request.employee?.employeeId || 'N/A'}</span></td>}
                            <td>{moment(request.startDate).format('DD MMM YYYY')} - {moment(request.endDate).format('DD MMM YYYY')}</td>
                            <td>{getDays(request.startDate, request.endDate)}</td>
                            <td className="leave-reason" title={request.reason}>{request.reason || '-'}</td>
                            <td><Badge bg={statusMeta.variant}>{statusMeta.label}</Badge></td>
                            <td>
                              {isAdmin ? (
                                <>
                                  <Button className="leave-action-btn me-2" variant="success" size="sm" onClick={() => handleStatus(request._id, 'approved')} disabled={request.status !== 'pending'}>
                                    Approve
                                  </Button>
                                  <Button className="leave-action-btn" variant="danger" size="sm" onClick={() => handleStatus(request._id, 'rejected')} disabled={request.status !== 'pending'}>
                                    Reject
                                  </Button>
                                </>
                              ) : (
                                <Button className="leave-action-btn" variant="outline-danger" size="sm" onClick={() => handleCancel(request._id)} disabled={request.status !== 'pending'}>
                                  Cancel
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={isAdmin ? 6 : 5} className="text-center text-muted py-4">No Work From Home requests available</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>

              <div className="leave-mobile-list">
                {paginatedRequests.length > 0 ? (
                  paginatedRequests.map((request) => {
                    const statusMeta = getStatusMeta(request.status);
                    return (
                      <article className="leave-mobile-card" key={request._id}>
                        <div className="leave-mobile-head">
                          <div>
                            <div className="leave-date-range">{moment(request.startDate).format('DD MMM')} - {moment(request.endDate).format('DD MMM YYYY')}</div>
                            {isAdmin && <div className="leave-mobile-meta">{request.employee?.name || 'N/A'} ({request.employee?.employeeId || 'N/A'})</div>}
                          </div>
                          <Badge bg={statusMeta.variant}>{statusMeta.label}</Badge>
                        </div>
                        <p className="leave-mobile-meta">{getDays(request.startDate, request.endDate)} days</p>
                        <p className="mb-0">{request.reason || '-'}</p>
                        <div className="d-flex gap-2 mt-3">
                          {isAdmin ? (
                            <>
                              <Button className="leave-action-btn flex-fill" variant="success" size="sm" onClick={() => handleStatus(request._id, 'approved')} disabled={request.status !== 'pending'}>
                                Approve
                              </Button>
                              <Button className="leave-action-btn flex-fill" variant="danger" size="sm" onClick={() => handleStatus(request._id, 'rejected')} disabled={request.status !== 'pending'}>
                                Reject
                              </Button>
                            </>
                          ) : (
                            <Button className="leave-action-btn flex-fill" variant="outline-danger" size="sm" onClick={() => handleCancel(request._id)} disabled={request.status !== 'pending'}>
                              Cancel
                            </Button>
                          )}
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="leave-empty">No Work From Home requests available</div>
                )}
              </div>

              {filteredRequests.length > limit && (
                <PaginationControls
                  page={page}
                  limit={limit}
                  total={filteredRequests.length}
                  label="Work From Home requests"
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

export default WFHRequest;
