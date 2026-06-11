import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Col, Form, Modal, Row, Spinner, Table } from 'react-bootstrap';
import moment from 'moment';
import api from '../utils/axios';
import PaginationControls from './PaginationControls';

const getRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const moneyDate = (date) => (date ? moment(date).format('DD MMM YYYY') : 'N/A');

const RelievingLetter = () => {
  const [employees, setEmployees] = useState([]);
  const [letters, setLetters] = useState([]);
  const [formData, setFormData] = useState({ employeeId: '', relievingDate: '', reason: 'Resignation' });
  const [emailDraft, setEmailDraft] = useState({ subject: 'Relieving Letter - Fintradify', content: '' });
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const selectedEmployee = employees.find((employee) => employee._id === formData.employeeId);

  const fetchEmployees = async () => {
    const response = await api.get('/employees');
    setEmployees(getRows(response.data).filter((employee) => String(employee.role || 'employee') !== 'admin'));
  };

  const fetchLetters = async () => {
    const response = await api.get('/relieving');
    const rows = getRows(response.data).sort((a, b) => new Date(b.generatedAt || 0) - new Date(a.generatedAt || 0));
    setLetters(rows);
    setPage(1);
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchEmployees(), fetchLetters()]);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading relieving letters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const summary = useMemo(() => ({
    total: letters.length,
    resignation: letters.filter((letter) => letter.reason === 'Resignation').length,
    termination: letters.filter((letter) => letter.reason === 'Termination').length,
    thisMonth: letters.filter((letter) => moment(letter.generatedAt).isSame(moment(), 'month')).length,
  }), [letters]);

  const filteredLetters = useMemo(() => {
    const query = search.trim().toLowerCase();
    return letters.filter((letter) => {
      const text = `${letter.employee?.name || ''} ${letter.employee?.employeeId || ''} ${letter.employee?.email || ''} ${letter.position || ''} ${letter.department || ''}`.toLowerCase();
      return (reasonFilter === 'all' || letter.reason === reasonFilter) && (!query || text.includes(query));
    });
  }, [letters, search, reasonFilter]);

  const paginatedLetters = filteredLetters.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    setPage(1);
  }, [search, reasonFilter, limit]);

  const handleGenerate = async (event) => {
    event.preventDefault();
    if (!formData.employeeId || !formData.relievingDate) {
      setError('Please select employee and relieving date');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/relieving/generate', formData);
      setSuccess(response.data?.message || 'Relieving letter generated and emailed successfully');
      setError('');
      setFormData({ employeeId: '', relievingDate: '', reason: 'Resignation' });
      await fetchLetters();
    } catch (err) {
      setSuccess('');
      setError(err.response?.data?.message || 'Error generating relieving letter');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (letterId) => {
    if (!window.confirm('Delete this relieving letter?')) return;
    try {
      await api.delete(`/relieving/${letterId}`);
      setSuccess('Relieving letter deleted successfully');
      setError('');
      await fetchLetters();
    } catch (err) {
      setSuccess('');
      setError(err.response?.data?.message || 'Error deleting relieving letter');
    }
  };

  const openEmailModal = (letter) => {
    setSelectedLetter(letter);
    setEmailDraft({
      subject: 'Relieving Letter - Fintradify',
      content: `Dear ${letter.employee?.name || 'Employee'},\n\nYour relieving letter has been generated and is available for download.\n\nWe appreciate your contribution to Fintradify and wish you success in your future career.\n\nRegards,\nFintradify HR Team`,
    });
    setShowEmailModal(true);
  };

  const handleSendEmail = async () => {
    if (!selectedLetter || !emailDraft.content.trim()) {
      setError('Please enter email content');
      return;
    }

    try {
      await api.post('/relieving/send-email', {
        letterId: selectedLetter._id,
        subject: emailDraft.subject,
        content: emailDraft.content,
      });
      setSuccess('Custom email sent successfully');
      setError('');
      setShowEmailModal(false);
      setSelectedLetter(null);
    } catch (err) {
      setSuccess('');
      setError(err.response?.data?.message || 'Error sending custom email');
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
        .doc-grid { display:grid; grid-template-columns:minmax(320px,.75fr) minmax(0,1.25fr); gap:1rem; align-items:start; }
        .doc-stat-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:.85rem; }
        .doc-stat { padding:.95rem; }
        .doc-stat span { display:block; color:#64748b; font-size:.74rem; font-weight:900; text-transform:uppercase; }
        .doc-stat strong { display:block; margin-top:.25rem; font-size:1.45rem; }
        .doc-panel { padding:1rem; }
        .doc-panel-head { display:flex; align-items:center; justify-content:space-between; gap:1rem; margin-bottom:1rem; }
        .doc-panel-title { margin:0; font-size:1.05rem; font-weight:900; }
        .doc-controls { display:grid; grid-template-columns:minmax(190px,1fr) 160px; gap:.75rem; margin-bottom:1rem; }
        .doc-page .form-label { color:#334155; font-size:.76rem; font-weight:900; text-transform:uppercase; }
        .doc-page .form-control,.doc-page .form-select { border:1px solid #dbe3ef; border-radius:.65rem; color:#0f172a; font-weight:600; min-height:42px; }
        .doc-page .form-control:focus,.doc-page .form-select:focus { border-color:#93c5fd; box-shadow:0 0 0 .2rem rgba(37,99,235,.1); }
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
        .doc-person strong,.doc-date strong { display:block; color:#0f172a; }
        .doc-person span,.doc-date span,.doc-muted { color:#64748b; font-size:.84rem; font-weight:600; }
        .doc-empty { min-height:220px; display:flex; align-items:center; justify-content:center; text-align:center; padding:1rem; color:#64748b; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:.8rem; font-weight:700; }
        @media(max-width:1100px){ .doc-grid,.doc-hero{grid-template-columns:1fr}.doc-stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))} }
        @media(max-width:760px){ .doc-controls{grid-template-columns:1fr}.doc-panel-head{align-items:flex-start;flex-direction:column}.doc-table-wrap{overflow-x:auto} }
        @media(max-width:560px){ .doc-stat-grid{grid-template-columns:1fr}.doc-panel,.doc-hero{padding:.85rem}.doc-action-btn{width:100%} }
      `}</style>

      <section className="doc-hero">
        <div>
          <p className="doc-eyebrow">Exit documents</p>
          <h2 className="doc-title">Relieving Letter</h2>
          <p className="doc-subtitle">Generate, email, download, and manage employee relieving letters from live records.</p>
        </div>
        <Button className="doc-action-btn" variant="outline-primary" onClick={refreshData} disabled={loading}>Refresh</Button>
      </section>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <section className="doc-stat-grid">
        <div className="doc-stat"><span>Total Letters</span><strong>{summary.total}</strong></div>
        <div className="doc-stat"><span>This Month</span><strong>{summary.thisMonth}</strong></div>
        <div className="doc-stat"><span>Resignation</span><strong>{summary.resignation}</strong></div>
        <div className="doc-stat"><span>Termination</span><strong>{summary.termination}</strong></div>
      </section>

      <section className="doc-grid">
        <div className="doc-panel">
          <h3 className="doc-panel-title mb-3">Generate letter</h3>
          <Form onSubmit={handleGenerate}>
            <Row className="g-3">
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Employee</Form.Label>
                  <Form.Select value={formData.employeeId} onChange={(event) => setFormData({ ...formData, employeeId: event.target.value })} required>
                    <option value="">Select employee</option>
                    {employees.map((employee) => <option key={employee._id} value={employee._id}>{employee.employeeId} - {employee.name}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Relieving Date</Form.Label>
                  <Form.Control type="date" value={formData.relievingDate} onChange={(event) => setFormData({ ...formData, relievingDate: event.target.value })} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Reason</Form.Label>
                  <Form.Select value={formData.reason} onChange={(event) => setFormData({ ...formData, reason: event.target.value })}>
                    <option value="Resignation">Resignation</option>
                    <option value="Termination">Termination</option>
                    <option value="Retirement">Retirement</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <div className="doc-preview">
              <div className="doc-preview-row"><span>Employee</span><strong>{selectedEmployee ? `${selectedEmployee.name} (${selectedEmployee.employeeId})` : 'Not selected'}</strong></div>
              <div className="doc-preview-row"><span>Department</span><strong>{selectedEmployee?.department || 'N/A'}</strong></div>
              <div className="doc-preview-row"><span>Date</span><strong>{moneyDate(formData.relievingDate)}</strong></div>
            </div>
            <Button className="doc-action-btn" type="submit" disabled={submitting || loading}>{submitting ? 'Generating...' : 'Generate Relieving Letter'}</Button>
          </Form>
        </div>

        <div className="doc-panel">
          <div className="doc-panel-head">
            <div>
              <h3 className="doc-panel-title">Generated letters</h3>
              <p className="doc-subtitle">{filteredLetters.length} records, latest first</p>
            </div>
          </div>
          <div className="doc-controls">
            <Form.Control value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employee, email, department" />
            <Form.Select value={reasonFilter} onChange={(event) => setReasonFilter(event.target.value)}>
              <option value="all">All reasons</option>
              <option value="Resignation">Resignation</option>
              <option value="Termination">Termination</option>
              <option value="Retirement">Retirement</option>
              <option value="Other">Other</option>
            </Form.Select>
          </div>
          {loading ? <div className="doc-empty"><Spinner animation="border" size="sm" className="me-2" /> Loading letters...</div> : (
            <>
              <div className="doc-table-wrap table-responsive">
                <Table hover>
                  <thead><tr><th>Employee</th><th>Relieving</th><th>Reason</th><th>Generated</th><th>Actions</th></tr></thead>
                  <tbody>
                    {paginatedLetters.length ? paginatedLetters.map((letter, index) => (
                      <tr key={letter._id}>
                        <td><div className="doc-person"><div className="doc-avatar">{String(letter.employee?.name || 'E').charAt(0).toUpperCase()}</div><div><strong>{letter.employee?.name || 'N/A'}</strong><span>{letter.employee?.employeeId || 'N/A'} - {letter.employee?.email || 'N/A'}</span></div></div></td>
                        <td><div className="doc-date"><strong>{moneyDate(letter.relievingDate)}</strong><span>{letter.position || 'N/A'} / {letter.department || 'N/A'}</span>{page === 1 && index === 0 && <Badge bg="success" className="mt-1">Latest</Badge>}</div></td>
                        <td><Badge bg="secondary">{letter.reason || 'N/A'}</Badge></td>
                        <td>{letter.generatedAt ? moment(letter.generatedAt).format('DD MMM YYYY, hh:mm A') : 'N/A'}</td>
                        <td>
                          <Button className="doc-action-btn me-2" size="sm" variant="outline-primary" href={letter.letterUrl} target="_blank" rel="noopener noreferrer" disabled={!letter.letterUrl}>Download</Button>
                          <Button className="doc-action-btn me-2" size="sm" variant="outline-secondary" onClick={() => openEmailModal(letter)}>Email</Button>
                          <Button className="doc-action-btn" size="sm" variant="outline-danger" onClick={() => handleDelete(letter._id)}>Delete</Button>
                        </td>
                      </tr>
                    )) : <tr><td colSpan="5" className="text-center text-muted py-4">No relieving letters found</td></tr>}
                  </tbody>
                </Table>
              </div>
              {filteredLetters.length > limit && <PaginationControls page={page} limit={limit} total={filteredLetters.length} label="relieving letters" onPageChange={setPage} onLimitChange={(nextLimit) => { setLimit(nextLimit); setPage(1); }} />}
            </>
          )}
        </div>
      </section>

      <Modal show={showEmailModal} onHide={() => setShowEmailModal(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title>Customize Email</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3"><Form.Label>Subject</Form.Label><Form.Control value={emailDraft.subject} onChange={(event) => setEmailDraft({ ...emailDraft, subject: event.target.value })} /></Form.Group>
          <Form.Group><Form.Label>Email Content</Form.Label><Form.Control as="textarea" rows={10} value={emailDraft.content} onChange={(event) => setEmailDraft({ ...emailDraft, content: event.target.value })} /></Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowEmailModal(false)}>Cancel</Button>
          <Button onClick={handleSendEmail}>Send Email</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default RelievingLetter;
