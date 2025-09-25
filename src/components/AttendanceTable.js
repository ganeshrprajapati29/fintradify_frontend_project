import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Alert } from 'react-bootstrap';
import axios from 'axios';
import moment from 'moment';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css';

const AttendanceTable = ({ isEmployee }) => {
  const [attendances, setAttendances] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [punchStatus, setPunchStatus] = useState({ canPunchIn: true, canPunchOut: false });

  const fetchAttendance = async () => {
    try {
      const url = isEmployee
        ? `${process.env.REACT_APP_API_URL}/attendance/my-attendance`
        : `${process.env.REACT_APP_API_URL}/attendance`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        params: { startDate, endDate },
      });
      setAttendances(res.data || []);
      setError('');

      if (isEmployee) {
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = res.data.find(
          (att) => new Date(att.date).toISOString().split('T')[0] === today
        );
        setPunchStatus({
          canPunchIn: !todayAttendance || !todayAttendance.punchIn,
          canPunchOut: todayAttendance && todayAttendance.punchIn && !todayAttendance.punchOut,
        });
      }
    } catch (err) {
      console.error('Fetch attendance error:', err);
      setError(err.response?.data?.message || 'Error fetching attendance');
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [startDate, endDate, isEmployee]);

  const handlePunch = async (type) => {
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/attendance/punch`,
        { type },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setError('');
      alert(res.data.message);
      fetchAttendance();
    } catch (err) {
      console.error('Punch error:', err);
      setError(err.response?.data?.message || 'Error recording punch');
    }
  };

  const handleDownload = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }
    try {
      const url = isEmployee
        ? `${process.env.REACT_APP_API_URL}/attendance/download/my-attendance`
        : `${process.env.REACT_APP_API_URL}/attendance/download`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        params: { startDate, endDate },
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'text/csv; charset=utf-8' });
      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlBlob;
      link.setAttribute('download', `attendance-${startDate}-${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlBlob);
      setError('');
    } catch (err) {
      console.error('Download error:', err);
      setError(err.response?.data?.message || 'Error downloading attendance CSV');
    }
  };

  return (
    <div className="attendance-table-container">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

          .attendance-table-container {
            font-family: 'Poppins', sans-serif;
            color: #1e40af;
            background: #ffffff;
            padding: 1.5rem;
            border-radius: 1rem;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            margin: 1rem;
          }
          .attendance-title {
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
          .btn-success, .btn-danger, .btn-primary {
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
          .btn-success::before, .btn-danger::before, .btn-primary::before {
            content: '';
            position: absolute;
            left: -100%;
            top: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.4), transparent);
            transition: left 0.4s ease;
          }
          .btn-success:hover::before, .btn-danger:hover::before, .btn-primary:hover::before {
            left: 100%;
          }
          .btn-success:hover {
            background: linear-gradient(90deg, #047857, #34d399) !important;
            border-color: #34d399 !important;
            color: #fff !important;
            transform: scale(1.05);
            box-shadow: 0 6px 16px rgba(52, 211, 153, 0.5);
          }
          .btn-danger:hover {
            background: linear-gradient(90deg, #b91c1c, #f87171) !important;
            border-color: #f87171 !important;
            color: #fff !important;
            transform: scale(1.05);
            box-shadow: 0 6px 16px rgba(248, 113, 113, 0.5);
          }
          .btn-primary:hover {
            background: linear-gradient(90deg, #1e40af, #3b82f6) !important;
            border-color: #3b82f6 !important;
            color: #fff !important;
            transform: scale(1.05);
            box-shadow: 0 6px 16px rgba(59, 130, 246, 0.5);
          }
          .btn-success:disabled, .btn-danger:disabled {
            border-color: #d1d5db;
            color: #6b7280;
            background: #f3f4f6;
            opacity: 0.6;
            transform: none;
            box-shadow: none;
          }
          .btn-success svg, .btn-danger svg, .btn-primary svg {
            width: 24px;
            height: 24px;
            margin-right: 0.75rem;
            vertical-align: middle;
          }
          .form-group {
            margin-bottom: 1.5rem;
          }
          .form-label {
            font-size: 1rem;
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 0.5rem;
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
          @media (max-width: 576px) {
            .attendance-table-container {
              padding: 1rem;
              margin: 0.5rem;
            }
            .attendance-title {
              font-size: 1.6rem;
              margin-bottom: 1.5rem;
            }
            .alert {
              font-size: 0.9rem;
              padding: 0.8rem;
            }
            .btn-success, .btn-danger, .btn-primary {
              padding: 0.6rem 1.5rem;
              font-size: 0.95rem;
            }
            .btn-success svg, .btn-danger svg, .btn-primary svg {
              width: 20px;
              height: 20px;
            }
            .form-control {
              font-size: 0.9rem;
              padding: 0.7rem;
            }
            .form-label {
              font-size: 0.9rem;
            }
            .table th, .table td {
              padding: 0.8rem;
              font-size: 0.85rem;
            }
            .table-responsive {
              margin: 0 0.5rem;
            }
            .table-empty {
              font-size: 0.9rem;
            }
          }
          @media (max-width: 400px) {
            .attendance-title {
              font-size: 1.4rem;
            }
            .btn-success, .btn-danger, .btn-primary {
              padding: 0.5rem 1.2rem;
              font-size: 0.9rem;
            }
            .btn-success svg, .btn-danger svg, .btn-primary svg {
              width: 18px;
              height: 18px;
            }
            .form-control {
              font-size: 0.8rem;
              padding: 0.6rem;
            }
            .form-label {
              font-size: 0.85rem;
            }
            .table th, .table td {
              padding: 0.6rem;
              font-size: 0.8rem;
            }
            .table-empty {
              font-size: 0.85rem;
            }
          }
        `}
      </style>
      <div className="attendance-table-container animate__animated animate__fadeIn">
        <h3 className="attendance-title">Attendance Details</h3>
        {error && (
          <Alert variant="danger" className="animate__animated animate__fadeIn">
            {error}
          </Alert>
        )}
        {isEmployee && (
          <div className="mb-3">
            <Button
              variant="success"
              onClick={() => handlePunch('in')}
              className="me-2 animate__animated animate__fadeIn"
              style={{ animationDelay: '0.1s' }}
              disabled={!punchStatus.canPunchIn}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {punchStatus.canPunchIn ? 'Punch In' : 'Punched In Today'}
            </Button>
            <Button
              variant="danger"
              onClick={() => handlePunch('out')}
              className="animate__animated animate__fadeIn"
              style={{ animationDelay: '0.2s' }}
              disabled={!punchStatus.canPunchOut}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              {punchStatus.canPunchOut ? 'Punch Out' : punchStatus.canPunchIn ? 'Punch In First' : 'Punched Out Today'}
            </Button>
          </div>
        )}
        <Form className="mb-3">
          <Form.Group controlId="startDate" className="animate__animated animate__fadeIn" style={{ animationDelay: '0.3s' }}>
            <Form.Label>Start Date</Form.Label>
            <Form.Control
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group controlId="endDate" className="mt-3 animate__animated animate__fadeIn" style={{ animationDelay: '0.4s' }}>
            <Form.Label>End Date</Form.Label>
            <Form.Control
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </Form.Group>
          <Button
            variant="primary"
            onClick={handleDownload}
            className="mt-3 animate__animated animate__fadeIn"
            style={{ animationDelay: '0.5s' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download CSV
          </Button>
        </Form>
        <div className="table-responsive">
          <Table className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.6s' }}>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Date</th>
                <th>Punch In</th>
                <th>Punch Out</th>
                <th>Hours Worked</th>
                <th>Hourly Rate (₹)</th>
                <th>Total Salary (₹)</th>
              </tr>
            </thead>
            <tbody>
              {attendances.length > 0 ? (
                attendances.map((att, index) => {
                  const hoursWorked = att.punchOut && att.punchIn
                    ? ((new Date(att.punchOut) - new Date(att.punchIn)) / 1000 / 60 / 60).toFixed(2)
                    : '0.00';
                  return (
                    <tr key={att._id} className="animate__animated animate__fadeIn" style={{ animationDelay: `${0.05 * index}s` }}>
                      <td>{att.employee?.employeeId || 'N/A'}</td>
                      <td>{att.employee?.name || 'N/A'}</td>
                      <td>{moment(att.date).format('YYYY-MM-DD')}</td>
                      <td>{att.punchIn ? moment(att.punchIn).format('HH:mm:ss') : '-'}</td>
                      <td>{att.punchOut ? moment(att.punchOut).format('HH:mm:ss') : '-'}</td>
                      <td>{hoursWorked}</td>
                      <td>{att.employee?.hourlyRate || 'N/A'}</td>
                      <td>{att.employee?.hourlyRate && hoursWorked !== '0.00' ? (att.employee.hourlyRate * hoursWorked).toFixed(2) : 'N/A'}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="table-empty">No attendance records available</td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceTable;