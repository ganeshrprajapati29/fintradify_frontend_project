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
const defaultBenefits = [
  'Health insurance coverage as per company policy.',
  'Provident Fund and statutory benefits, wherever applicable.',
  'Leave, holidays, and reimbursements as per HR policy.',
  'Performance-linked rewards subject to company and individual performance.',
].join('\n');

const defaultTerms = '';

const initialFormData = {
  employeeId: '',
  position: '',
  department: '',
  joiningDate: '',
  salary: '',
  compensationType: 'salary',
  documentType: 'offer',
  salaryStructureLabel: 'Monthly Salary + Incentives',
  salaryCondition: 'The variable part of your salary will be based on your performance and targets. Incentives will be reviewed and adjusted quarterly.',
  reportingManager: '',
  workLocation: 'Noida, Uttar Pradesh',
  workingHours: '10:00 AM to 6:00 PM',
  employmentType: 'Full-time',
  probationPeriod: '6',
  noticePeriod: '30',
  offerValidityDays: '7',
  logoUrl: '',
  companyAddress: 'C6, C Block, Sector 7, Noida, Uttar Pradesh 201301',
  companyEmail: 'support@fintradify.com',
  companyPhone: '+91 78360 09907',
  companyWebsite: 'www.fintradify.com',
  customIntro: '',
  responsibilities: '',
  benefits: defaultBenefits,
  termsMode: 'append',
  terms: defaultTerms,
  closingNote: 'Please sign and return a copy of this letter or confirm acceptance over official email. We look forward to welcoming you to the Fintradify team.',
};

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
  const [formData, setFormData] = useState(initialFormData);
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

  const splitLines = (value) => String(value || '').split(/\r?\n/).map((item) => item.trim().replace(/^[-*]\s*/, '')).filter(Boolean);

  const handleGenerate = async (event) => {
    event.preventDefault();
    if (!formData.employeeId || !formData.position || !formData.department || !formData.joiningDate) {
      setError('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        salary: Number(formData.salary) || 0,
        probationPeriod: Number(formData.probationPeriod) || 6,
        noticePeriod: Number(formData.noticePeriod) || 30,
        offerValidityDays: Number(formData.offerValidityDays) || 7,
        benefits: splitLines(formData.benefits),
        terms: splitLines(formData.terms),
      };
      const response = await api.post('/offer/generate', payload);
      setSuccess(response.data?.message || 'Offer letter generated and emailed successfully');
      setError('');
      setFormData(initialFormData);
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

  const previewName = selectedEmployee?.name || 'Candidate Name';
  const previewDate = formData.joiningDate ? moment(formData.joiningDate).format('DD MMMM YYYY') : 'Joining Date';
  const previewCompensation = formData.compensationType === 'unpaid'
    ? 'unpaid unless separately approved in writing'
    : `${money(formData.salary)} (${formData.salaryStructureLabel || (formData.compensationType === 'stipend' ? 'Monthly Stipend' : 'Monthly Salary + Incentives')})`;
  const previewTerms = splitLines(formData.terms).slice(0, 5);

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
        .doc-fieldset { margin-top:1rem; padding-top:1rem; border-top:1px solid #e2e8f0; }
        .doc-fieldset-title { margin:0 0 .75rem; color:#0f172a; font-size:.92rem; font-weight:900; }
        .doc-controls { display:grid; grid-template-columns:minmax(190px,1fr) 150px; gap:.75rem; margin-bottom:1rem; }
        .doc-page .form-label { color:#334155; font-size:.76rem; font-weight:900; text-transform:uppercase; }
        .doc-page .form-control,.doc-page .form-select { border:1px solid #dbe3ef; border-radius:.65rem; color:#0f172a; font-weight:600; min-height:42px; }
        .doc-page textarea.form-control { min-height:96px; resize:vertical; line-height:1.5; }
        .doc-action-btn { border-radius:.65rem; font-weight:800; min-height:42px; }
        .doc-template-note { margin:.5rem 0 0; color:#64748b; font-size:.82rem; font-weight:700; }
        .doc-logo-preview { display:flex; align-items:center; gap:.75rem; padding:.75rem; background:#fff; border:1px dashed #cbd5e1; border-radius:.75rem; min-height:62px; }
        .doc-logo-preview img { max-width:150px; max-height:42px; object-fit:contain; }
        .doc-logo-fallback { width:120px; height:38px; display:grid; place-items:center; border-radius:.5rem; background:#e8f4f7; color:#237282; font-weight:900; }
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
        .offer-preview-wrap { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:.75rem; margin:1rem 0; }
        .offer-preview-sheet { position:relative; aspect-ratio:595/842; overflow:hidden; border:1px solid #dbe3ef; background:#fff center/cover no-repeat; box-shadow:0 12px 26px rgba(15,23,42,.08); }
        .offer-preview-page1 { background-image:url('/offer-template-page1.jpg'); }
        .offer-preview-page2 { background-image:url('/offer-template-page2.jpg'); }
        .offer-preview-clean-main { position:absolute; left:7.5%; top:13.3%; width:84.8%; height:71.8%; background:#fff; }
        .offer-preview-clean-contact { position:absolute; left:17%; top:68.2%; width:68%; height:14.6%; background:#fff; }
        .offer-preview-clean-continue { position:absolute; left:9.2%; top:13.3%; width:84%; height:67.9%; background:#fff; }
        .offer-preview-text { position:absolute; z-index:2; color:#050505; font-family:Arial,Helvetica,sans-serif; line-height:1.2; }
        .offer-preview-title { left:0; top:15%; width:100%; text-align:center; font-size:1.05rem; font-weight:900; }
        .offer-preview-body { left:10.6%; top:21.5%; width:78.8%; font-size:.45rem; display:grid; gap:.35rem; }
        .offer-preview-body strong { font-weight:900; }
        .offer-preview-list { margin:.15rem 0 0; padding-left:.7rem; display:grid; gap:.12rem; }
        .offer-preview-final { left:10.3%; top:48.5%; width:78%; font-size:.48rem; }
        .offer-preview-contact { left:17.4%; top:69.4%; width:62%; font-size:.5rem; display:grid; gap:.72rem; }
        @media(max-width:1180px){ .doc-grid,.doc-hero{grid-template-columns:1fr}.doc-stat-grid{grid-template-columns:repeat(3,minmax(0,1fr))} }
        @media(max-width:1180px){ .offer-preview-wrap{grid-template-columns:repeat(2,minmax(0,1fr))} }
        @media(max-width:760px){ .doc-controls,.offer-preview-wrap{grid-template-columns:1fr}.doc-panel-head{align-items:flex-start;flex-direction:column}.doc-table-wrap{overflow-x:auto}.doc-stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))} }
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
              <Col md={6}><Form.Group><Form.Label>Compensation Amount</Form.Label><Form.Control type="number" min="0" value={formData.salary} onChange={(event) => setFormData({ ...formData, salary: event.target.value })} placeholder="Leave blank or 0 for unpaid internship" /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Reporting Manager</Form.Label><Form.Control value={formData.reportingManager} onChange={(event) => setFormData({ ...formData, reportingManager: event.target.value })} placeholder="HR Manager" /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Work Location</Form.Label><Form.Control value={formData.workLocation} onChange={(event) => setFormData({ ...formData, workLocation: event.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Working Hours</Form.Label><Form.Control value={formData.workingHours} onChange={(event) => setFormData({ ...formData, workingHours: event.target.value })} /></Form.Group></Col>
            </Row>
            <div className="doc-fieldset">
              <h4 className="doc-fieldset-title">Offer controls</h4>
              <Row className="g-3">
                <Col md={4}><Form.Group><Form.Label>Document Type</Form.Label><Form.Select value={formData.documentType} onChange={(event) => setFormData({ ...formData, documentType: event.target.value })}><option value="offer">Offer Letter</option><option value="appointment">Appointment Letter</option></Form.Select></Form.Group></Col>
                <Col md={4}><Form.Group><Form.Label>Compensation Type</Form.Label><Form.Select value={formData.compensationType} onChange={(event) => setFormData({ ...formData, compensationType: event.target.value, salaryStructureLabel: event.target.value === 'stipend' ? 'Monthly Stipend' : event.target.value === 'unpaid' ? 'Unpaid Internship' : formData.salaryStructureLabel })}><option value="salary">Salary</option><option value="stipend">Stipend</option><option value="unpaid">Unpaid / No Salary</option><option value="custom">Custom</option></Form.Select></Form.Group></Col>
                <Col md={4}><Form.Group><Form.Label>Employment Type</Form.Label><Form.Select value={formData.employmentType} onChange={(event) => setFormData({ ...formData, employmentType: event.target.value })}><option>Full-time</option><option>Internship</option><option>Contract</option><option>Part-time</option><option>Consultant</option></Form.Select></Form.Group></Col>
                <Col md={4}><Form.Group><Form.Label>Probation Months</Form.Label><Form.Control type="number" min="0" value={formData.probationPeriod} onChange={(event) => setFormData({ ...formData, probationPeriod: event.target.value })} /></Form.Group></Col>
                <Col md={4}><Form.Group><Form.Label>Notice Days</Form.Label><Form.Control type="number" min="0" value={formData.noticePeriod} onChange={(event) => setFormData({ ...formData, noticePeriod: event.target.value })} /></Form.Group></Col>
                <Col md={4}><Form.Group><Form.Label>Offer Valid Days</Form.Label><Form.Control type="number" min="1" value={formData.offerValidityDays} onChange={(event) => setFormData({ ...formData, offerValidityDays: event.target.value })} /></Form.Group></Col>
                <Col md={8}><Form.Group><Form.Label>Salary Structure Label</Form.Label><Form.Control value={formData.salaryStructureLabel} onChange={(event) => setFormData({ ...formData, salaryStructureLabel: event.target.value })} placeholder="Monthly Salary + Incentives" /></Form.Group></Col>
                <Col xs={12}><Form.Group><Form.Label>Salary Structure Condition</Form.Label><Form.Control as="textarea" value={formData.salaryCondition} onChange={(event) => setFormData({ ...formData, salaryCondition: event.target.value })} placeholder="Variable pay, incentive, deduction, review, or salary confidentiality condition" /></Form.Group></Col>
              </Row>
            </div>
            <div className="doc-fieldset">
              <h4 className="doc-fieldset-title">Branding and company details</h4>
              <Row className="g-3">
                <Col xs={12}><Form.Group><Form.Label>Logo URL</Form.Label><Form.Control value={formData.logoUrl} onChange={(event) => setFormData({ ...formData, logoUrl: event.target.value })} placeholder="Optional public logo URL, default Fintradify logo used" /><p className="doc-template-note">Leave blank to use the uploaded Fintradify logo from backend assets.</p></Form.Group></Col>
                <Col xs={12}>
                  <div className="doc-logo-preview">
                    {formData.logoUrl ? <img src={formData.logoUrl} alt="Offer logo preview" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <img src="/fintradify-logo.png" alt="Fintradify logo preview" onError={(event) => { event.currentTarget.style.display = 'none'; }} />}
                    <span className="doc-muted">PDF header logo preview</span>
                  </div>
                </Col>
                <Col xs={12}><Form.Group><Form.Label>Company Address</Form.Label><Form.Control value={formData.companyAddress} onChange={(event) => setFormData({ ...formData, companyAddress: event.target.value })} /></Form.Group></Col>
                <Col md={4}><Form.Group><Form.Label>Company Email</Form.Label><Form.Control value={formData.companyEmail} onChange={(event) => setFormData({ ...formData, companyEmail: event.target.value })} /></Form.Group></Col>
                <Col md={4}><Form.Group><Form.Label>Company Phone</Form.Label><Form.Control value={formData.companyPhone} onChange={(event) => setFormData({ ...formData, companyPhone: event.target.value })} /></Form.Group></Col>
                <Col md={4}><Form.Group><Form.Label>Website</Form.Label><Form.Control value={formData.companyWebsite} onChange={(event) => setFormData({ ...formData, companyWebsite: event.target.value })} /></Form.Group></Col>
              </Row>
            </div>
            <div className="doc-fieldset">
              <h4 className="doc-fieldset-title">Letter content</h4>
              <Row className="g-3">
                <Col xs={12}><Form.Group><Form.Label>Custom Intro</Form.Label><Form.Control as="textarea" value={formData.customIntro} onChange={(event) => setFormData({ ...formData, customIntro: event.target.value })} placeholder="Optional opening paragraph; leave blank for default offer paragraph" /></Form.Group></Col>
                <Col xs={12}><Form.Group><Form.Label>Role Expectations</Form.Label><Form.Control as="textarea" value={formData.responsibilities} onChange={(event) => setFormData({ ...formData, responsibilities: event.target.value })} placeholder="Department specific duties, reporting cadence, working hours, or goals" /></Form.Group></Col>
                <Col xs={12}><Form.Group><Form.Label>Benefits</Form.Label><Form.Control as="textarea" rows={5} value={formData.benefits} onChange={(event) => setFormData({ ...formData, benefits: event.target.value })} placeholder="One benefit per line" /></Form.Group></Col>
                <Col md={6}><Form.Group><Form.Label>Terms Mode</Form.Label><Form.Select value={formData.termsMode} onChange={(event) => setFormData({ ...formData, termsMode: event.target.value })}><option value="append">Append to standard terms</option><option value="replace">Replace standard terms</option></Form.Select></Form.Group></Col>
                <Col xs={12}><Form.Group><Form.Label>Custom Terms & Conditions</Form.Label><Form.Control as="textarea" rows={10} value={formData.terms} onChange={(event) => setFormData({ ...formData, terms: event.target.value })} placeholder="One term per line. Add as many as needed; PDF pages continue automatically." /><p className="doc-template-note">Append mode keeps the standard appointment terms and adds your custom points after them.</p></Form.Group></Col>
                <Col xs={12}><Form.Group><Form.Label>Closing Note</Form.Label><Form.Control as="textarea" value={formData.closingNote} onChange={(event) => setFormData({ ...formData, closingNote: event.target.value })} /></Form.Group></Col>
              </Row>
            </div>
            <div className="doc-preview">
              <div className="doc-preview-row"><span>Employee</span><strong>{selectedEmployee ? `${selectedEmployee.name} (${selectedEmployee.employeeId})` : 'Not selected'}</strong></div>
              <div className="doc-preview-row"><span>Position</span><strong>{formData.position || 'N/A'}</strong></div>
              <div className="doc-preview-row"><span>Compensation</span><strong>{formData.compensationType === 'unpaid' ? 'Unpaid / No Salary' : money(formData.salary)}</strong></div>
              <div className="doc-preview-row"><span>Document</span><strong>{formData.documentType === 'appointment' ? 'Appointment Letter' : 'Offer Letter'}</strong></div>
              <div className="doc-preview-row"><span>Template</span><strong>A4 Modern Blue Template</strong></div>
              <div className="doc-preview-row"><span>Terms</span><strong>{splitLines(formData.terms).length} custom points</strong></div>
            </div>
            <div className="offer-preview-wrap">
              <div className="offer-preview-sheet offer-preview-page1">
                <div className="offer-preview-clean-main" />
                <div className="offer-preview-text offer-preview-title">{formData.documentType === 'appointment' ? 'APPOINTMENT LETTER' : 'OFFER LETTER'}</div>
                <div className="offer-preview-text offer-preview-body">
                  <strong>Date: {moment().format('DD MMMM YYYY')}</strong>
                  <div><strong>To, Mr. {previewName}</strong><br />{selectedEmployee?.address || 'Address not provided'}</div>
                  <div>Dear Mr. {previewName}</div>
                  <div>We are pleased to {formData.documentType === 'appointment' ? 'appoint you with' : 'offer you employment with'} <strong>FinTradify</strong>, for the position of <strong>{formData.position || 'Role'}</strong>.</div>
                  <div>Your employment will be effective from <strong>{previewDate}</strong>. You will be assigned <strong>Employee ID: {selectedEmployee?.employeeId || 'N/A'}</strong>.</div>
                  <div>You will report directly to <strong>{formData.reportingManager || 'HR Manager'}</strong>. Compensation: <strong>{previewCompensation}</strong>.</div>
                  <div>Your working hours will be from <strong>{formData.workingHours || '10:00 AM to 6:00 PM'}</strong>.</div>
                  <ul className="offer-preview-list">
                    {(previewTerms.length ? previewTerms : [
                      `Your appointment will be effective from ${previewDate}`,
                      'You are expected to perform your duties with dedication and professionalism.',
                      'Company terms and policies will apply as amended from time to time.',
                    ]).map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
                  </ul>
                </div>
              </div>
              <div className="offer-preview-sheet offer-preview-page2">
                <div className="offer-preview-clean-continue" />
                <div className="offer-preview-text offer-preview-body" style={{ top: '15%' }}>
                  <ul className="offer-preview-list">
                    {(previewTerms.length ? previewTerms : [
                      'Continued terms and conditions flow here.',
                      'Extra custom terms continue onto clean template pages.',
                      'Signature and contact section stays only on the final page.',
                    ]).map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
                  </ul>
                </div>
              </div>
              <div className="offer-preview-sheet offer-preview-page2">
                <div className="offer-preview-clean-contact" />
                <div className="offer-preview-text offer-preview-final">Wishing you all the best {String(previewName).split(' ')[0] || 'Candidate'},</div>
                <div className="offer-preview-text offer-preview-contact">
                  <div>{formData.companyPhone || '8882385802'}</div>
                  <div>{formData.companyEmail || 'support@fintradify.com'}</div>
                  <div>{formData.companyAddress || 'Office no-105, C-6, Sector 7, Noida'}</div>
                  <div>{formData.companyWebsite || 'https://fintradify.com/'}</div>
                </div>
              </div>
            </div>
            <Button className="doc-action-btn" type="submit" disabled={submitting || loading}>{submitting ? 'Generating...' : `Generate ${formData.documentType === 'appointment' ? 'Appointment' : 'Offer'} Letter`}</Button>
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
