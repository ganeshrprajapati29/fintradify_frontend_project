import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Spinner, Table } from 'react-bootstrap';
import { FaCertificate, FaCheckCircle, FaExclamationTriangle, FaFileAlt, FaIdCard, FaRedo, FaShieldAlt } from 'react-icons/fa';
import api from '../utils/axios';

const getRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.records)) return payload.records;
  return [];
};

const getStatus = (value) => String(value || '').trim().toLowerCase();

const AdminComplianceCenter = ({ onNavigate }) => {
  const [records, setRecords] = useState({
    employees: [],
    documents: [],
    certificates: [],
    offers: [],
    relieving: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCompliance = async () => {
    setLoading(true);
    setError('');
    try {
      const [employees, documents, certificates, offers, relieving] = await Promise.allSettled([
        api.get('/employees'),
        api.get('/document-submissions'),
        api.get('/certificates'),
        api.get('/offer'),
        api.get('/relieving'),
      ]);

      setRecords({
        employees: employees.status === 'fulfilled' ? getRows(employees.value.data).filter((employee) => String(employee.role || 'employee') !== 'admin') : [],
        documents: documents.status === 'fulfilled' ? getRows(documents.value.data) : [],
        certificates: certificates.status === 'fulfilled' ? getRows(certificates.value.data) : [],
        offers: offers.status === 'fulfilled' ? getRows(offers.value.data) : [],
        relieving: relieving.status === 'fulfilled' ? getRows(relieving.value.data) : [],
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load compliance center.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompliance();
  }, []);

  const summary = useMemo(() => {
    const approvedDocs = records.documents.filter((doc) => ['approved', 'valid'].includes(getStatus(doc.status))).length;
    const pendingDocs = records.documents.filter((doc) => ['submitted', 'under_review', 'pending'].includes(getStatus(doc.status))).length;
    const rejectedDocs = records.documents.filter((doc) => getStatus(doc.status) === 'rejected').length;
    const validCertificates = records.certificates.filter((cert) => getStatus(cert.verificationStatus || 'valid') === 'valid').length;
    const revokedCertificates = records.certificates.filter((cert) => getStatus(cert.verificationStatus) === 'revoked').length;
    const employeeDocMap = records.documents.reduce((acc, doc) => {
      const id = doc.employee?._id || doc.employee?.employeeId || doc.employee;
      if (id) acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {});
    const missingDocs = records.employees.filter((employee) => !employeeDocMap[employee._id] && !employeeDocMap[employee.employeeId]);
    const readinessScore = records.employees.length
      ? Math.round(((records.employees.length - missingDocs.length) / records.employees.length) * 100)
      : 0;

    return {
      approvedDocs,
      pendingDocs,
      rejectedDocs,
      validCertificates,
      revokedCertificates,
      missingDocs,
      readinessScore,
    };
  }, [records]);

  const actionRows = [
    ['Document Submissions', `${records.documents.length} total, ${summary.pendingDocs} pending review`, 'documents', summary.pendingDocs ? 'warning' : 'success'],
    ['Certificates', `${summary.validCertificates} valid, ${summary.revokedCertificates} revoked`, 'certificates', summary.revokedCertificates ? 'warning' : 'success'],
    ['Offer Letters', `${records.offers.length} generated records`, 'offer-letter', records.offers.length ? 'success' : 'warning'],
    ['Relieving Letters', `${records.relieving.length} generated records`, 'relieving-letter', records.relieving.length ? 'success' : 'warning'],
  ];

  return (
    <div className="admin-compliance-center">
      <style>{`
        .admin-compliance-center{display:grid;gap:20px;color:#0f172a}
        .compliance-hero,.compliance-card,.compliance-panel{background:#fff;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 18px 42px rgba(15,23,42,.08)}
        .compliance-hero{display:flex;justify-content:space-between;gap:18px;align-items:center;padding:26px;background:linear-gradient(135deg,#fff,#f0fdfa)}
        .compliance-eyebrow{margin:0 0 8px;color:#0f766e;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}
        .compliance-hero h2{margin:0;color:#0f172a;font-size:clamp(28px,4vw,44px);font-weight:950;line-height:1.06}.compliance-hero p{margin:12px 0 0;color:#475569;font-weight:650;line-height:1.7}
        .compliance-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.compliance-card{padding:18px}
        .compliance-card span{display:flex;align-items:center;gap:8px;color:#64748b;font-size:12px;font-weight:900;text-transform:uppercase}.compliance-card svg{color:#0f766e}
        .compliance-card strong{display:block;margin-top:10px;color:#0f172a;font-size:30px;line-height:1;font-weight:950}.compliance-card small{display:block;margin-top:7px;color:#64748b;font-weight:750}
        .compliance-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.75fr);gap:18px}.compliance-panel{padding:20px}
        .compliance-panel-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:16px}.compliance-panel h3{margin:0;color:#0f172a;font-weight:950}
        .compliance-action-list{display:grid;gap:10px}.compliance-action{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:14px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc}
        .compliance-action strong{display:block;color:#0f172a}.compliance-action span{display:block;color:#64748b;font-size:13px;font-weight:750}
        .compliance-mini-btn{border:1px solid #cbd5e1;border-radius:8px;background:#fff;color:#0f172a;font-weight:900;min-height:36px;padding:0 12px}
        .compliance-empty{padding:28px;border:1px dashed #cbd5e1;border-radius:12px;background:#f8fafc;text-align:center;color:#64748b;font-weight:850}
        .compliance-readiness{display:grid;place-items:center;min-height:240px;border:1px solid #ccfbf1;border-radius:14px;background:linear-gradient(135deg,#ecfeff,#fff)}
        .compliance-readiness strong{font-size:58px;line-height:1;color:#0f766e}.compliance-readiness span{color:#64748b;font-weight:900;text-transform:uppercase;font-size:12px}
        @media(max-width:1100px){.compliance-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.compliance-grid{grid-template-columns:1fr}.compliance-hero{align-items:flex-start;flex-direction:column}}
        @media(max-width:620px){.compliance-kpis{grid-template-columns:1fr}.compliance-action{align-items:flex-start;flex-direction:column}}
      `}</style>

      <section className="compliance-hero">
        <div>
          <p className="compliance-eyebrow">HR readiness and records</p>
          <h2>Compliance Center</h2>
          <p>Track employee document submissions, certificate validity, offer letters, relieving letters, and missing readiness items dynamically.</p>
        </div>
        <Button variant="outline-success" onClick={fetchCompliance} disabled={loading}><FaRedo /> Refresh</Button>
      </section>

      {error && <Alert variant="danger">{error}</Alert>}
      {loading ? (
        <div className="compliance-empty"><Spinner animation="border" size="sm" /> Loading compliance records...</div>
      ) : (
        <>
          <section className="compliance-kpis">
            <div className="compliance-card"><span><FaShieldAlt /> Readiness</span><strong>{summary.readinessScore}%</strong><small>{summary.missingDocs.length} employees missing docs</small></div>
            <div className="compliance-card"><span><FaIdCard /> Approved Docs</span><strong>{summary.approvedDocs}</strong><small>{summary.pendingDocs} pending review</small></div>
            <div className="compliance-card"><span><FaCertificate /> Certificates</span><strong>{summary.validCertificates}</strong><small>{summary.revokedCertificates} revoked</small></div>
            <div className="compliance-card"><span><FaFileAlt /> HR Letters</span><strong>{records.offers.length + records.relieving.length}</strong><small>Offer + relieving records</small></div>
          </section>

          <section className="compliance-grid">
            <div className="compliance-panel">
              <div className="compliance-panel-head">
                <div>
                  <p className="compliance-eyebrow">Action center</p>
                  <h3>Review HR compliance modules</h3>
                </div>
              </div>
              <div className="compliance-action-list">
                {actionRows.map(([title, detail, tab, variant]) => (
                  <div className="compliance-action" key={title}>
                    <div>
                      <strong>{title}</strong>
                      <span>{detail}</span>
                    </div>
                    <div className="d-flex gap-2 align-items-center flex-wrap">
                      <Badge bg={variant}>{variant === 'success' ? 'Healthy' : 'Needs review'}</Badge>
                      <button className="compliance-mini-btn" type="button" onClick={() => onNavigate?.(tab)}>Open</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="compliance-panel">
              <div className="compliance-panel-head">
                <div>
                  <p className="compliance-eyebrow">Completion score</p>
                  <h3>Document readiness</h3>
                </div>
                {summary.readinessScore >= 80 ? <FaCheckCircle color="#0f766e" /> : <FaExclamationTriangle color="#b45309" />}
              </div>
              <div className="compliance-readiness">
                <div className="text-center">
                  <strong>{summary.readinessScore}%</strong>
                  <span>employees with at least one document</span>
                </div>
              </div>
            </div>
          </section>

          <section className="compliance-panel">
            <div className="compliance-panel-head">
              <div>
                <p className="compliance-eyebrow">Missing items</p>
                <h3>Employees without document submission</h3>
              </div>
              <button className="compliance-mini-btn" type="button" onClick={() => onNavigate?.('documents')}>Open documents</button>
            </div>
            {summary.missingDocs.length ? (
              <div className="table-responsive">
                <Table hover>
                  <thead><tr><th>Employee</th><th>Employee ID</th><th>Department</th><th>Email</th><th>Action</th></tr></thead>
                  <tbody>
                    {summary.missingDocs.slice(0, 12).map((employee) => (
                      <tr key={employee._id || employee.employeeId}>
                        <td>{employee.name || 'N/A'}</td>
                        <td>{employee.employeeId || 'N/A'}</td>
                        <td>{employee.department || employee.team || 'N/A'}</td>
                        <td>{employee.email || 'N/A'}</td>
                        <td><Badge bg="warning">Request documents</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div className="compliance-empty">All active employee records have at least one document submission.</div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default AdminComplianceCenter;
