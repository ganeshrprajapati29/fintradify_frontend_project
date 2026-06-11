import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Form, Modal, Spinner, Table } from 'react-bootstrap';
import moment from 'moment';
import api from '../utils/axios';
import PaginationControls from './PaginationControls';

const getRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const statusMeta = (status) => {
  if (status === 'Approved') return { label: 'Approved', variant: 'success' };
  if (status === 'Rejected') return { label: 'Rejected', variant: 'danger' };
  return { label: 'Pending', variant: 'warning' };
};

const AdminReimbursement = () => {
  const [reimbursements, setReimbursements] = useState([]);
  const [stats, setStats] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedReimbursement, setSelectedReimbursement] = useState(null);
  const [action, setAction] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const fetchReimbursements = async () => {
    const res = await api.get('/reimbursements');
    const rows = getRows(res.data).sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));
    setReimbursements(rows);
    setPage(1);
  };

  const fetchStats = async () => {
    const res = await api.get('/reimbursements/stats');
    setStats(res.data?.data || {});
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchReimbursements(), fetchStats()]);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching reimbursements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const summary = useMemo(() => reimbursements.reduce((acc, item) => {
    acc.total += 1;
    acc.amount += Number(item.amount || 0);
    acc[String(item.status || 'Pending').toLowerCase()] += 1;
    return acc;
  }, { total: 0, amount: 0, pending: 0, approved: 0, rejected: 0 }), [reimbursements]);

  const categories = useMemo(() => [...new Set(reimbursements.map((item) => item.category).filter(Boolean))].sort(), [reimbursements]);

  const filteredReimbursements = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reimbursements.filter((item) => {
      const status = String(item.status || 'Pending').toLowerCase();
      const text = `${item.employee?.name || ''} ${item.employee?.employeeId || ''} ${item.category || ''} ${item.description || ''}`.toLowerCase();
      return (
        (statusFilter === 'all' || status === statusFilter) &&
        (categoryFilter === 'all' || item.category === categoryFilter) &&
        (!query || text.includes(query))
      );
    });
  }, [reimbursements, search, statusFilter, categoryFilter]);

  const paginatedReimbursements = filteredReimbursements.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, categoryFilter, limit]);

  const openActionModal = (reimbursement, nextAction) => {
    setSelectedReimbursement(reimbursement);
    setAction(nextAction);
    setRejectionReason('');
    setShowModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedReimbursement || !action) return;
    if (action === 'Rejected' && !rejectionReason.trim()) {
      setError('Please enter rejection reason');
      return;
    }

    try {
      await api.put(`/reimbursements/${selectedReimbursement._id}/status`, {
        status: action,
        rejectionReason: action === 'Rejected' ? rejectionReason : undefined,
      });
      setSuccess(`Reimbursement ${action.toLowerCase()} successfully`);
      setError('');
      setShowModal(false);
      await refreshData();
    } catch (err) {
      setSuccess('');
      setError(err.response?.data?.message || 'Error updating reimbursement status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this reimbursement?')) return;
    try {
      await api.delete(`/reimbursements/${id}`);
      setSuccess('Reimbursement deleted successfully');
      setError('');
      await refreshData();
    } catch (err) {
      setSuccess('');
      setError(err.response?.data?.message || 'Error deleting reimbursement');
    }
  };

  return (
    <div className="reim-page">
      <style>{`
        .reim-page { color:#0f172a; display:grid; gap:1rem; }
        .reim-hero,.reim-panel,.reim-stat { background:#fff; border:1px solid #e2e8f0; border-radius:.85rem; box-shadow:0 14px 34px rgba(15,23,42,.07); }
        .reim-hero { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:1rem; align-items:center; padding:1.15rem; background:linear-gradient(135deg,#fff,#f8fbff); border-color:#dbeafe; }
        .reim-eyebrow { margin:0; color:#64748b; font-size:.76rem; font-weight:900; letter-spacing:.08em; text-transform:uppercase; }
        .reim-title { margin:.25rem 0; font-size:clamp(1.45rem,3vw,2.1rem); font-weight:900; line-height:1.15; }
        .reim-subtitle { margin:0; color:#64748b; font-weight:600; }
        .reim-stat-grid { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:.85rem; }
        .reim-stat { padding:.95rem; }
        .reim-stat span { display:block; color:#64748b; font-size:.74rem; font-weight:900; text-transform:uppercase; }
        .reim-stat strong { display:block; margin-top:.25rem; font-size:1.35rem; }
        .reim-panel { padding:1rem; }
        .reim-panel-head { display:flex; align-items:center; justify-content:space-between; gap:1rem; margin-bottom:1rem; }
        .reim-panel-title { margin:0; font-size:1.05rem; font-weight:900; }
        .reim-controls { display:grid; grid-template-columns:minmax(190px,1fr) 150px 170px; gap:.75rem; margin-bottom:1rem; }
        .reim-page .form-control,.reim-page .form-select { border:1px solid #dbe3ef; border-radius:.65rem; color:#0f172a; font-weight:600; min-height:42px; }
        .reim-action-btn { border-radius:.65rem; font-weight:800; min-height:38px; }
        .reim-table-wrap { border:1px solid #e2e8f0; border-radius:.8rem; overflow:hidden; }
        .reim-table-wrap table { margin:0; }
        .reim-table-wrap thead th { background:#f8fafc; color:#475569; border-bottom:1px solid #e2e8f0; font-size:.73rem; font-weight:900; letter-spacing:.04em; text-transform:uppercase; white-space:nowrap; padding:.85rem; }
        .reim-table-wrap td { color:#334155; vertical-align:middle; padding:.9rem .85rem; }
        .reim-person { display:flex; align-items:center; gap:.75rem; min-width:180px; }
        .reim-avatar { width:40px; height:40px; border-radius:50%; display:grid; place-items:center; background:#dbeafe; color:#1d4ed8; font-weight:900; flex:0 0 auto; }
        .reim-person strong,.reim-claim strong { display:block; color:#0f172a; }
        .reim-person span,.reim-claim span,.reim-muted { color:#64748b; font-size:.84rem; font-weight:600; }
        .reim-desc { max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .reim-empty { min-height:240px; display:flex; align-items:center; justify-content:center; text-align:center; padding:1rem; color:#64748b; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:.8rem; font-weight:700; }
        @media(max-width:1120px){ .reim-hero,.reim-controls{grid-template-columns:1fr}.reim-stat-grid{grid-template-columns:repeat(3,minmax(0,1fr))} }
        @media(max-width:760px){ .reim-panel-head{align-items:flex-start;flex-direction:column}.reim-table-wrap{overflow-x:auto}.reim-stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))} }
        @media(max-width:560px){ .reim-stat-grid{grid-template-columns:1fr}.reim-panel,.reim-hero{padding:.85rem}.reim-action-btn{width:100%} }
      `}</style>

      <section className="reim-hero">
        <div>
          <p className="reim-eyebrow">Expense approvals</p>
          <h2 className="reim-title">Reimbursements</h2>
          <p className="reim-subtitle">Review, approve, reject, and audit employee reimbursement requests.</p>
        </div>
        <Button className="reim-action-btn" variant="outline-primary" onClick={refreshData} disabled={loading}>Refresh</Button>
      </section>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <section className="reim-stat-grid">
        <div className="reim-stat"><span>Total Claims</span><strong>{summary.total}</strong></div>
        <div className="reim-stat"><span>Pending</span><strong>{summary.pending}</strong></div>
        <div className="reim-stat"><span>Approved</span><strong>{summary.approved}</strong></div>
        <div className="reim-stat"><span>Rejected</span><strong>{summary.rejected}</strong></div>
        <div className="reim-stat"><span>Total Amount</span><strong>{money(summary.amount)}</strong></div>
      </section>

      <section className="reim-panel">
        <div className="reim-panel-head">
          <div>
            <h3 className="reim-panel-title">Claim register</h3>
            <p className="reim-subtitle">{filteredReimbursements.length} records, latest first</p>
          </div>
          <span className="reim-muted">{stats.monthly?.length || 0} monthly status groups</span>
        </div>
        <div className="reim-controls">
          <Form.Control value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employee, category, description" />
          <Form.Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All status</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></Form.Select>
          <Form.Select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="all">All categories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</Form.Select>
        </div>

        {loading ? <div className="reim-empty"><Spinner animation="border" size="sm" className="me-2" /> Loading reimbursements...</div> : (
          <>
            <div className="reim-table-wrap table-responsive">
              <Table hover>
                <thead><tr><th>Employee</th><th>Claim</th><th>Amount</th><th>Date</th><th>Status</th><th>Attachments</th><th>Actions</th></tr></thead>
                <tbody>
                  {paginatedReimbursements.length ? paginatedReimbursements.map((item, index) => {
                    const meta = statusMeta(item.status);
                    return (
                      <tr key={item._id}>
                        <td><div className="reim-person"><div className="reim-avatar">{String(item.employee?.name || 'E').charAt(0).toUpperCase()}</div><div><strong>{item.employee?.name || 'N/A'}</strong><span>{item.employee?.employeeId || 'N/A'} - {item.employee?.email || 'N/A'}</span></div></div></td>
                        <td><div className="reim-claim"><strong>{item.category}</strong><span className="reim-desc" title={item.description}>{item.description || 'No description'}</span>{page === 1 && index === 0 && <Badge bg="success" className="mt-1">Latest</Badge>}</div></td>
                        <td><strong>{money(item.amount)}</strong></td>
                        <td>{item.date ? moment(item.date).format('DD MMM YYYY') : 'N/A'}</td>
                        <td><Badge bg={meta.variant}>{meta.label}</Badge>{item.rejectionReason && <div className="text-danger small mt-1">{item.rejectionReason}</div>}</td>
                        <td>{item.attachments?.length ? item.attachments.map((attachment, idx) => <div key={idx}><a href={attachment.url} target="_blank" rel="noopener noreferrer">{attachment.filename || `Attachment ${idx + 1}`}</a></div>) : <span className="reim-muted">No files</span>}</td>
                        <td>
                          {item.status === 'Pending' && <Button className="reim-action-btn me-2" size="sm" variant="outline-success" onClick={() => openActionModal(item, 'Approved')}>Approve</Button>}
                          {item.status === 'Pending' && <Button className="reim-action-btn me-2" size="sm" variant="outline-danger" onClick={() => openActionModal(item, 'Rejected')}>Reject</Button>}
                          <Button className="reim-action-btn" size="sm" variant="outline-secondary" onClick={() => handleDelete(item._id)}>Delete</Button>
                        </td>
                      </tr>
                    );
                  }) : <tr><td colSpan="7" className="text-center text-muted py-4">No reimbursements found</td></tr>}
                </tbody>
              </Table>
            </div>
            {filteredReimbursements.length > limit && <PaginationControls page={page} limit={limit} total={filteredReimbursements.length} label="reimbursements" onPageChange={setPage} onLimitChange={(nextLimit) => { setLimit(nextLimit); setPage(1); }} />}
          </>
        )}
      </section>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>{action === 'Approved' ? 'Approve' : 'Reject'} Reimbursement</Modal.Title></Modal.Header>
        <Modal.Body>
          {selectedReimbursement && <div className="mb-3">
            <p><strong>Employee:</strong> {selectedReimbursement.employee?.name || 'N/A'}</p>
            <p><strong>Amount:</strong> {money(selectedReimbursement.amount)}</p>
            <p><strong>Description:</strong> {selectedReimbursement.description}</p>
          </div>}
          {action === 'Rejected' && <Form.Group><Form.Label>Rejection Reason</Form.Label><Form.Control as="textarea" rows={3} value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Enter reason for rejection" /></Form.Group>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant={action === 'Approved' ? 'success' : 'danger'} onClick={handleStatusUpdate}>{action === 'Approved' ? 'Approve' : 'Reject'}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminReimbursement;
