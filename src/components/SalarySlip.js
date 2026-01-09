
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import { Form, Button, Table, Alert } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css';

const SalarySlip = ({ isAdmin }) => {
  const [formData, setFormData] = useState({ employeeId: '', month: '', fixedAmount: '' });
  const [slips, setSlips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleGenerateMonthly = async () => {
    if (!isAdmin) {
      setError('Only admins can generate monthly salary slips');
      return;
    }
    try {
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1; // getMonth() returns 0-11
      const year = currentDate.getFullYear();
      await axios.post(
        `${process.env.REACT_APP_API_URL}/salary/generate-monthly`,
        { month, year },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      // Refresh the slips list
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/salary`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setSlips(res.data || []);
      setSuccess('Monthly salary slips generated successfully');
      setError('');
    } catch (err) {
      console.error('Generate monthly slips error:', err.response?.status, err.response?.data);
      setError(err.response?.data?.message || 'Error generating monthly salary slips');
      setSuccess('');
    }
  };

  useEffect(() => {
    const abortController = new AbortController();

    const fetchData = async () => {
      try {
    const url = isAdmin ? '/salary' : '/salary/my-slips';
        const res = await axios.get(`${process.env.REACT_APP_API_URL}${url}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          signal: abortController.signal,
        });
        setSlips(res.data.data || []);
        if (isAdmin) {
          const empRes = await axios.get(`${process.env.REACT_APP_API_URL}/employees`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            signal: abortController.signal,
          });
          setEmployees(empRes.data || []);
        }
        setError('');
        setSuccess('');
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Fetch error:', err.response?.status, err.response?.data);
          setError(err.response?.data?.message || 'Error fetching data');
        }
      }
    };
    fetchData();

    return () => abortController.abort();
  }, [isAdmin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      setError('Only admins can generate salary slips');
      return;
    }
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/salary`,
        formData,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setFormData({ employeeId: '', month: '', fixedAmount: '' });
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/salary`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setSlips(res.data || []);
      setSuccess('Salary slip generated successfully');
      setError('');
    } catch (err) {
      console.error('Generate slip error:', err.response?.status, err.response?.data);
      setError(err.response?.data?.message || 'Error generating salary slip');
      setSuccess('');
    }
  };

  const handleDownload = async (id, month) => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/salary/download/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `salary-slip-${month}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSuccess('Salary slip downloaded successfully');
      setError('');
    } catch (err) {
      console.error('Download slip error:', err.response?.status, err.response?.data);
      setError(err.response?.data?.message || 'Error downloading salary slip');
      setSuccess('');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="salary-slip-container">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

          .salary-slip-container {
            font-family: 'Poppins', sans-serif;
            color: #1e40af;
            background: #ffffff;
            padding: 1.5rem;
            border-radius: 1rem;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            margin: 1rem;
          }
          .salary-title {
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
          .form-control, .form-select {
            background: #f8fafc;
            border: 2px solid #bfdbfe;
            color: #1e40af;
            border-radius: 0.6rem;
            padding: 0.8rem;
            font-size: 1rem;
            transition: all 0.3s ease;
          }
          .form-control:focus, .form-select:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
            background: #f8fafc;
          }
          .form-control:hover, .form-select:hover {
            border-color: #3b82f6;
          }
          .form-control::placeholder, .form-select option:disabled {
            color: #6b7280;
          }
          .btn-primary {
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
          .btn-primary::before {
            content: '';
            position: absolute;
            left: -100%;
            top: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.4), transparent);
            transition: left 0.4s ease;
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
          .btn-primary:disabled {
            border-color: #d1d5db;
            background: #e5e7eb;
            color: #6b7280;
            opacity: 0.6;
            transform: none;
            box-shadow: none;
          }
          .btn-primary svg {
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
            .salary-slip-container {
              padding: 1rem;
              margin: 0.5rem;
            }
            .salary-title {
              font-size: 1.6rem;
              margin-bottom: 1.5rem;
            }
            .alert-danger, .alert-success {
              font-size: 0.9rem;
              padding: 0.8rem;
            }
            .form-control, .form-select {
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
            .btn-primary {
              padding: 0.6rem 1.5rem;
              font-size: 0.95rem;
            }
            .btn-primary svg {
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
            .salary-title {
              font-size: 1.4rem;
            }
            .form-control, .form-select {
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
            .btn-primary {
              padding: 0.5rem 1.2rem;
              font-size: 0.9rem;
            }
            .btn-primary svg {
              width: 18px;
              height: 18px;
            }
            .table th, .table td {
              padding: 0.6rem;
              font-size: 0.8rem;
            }
          }
        `}
      </style>
      <div className="salary-slip-container animate__animated animate__fadeIn">
        <h3 className="salary-title animate__animated animate__zoomIn">Salary Slips</h3>
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
        {isAdmin && (
          <div className="mb-4 animate__animated animate__fadeInUp" style={{ animationDelay: '0.1s' }}>
            <Button
              variant="primary"
              onClick={handleGenerateMonthly}
              className="me-3"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Generate Monthly Salary Slips
            </Button>
          </div>
        )}
        {isAdmin && (
          <Form onSubmit={handleSubmit} className="mb-4 animate__animated animate__fadeInUp" style={{ animationDelay: '0.2s' }}>
            <Form.Group controlId="employeeId" className="mb-3 animate__animated animate__fadeIn" style={{ animationDelay: '0.2s' }}>
              <Form.Label>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Employee
              </Form.Label>
              <Form.Select
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.employeeId})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group controlId="month" className="mb-3 animate__animated animate__fadeIn" style={{ animationDelay: '0.3s' }}>
              <Form.Label>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Month
              </Form.Label>
              <Form.Control
                type="month"
                name="month"
                value={formData.month}
                onChange={handleChange}
                required
                max={moment().format('YYYY-MM')}
              />
            </Form.Group>
            <Form.Group controlId="fixedAmount" className="mb-3 animate__animated animate__fadeIn" style={{ animationDelay: '0.4s' }}>
              <Form.Label>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Fixed Amount (₹)
              </Form.Label>
              <Form.Control
                type="number"
                name="fixedAmount"
                value={formData.fixedAmount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="Enter fixed amount"
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
              Generate Salary Slip
            </Button>
          </Form>
        )}
        <div className="table-responsive">
          <Table className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.6s' }}>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Month</th>
                <th>Basic Pay</th>
                <th>HRA</th>
                <th>Conveyance</th>
                <th>Medical</th>
                <th>LTA</th>
                <th>Other Allow.</th>
                <th>Total Earnings</th>
                <th>PF</th>
                <th>Professional Tax</th>
                <th>Gratuity</th>
                <th>Other Ded.</th>
                <th>Total Ded.</th>
                <th>Net Salary</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {slips.length > 0 ? (
                slips.map((slip, index) => (
                  <tr key={slip._id} className="animate__animated animate__fadeIn" style={{ animationDelay: `${0.05 * index}s` }}>
                    <td>{slip.employee?.employeeId || 'N/A'}</td>
                    <td>{slip.employee?.name || 'N/A'}</td>
                    <td>{slip.month ? moment(slip.month).format('MMM YYYY') : 'N/A'}</td>
                    <td>₹{slip.basicPay ? slip.basicPay.toFixed(2) : '0.00'}</td>
                    <td>₹{slip.hra ? slip.hra.toFixed(2) : '0.00'}</td>
                    <td>₹{slip.conveyanceAllowance ? slip.conveyanceAllowance.toFixed(2) : '0.00'}</td>
                    <td>₹{slip.medicalAllowance ? slip.medicalAllowance.toFixed(2) : '0.00'}</td>
                    <td>₹{slip.lta ? slip.lta.toFixed(2) : '0.00'}</td>
                    <td>₹{slip.otherAllowances ? slip.otherAllowances.toFixed(2) : '0.00'}</td>
                    <td><strong>₹{slip.totalEarnings ? slip.totalEarnings.toFixed(2) : '0.00'}</strong></td>
                    <td>₹{slip.pf ? slip.pf.toFixed(2) : '0.00'}</td>
                    <td>₹{slip.professionalTax ? slip.professionalTax.toFixed(2) : '0.00'}</td>
                    <td>₹{slip.gratuity ? slip.gratuity.toFixed(2) : '0.00'}</td>
                    <td>₹{slip.otherDeductions ? slip.otherDeductions.toFixed(2) : '0.00'}</td>
                    <td><strong>₹{slip.totalDeductions ? slip.totalDeductions.toFixed(2) : '0.00'}</strong></td>
                    <td><strong style={{color: '#1e40af'}}>₹{slip.netSalary ? slip.netSalary.toFixed(2) : '0.00'}</strong></td>
                    <td>
                      <Button
                        variant="primary"
                        onClick={() => handleDownload(slip._id, slip.month ? moment(slip.month).format('YYYY-MM') : 'unknown')}
                        disabled={!slip.employee}
                        size="sm"
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download PDF
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="17" className="table-empty">No salary slips available</td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default SalarySlip;