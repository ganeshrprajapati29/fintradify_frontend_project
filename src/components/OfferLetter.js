import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Col, Form, Row, Spinner, Table } from 'react-bootstrap';
import moment from 'moment';
import api from '../utils/axios';
import PaginationControls from './PaginationControls';

const getRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`;

const statusMeta = (status) => {
  const value = String(status || 'draft').toLowerCase();
  if (value === 'sent') return { label: 'Sent', variant: 'primary' };
  if (value === 'accepted') return { label: 'Accepted', variant: 'success' };
  if (value === 'rejected') return { label: 'Rejected', variant: 'danger' };
  return { label: 'Draft', variant: 'secondary' };
};

const OfferLetter = () => {
  const [employees, setEmployees] = useState([]);
  const [letters, setLetters] = useState([]);
  const [formData, setFormData] = useState({
    employeeId: '',
    position: '',
    department: '',
    joiningDate: '',
    salary: '',
    reportingManager: '',
    workLocation: 'Noida, Uttar Pradesh',
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const selectedEmployee = employees.find((employee) => employee._id === formData.employeeId);

  const fetchEmployees = async () => {
    const response = await api.get('/employees');
    setEmployees(getRows(response.data).filter((employee) => String(employee.role || 'employee') !== 'admin'));
  };

  const fetchLetters = async () => {
    const response = await api.get('/offer');
    const rows = getRows(response.data).sort((a, b) => new Date(b.createdAt || b.sentAt || 0) - new Date(a.createdAt || a.sentAt || 0));
    setLetters(rows);
    setPage(1);
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchEmployees(), fetchLetters()]);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading offer letters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const summary = useMemo(() => letters.reduce((acc, letter) => {
    const status = String(letter.status || 'draft').toLowerCase();
    acc[status] = (acc[status] || 0) + 1;
    acc.payroll += Number(letter.salary || 0);
    return acc;
  }, { draft: 0, sent: 0, accepted: 0, rejected: 0, payroll: 0 }), [letters]);

  const filteredLetters = useMemo(() => {
    const query = search.trim().toLowerCase();
    return letters.filter((letter) => {
      const status = String(letter.status || 'draft').toLowerCase();
      const text = `${letter.employee?.name || ''} ${letter.employee?.employeeId || ''} ${letter.employee?.email || ''} ${letter.position || ''} ${letter.department || ''}`.toLowerCase();
      return (statusFilter === 'all' || status === statusFilter) && (!query || text.includes(query));
    });
  }, [letters, search, statusFilter]);

  const paginatedLetters = filteredLetters.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, limit]);

  const handleEmployeeChange = (employeeId) => {
    const employee = employees.find((item) => item._id === employeeId);
    setFormData({
      ...formData,
      employeeId,
      position: employee?.position || formData.position,
      department: employee?.department || formData.department,
      joiningDate: employee?.joiningDate ? moment(employee.joiningDate).format('YYYY-MM-DD') : formData.joiningDate,
      salary: employee?.salary ? String(employee.salary) : formData.salary,
    });
  };

  const handleGenerate = async (event) => {
    event.preventDefault();
    if (!formData.employeeId || !formData.position || !formData.department || !formData.joiningDate || !Number(formData.salary)) {
      setError('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/offer/generate', { ...formData, salary: Number(formData.salary) });
      setSuccess(response.data?.message || 'Offer letter generated and emailed successfully');
      setError('');
      setFormData({ employeeId: '', position: '', department: '', joiningDate: '', salary: '', reportingManager: '', workLocation: 'Noida, Uttar Pradesh' });
      await fetchLetters();
    } catch (err) {
      setSuccess('');
      setError(err.response?.data?.message || 'Error generating offer letter');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (letterId) => {
    if (!window.confirm('Delete this offer letter?')) return;
    try {
      await api.delete(`/offer/${letterId}`);
      setSuccess('Offer letter deleted successfully');
      setError('');
      await fetchLetters();
    } catch (err) {
      setSuccess('');
      setError(err.response?.data?.message || 'Error deleting offer letter');
    }
  };

  const handleStatusUpdate = async (letterId, status) => {
    const rejectionReason = status === 'rejected' ? window.prompt('Enter rejection reason:') : '';
    if (status === 'rejected' && !rejectionReason) return;
    try {
      await api.put(`/offer/${letterId}/status`, { status, rejectionReason });
      setSuccess(`Offer letter ${status} successfully`);
      setError('');
      await fetchLetters();
    } catch (err) {
      setSuccess('');
      setError(err.response?.data?.message || 'Error updating offer letter status');
    }
  };

  return (
    <div className="doc-page">
      <style>{`
        .doc-page { color:#0f172a; display:grid; gap:1rem; }
        .doc-hero,.doc-panel,.doc-stat { background:#fff; border:1px solid #e2e8f0; border-radius:.85rem; box-shadow:0 14px 34px rgba(15,23,42,.07); }
        .doc-hero { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:1rem; align-items:center; padding:1.15rem; background:linear-gradient(135deg,#fff,#f8fbff); border-color:#dbeafe; }
        .doc-eyebrow { margin:0; color:#64748b; font-size:.76rem; font-weight:900; letter-spacing:.08em; text-transform:uppercase; }
        .doc-title { margin:.25rem 0; font-size:clamp(1.45rem,3vw,2.1rem); font-weight:900; line-height:1.15; }
        .doc-subtitle { margin:0; color:#64748b; font-weight:600; }
        .doc-grid { display:grid; grid-template-columns:minmax(330px,.8fr) minmax(0,1.2fr); gap:1rem; align-items:start; }
        .doc-stat-grid { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:.85rem; }
        .doc-stat { padding:.95rem; }
        .doc-stat span { display:block; color:#64748b; font-size:.74rem; font-weight:900; text-transform:uppercase; }
        .doc-stat strong { display:block; margin-top:.25rem; font-size:1.35rem; }
        .doc-panel { padding:1rem; }
        .doc-panel-head { display:flex; align-items:center; justify-content:space-between; gap:1rem; margin-bottom:1rem; }
        .doc-panel-title { margin:0; font-size:1.05rem; font-weight:900; }
        .doc-controls { display:grid; grid-template-columns:minmax(190px,1fr) 150px; gap:.75rem; margin-bottom:1rem; }
        .doc-page .form-label { color:#334155; font-size:.76rem; font-weight:900; text-transform:uppercase; }
        .doc-page .form-control,.doc-page .form-select { border:1px solid #dbe3ef; border-radius:.65rem; color:#0f172a; font-weight:600; min-height:42px; }
        .doc-action-btn { border-radius:.65rem; font-weight:800; min-height:42px; }
        .doc-preview { display:grid; gap:.5rem; padding:.85rem; margin:1rem 0; background:#f8fafc; border:1px solid #e2e8f0; border-radius:.75rem; }
        .doc-preview-row { display:flex; justify-content:space-between; gap:1rem; color:#64748b; font-weight:700; }
        .doc-preview-row strong { color:#0f172a; text-align:right; }
        .doc-table-wrap { border:1px solid #e2e8f0; border-radius:.8rem; overflow:hidden; }
        .doc-table-wrap table { margin:0; }
        .doc-table-wrap thead th { background:#f8fafc; color:#475569; border-bottom:1px solid #e2e8f0; font-size:.73rem; font-weight:900; letter-spacing:.04em; text-transform:uppercase; white-space:nowrap; padding:.85rem; }
        .doc-table-wrap td { color:#334155; vertical-align:middle; padding:.9rem .85rem; }
        .doc-person { display:flex; align-items:center; gap:.75rem; min-width:190px; }
        .doc-avatar { width:40px; height:40px; border-radius:50%; display:grid; place-items:center; background:#dbeafe; color:#1d4ed8; font-weight:900; flex:0 0 auto; }
        .doc-person strong,.doc-role strong { display:block; color:#0f172a; }
        .doc-person span,.doc-role span,.doc-muted { color:#64748b; font-size:.84rem; font-weight:600; }
        .doc-empty { min-height:220px; display:flex; align-items:center; justify-content:center; text-align:center; padding:1rem; color:#64748b; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:.8rem; font-weight:700; }
        @media(max-width:1180px){ .doc-grid,.doc-hero{grid-template-columns:1fr}.doc-stat-grid{grid-template-columns:repeat(3,minmax(0,1fr))} }
        @media(max-width:760px){ .doc-controls{grid-template-columns:1fr}.doc-panel-head{align-items:flex-start;flex-direction:column}.doc-table-wrap{overflow-x:auto}.doc-stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))} }
        @media(max-width:560px){ .doc-stat-grid{grid-template-columns:1fr}.doc-panel,.doc-hero{padding:.85rem}.doc-action-btn{width:100%} }
      `}</style>

      <section className="doc-hero">
        <div>
          <p className="doc-eyebrow">Hiring documents</p>
          <h2 className="doc-title">Offer Letter</h2>
          <p className="doc-subtitle">Generate, send, and track offer letters from live employee records.</p>
        </div>
        <Button className="doc-action-btn" variant="outline-primary" onClick={refreshData} disabled={loading}>Refresh</Button>
      </section>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <section className="doc-stat-grid">
        <div className="doc-stat"><span>Total</span><strong>{letters.length}</strong></div>
        <div className="doc-stat"><span>Sent</span><strong>{summary.sent || 0}</strong></div>
        <div className="doc-stat"><span>Accepted</span><strong>{summary.accepted || 0}</strong></div>
        <div className="doc-stat"><span>Rejected</span><strong>{summary.rejected || 0}</strong></div>
        <div className="doc-stat"><span>Offered Salary</span><strong>{money(summary.payroll)}</strong></div>
      </section>

      <section className="doc-grid">
        <div className="doc-panel">
          <h3 className="doc-panel-title mb-3">Generate offer</h3>
          <Form onSubmit={handleGenerate}>
            <Row className="g-3">
              <Col xs={12}><Form.Group><Form.Label>Employee</Form.Label><Form.Select value={formData.employeeId} onChange={(event) => handleEmployeeChange(event.target.value)} required><option value="">Select employee</option>{employees.map((employee) => <option key={employee._id} value={employee._id}>{employee.employeeId} - {employee.name}</option>)}</Form.Select></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Position</Form.Label><Form.Control value={formData.position} onChange={(event) => setFormData({ ...formData, position: event.target.value })} required /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Department</Form.Label><Form.Control value={formData.department} onChange={(event) => setFormData({ ...formData, department: event.target.value })} required /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Joining Date</Form.Label><Form.Control type="date" value={formData.joiningDate} onChange={(event) => setFormData({ ...formData, joiningDate: event.target.value })} required /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Monthly Salary</Form.Label><Form.Control type="number" min="1" value={formData.salary} onChange={(event) => setFormData({ ...formData, salary: event.target.value })} required /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Reporting Manager</Form.Label><Form.Control value={formData.reportingManager} onChange={(event) => setFormData({ ...formData, reportingManager: event.target.value })} placeholder="HR Manager" /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Work Location</Form.Label><Form.Control value={formData.workLocation} onChange={(event) => setFormData({ ...formData, workLocation: event.target.value })} /></Form.Group></Col>
            </Row>
            <div className="doc-preview">
              <div className="doc-preview-row"><span>Employee</span><strong>{selectedEmployee ? `${selectedEmployee.name} (${selectedEmployee.employeeId})` : 'Not selected'}</strong></div>
              <div className="doc-preview-row"><span>Position</span><strong>{formData.position || 'N/A'}</strong></div>
              <div className="doc-preview-row"><span>Salary</span><strong>{money(formData.salary)}</strong></div>
            </div>
            <Button className="doc-action-btn" type="submit" disabled={submitting || loading}>{submitting ? 'Generating...' : 'Generate Offer Letter'}</Button>
          </Form>
        </div>

        <div className="doc-panel">
          <div className="doc-panel-head"><div><h3 className="doc-panel-title">Generated offers</h3><p className="doc-subtitle">{filteredLetters.length} records, latest first</p></div></div>
          <div className="doc-controls">
            <Form.Control value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employee, role, department" />
            <Form.Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All status</option><option value="draft">Draft</option><option value="sent">Sent</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option></Form.Select>
          </div>
          {loading ? <div className="doc-empty"><Spinner animation="border" size="sm" className="me-2" /> Loading offers...</div> : (
            <>
              <div className="doc-table-wrap table-responsive">
                <Table hover>
                  <thead><tr><th>Employee</th><th>Role</th><th>Salary</th><th>Joining</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {paginatedLetters.length ? paginatedLetters.map((letter, index) => {
                      const meta = statusMeta(letter.status);
                      return (
                        <tr key={letter._id}>
                          <td><div className="doc-person"><div className="doc-avatar">{String(letter.employee?.name || 'E').charAt(0).toUpperCase()}</div><div><strong>{letter.employee?.name || 'N/A'}</strong><span>{letter.employee?.employeeId || 'N/A'} - {letter.employee?.email || 'N/A'}</span></div></div></td>
                          <td><div className="doc-role"><strong>{letter.position}</strong><span>{letter.department} / {letter.workLocation || 'N/A'}</span>{page === 1 && index === 0 && <Badge bg="success" className="mt-1">Latest</Badge>}</div></td>
                          <td><strong>{money(letter.salary)}</strong></td>
                          <td>{letter.joiningDate ? moment(letter.joiningDate).format('DD MMM YYYY') : 'N/A'}</td>
                          <td><Badge bg={meta.variant}>{meta.label}</Badge></td>
                          <td>
                            <Button className="doc-action-btn me-2" size="sm" variant="outline-primary" href={letter.offerLetterUrl} target="_blank" rel="noopener noreferrer" disabled={!letter.offerLetterUrl}>Download</Button>
                            {String(letter.status).toLowerCase() === 'sent' && <Button className="doc-action-btn me-2" size="sm" variant="outline-success" onClick={() => handleStatusUpdate(letter._id, 'accepted')}>Accept</Button>}
                            {String(letter.status).toLowerCase() === 'sent' && <Button className="doc-action-btn me-2" size="sm" variant="outline-danger" onClick={() => handleStatusUpdate(letter._id, 'rejected')}>Reject</Button>}
                            <Button className="doc-action-btn" size="sm" variant="outline-danger" onClick={() => handleDelete(letter._id)}>Delete</Button>
                          </td>
                        </tr>
                      );
                    }) : <tr><td colSpan="6" className="text-center text-muted py-4">No offer letters found</td></tr>}
                  </tbody>
                </Table>
              </div>
              {filteredLetters.length > limit && <PaginationControls page={page} limit={limit} total={filteredLetters.length} label="offer letters" onPageChange={setPage} onLimitChange={(nextLimit) => { setLimit(nextLimit); setPage(1); }} />}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default OfferLetter;
