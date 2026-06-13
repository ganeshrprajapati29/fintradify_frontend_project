import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Col, Form, Row, Spinner, Table } from 'react-bootstrap';
import moment from 'moment';
import api from '../utils/axios';

const getRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const documentTypes = [
  { value: 'aadhaar', label: 'Aadhaar Card' },
  { value: 'pan', label: 'PAN Card' },
  { value: 'resume', label: 'Resume' },
  { value: 'photo', label: 'Photo' },
  { value: 'bank', label: 'Bank Proof' },
  { value: 'education', label: 'Education Document' },
  { value: 'experience', label: 'Experience Document' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'other', label: 'Other' },
];

const statusMeta = {
  submitted: { label: 'Submitted', variant: 'primary' },
  under_review: { label: 'Under Review', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
};

const formatSize = (bytes) => {
  const value = Number(bytes) || 0;
  if (!value) return 'N/A';
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const DocumentSubmission = ({ isAdmin = false }) => {
  const [documents, setDocuments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({ employeeId: '', documentType: 'aadhaar', title: '', description: '' });
  const [file, setFile] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const requests = isAdmin ? [api.get('/document-submissions'), api.get('/employees')] : [api.get('/document-submissions/my')];
      const responses = await Promise.all(requests);
      setDocuments(getRows(responses[0].data));
      if (isAdmin) setEmployees(getRows(responses[1].data).filter((employee) => String(employee.role || 'employee') !== 'admin'));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load document submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdmin]);

  const stats = useMemo(() => documents.reduce((acc, item) => {
    acc.total += 1;
    acc[item.status || 'submitted'] = (acc[item.status || 'submitted'] || 0) + 1;
    return acc;
  }, { total: 0, submitted: 0, under_review: 0, approved: 0, rejected: 0 }), [documents]);

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return documents.filter((item) => {
      const status = item.status || 'submitted';
      const text = `${item.title || ''} ${item.documentType || ''} ${item.employee?.name || ''} ${item.employee?.employeeId || ''} ${item.employee?.email || ''}`.toLowerCase();
      return (statusFilter === 'all' || status === statusFilter) && (!query || text.includes(query));
    });
  }, [documents, search, statusFilter]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.title.trim() || !formData.documentType || !file) {
      setError('Please enter title, document type, and upload a file.');
      return;
    }

    const payload = new FormData();
    payload.append('documentType', formData.documentType);
    payload.append('title', formData.title);
    payload.append('description', formData.description || '');
    if (isAdmin && formData.employeeId) payload.append('employeeId', formData.employeeId);
    payload.append('document', file);

    setSubmitting(true);
    try {
      const response = await api.post('/document-submissions', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess(response.data?.message || 'Document submitted successfully');
      setError('');
      setFormData({ employeeId: '', documentType: 'aadhaar', title: '', description: '' });
      setFile(null);
      await fetchData();
    } catch (err) {
      setSuccess('');
      setError(err.response?.data?.message || 'Error submitting document');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (documentId, status) => {
    const adminComment = window.prompt('Admin comment (optional):', '');
    try {
      await api.put(`/document-submissions/${documentId}/status`, { status, adminComment: adminComment || '' });
      setSuccess('Document status updated successfully');
      setError('');
      await fetchData();
    } catch (err) {
      setSuccess('');
      setError(err.response?.data?.message || 'Error updating document status');
    }
  };

  const deleteDocument = async (documentId) => {
    if (!window.confirm('Delete this document submission?')) return;
    try {
      await api.delete(`/document-submissions/${documentId}`);
      setSuccess('Document deleted successfully');
      setError('');
      await fetchData();
    } catch (err) {
      setSuccess('');
      setError(err.response?.data?.message || 'Error deleting document');
    }
  };

  return (
    <div className="document-page">
      <style>{`
        .document-page{display:grid;gap:1rem;color:#0f172a}
        .document-hero,.document-panel,.document-stat{background:#fff;border:1px solid #e2e8f0;border-radius:.85rem;box-shadow:0 14px 34px rgba(15,23,42,.07)}
        .document-hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:1rem;align-items:center;padding:1.15rem;background:linear-gradient(135deg,#fff,#eff6ff)}
        .document-eyebrow{margin:0;color:#1d4ed8;font-size:.75rem;font-weight:900;text-transform:uppercase;letter-spacing:.08em}
        .document-title{margin:.25rem 0;font-size:clamp(1.45rem,3vw,2.1rem);font-weight:900;color:#0f172a}
        .document-subtitle{margin:0;color:#64748b;font-weight:600}
        .document-grid{display:grid;grid-template-columns:minmax(330px,.78fr) minmax(0,1.22fr);gap:1rem;align-items:start}
        .document-stat-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:.85rem}
        .document-stat{padding:.95rem}.document-stat span{display:block;color:#64748b;font-size:.73rem;font-weight:900;text-transform:uppercase}.document-stat strong{display:block;margin-top:.25rem;font-size:1.4rem}
        .document-panel{padding:1rem}.document-panel-title{font-size:1.05rem;font-weight:900;margin:0 0 .8rem}
        .document-page .form-label{font-size:.75rem;font-weight:900;text-transform:uppercase;color:#334155}
        .document-page .form-control,.document-page .form-select{border:1px solid #dbe3ef;border-radius:.65rem;min-height:42px;font-weight:600;color:#0f172a}
        .document-actions{display:flex;gap:.5rem;flex-wrap:wrap}.document-action-btn{border-radius:.65rem;font-weight:800;min-height:38px}
        .document-controls{display:grid;grid-template-columns:minmax(180px,1fr) 150px auto;gap:.75rem;margin-bottom:1rem}
        .document-table-wrap{border:1px solid #e2e8f0;border-radius:.8rem;overflow:hidden}.document-table-wrap table{margin:0}
        .document-table-wrap th{background:#f8fafc;color:#475569;font-size:.72rem;font-weight:900;text-transform:uppercase;white-space:nowrap;padding:.85rem}.document-table-wrap td{vertical-align:middle;color:#334155;padding:.85rem}
        .document-person{display:flex;align-items:center;gap:.75rem;min-width:220px}.document-avatar{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:#dbeafe;color:#1d4ed8;font-weight:900;overflow:hidden}.document-avatar img{width:100%;height:100%;object-fit:cover}
        .document-person strong,.document-role strong{display:block;color:#0f172a}.document-person span,.document-role span{color:#64748b;font-size:.84rem;font-weight:600}
        .document-empty{min-height:220px;display:flex;align-items:center;justify-content:center;text-align:center;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:.8rem;color:#64748b;font-weight:800}
        @media(max-width:1180px){.document-grid,.document-hero{grid-template-columns:1fr}.document-stat-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
        @media(max-width:760px){.document-controls{grid-template-columns:1fr}.document-table-wrap{overflow-x:auto}.document-stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:560px){.document-stat-grid{grid-template-columns:1fr}.document-panel,.document-hero{padding:.85rem}}
      `}</style>

      <section className="document-hero">
        <div>
          <p className="document-eyebrow">{isAdmin ? 'Document review' : 'Employee documents'}</p>
          <h2 className="document-title">{isAdmin ? 'Document Submissions' : 'Submit Documents'}</h2>
          <p className="document-subtitle">{isAdmin ? 'Review employee uploads, download files, approve or reject submitted documents.' : 'Upload required HR documents securely. Files are stored on Cloudinary and tracked by HR.'}</p>
        </div>
        <Button className="document-action-btn" variant="outline-primary" onClick={fetchData} disabled={loading}>Refresh</Button>
      </section>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <section className="document-stat-grid">
        <div className="document-stat"><span>Total</span><strong>{stats.total}</strong></div>
        <div className="document-stat"><span>Submitted</span><strong>{stats.submitted || 0}</strong></div>
        <div className="document-stat"><span>Review</span><strong>{stats.under_review || 0}</strong></div>
        <div className="document-stat"><span>Approved</span><strong>{stats.approved || 0}</strong></div>
        <div className="document-stat"><span>Rejected</span><strong>{stats.rejected || 0}</strong></div>
      </section>

      <section className="document-grid">
        <div className="document-panel">
          <h3 className="document-panel-title">{isAdmin ? 'Upload on behalf of employee' : 'Upload new document'}</h3>
          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              {isAdmin && (
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label>Employee</Form.Label>
                    <Form.Select value={formData.employeeId} onChange={(event) => setFormData({ ...formData, employeeId: event.target.value })}>
                      <option value="">Use my admin account</option>
                      {employees.map((employee) => <option key={employee._id} value={employee._id}>{employee.employeeId} - {employee.name}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}
              <Col md={6}><Form.Group><Form.Label>Document Type</Form.Label><Form.Select value={formData.documentType} onChange={(event) => setFormData({ ...formData, documentType: event.target.value })}>{documentTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</Form.Select></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Title</Form.Label><Form.Control value={formData.title} onChange={(event) => setFormData({ ...formData, title: event.target.value })} placeholder="PAN card, marksheet, resume" required /></Form.Group></Col>
              <Col xs={12}><Form.Group><Form.Label>Document File</Form.Label><Form.Control type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" onChange={(event) => setFile(event.target.files?.[0] || null)} required /></Form.Group></Col>
              <Col xs={12}><Form.Group><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={3} value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} placeholder="Add document number, purpose, or HR note" /></Form.Group></Col>
            </Row>
            <div className="document-actions mt-3">
              <Button className="document-action-btn" type="submit" disabled={submitting || loading}>{submitting ? 'Uploading...' : 'Submit Document'}</Button>
              {file && <Button className="document-action-btn" type="button" variant="outline-secondary" onClick={() => setFile(null)}>Clear File</Button>}
            </div>
          </Form>
        </div>

        <div className="document-panel">
          <div className="document-controls">
            <Form.Control value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employee, title, type, email" />
            <Form.Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All status</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </Form.Select>
            <Button className="document-action-btn" variant="outline-secondary" onClick={() => { setSearch(''); setStatusFilter('all'); }}>Clear</Button>
          </div>

          {loading ? <div className="document-empty"><Spinner animation="border" size="sm" className="me-2" /> Loading documents...</div> : (
            <div className="document-table-wrap table-responsive">
              <Table hover>
                <thead><tr><th>Employee</th><th>Document</th><th>File</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredDocuments.length ? filteredDocuments.map((item) => {
                    const meta = statusMeta[item.status || 'submitted'] || statusMeta.submitted;
                    return (
                      <tr key={item._id}>
                        <td><div className="document-person"><div className="document-avatar">{item.employee?.profilePhoto ? <img src={item.employee.profilePhoto} alt={item.employee?.name || 'Employee'} /> : String(item.employee?.name || 'E').charAt(0).toUpperCase()}</div><div><strong>{item.employee?.name || 'N/A'}</strong><span>{item.employee?.employeeId || 'N/A'} - {item.employee?.email || 'N/A'}</span></div></div></td>
                        <td><div className="document-role"><strong>{item.title || 'Untitled'}</strong><span>{documentTypes.find((type) => type.value === item.documentType)?.label || item.documentType} {item.description ? `- ${item.description}` : ''}</span></div></td>
                        <td><div className="document-role"><strong>{item.fileName || 'Uploaded file'}</strong><span>{item.fileType || 'N/A'} / {formatSize(item.fileSize)}</span></div></td>
                        <td><Badge bg={meta.variant}>{meta.label}</Badge>{item.adminComment && <div className="text-muted small mt-1">{item.adminComment}</div>}</td>
                        <td>{item.createdAt ? moment(item.createdAt).format('DD MMM YYYY') : 'N/A'}</td>
                        <td>
                          <div className="document-actions">
                            <Button className="document-action-btn" size="sm" variant="outline-primary" href={item.fileUrl} target="_blank" rel="noopener noreferrer">Download</Button>
                            {isAdmin && <Button className="document-action-btn" size="sm" variant="outline-warning" onClick={() => updateStatus(item._id, 'under_review')}>Review</Button>}
                            {isAdmin && <Button className="document-action-btn" size="sm" variant="outline-success" onClick={() => updateStatus(item._id, 'approved')}>Approve</Button>}
                            {isAdmin && <Button className="document-action-btn" size="sm" variant="outline-danger" onClick={() => updateStatus(item._id, 'rejected')}>Reject</Button>}
                            {(isAdmin || item.status === 'submitted') && <Button className="document-action-btn" size="sm" variant="outline-danger" onClick={() => deleteDocument(item._id)}>Delete</Button>}
                          </div>
                        </td>
                      </tr>
                    );
                  }) : <tr><td colSpan="6" className="text-center text-muted py-4">No document submissions found.</td></tr>}
                </tbody>
              </Table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default DocumentSubmission;
