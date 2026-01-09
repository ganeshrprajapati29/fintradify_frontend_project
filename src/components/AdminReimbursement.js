import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Alert, Modal, Form, Badge } from 'react-bootstrap';
import moment from 'moment';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css';

const AdminReimbursement = () => {
  const [reimbursements, setReimbursements] = useState([]);
  const [stats, setStats] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedReimbursement, setSelectedReimbursement] = useState(null);
  const [action, setAction] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchReimbursements();
    fetchStats();
  }, []);

  const fetchReimbursements = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/reimbursements`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setReimbursements(res.data.data || []);
      setError('');
    } catch (err) {
      console.error('Fetch reimbursements error:', err.response?.status, err.response?.data);
      setError(err.response?.data?.message || 'Error fetching reimbursements');
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/reimbursements/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setStats(res.data.data || {});
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedReimbursement || !action) return;

    try {
      const data = { status: action };
      if (action === 'Rejected' && rejectionReason) {
        data.rejectionReason = rejectionReason;
      }

      await axios.put(
        `${process.env.REACT_APP_API_URL}/reimbursements/${selectedReimbursement._id}/status`,
        data,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      setSuccess(`Reimbursement ${action.toLowerCase()} successfully`);
      setError('');
      setShowModal(false);
      setSelectedReimbursement(null);
      setAction('');
      setRejectionReason('');
      fetchReimbursements();
      fetchStats();
    } catch (err) {
      console.error('Update status error:', err.response?.status, err.response?.data);
      setError(err.response?.data?.message || 'Error updating reimbursement status');
      setSuccess('');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reimbursement?')) return;

    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/reimbursement/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setSuccess('Reimbursement deleted successfully');
      setError('');
      fetchReimbursements();
      fetchStats();
    } catch (err) {
      console.error('Delete error:', err.response?.status, err.response?.data);
      setError(err.response?.data?.message || 'Error deleting reimbursement');
      setSuccess('');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return <Badge bg="success">Approved</Badge>;
      case 'Rejected':
        return <Badge bg="danger">Rejected</Badge>;
      default:
        return <Badge bg="warning">Pending</Badge>;
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Travel':
        return '✈️';
      case 'Medical':
        return '🏥';
      case 'Food':
        return '🍽️';
      case 'Office Supplies':
        return '📎';
      case 'Training':
        return '🎓';
      default:
        return '📄';
    }
  };

  return (
    <div className="admin-reimbursement-container">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

          .admin-reimbursement-container {
            font-family: 'Poppins', sans-serif;
            color: #1e40af;
            background: #ffffff;
            padding: 1.5rem;
            border-radius: 1rem;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            margin: 1rem;
          }
          .reimbursement-title {
            font-size: 2rem;
            font-weight: 700;
            color: #1e40af;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            margin-bottom: 2rem;
            text-align: center;
          }
          .stats-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
          }
          .stat-card {
            background: linear-gradient(135deg, #f0f9ff, #bfdbfe);
            border: 2px solid #3b82f6;
            border-radius: 0.6rem;
            padding: 1rem;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .stat-number {
            font-size: 2rem;
            font-weight: 700;
            color: #1e40af;
          }
          .stat-label {
            font-size: 1rem;
            color: #374151;
            margin-top: 0.5rem;
          }
          .alert-danger {
            border-radius: 0.6rem;
            border: 2px solid #f87171;
            background: #fef2f2;
            color: #b91c1c;
            margin-bottom: 1.5rem;
            padding: 1rem;
            font-size: 1rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .alert-success {
            border-radius: 0.6rem;
            border: 2px solid #22c55e;
            background: #f0fdf4;
            color: #15803d;
            margin-bottom: 1.5rem;
            padding: 1rem;
            font-size: 1rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .table {
            border-radius: 0.6rem;
            overflow: hidden;
            background: #f8fafc;
            color: #1e40af;
            border: 2px solid rgba(30, 64, 175, 0.2);
            margin-top: 1.5rem;
            font-size: 0.9rem;
          }
          .table thead {
            background: linear-gradient(to right, #1e40af, #3b82f6);
            color: #fff;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.8rem;
            letter-spacing: 0.5px;
          }
          .table th, .table td {
            padding: 0.8rem;
            vertical-align: middle;
            border-color: rgba(30, 64, 175, 0.2);
          }
          .table tbody tr:nth-child(even) {
            background: rgba(191, 219, 254, 0.1);
          }
          .table tbody tr:hover {
            background: rgba(59, 130, 246, 0.15);
            transform: scale(1.01);
          }
          .btn-approve {
            background: linear-gradient(90deg, #22c55e, #16a34a);
            border: none;
            color: white;
            padding: 0.4rem 0.8rem;
            border-radius: 0.4rem;
            font-size: 0.8rem;
            margin-right: 0.5rem;
          }
          .btn-reject {
            background: linear-gradient(90deg, #f87171, #dc2626);
            border: none;
            color: white;
            padding: 0.4rem 0.8rem;
            border-radius: 0.4rem;
            font-size: 0.8rem;
            margin-right: 0.5rem;
          }
          .btn-delete {
            background: linear-gradient(90deg, #6b7280, #4b5563);
            border: none;
            color: white;
            padding: 0.4rem 0.8rem;
            border-radius: 0.4rem;
            font-size: 0.8rem;
          }
          .attachment-link {
            color: #3b82f6;
            text-decoration: none;
          }
          .attachment-link:hover {
            text-decoration: underline;
          }
          .modal-content {
            border-radius: 0.6rem;
            border: 2px solid #3b82f6;
          }
          .modal-header {
            background: linear-gradient(to right, #1e40af, #3b82f6);
            color: white;
            border-bottom: none;
            border-radius: 0.6rem 0.6rem 0 0;
          }
          .modal-body {
            padding: 1.5rem;
          }
          @media (max-width: 768px) {
            .admin-reimbursement-container {
              padding: 1rem;
              margin: 0.5rem;
            }
            .reimbursement-title {
              font-size: 1.6rem;
              margin-bottom: 1.5rem;
            }
            .stats-container {
              grid-template-columns: 1fr;
            }
            .table th, .table td {
              padding: 0.6rem;
              font-size: 0.8rem;
            }
          }
        `}
      </style>

      <div className="admin-reimbursement-container animate__animated animate__fadeIn">
        <h3 className="reimbursement-title animate__animated animate__zoomIn">Reimbursement Management</h3>

        {error && (
          <Alert variant="danger" className="animate__animated animate__fadeIn">
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" className="animate__animated animate__fadeIn">
            {success}
          </Alert>
        )}

        <div className="stats-container animate__animated animate__fadeInUp" style={{ animationDelay: '0.1s' }}>
          {stats.overall && stats.overall.map((stat, index) => (
            <div key={stat._id} className="stat-card animate__animated animate__zoomIn" style={{ animationDelay: `${0.1 * index}s` }}>
              <div className="stat-number">{stat.count}</div>
              <div className="stat-label">{stat._id} Reimbursements</div>
              <div className="stat-label">Total: ₹{stat.totalAmount?.toFixed(2) || '0.00'}</div>
            </div>
          ))}
        </div>

        <div className="table-responsive">
          <Table className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.2s' }}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Date</th>
                <th>Status</th>
                <th>Attachments</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reimbursements.length > 0 ? (
                reimbursements.map((reimbursement, index) => (
                  <tr key={reimbursement._id} className="animate__animated animate__fadeIn" style={{ animationDelay: `${0.05 * index}s` }}>
                    <td>
                      <div>{reimbursement.employee?.name || 'N/A'}</div>
                      <small className="text-muted">{reimbursement.employee?.employeeId || ''}</small>
                    </td>
                    <td>
                      <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>
                        {getCategoryIcon(reimbursement.category)}
                      </span>
                      {reimbursement.category}
                    </td>
                    <td><strong>₹{reimbursement.amount?.toFixed(2) || '0.00'}</strong></td>
                    <td>
                      <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {reimbursement.description}
                      </div>
                    </td>
                    <td>{moment(reimbursement.date).format('DD MMM YYYY')}</td>
                    <td>
                      {getStatusBadge(reimbursement.status)}
                      {reimbursement.status === 'Rejected' && reimbursement.rejectionReason && (
                        <div style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: '0.25rem' }}>
                          {reimbursement.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td>
                      {reimbursement.attachments && reimbursement.attachments.length > 0 ? (
                        reimbursement.attachments.map((attachment, idx) => (
                          <div key={idx}>
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="attachment-link"
                            >
                              📎 {attachment.filename}
                            </a>
                          </div>
                        ))
                      ) : (
                        <span className="text-muted">No attachments</span>
                      )}
                    </td>
                    <td>
                      {reimbursement.status === 'Pending' && (
                        <>
                          <Button
                            className="btn-approve"
                            size="sm"
                            onClick={() => {
                              setSelectedReimbursement(reimbursement);
                              setAction('Approved');
                              setShowModal(true);
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            className="btn-reject"
                            size="sm"
                            onClick={() => {
                              setSelectedReimbursement(reimbursement);
                              setAction('Rejected');
                              setShowModal(true);
                            }}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        className="btn-delete"
                        size="sm"
                        onClick={() => handleDelete(reimbursement._id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    No reimbursements found
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>
              {action === 'Approved' ? 'Approve' : 'Reject'} Reimbursement
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedReimbursement && (
              <div>
                <p><strong>Employee:</strong> {selectedReimbursement.employee?.name}</p>
                <p><strong>Amount:</strong> ₹{selectedReimbursement.amount?.toFixed(2)}</p>
                <p><strong>Description:</strong> {selectedReimbursement.description}</p>
                {action === 'Rejected' && (
                  <Form.Group className="mt-3">
                    <Form.Label>Rejection Reason</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Please provide a reason for rejection"
                    />
                  </Form.Group>
                )}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              variant={action === 'Approved' ? 'success' : 'danger'}
              onClick={handleStatusUpdate}
            >
              {action === 'Approved' ? 'Approve' : 'Reject'}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default AdminReimbursement;
