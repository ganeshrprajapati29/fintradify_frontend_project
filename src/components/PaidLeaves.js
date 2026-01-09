import React, { useState, useEffect } from 'react';
import { Form, Button, Table, Alert } from 'react-bootstrap';
import axios from 'axios';
import moment from 'moment';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css';

const PaidLeaves = ({ isAdmin }) => {
  const [leaves, setLeaves] = useState([]);
  const [leaveData, setLeaveData] = useState([]);
  const [formData, setFormData] = useState({ startDate: '', endDate: '', reason: '' });
  const [leaveBalances, setLeaveBalances] = useState({ paidLeaveBalance: 0, halfDayLeaveBalance: 0 });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchLeaveData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login to view leave data');
      return;
    }
    try {
      const url = isAdmin
        ? `${process.env.REACT_APP_API_URL}/leaves/employee-data`
        : `${process.env.REACT_APP_API_URL}/leaves/my-employee-data`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (isAdmin) {
        setLeaveData(res.data);
      } else {
        setLeaveData([res.data]); // For employee, wrap in array for consistency
      }
      setError('');
      setSuccess('');
    } catch (err) {
      console.error('Error fetching leave data:', err);
      setError(err.response?.data?.message || 'Error fetching leave data');
    }
  };

  const fetchLeaves = async () => {
    const token = localStorage.getItem('token');
    if (!token) return; // Skip if no token
    try {
      const url = isAdmin
        ? `${process.env.REACT_APP_API_URL}/leaves`
        : `${process.env.REACT_APP_API_URL}/leaves/my-leaves`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Filter for paid leaves
      const paidLeaves = res.data ? res.data.filter(leave => leave.type === 'paid') : [];
      setLeaves(paidLeaves);
      setError('');
      setSuccess('');
    } catch (err) {
      console.error('Error fetching paid leaves:', err);
      setError(err.response?.data?.message || 'Error fetching paid leave requests');
    }
  };

  const fetchLeaveBalances = async () => {
    if (isAdmin) return; // Only fetch for employees
    const token = localStorage.getItem('token');
    if (!token) return; // Skip if no token
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/leaves/my-balances`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeaveBalances(res.data || { paidLeaveBalance: 0, halfDayLeaveBalance: 0 });
    } catch (err) {
      console.error('Error fetching leave balances:', err);
      // Don't set error for balances, as it's not critical
    }
  };

  useEffect(() => {
    fetchLeaveData();
    fetchLeaves();
    fetchLeaveBalances();
  }, [isAdmin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isAdmin) {
      setError('Admins cannot request paid leaves');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login to request leave');
      return;
    }
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/leaves`, {
        ...formData,
        type: 'paid'
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Paid leave requested successfully');
      setFormData({ startDate: '', endDate: '', reason: '' });
      fetchLeaves();
      setError('');
    } catch (err) {
      console.error('Request paid leave error:', err);
      setError(err.response?.data?.message || 'Error requesting paid leave');
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/leaves/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setSuccess(`Paid leave ${status} successfully`);
      fetchLeaves();
      setError('');
    } catch (err) {
      console.error('Update paid leave status error:', err);
      setError(err.response?.data?.message || `Error ${status === 'approved' ? 'approving' : 'rejecting'} paid leave`);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="paid-leaves-dashboard">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

          .paid-leaves-dashboard {
            font-family: 'Poppins', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 2rem;
            color: #fff;
          }

          .dashboard-header {
            text-align: center;
            margin-bottom: 3rem;
          }

          .dashboard-title {
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            background: linear-gradient(45deg, #fff, #e0e7ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .dashboard-subtitle {
            font-size: 1.2rem;
            opacity: 0.9;
            margin-bottom: 2rem;
          }

          .employee-cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
          }

          .employee-card {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 2rem;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
            color: #1e40af;
          }

          .employee-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.2);
          }

          .employee-header {
            display: flex;
            align-items: center;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #e0e7ff;
          }

          .employee-avatar {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea, #764ba2);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: 1.5rem;
            margin-right: 1rem;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
          }

          .employee-info h3 {
            margin: 0;
            font-size: 1.4rem;
            font-weight: 600;
            color: #1e40af;
          }

          .employee-id {
            color: #6b7280;
            font-size: 0.9rem;
            margin: 0.2rem 0 0 0;
          }

          .eligibility-badge {
            display: inline-block;
            padding: 0.5rem 1rem;
            border-radius: 25px;
            font-weight: 600;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 1.5rem;
          }

          .eligible {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
          }

          .not-eligible {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
          }

          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-bottom: 1.5rem;
          }

          .info-item {
            background: #f8fafc;
            padding: 1rem;
            border-radius: 12px;
            text-align: center;
            border: 1px solid #e0e7ff;
          }

          .info-label {
            font-size: 0.8rem;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 0.5rem;
            font-weight: 600;
          }

          .info-value {
            font-size: 1.2rem;
            font-weight: 700;
            color: #1e40af;
          }

          .eligibility-info {
            background: #f0f9ff;
            padding: 1rem;
            border-radius: 12px;
            border-left: 4px solid #3b82f6;
            margin-top: 1rem;
          }

          .eligibility-text {
            margin: 0;
            font-size: 0.9rem;
            color: #1e40af;
            font-weight: 500;
          }

          .leave-request-section {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 2rem;
            margin-top: 3rem;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          .section-title {
            font-size: 1.8rem;
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 2rem;
            text-align: center;
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

          .btn-primary {
            background: linear-gradient(135deg, #667eea, #764ba2);
            border: none;
            border-radius: 0.6rem;
            padding: 0.8rem 2rem;
            font-weight: 600;
            font-size: 1.1rem;
            color: white;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }

          .btn-primary:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
          }

          .alert {
            border-radius: 0.6rem;
            margin-bottom: 1.5rem;
            padding: 1rem;
            font-size: 1rem;
          }

          @media (max-width: 768px) {
            .paid-leaves-dashboard {
              padding: 1rem;
            }

            .dashboard-title {
              font-size: 2rem;
            }

            .employee-cards-grid {
              grid-template-columns: 1fr;
              gap: 1.5rem;
            }

            .employee-card {
              padding: 1.5rem;
            }

            .info-grid {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      <div className="dashboard-header">
        <h1 className="dashboard-title">Paid Leaves Dashboard</h1>
        <p className="dashboard-subtitle">Track employee eligibility and leave balances</p>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-4">
          {success}
        </Alert>
      )}

      <div className="employee-cards-grid">
        {leaveData.map((employee, index) => (
          <div key={employee.employeeId} className="employee-card animate__animated animate__fadeInUp" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="employee-header">
              <div className="employee-avatar">
                {employee.name.charAt(0).toUpperCase()}
              </div>
              <div className="employee-info">
                <h3>{employee.name}</h3>
                <p className="employee-id">ID: {employee.employeeId}</p>
              </div>
            </div>

            <div className={`eligibility-badge ${employee.isEligible ? 'eligible' : 'not-eligible'}`}>
              {employee.isEligible ? 'Eligible for Paid Leave' : 'Not Eligible Yet'}
            </div>

            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">Remaining Leaves</div>
                <div className="info-value">{employee.remainingLeaves}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Taken Leaves</div>
                <div className="info-value">{employee.usedPaidLeaves || 0}</div>
              </div>
            </div>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">Joining Date</div>
                <div className="info-value">{moment(employee.joiningDate).format('MMM DD, YYYY')}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Eligibility Date</div>
                <div className="info-value">{moment(employee.eligibilityDate).format('MMM DD, YYYY')}</div>
              </div>
            </div>

            {!employee.isEligible && (
              <div className="eligibility-info">
                <p className="eligibility-text">
                  Will be eligible on: {moment(employee.eligibilityDate).format('MMM DD, YYYY')}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {!isAdmin && (
        <div className="leave-request-section">
          <h2 className="section-title">Request Paid Leave</h2>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="startDate" className="mb-3">
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
            <Form.Group controlId="endDate" className="mb-3">
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
            <Form.Group controlId="reason" className="mb-3">
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
                placeholder="Enter reason for paid leave"
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '20px', height: '20px', marginRight: '8px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Request Paid Leave
            </Button>
          </Form>
        </div>
      )}
    </div>
  );
};

export default PaidLeaves;
