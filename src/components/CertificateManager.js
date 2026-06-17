import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Col, Form, Row, Spinner, Table } from 'react-bootstrap';
import moment from 'moment';
import api from '../utils/axios';

const getRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const initialForm = {
  employeeId: '',
  type: 'internship',
  title: 'Internship Certificate',
  designation: '',
  department: '',
  startDate: '',
  endDate: '',
  issueDate: moment().format('YYYY-MM-DD'),
  workMode: 'On-site',
  performance: 'Excellent',
  managerName: 'HR Manager',
  ceoName: 'CEO',
  description: '',
};

const typeLabels = {
  internship: 'Internship',
  experience: 'Experience',
  employment: 'Employment',
};

const getCertificateDownloadUrl = (certificate) => {
  if (!certificate?.certificateNo) return certificate?.certificateUrl || '#';
  const baseUrl = api.defaults.baseURL || process.env.REACT_APP_API_URL || 'https://crm.fintradify.com/api';
  return `${baseUrl.replace(/\/$/, '')}/certificates/download/${encodeURIComponent(certificate.certificateNo)}`;
};

const getCertificatePreviewUrl = (certificate) => {
  if (!certificate?.certificateNo) return certificate?.certificateUrl || '#';
  const baseUrl = api.defaults.baseURL || process.env.REACT_APP_API_URL || 'https://crm.fintradify.com/api';
  return `${baseUrl.replace(/\/$/, '')}/certificates/preview/${encodeURIComponent(certificate.certificateNo)}`;
};

