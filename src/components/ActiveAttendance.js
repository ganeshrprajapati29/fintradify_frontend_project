import React, { useState, useEffect } from 'react';
import { Table, Button, Alert, Spinner } from 'react-bootstrap';
import axios from '../utils/axios';
import moment from 'moment';

const ActiveAttendance = () => {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAttendances = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/attendance/active');
      setAttendances(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching active attendances:', err);
      setError(err.response?.data?.message || 'Error fetching active attendances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendances();
  }, []);

  const handlePause = async (id) => {
    try {
      await axios.put(`/attendance/admin/pause/${id}`);
      setSuccess('Timer paused successfully');
      fetchAttendances();
      window.dispatchEvent(new CustomEvent('attendanceUpdated'));
    } catch (err) {
      console.error('Error pausing timer:', err);
      setError(err.response?.data?.message || 'Error pausing timer');
    }
  };

  const handleResume = async (id) => {
    try {
      await axios.put(`/attendance/admin/resume/${id}`);
      setSuccess('Timer resumed successfully');
      fetchAttendances();
      window.dispatchEvent(new CustomEvent('attendanceUpdated'));
    } catch (err) {
      console.error('Error resuming timer:', err);
      setError(err.response?.data?.message || 'Error resuming timer');
    }
  };

const calculateCurrentHours = (att) => {
  if (!att.punchIn) return 0;
  const now = new Date();
  const totalTime = now - new Date(att.punchIn);
  const pausedDuration = att.totalPausedDuration || 0;
  return ((totalTime - pausedDuration) / (1000 * 60 * 60)).toFixed(2);
};

  return (
    <div>
      <style>
        {`
          .active-attendance-container {
            font-family: 'Poppins', sans-serif;
            color: #1e40af;
            background: #ffffff;
            padding: 1.5rem;
            border-radius: 1rem;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            margin: 1rem;
          }
          .active-attendance-title {
            font-size: 2rem;
            font-weight: 700;
            color: #1e40af;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            margin-bottom: 2rem;
            text-align: center;
          }
          .alert {
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
            border-color: #10b981;
            background: #f0fdf4;
            color: #047857;
          }
          .btn-primary {
            border-radius: 0.6rem;
            padding: 0.5rem 1rem;
            font-weight: 600;
            font-size: 0.9rem;
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
            border: 2px solid #3b82f6;
            background: linear-gradient(90deg, #f0f9ff, #bfdbfe);
            color: #1e40af;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .btn-primary:hover::before {
            left: 100%;
          }
          .btn-primary:hover {
            background: linear-gradient(90deg, #1e40af, #3b82f6) !important;
            border-color: #3b82f6 !important;
            color: #fff !important;
            transform: scale(1.05);
            box-shadow: 0 6px 16px rgba(59, 130, 246, 0.5);
          }
          .btn-warning {
            border-radius: 0.6rem;
            padding: 0.5rem 1rem;
            font-weight: 600;
            font-size: 0.9rem;
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
            border: 2px solid #f59e0b;
            background: linear-gradient(90deg, #fffbeb, #fef3c7);
            color: #92400e;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .btn-warning:hover {
            background: linear-gradient(90deg, #92400e, #f59e0b) !important;
            border-color: #f59e0b !important;
            color: #fff !important;
            transform: scale(1.05);
            box-shadow: 0 6px 16px rgba(245, 158, 11, 0.5);
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
          .status-active {
            background: #d1fae5;
            color: #065f46;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-weight: 600;
          }
          .status-paused {
            background: #fef3c7;
            color: #92400e;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-weight: 600;
          }
          .status-inactive {
            background: #fee2e2;
            color: #dc2626;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-weight: 600;
          }
        `}
      </style>
      <div className="active-attendance-container">
        <h3 className="active-attendance-title">Active Attendances</h3>
        {error && (
          <Alert variant="danger">
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success">
            {success}
          </Alert>
        )}
        {loading ? (
          <div className="text-center">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : (
          <div className="table-responsive">
            <Table>
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Punch In</th>
                  <th>Current Hours</th>
                  <th>Location Address</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attendances.length > 0 ? (
                  attendances.map((att) => (
                    <tr key={att._id}>
                      <td>{att.employee?.employeeId || 'N/A'}</td>
                      <td>{att.employee?.name || 'N/A'}</td>
                      <td>{moment(att.punchIn).format('HH:mm:ss')}</td>
                      <td>{calculateCurrentHours(att)}</td>
                      <td>{att.locationAddress || 'N/A'}</td>
                      <td>
                        <span className={`status-${att.timerStatus === 'active' ? 'active' : 'inactive'}`}>
                          {att.timerStatus === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        {att.timerStatus === 'active' ? (
                          <Button variant="warning" size="sm" onClick={() => handlePause(att._id)}>
                            Pause
                          </Button>
                        ) : (
                          <Button variant="primary" size="sm" onClick={() => handleResume(att._id)}>
                            Resume
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="table-empty">
                      No active attendances found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveAttendance;
