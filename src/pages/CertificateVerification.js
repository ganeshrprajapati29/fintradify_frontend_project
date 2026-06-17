import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './PublicPage.css';

const apiBase = process.env.REACT_APP_API_URL || 'https://crm.fintradify.com/api';

const useQuery = () => new URLSearchParams(useLocation().search);

const formatDate = (value) => {
  if (!value) return 'Present';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
};

const getDownloadUrl = (certificate) => {
  if (!certificate?.certificateNo) return certificate?.certificateUrl || '#';
  if (certificate.downloadUrl?.startsWith('http')) return certificate.downloadUrl;
  if (certificate.downloadUrl) return `${apiBase.replace(/\/api$/, '')}${certificate.downloadUrl}`;
  return `${apiBase}/certificates/download/${encodeURIComponent(certificate.certificateNo)}`;
};

const getPreviewUrl = (certificate) => {
  if (!certificate?.certificateNo) return certificate?.certificateUrl || '';
  if (certificate.previewUrl?.startsWith('http')) return certificate.previewUrl;
  if (certificate.previewUrl) return `${apiBase.replace(/\/api$/, '')}${certificate.previewUrl}`;
  return `${apiBase}/certificates/preview/${encodeURIComponent(certificate.certificateNo)}`;
};

const CertificateVerification = () => {
  const query = useQuery();
  const [search, setSearch] = useState(query.get('certificateNo') || '');
  const [certificates, setCertificates] = useState([]);
  const [selectedCertificateNo, setSelectedCertificateNo] = useState('');
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const selectedCertificate = certificates.find((certificate) => certificate.certificateNo === selectedCertificateNo) || certificates[0] || null;

  const verifyCertificate = async (value = search) => {
    const lookup = value.trim();
    if (!lookup) {
      setMessage('Enter certificate number, employee ID, email, or mobile number.');
      setCertificates([]);
      setEmployee(null);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${apiBase}/certificates/verify`, { params: { q: lookup } });
      const rows = Array.isArray(response.data?.certificates) ? response.data.certificates : Array.isArray(response.data?.data) ? response.data.data : [];
      setCertificates(rows);
      setSelectedCertificateNo(rows[0]?.certificateNo || '');
      setEmployee(response.data?.employee || rows[0]?.employee || null);
      setMessage(rows.length ? '' : (response.data?.message || 'Employee found. No certificate has been generated yet.'));
    } catch (error) {
      setCertificates([]);
      setSelectedCertificateNo('');
      setEmployee(null);
      setMessage(error.response?.data?.message || 'No verified certificate found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const certificateNo = query.get('certificateNo');
    if (certificateNo) verifyCertificate(certificateNo);
  }, []);

  return (
    <div className="public-page">
      <Navbar />
      <main className="verify-page">
        <style>{`
          .verify-page{min-height:calc(100vh - 160px);background:linear-gradient(180deg,#ffffff 0%,#f8fafc 46%,#ffffff 100%);color:#0f172a;padding:4.4rem 1rem}
          .verify-shell{max-width:1220px;margin:0 auto;display:grid;gap:1.2rem}
          .verify-hero,.verify-card,.verify-profile,.verify-preview{background:#fff;border:1px solid #e2e8f0;border-radius:8px;box-shadow:0 18px 40px rgba(15,23,42,.08)}
          .verify-hero{position:relative;overflow:hidden;display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.55fr);gap:1.2rem;align-items:center;padding:1.75rem;background:linear-gradient(135deg,#fff,#f0fdfa)}
          .verify-hero:before{content:"";position:absolute;inset:0;background-image:url("data:image/svg+xml,%3Csvg width='900' height='260' viewBox='0 0 900 260' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M-24 184C100 121 202 124 325 170C455 219 570 226 696 142C785 82 860 71 930 94' stroke='%230f766e' stroke-opacity='.13' stroke-width='20' stroke-linecap='round'/%3E%3Cpath d='M-20 76C110 120 236 106 344 52C477 -14 592 24 701 90C787 142 858 149 930 105' stroke='%23173b74' stroke-opacity='.09' stroke-width='16' stroke-linecap='round'/%3E%3C/svg%3E");background-size:cover;background-position:center;pointer-events:none}
          .verify-hero>*{position:relative;z-index:1}
          .verify-eyebrow{margin:0;color:#0f766e;font-size:.78rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
          .verify-title{margin:.3rem 0;font-size:clamp(2rem,4vw,3.4rem);font-weight:900;line-height:1.05;color:#0f172a}
          .verify-copy{margin:0;color:#475569;font-size:1rem;line-height:1.7;font-weight:600}
          .verify-form{display:grid;gap:.75rem;background:#fff;border:1px solid #dbe3ef;border-radius:8px;padding:1rem}
          .verify-form input{width:100%;border:1px solid #cbd5e1;border-radius:6px;min-height:52px;padding:0 .9rem;font-weight:800;color:#0f172a;background:#f8fafc}
          .verify-hints{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.5rem}.verify-hints span{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:.55rem;color:#475569;font-size:.78rem;font-weight:900;text-align:center}
          .verify-actions{display:flex;gap:.6rem;flex-wrap:wrap}.verify-btn{border:0;border-radius:6px;min-height:44px;padding:0 1rem;font-weight:900;background:#173b74;color:#fff;text-decoration:none;display:inline-flex;align-items:center;justify-content:center}.verify-btn.secondary{background:#0f9f6e}.verify-btn.light{background:#e2e8f0;color:#0f172a}
          .verify-profile{display:grid;grid-template-columns:auto minmax(0,1fr);gap:1rem;align-items:start;padding:1rem}
          .verify-avatar{width:88px;height:88px;border-radius:8px;background:#ccfbf1;color:#0f766e;display:grid;place-items:center;font-size:2rem;font-weight:900;overflow:hidden}.verify-avatar img{width:100%;height:100%;object-fit:cover}
          .verify-profile h2{margin:0;font-size:1.7rem;font-weight:900;color:#0f172a}.verify-profile-meta{display:flex;gap:.5rem;flex-wrap:wrap;margin:.5rem 0}.verify-chip{background:#eef2ff;color:#173b74;border-radius:999px;padding:.35rem .65rem;font-weight:900;font-size:.78rem}
          .verify-detail-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:.6rem;margin-top:1rem}.verify-detail{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:.75rem}.verify-detail span{display:block;color:#64748b;font-size:.74rem;font-weight:900;text-transform:uppercase}.verify-detail strong{display:block;color:#0f172a;margin-top:.2rem;word-break:break-word}
          .verify-section-title{margin:0;font-size:1.35rem;font-weight:900;color:#0f172a}.verify-section-head{display:flex;justify-content:space-between;gap:1rem;align-items:center}
          .verify-certificate-tabs{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:.7rem}.verify-certificate-tab{border:1px solid #dbe3ef;background:#fff;border-radius:8px;padding:.85rem;text-align:left;cursor:pointer;color:#0f172a}.verify-certificate-tab.active{border-color:#0f9f6e;background:#f0fdfa;box-shadow:0 12px 24px rgba(15,159,110,.12)}.verify-certificate-tab strong{display:block;margin:.2rem 0;font-size:.98rem}.verify-certificate-tab span{display:block;color:#64748b;font-weight:800;font-size:.78rem}.verify-certificate-tab small{display:inline-flex;margin-top:.5rem;border-radius:999px;background:#e0f2fe;color:#075985;padding:.22rem .55rem;font-weight:900;text-transform:uppercase}
          .verify-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:1rem}.verify-card{padding:1rem}
          .verify-card-head{display:flex;justify-content:space-between;gap:.8rem;align-items:flex-start;border-bottom:1px solid #e2e8f0;padding-bottom:.8rem;margin-bottom:.8rem}
          .verify-card h2{margin:0;font-size:1.25rem;font-weight:900;color:#0f172a}.verify-badge{border-radius:999px;padding:.32rem .7rem;font-size:.72rem;font-weight:900;text-transform:uppercase;background:#dcfce7;color:#166534}.verify-badge.revoked{background:#fee2e2;color:#991b1b}
          .verify-list{display:grid;gap:.55rem}.verify-row{display:flex;justify-content:space-between;gap:1rem;border-bottom:1px dashed #e2e8f0;padding-bottom:.5rem;color:#64748b;font-weight:700}.verify-row strong{color:#0f172a;text-align:right}
          .verify-description{margin:.85rem 0 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:.8rem;color:#334155;font-weight:650;line-height:1.6}
          .verify-preview{padding:1rem}.verify-preview-body{display:grid;grid-template-columns:minmax(300px,.42fr) minmax(0,1fr);gap:1rem;margin-top:1rem}.verify-preview-summary{border:1px solid #e2e8f0;border-radius:8px;background:linear-gradient(180deg,#ffffff,#f8fafc);padding:1rem}.verify-preview-summary h3{margin:0 0 .35rem;font-size:1.45rem;color:#173b74;font-weight:900}.verify-preview-summary p{margin:0;color:#475569;font-weight:700;line-height:1.6}.verify-preview-frame{width:100%;height:640px;border:1px solid #dbe3ef;border-radius:8px;background:#f8fafc}.verify-preview-fallback{padding:1rem;text-align:center;color:#64748b;font-weight:800}
          .verify-empty{background:#fff;border:1px dashed #cbd5e1;border-radius:8px;padding:2rem;text-align:center;color:#64748b;font-weight:800}
          @media(max-width:860px){.verify-hero,.verify-profile,.verify-preview-body{grid-template-columns:1fr}.verify-page{padding:2rem .8rem}.verify-title{font-size:2.1rem}.verify-preview-frame{height:420px}}
        `}</style>
        <div className="verify-shell">
          <section className="verify-hero">
            <div>
              <p className="verify-eyebrow">Fintradify certificate verification</p>
              <h1 className="verify-title">Verify official employee </h1>
              <p className="verify-copy">Enter certificate number, employee ID, registered email, or mobile number to view the employee profile, performance record, generated certificate preview, and PDF download.</p>
            </div>
            <form className="verify-form" onSubmit={(event) => { event.preventDefault(); verifyCertificate(); }}>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Certificate No / Employee ID / Email / Mobile" />
              <div className="verify-hints">
                <span>Certificate No</span>
                <span>Employee ID</span>
                <span>Email</span>
                <span>Mobile</span>
              </div>
              <div className="verify-actions">
                <button className="verify-btn" type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Verify '}</button>
                <Link className="verify-btn light" to="/">Home</Link>
              </div>
            </form>
          </section>

          {message && <div className="verify-empty">{message}</div>}

          {employee && (
            <section className="verify-profile">
              <div className="verify-avatar">
                {employee.profilePhoto ? <img src={employee.profilePhoto} alt={employee.name || 'Employee'} /> : String(employee.name || 'E').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="verify-eyebrow">Employee record</p>
                <h2>{employee.name || 'N/A'}</h2>
                <div className="verify-profile-meta">
                  <span className="verify-chip">ID: {employee.employeeId || 'N/A'}</span>
                  <span className="verify-chip">{employee.status || 'active'}</span>
                  <span className="verify-chip">{employee.position || 'Team Member'}</span>
                  <span className="verify-chip">{employee.department || 'Unassigned'}</span>
                </div>
                <div className="verify-detail-grid">
                  <div className="verify-detail"><span>Email</span><strong>{employee.email || 'N/A'}</strong></div>
                  <div className="verify-detail"><span>Mobile</span><strong>{employee.phone || 'N/A'}</strong></div>
                  <div className="verify-detail"><span>Joining Date</span><strong>{formatDate(employee.joiningDate)}</strong></div>
                  <div className="verify-detail"><span>Team</span><strong>{employee.team || 'N/A'}</strong></div>
                  <div className="verify-detail"><span>Address</span><strong>{employee.address || 'N/A'}</strong></div>
                  <div className="verify-detail"><span>Certificates</span><strong>{certificates.length} generated</strong></div>
                  <div className="verify-detail"><span>Paid Leave Balance</span><strong>{employee.paidLeaveBalance ?? 'N/A'}</strong></div>
                  <div className="verify-detail"><span>Unpaid Leave Balance</span><strong>{employee.unpaidLeaveBalance ?? 'N/A'}</strong></div>
                </div>
              </div>
            </section>
          )}

          {!!certificates.length && (
            <section className="verify-certificate-tabs" aria-label="Generated certificates">
              {certificates.map((certificate) => (
                <button
                  className={`verify-certificate-tab ${selectedCertificate?.certificateNo === certificate.certificateNo ? 'active' : ''}`}
                  key={certificate.certificateNo}
                  type="button"
                  onClick={() => setSelectedCertificateNo(certificate.certificateNo)}
                >
                  <span>{formatDate(certificate.issueDate)}</span>
                  <strong>{certificate.title || certificate.certificateNo}</strong>
                  <span>{certificate.certificateNo}</span>
                  <small>{certificate.verificationStatus}</small>
                </button>
              ))}
            </section>
          )}

          {selectedCertificate && (
            <section className="verify-preview">
              <div className="verify-section-head">
                <div>
                  <p className="verify-eyebrow">Certificate preview</p>
                  <h2 className="verify-section-title">{selectedCertificate.title || selectedCertificate.certificateNo}</h2>
                </div>
                <a className="verify-btn secondary" href={getDownloadUrl(selectedCertificate)}>Download PDF</a>
              </div>
              <div className="verify-preview-body">
                <div className="verify-preview-summary">
                  <p className="verify-eyebrow">{selectedCertificate.type} certificate</p>
                  <h3>{selectedCertificate.employee?.name || employee?.name || 'Employee'}</h3>
                  <p>{selectedCertificate.description || `${selectedCertificate.title || 'Certificate'} issued by Fintradify with a one-page A4 PDF, logo watermark, certificate number, and QR verification.`}</p>
                  <div className="verify-list" style={{ marginTop: '1rem' }}>
                    <div className="verify-row"><span>Certificate No</span><strong>{selectedCertificate.certificateNo}</strong></div>
                    <div className="verify-row"><span>Designation</span><strong>{selectedCertificate.designation || 'N/A'}</strong></div>
                    <div className="verify-row"><span>Tenure</span><strong>{formatDate(selectedCertificate.startDate)} - {formatDate(selectedCertificate.endDate)}</strong></div>
                    <div className="verify-row"><span>Performance</span><strong>{selectedCertificate.performance || 'N/A'}</strong></div>
                    <div className="verify-row"><span>Status</span><strong>{selectedCertificate.verificationStatus}</strong></div>
                  </div>
                </div>
                {getPreviewUrl(selectedCertificate) ? (
                  <iframe className="verify-preview-frame" src={getPreviewUrl(selectedCertificate)} title={selectedCertificate.certificateNo} />
                ) : (
                  <div className="verify-preview-fallback">Certificate PDF preview is not available.</div>
                )}
              </div>
            </section>
          )}

          <section className="verify-grid">
            {certificates.map((certificate) => (
              <article className="verify-card" key={certificate.certificateNo}>
                <div className="verify-card-head">
                  <div>
                    <p className="verify-eyebrow">{certificate.type} certificate</p>
                    <h2>{certificate.certificateNo}</h2>
                  </div>
                  <span className={`verify-badge ${certificate.verificationStatus === 'revoked' ? 'revoked' : ''}`}>{certificate.verificationStatus}</span>
                </div>
                <div className="verify-list">
                  <div className="verify-row"><span>Employee</span><strong>{certificate.employee?.name || 'N/A'}</strong></div>
                  <div className="verify-row"><span>Employee ID</span><strong>{certificate.employee?.employeeId || 'N/A'}</strong></div>
                  <div className="verify-row"><span>Designation</span><strong>{certificate.designation || certificate.employee?.position || 'N/A'}</strong></div>
                  <div className="verify-row"><span>Department</span><strong>{certificate.department || certificate.employee?.department || 'N/A'}</strong></div>
                  <div className="verify-row"><span>Tenure</span><strong>{formatDate(certificate.startDate)} - {formatDate(certificate.endDate)}</strong></div>
                  <div className="verify-row"><span>Issue Date</span><strong>{formatDate(certificate.issueDate)}</strong></div>
                  <div className="verify-row"><span>Work Mode</span><strong>{certificate.workMode || 'N/A'}</strong></div>
                  <div className="verify-row"><span>Performance</span><strong>{certificate.performance || 'N/A'}</strong></div>
                  <div className="verify-row"><span>Issued By</span><strong>{certificate.issuedBy || 'Fintradify HR'}</strong></div>
                  <div className="verify-row"><span>Manager</span><strong>{certificate.managerName || 'N/A'}</strong></div>
                  <div className="verify-row"><span>CEO / Signatory</span><strong>{certificate.ceoName || 'N/A'}</strong></div>
                  <div className="verify-row"><span>Email</span><strong>{certificate.employee?.email || 'N/A'}</strong></div>
                  <div className="verify-row"><span>Mobile</span><strong>{certificate.employee?.phone || 'N/A'}</strong></div>
                </div>
                {certificate.description && <div className="verify-description">{certificate.description}</div>}
                <div className="verify-actions" style={{ marginTop: '1rem' }}>
                  <button className="verify-btn" type="button" onClick={() => setSelectedCertificateNo(certificate.certificateNo)}>Preview</button>
                  <a className="verify-btn secondary" href={getDownloadUrl(certificate)}>Download PDF</a>
                </div>
              </article>
            ))}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CertificateVerification;