const CertificateManager = ({ isAdmin = false }) => {
  const [employees, setEmployees] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [editingCertificate, setEditingCertificate] = useState(null);

  const selectedEmployee = employees.find((employee) => employee._id === formData.employeeId);

  const fetchData = async () => {
    setLoading(true);
    try {
      const requests = isAdmin ? [api.get('/employees'), api.get('/certificates')] : [api.get('/certificates/my')];
      const responses = await Promise.all(requests);
      if (isAdmin) {
        setEmployees(getRows(responses[0].data).filter((employee) => String(employee.role || 'employee') !== 'admin'));
        setCertificates(getRows(responses[1].data));
      } else {
        setCertificates(getRows(responses[0].data));
      }
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load certificates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdmin]);

  const stats = useMemo(() => certificates.reduce((acc, certificate) => {
    acc.total += 1;
    acc[certificate.type] = (acc[certificate.type] || 0) + 1;
    if (certificate.verificationStatus === 'valid') acc.valid += 1;
    return acc;
  }, { total: 0, valid: 0, internship: 0, experience: 0, employment: 0 }), [certificates]);

  const filteredCertificates = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return certificates;
    return certificates.filter((certificate) => `${certificate.certificateNo || ''} ${certificate.employee?.name || ''} ${certificate.employee?.employeeId || ''} ${certificate.employee?.email || ''} ${certificate.designation || ''} ${certificate.type || ''}`.toLowerCase().includes(query));
  }, [certificates, search]);

  const setField = (key, value) => {
    const next = { ...formData, [key]: value };
    if (key === 'type') {
      next.title = value === 'internship' ? 'Internship Certificate' : value === 'employment' ? 'Employment Certificate' : 'Experience Certificate';
    }
    setFormData(next);
  };

  const handleEmployeeChange = (employeeId) => {
    const employee = employees.find((item) => item._id === employeeId);
    setFormData({
      ...formData,
      employeeId,
      designation: employee?.position || formData.designation,
      department: employee?.department || formData.department,
      startDate: employee?.joiningDate ? moment(employee.joiningDate).format('YYYY-MM-DD') : formData.startDate,
    });
  };

  const resetForm = () => {
    setFormData(initialForm);
    setFiles({});
    setEditingCertificate(null);
  };

  const startEdit = (certificate) => {
    setEditingCertificate(certificate);
    setFiles({});
    setError('');
    setSuccess('');
    setFormData({
      employeeId: certificate.employee?._id || certificate.employee?.id || certificate.employee || '',
      type: certificate.type || 'internship',
      title: certificate.title || 'Certificate',
      designation: certificate.designation || '',
      department: certificate.department || certificate.employee?.department || '',
      startDate: certificate.startDate ? moment(certificate.startDate).format('YYYY-MM-DD') : '',
      endDate: certificate.endDate ? moment(certificate.endDate).format('YYYY-MM-DD') : '',
      issueDate: certificate.issueDate ? moment(certificate.issueDate).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
      workMode: certificate.workMode || 'On-site',
      performance: certificate.performance || 'Excellent',
      managerName: certificate.managerName || 'HR Manager',
      ceoName: certificate.ceoName || 'CEO',
      description: certificate.description || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerate = async (event) => {
    event.preventDefault();
    if (!formData.employeeId || !formData.type || !formData.designation || !formData.startDate) {
      setError('Please select employee and fill certificate type, designation, and start date.');
      return;
    }

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => payload.append(key, value || ''));
    if (files.managerSignature) payload.append('managerSignature', files.managerSignature);
    if (files.ceoSignature) payload.append('ceoSignature', files.ceoSignature);
    if (files.stamp) payload.append('stamp', files.stamp);

    setSubmitting(true);
    try {
      const response = editingCertificate
        ? await api.put(`/certificates/${editingCertificate._id}`, payload, { headers: { 'Content-Type': 'multipart/form-data' } })
        : await api.post('/certificates/generate', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess(response.data?.message || (editingCertificate ? 'Certificate updated successfully' : 'Certificate generated and emailed successfully'));
      setError('');
      resetForm();
      await fetchData();
    } catch (err) {
      setSuccess('');
      setError(err.response?.data?.message || 'Error generating certificate');
    } finally {
      setSubmitting(false);
    }
  };

  const revokeCertificate = async (certificateId) => {
    const reason = window.prompt('Reason for revoking this certificate:');
    if (!reason) return;
    try {
      await api.put(`/certificates/${certificateId}/revoke`, { reason });
      setSuccess('Certificate revoked successfully');
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error revoking certificate');
    }
  };

  const deleteCertificate = async (certificateId) => {
    if (!window.confirm('Delete this certificate permanently?')) return;
    try {
      await api.delete(`/certificates/${certificateId}`);
      setSuccess('Certificate deleted successfully');
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting certificate');
    }
  };

  return (
    <div className="certificate-page">
      <style>{`
        .certificate-page{display:grid;gap:1rem;color:#0f172a}
        .certificate-hero,.certificate-panel,.certificate-stat{background:#fff;border:1px solid #e2e8f0;border-radius:.85rem;box-shadow:0 14px 34px rgba(15,23,42,.07)}
        .certificate-hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:1rem;align-items:center;padding:1.15rem;background:linear-gradient(135deg,#fff,#f0fdfa)}
        .certificate-eyebrow{margin:0;color:#0f766e;font-size:.75rem;font-weight:900;text-transform:uppercase;letter-spacing:.08em}
        .certificate-title{margin:.25rem 0;font-size:clamp(1.45rem,3vw,2.1rem);font-weight:900;color:#0f172a}
        .certificate-subtitle{margin:0;color:#64748b;font-weight:600}
        .certificate-stat-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:.85rem}
        .certificate-stat{padding:.95rem}.certificate-stat span{display:block;color:#64748b;font-size:.73rem;font-weight:900;text-transform:uppercase}.certificate-stat strong{display:block;margin-top:.25rem;font-size:1.4rem}
        .certificate-grid{display:grid;grid-template-columns:minmax(340px,.82fr) minmax(0,1.18fr);gap:1rem;align-items:start}
        .certificate-panel{padding:1rem}.certificate-panel-title{font-size:1.05rem;font-weight:900;margin:0 0 .8rem}
        .certificate-page .form-label{font-size:.75rem;font-weight:900;text-transform:uppercase;color:#334155}
        .certificate-page .form-control,.certificate-page .form-select{border:1px solid #dbe3ef;border-radius:.65rem;min-height:42px;font-weight:600;color:#0f172a}
        .certificate-preview{display:grid;gap:.45rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:.75rem;padding:.8rem;margin:1rem 0}
        .certificate-preview div{display:flex;justify-content:space-between;gap:1rem;color:#64748b;font-weight:700}.certificate-preview strong{color:#0f172a;text-align:right}
        .certificate-actions{display:flex;gap:.5rem;flex-wrap:wrap}.certificate-action-btn{border-radius:.65rem;font-weight:800;min-height:38px}
        .certificate-controls{display:grid;grid-template-columns:minmax(180px,1fr) auto;gap:.75rem;margin-bottom:1rem}
        .certificate-table-wrap{border:1px solid #e2e8f0;border-radius:.8rem;overflow:hidden}.certificate-table-wrap table{margin:0}
        .certificate-table-wrap th{background:#f8fafc;color:#475569;font-size:.72rem;font-weight:900;text-transform:uppercase;white-space:nowrap;padding:.85rem}.certificate-table-wrap td{vertical-align:middle;color:#334155;padding:.85rem}
        .certificate-person{display:flex;align-items:center;gap:.75rem;min-width:210px}.certificate-avatar{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:#ccfbf1;color:#0f766e;font-weight:900}
        .certificate-person strong,.certificate-role strong{display:block;color:#0f172a}.certificate-person span,.certificate-role span{color:#64748b;font-size:.84rem;font-weight:600}
        .certificate-empty{min-height:220px;display:flex;align-items:center;justify-content:center;text-align:center;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:.8rem;color:#64748b;font-weight:800}
        @media(max-width:1180px){.certificate-grid,.certificate-hero{grid-template-columns:1fr}.certificate-stat-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
        @media(max-width:760px){.certificate-controls{grid-template-columns:1fr}.certificate-table-wrap{overflow-x:auto}.certificate-stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:560px){.certificate-stat-grid{grid-template-columns:1fr}.certificate-panel,.certificate-hero{padding:.85rem}}
      `}</style>

      <section className="certificate-hero">
        <div>
          <p className="certificate-eyebrow">{isAdmin ? 'HR documents' : 'Verified records'}</p>
          <h2 className="certificate-title">{isAdmin ? 'Certificate Generator' : 'My Certificates'}</h2>
          <p className="certificate-subtitle">{isAdmin ? 'Generate one-page A4 certificates with logo watermark, signatures, stamp, email delivery, and QR verification.' : 'Download official QR-verifiable certificates issued by Fintradify HR.'}</p>
        </div>
        <Button className="certificate-action-btn" variant="outline-primary" onClick={fetchData} disabled={loading}>Refresh</Button>
      </section>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <section className="certificate-stat-grid">
        <div className="certificate-stat"><span>Total</span><strong>{stats.total}</strong></div>
        <div className="certificate-stat"><span>Valid</span><strong>{stats.valid}</strong></div>
        <div className="certificate-stat"><span>Internship</span><strong>{stats.internship || 0}</strong></div>
        <div className="certificate-stat"><span>Experience</span><strong>{stats.experience || 0}</strong></div>
        <div className="certificate-stat"><span>Employment</span><strong>{stats.employment || 0}</strong></div>
      </section>

      <section className={isAdmin ? 'certificate-grid' : ''}>
        {isAdmin && (
          <div className="certificate-panel">
            <h3 className="certificate-panel-title">{editingCertificate ? `Edit certificate ${editingCertificate.certificateNo}` : 'Manual certificate details'}</h3>
            <Form onSubmit={handleGenerate}>
              <Row className="g-3">
                <Col xs={12}><Form.Group><Form.Label>Employee</Form.Label><Form.Select value={formData.employeeId} onChange={(event) => handleEmployeeChange(event.target.value)} required><option value="">Select employee</option>{employees.map((employee) => <option key={employee._id} value={employee._id}>{employee.employeeId} - {employee.name}</option>)}</Form.Select></Form.Group></Col>
                <Col md={6}><Form.Group><Form.Label>Type</Form.Label><Form.Select value={formData.type} onChange={(event) => setField('type', event.target.value)}><option value="internship">Internship</option><option value="experience">Experience</option><option value="employment">Employment</option></Form.Select></Form.Group></Col>
                <Col md={6}><Form.Group><Form.Label>Title</Form.Label><Form.Control value={formData.title} onChange={(event) => setField('title', event.target.value)} /></Form.Group></Col>
                <Col md={6}><Form.Group><Form.Label>Designation</Form.Label><Form.Control value={formData.designation} onChange={(event) => setField('designation', event.target.value)} required /></Form.Group></Col>
                <Col md={6}><Form.Group><Form.Label>Department</Form.Label><Form.Control value={formData.department} onChange={(event) => setField('department', event.target.value)} /></Form.Group></Col>
                <Col md={6}><Form.Group><Form.Label>Start Date</Form.Label><Form.Control type="date" value={formData.startDate} onChange={(event) => setField('startDate', event.target.value)} required /></Form.Group></Col>
                <Col md={6}><Form.Group><Form.Label>End Date</Form.Label><Form.Control type="date" value={formData.endDate} onChange={(event) => setField('endDate', event.target.value)} /></Form.Group></Col>
                <Col md={6}><Form.Group><Form.Label>Issue Date</Form.Label><Form.Control type="date" value={formData.issueDate} onChange={(event) => setField('issueDate', event.target.value)} /></Form.Group></Col>
                <Col md={6}><Form.Group><Form.Label>Work Mode</Form.Label><Form.Control value={formData.workMode} onChange={(event) => setField('workMode', event.target.value)} /></Form.Group></Col>
                <Col md={6}><Form.Group><Form.Label>Manager Name</Form.Label><Form.Control value={formData.managerName} onChange={(event) => setField('managerName', event.target.value)} /></Form.Group></Col>
                <Col md={6}><Form.Group><Form.Label>CEO / Signatory Name</Form.Label><Form.Control value={formData.ceoName} onChange={(event) => setField('ceoName', event.target.value)} /></Form.Group></Col>
                <Col md={6}><Form.Group><Form.Label>Manager Signature</Form.Label><Form.Control type="file" accept="image/*" onChange={(event) => setFiles({ ...files, managerSignature: event.target.files?.[0] })} /></Form.Group></Col>
                <Col md={6}><Form.Group><Form.Label>CEO Signature</Form.Label><Form.Control type="file" accept="image/*" onChange={(event) => setFiles({ ...files, ceoSignature: event.target.files?.[0] })} /></Form.Group></Col>
                <Col md={6}><Form.Group><Form.Label>Company Stamp</Form.Label><Form.Control type="file" accept="image/*" onChange={(event) => setFiles({ ...files, stamp: event.target.files?.[0] })} /></Form.Group></Col>
                <Col md={6}><Form.Group><Form.Label>Performance</Form.Label><Form.Control value={formData.performance} onChange={(event) => setField('performance', event.target.value)} /></Form.Group></Col>
                <Col xs={12}><Form.Group><Form.Label>Certificate Text</Form.Label><Form.Control as="textarea" rows={4} value={formData.description} onChange={(event) => setField('description', event.target.value)} placeholder="Write custom appreciation, responsibilities, project work, or experience details." /></Form.Group></Col>
              </Row>
              <div className="certificate-preview">
                <div><span>Employee</span><strong>{selectedEmployee ? `${selectedEmployee.name} (${selectedEmployee.employeeId})` : 'Not selected'}</strong></div>
                <div><span>Document</span><strong>{formData.title}</strong></div>
                <div><span>Period</span><strong>{formData.startDate || 'Start'} to {formData.endDate || 'Present'}</strong></div>
              </div>
              <div className="certificate-actions">
                <Button className="certificate-action-btn" type="submit" disabled={submitting || loading}>
                  {submitting ? (editingCertificate ? 'Saving...' : 'Generating...') : (editingCertificate ? 'Save Changes & Regenerate PDF' : 'Generate A4 Certificate & Email')}
                </Button>
                {editingCertificate && (
                  <Button className="certificate-action-btn" type="button" variant="outline-secondary" onClick={resetForm} disabled={submitting}>
                    Cancel Edit
                  </Button>
                )}
              </div>
            </Form>
          </div>
        )}

        <div className="certificate-panel">
          <div className="certificate-controls">
            <Form.Control value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search certificate, employee, email, type" />
            <Button className="certificate-action-btn" variant="outline-secondary" onClick={() => setSearch('')}>Clear</Button>
          </div>
          {loading ? <div className="certificate-empty"><Spinner animation="border" size="sm" className="me-2" /> Loading certificates...</div> : (
            <div className="certificate-table-wrap table-responsive">
              <Table hover>
                <thead><tr><th>Certificate</th><th>Employee</th><th>Role</th><th>Period</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredCertificates.length ? filteredCertificates.map((certificate) => (
                    <tr key={certificate._id || certificate.certificateNo}>
                      <td><div className="certificate-role"><strong>{certificate.certificateNo}</strong><span>{typeLabels[certificate.type] || certificate.type}</span></div></td>
                      <td><div className="certificate-person"><div className="certificate-avatar">{String(certificate.employee?.name || 'E').charAt(0).toUpperCase()}</div><div><strong>{certificate.employee?.name || 'N/A'}</strong><span>{certificate.employee?.employeeId || 'N/A'} - {certificate.employee?.email || 'N/A'}</span></div></div></td>
                      <td><div className="certificate-role"><strong>{certificate.designation}</strong><span>{certificate.department || certificate.employee?.department || 'N/A'}</span></div></td>
                      <td>{certificate.startDate ? moment(certificate.startDate).format('DD MMM YYYY') : 'N/A'} - {certificate.endDate ? moment(certificate.endDate).format('DD MMM YYYY') : 'Present'}</td>
                      <td><Badge bg={certificate.verificationStatus === 'valid' ? 'success' : 'danger'}>{certificate.verificationStatus || 'valid'}</Badge></td>
                      <td>
                        <div className="certificate-actions">
                          {isAdmin && <Button className="certificate-action-btn" size="sm" variant="outline-dark" onClick={() => startEdit(certificate)}>Edit</Button>}
                          <Button className="certificate-action-btn" size="sm" variant="outline-secondary" href={getCertificatePreviewUrl(certificate)} target="_blank" rel="noopener noreferrer">Preview</Button>
                          <Button className="certificate-action-btn" size="sm" variant="outline-primary" href={getCertificateDownloadUrl(certificate)} target="_blank" rel="noopener noreferrer">Download PDF</Button>
                          <Button className="certificate-action-btn" size="sm" variant="outline-success" href={`/verify-certificate?certificateNo=${encodeURIComponent(certificate.certificateNo)}`} target="_blank" rel="noopener noreferrer">Verify</Button>
                          {isAdmin && certificate.verificationStatus === 'valid' && <Button className="certificate-action-btn" size="sm" variant="outline-warning" onClick={() => revokeCertificate(certificate._id)}>Revoke</Button>}
                          {isAdmin && <Button className="certificate-action-btn" size="sm" variant="outline-danger" onClick={() => deleteCertificate(certificate._id)}>Delete</Button>}
                        </div>
                      </td>
                    </tr>
                  )) : <tr><td colSpan="6" className="text-center text-muted py-4">No certificates found.</td></tr>}
                </tbody>
              </Table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CertificateManager;
