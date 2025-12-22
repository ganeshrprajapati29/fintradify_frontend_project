import React, { useState, useEffect } from 'react';
import { Form, Button, Table, Alert } from 'react-bootstrap';
import axios from 'axios';
import moment from 'moment';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css';

const LeaveRequest = ({ isAdmin }) => {
  const [leaves, setLeaves] = useState([]);
  const [formData, setFormData] = useState({ startDate: '', endDate: '', reason: '' });
  const [leaveBalances, setLeaveBalances] = useState({ paidLeaveBalance: 0, halfDayLeaveBalance: 0 });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchLeaves = async () => {
    try {
      const url = isAdmin
        ? `${process.env.REACT_APP_API_URL}/leaves`
        : `${process.env.REACT_APP_API_URL}/leaves/my-leaves`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setLeaves(res.data || []);
      setError('');
      setSuccess('');
    } catch (err) {
      console.error('Error fetching leaves:', err);
      setError(err.response?.data?.message || 'Error fetching leave requests');
    }
  };

  const fetchLeaveBalances = async () => {
    if (isAdmin) return; // Only fetch for employees
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/leaves/balances`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setLeaveBalances(res.data || { paidLeaveBalance: 0, halfDayLeaveBalance: 0 });
    } catch (err) {
      console.error('Error fetching leave balances:', err);
      // Don't set error for balances, as it's not critical
    }
  };

  useEffect(() => {
    fetchLeaves();
    fetchLeaveBalances();
  }, [isAdmin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isAdmin) {
      setError('Admins cannot request leaves');
      return;
    }
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/leaves`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setSuccess('Leave requested successfully');
      setFormData({ startDate: '', endDate: '', reason: '' });
      fetchLeaves();
      setError('');
    } catch (err) {
      console.error('Request leave error:', err);
      setError(err.response?.data?.message || 'Error requesting leave');
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/leaves/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setSuccess(`Leave ${status} successfully`);
      fetchLeaves();
      setError('');
    } catch (err) {
      console.error('Update leave status error:', err);
      setError(err.response?.data?.message || `Error ${status === 'approved' ? 'approving' : 'rejecting'} leave`);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="leave-request-container">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

          .leave-request-container {
            font-family: 'Poppins', sans-serif;
            color: #1e40af;
            background: #ffffff;
            padding: 1.5rem;
            border-radius: 1rem;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            margin: 1rem;
          }
          .leave-title {
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
            transition: transform 0.3s ease, opacity 0.3s ease;
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
            transition: transform 0.3s ease, opacity 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .form-group {
            margin-bottom: 1.5rem;
          }
          .form-label {
            font-size: 1rem;
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .form-label svg {
            width: 24px;
            height: 24px;
          }
          .form-control {
            background: #f8fafc;
            border: 2px solid #bfdbfe;
            color: #1e40af;
            border-radius: 0.6rem;
            padding: 0.8rem;
            font-size: 1rem;
            transition: all 0.3s ease;
          }
          .form-control:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
            background: #f8fafc;
          }
          .form-control:hover {
            border-color: #3b82f6;
          }
          .form-control::placeholder {
            color: #6b7280;
          }
          .btn-primary, .btn-success, .btn-danger {
            border-radius: 0.6rem;
            padding: 0.8rem 2rem;
            font-weight: 600;
            font-size: 1.1rem;
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
            border: 2px solid #3b82f6;
            background: linear-gradient(90deg, #f0f9ff, #bfdbfe);
            color: #1e40af;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .btn-primary::before, .btn-success::before, .btn-danger::before {
            content: '';
            position: absolute;
            left: -100%;
            top: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.4), transparent);
            transition: left 0.4s ease;
          }
          .btn-primary:hover::before, .btn-success:hover::before, .btn-danger:hover::before {
            left: 100%;
          }
          .btn-primary:hover {
            background: linear-gradient(90deg, #1e40af, #3b82f6) !important;
            border-color: #3b82f6 !important;
            color: #fff !important;
            transform: scale(1.05);
            box-shadow: 0 6px 16px rgba(59, 130, 246, 0.5);
          }
          .btn-success {
            border-color: #22c55e;
            background: linear-gradient(90deg, #f0fdf4, #bbf7d0);
            color: #15803d;
          }
          .btn-success:hover {
            background: linear-gradient(90deg, #15803d, #22c55e) !important;
            border-color: #22c55e !important;
            color: #fff !important;
            transform: scale(1.05);
            box-shadow: 0 6px 16px rgba(34, 197, 94, 0.5);
          }
          .btn-danger {
            border-color: #f87171;
            background: linear-gradient(90deg, #fef2f2, #fecaca);
            color: #b91c1c;
          }
          .btn-danger:hover {
            background: linear-gradient(90deg, #b91c1c, #f87171) !important;
            border-color: #f87171 !important;
            color: #fff !important;
            transform: scale(1.05);
            box-shadow: 0 6px 16px rgba(248, 113, 113, 0.5);
          }
          .btn-success:disabled, .btn-danger:disabled {
            border-color: #d1d5db;
            background: #e5e7eb;
            color: #6b7280;
            opacity: 0.6;
            transform: none;
            box-shadow: none;
          }
          .btn-primary svg, .btn-success svg, .btn-danger svg {
            width: 24px;
            height: 24px;
            margin-right: 0.75rem;
            vertical-align: middle;
          }
          .table {
            border-radius: 0.6rem;
            overflow: hidden;
            background: #f8fafc;
            color: #1e40af;
            border: 2px solid rgba(30, 64, 175, 0.2);
            margin-top: 1.5rem;
            font-size: 1rem;
          }
          .table thead {
            background: linear-gradient(to right, #1e40af, #3b82f6);
            color: #fff;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.9rem;
            letter-spacing: 0.5px;
          }
          .table th, .table td {
            padding: 1.2rem;
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
          .table-empty {
            text-align: center;
            font-style: italic;
            color: #374151;
            padding: 1.5rem;
            font-size: 1rem;
          }
          .status-approved {
            color: #22c55e;
            font-weight: 500;
          }
          .status-rejected {
            color: #f87171;
            font-weight: 500;
          }
          .status-pending {
            color: #facc15;
            font-weight: 500;
          }
          @media (max-width: 576px) {
            .leave-request-container {
              padding: 1rem;
              margin: 0.5rem;
            }
            .leave-title {
              font-size: 1.6rem;
              margin-bottom: 1.5rem;
            }
            .alert-danger, .alert-success {
              font-size: 0.9rem;
              padding: 0.8rem;
            }
            .form-control {
              font-size: 0.9rem;
              padding: 0.7rem;
            }
            .form-label {
              font-size: 0.9rem;
            }
            .form-label svg {
              width: 20px;
              height: 20px;
            }
            .btn-primary, .btn-success, .btn-danger {
              padding: 0.6rem 1.5rem;
              font-size: 0.95rem;
            }
            .btn-primary svg, .btn-success svg, .btn-danger svg {
              width: 20px;
              height: 20px;
            }
            .table th, .table td {
              padding: 0.8rem;
              font-size: 0.85rem;
            }
            .table-responsive {
              margin: 0 0.5rem;
            }
          }
          @media (max-width: 400px) {
            .leave-title {
              font-size: 1.4rem;
            }
            .form-control {
              font-size: 0.8rem;
              padding: 0.6rem;
            }
            .form-label {
              font-size: 0.85rem;
            }
            .form-label svg {
              width: 18px;
              height: 18px;
            }
            .btn-primary, .btn-success, .btn-danger {
              padding: 0.5rem 1.2rem;
              font-size: 0.9rem;
            }
            .btn-primary svg, .btn-success svg, .btn-danger svg {
              width: 18px;
              height: 18px;
            }
            .table th, .table td {
              padding: 0.6rem;
              font-size: 0.8rem;
            }
            .status-approved, .status-rejected, .status-pending {
              font-size: 0.8rem;
            }
          }
        `}
      </style>
      <div className="leave-request-container animate__animated animate__fadeIn">
        <h3 className="leave-title animate__animated animate__zoomIn">Leave Requests</h3>
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
        {!isAdmin && (
          <Form onSubmit={handleSubmit} className="mb-4 animate__animated animate__fadeInUp" style={{ animationDelay: '0.1s' }}>
            <Form.Group controlId="startDate" className="mb-3 animate__animated animate__fadeIn" style={{ animationDelay: '0.2s' }}>
              <Form.Label>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Start Date
              </Form.Label>
              <Form.Control
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                min={moment().format('YYYY-MM-DD')}
              />
            </Form.Group>
            <Form.Group controlId="endDate" className="mb-3 animate__animated animate__fadeIn" style={{ animationDelay: '0.3s' }}>
              <Form.Label>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                End Date
              </Form.Label>
              <Form.Control
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                min={formData.startDate || moment().format('YYYY-MM-DD')}
              />
            </Form.Group>
            <Form.Group controlId="reason" className="mb-3 animate__animated animate__fadeIn" style={{ animationDelay: '0.4s' }}>
              <Form.Label>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                Reason
              </Form.Label>
              <Form.Control
                as="textarea"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Enter reason for leave"
              />
            </Form.Group>
            <Button
              variant="primary"
              type="submit"
              className="animate__animated animate__fadeIn"
              style={{ animationDelay: '0.5s' }}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Request Leave
            </Button>
          </Form>
        )}
        <div className="table-responsive">
          <Table className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.6s' }}>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Reason</th>
                <th>Status</th>
                {isAdmin && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {leaves.length > 0 ? (
                leaves.map((leave, index) => (
                  <tr key={leave._id} className="animate__animated animate__fadeIn" style={{ animationDelay: `${0.05 * index}s` }}>
                    <td>{leave.employee?.employeeId || 'N/A'}</td>
                    <td>{leave.employee?.name || 'N/A'}</td>
                    <td>{moment(leave.startDate).format('YYYY-MM-DD')}</td>
                    <td>{moment(leave.endDate).format('YYYY-MM-DD')}</td>
                    <td>{leave.reason}</td>
                    <td>
                      <span
                        className={`status-${leave.status}`}
                      >
                        {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                      </span>
                    </td>
                    {isAdmin && (
                      <td>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleStatus(leave._id, 'approved')}
                          disabled={leave.status !== 'pending'}
                          className="me-2"
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleStatus(leave._id, 'rejected')}
                          disabled={leave.status !== 'pending'}
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Reject
                        </Button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="table-empty">No leave requests available</td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequest;