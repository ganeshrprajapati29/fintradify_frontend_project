import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Alert, Modal, Form } from 'react-bootstrap';
import moment from 'moment';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css';

const EmployeeReimbursement = () => {
  const [reimbursements, setReimbursements] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    date: '',
    attachments: []
  });
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    fetchReimbursements();
  }, []);

  const fetchReimbursements = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/reimbursements/my`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setReimbursements(res.data || []);
      setError('');
    } catch (err) {
      console.error('Fetch reimbursements error:', err.response?.status, err.response?.data);
      setError(err.response?.data?.message || 'Error fetching reimbursements');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount || !formData.description || !formData.category) {
      setError('Amount, description, and category are required');
      return;
    }

    if (isNaN(formData.amount) || formData.amount <= 0) {
      setError('Invalid amount');
      return;
    }

    try {
      const data = new FormData();
      data.append('amount', formData.amount);
      data.append('description', formData.description);
      data.append('category', formData.category);
      if (formData.date) data.append('date', formData.date);

      selectedFiles.forEach(file => {
        data.append('attachments', file);
      });

      await axios.post(`${process.env.REACT_APP_API_URL}/reimbursements`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        },
      });

      setSuccess('Reimbursement request submitted successfully');
      setError('');
      setShowModal(false);
      setFormData({ amount: '', description: '', category: '', date: '', attachments: [] });
      setSelectedFiles([]);
      fetchReimbursements();
    } catch (err) {
      console.error('Submit reimbursement error:', err.response?.status, err.response?.data);
      setError(err.response?.data?.message || 'Error submitting reimbursement request');
      setSuccess('');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reimbursement request?')) return;

    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/reimbursements/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setSuccess('Reimbursement request deleted successfully');
      setError('');
      fetchReimbursements();
    } catch (err) {
      console.error('Delete error:', err.response?.status, err.response?.data);
      setError(err.response?.data?.message || 'Error deleting reimbursement request');
      setSuccess('');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return <span className="badge bg-success">Approved</span>;
      case 'Rejected':
        return <span className="badge bg-danger">Rejected</span>;
      default:
        return <span className="badge bg-warning">Pending</span>;
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

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  return (
    <div className="employee-reimbursement-container">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

          .employee-reimbursement-container {
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
          .btn-add {
            background: linear-gradient(90deg, #22c55e, #16a34a);
            border: none;
            color: white;
            padding: 0.4rem 0.8rem;
            border-radius: 0.4rem;
            font-size: 0.8rem;
            margin-bottom: 1rem;
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
            .employee-reimbursement-container {
              padding: 1rem;
              margin: 0.5rem;
            }
            .reimbursement-title {
              font-size: 1.6rem;
              margin-bottom: 1.5rem;
            }
            .table th, .table td {
              padding: 0.6rem;
              font-size: 0.8rem;
            }
          }
        `}
      </style>

      <div className="employee-reimbursement-container animate__animated animate__fadeIn">
        <h3 className="reimbursement-title animate__animated animate__zoomIn">My Reimbursements</h3>

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

        <Button
          className="btn-add"
          onClick={() => setShowModal(true)}
        >
          + New Reimbursement Request
        </Button>

        <div className="table-responsive">
          <Table className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.2s' }}>
            <thead>
              <tr>
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
                        <Button
                          className="btn-delete"
                          size="sm"
                          onClick={() => handleDelete(reimbursement._id)}
                        >
                          Delete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    No reimbursements found
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>New Reimbursement Request</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Amount (₹)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  placeholder="Enter amount"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="Describe the expense"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Category</Form.Label>
                <Form.Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Travel">Travel</option>
                  <option value="Medical">Medical</option>
                  <option value="Food">Food</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Training">Training</option>
                  <option value="Other">Other</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Attachments (Optional)</Form.Label>
                <Form.Control
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                />
                <Form.Text className="text-muted">
                  You can upload multiple files (images, PDF, DOC, DOCX). Max 5 files.
                </Form.Text>
              </Form.Group>

              <div className="d-flex justify-content-end gap-2">
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Submit Request
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>
      </div>
    </div>
  );
};

export default EmployeeReimbursement;
