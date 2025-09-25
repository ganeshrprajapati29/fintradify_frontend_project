import React, { useState, useEffect } from 'react';
import { Button, Alert, Table } from 'react-bootstrap';
import axios from 'axios';
import moment from 'moment';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css';

const Attendance = ({ isAdmin }) => {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchAttendance = async () => {
      try {
        console.log('Fetching attendance records...');
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/attendance`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          signal: abortController.signal,
        });
        setAttendanceRecords(res.data || []);
        setError('');
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Fetch attendance error:', err.response?.status, err.response?.data);
          setError(err.response?.data?.message || 'Error fetching attendance');
        }
      }
    };

    if (isAdmin) fetchAttendance();

    return () => abortController.abort();
  }, [isAdmin]);

  const handlePunch = async () => {
    try {
      console.log('Recording punch...');
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/attendance/punch`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setMessage(res.data.punchOut ? 'Punch-out recorded' : 'Punch-in recorded');
      setError('');
    } catch (err) {
      console.error('Punch error:', err.response?.status, err.response?.data);
      setError(err.response?.data?.message || 'Error recording punch');
      setMessage('');
    }
  };

  const handleDownload = async () => {
    try {
      console.log('Downloading attendance CSV...');
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/attendance/download`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'attendance-report.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download CSV error:', err.response?.status, err.response?.data);
      setError(err.response?.data?.message || 'Error downloading attendance report');
    }
  };

  return (
    <div className="attendance-container">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

          .attendance-container {
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
            border: 2px solid;
            background: #f8fafc;
            color: #1e40af;
            margin-bottom: 1.5rem;
            padding: 1rem;
            font-size: 1rem;
            transition: transform 0.3s ease, opacity 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .alert-danger {
            border-color: #f87171;
            background: #fef2f2;
            color: #b91c1c;
          }
          .alert-success {
            border-color: #34d399;
            background: #ecfdf5;
            color: #047857;
          }
          .btn-primary, .btn-secondary {
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
          .btn-primary::before, .btn-secondary::before {
            content: '';
            position: absolute;
            left: -100%;
            top: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.4), transparent);
            transition: left 0.4s ease;
          }
          .btn-primary:hover::before, .btn-secondary:hover::before {
            left: 100%;
          }
          .btn-primary:hover, .btn-secondary:hover {
            background: linear-gradient(90deg, #1e40af, #3b82f6) !important;
            border-color: #3b82f6 !important;
            color: #fff !important;
            transform: scale(1.05);
            box-shadow: 0 6px 16px rgba(59, 130, 246, 0.5);
          }
          .btn-primary svg, .btn-secondary svg {
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
          @media (max-width: 576px) {
            .attendance-container {
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
            .btn-primary, .btn-secondary {
              padding: 0.6rem 1.5rem;
              font-size: 0.95rem;
            }
            .btn-primary svg, .btn-secondary svg {
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
            .table-empty {
              font-size: 0.9rem;
            }
          }
          @media (max-width: 400px) {
            .attendance-title {
              font-size: 1.4rem;
            }
            .btn-primary, .btn-secondary {
              padding: 0.5rem 1.2rem;
              font-size: 0.9rem;
            }
            .btn-primary svg, .btn-secondary svg {
              width: 18px;
              height: 18px;
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
      <div className="attendance-container animate__animated animate__fadeIn">
        <h3 className="attendance-title">Attendance</h3>
        {error && (
          <Alert variant="danger" className="animate__animated animate__fadeIn">
            {error}
          </Alert>
        )}
        {message && (
          <Alert variant="success" className="animate__animated animate__fadeIn" style={{ animationDelay: '0.1s' }}>
            {message}
          </Alert>
        )}
        {!isAdmin && (
          <Button
            variant="primary"
            onClick={handlePunch}
            className="mb-3 animate__animated animate__fadeIn"
            style={{ animationDelay: '0.2s' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Punch In/Out
          </Button>
        )}
        {isAdmin && (
          <>
            <Button
              variant="secondary"
              onClick={handleDownload}
              className="mb-3 animate__animated animate__fadeIn"
              style={{ animationDelay: '0.3s' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Attendance Report
            </Button>
            <div className="table-responsive">
              <Table className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.4s' }}>
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Date</th>
                    <th>Punch In</th>
                    <th>Punch Out</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.length > 0 ? (
                    attendanceRecords.map((record, index) => (
                      <tr key={record._id} className="animate__animated animate__fadeIn" style={{ animationDelay: `${0.05 * index}s` }}>
                        <td>{record.employee?.employeeId || 'N/A'}</td>
                        <td>{record.employee?.name || 'N/A'}</td>
                        <td>{moment(record.date).format('YYYY-MM-DD')}</td>
                        <td>{record.punchIn ? moment(record.punchIn).format('HH:mm:ss') : 'N/A'}</td>
                        <td>{record.punchOut ? moment(record.punchOut).format('HH:mm:ss') : 'N/A'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="table-empty">No attendance records available</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Attendance;