import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Card, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css';

const ManualAttendance = () => {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employeeId: '',
    date: '',
    punchIn: '',
    punchOut: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/employees`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setEmployees(res.data);
      } catch (err) {
        console.error('Error fetching employees:', err);
        setError('Failed to fetch employees');
      }
    };
    fetchEmployees();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.employeeId || !formData.date) {
      setError('Employee and date are required');
      return;
    }

    try {
      const payload = {
        employeeId: formData.employeeId,
        date: formData.date,
        ...(formData.punchIn && { punchIn: `${formData.date}T${formData.punchIn}:00` }),
        ...(formData.punchOut && { punchOut: `${formData.date}T${formData.punchOut}:00` }),
      };

      await axios.post(`${process.env.REACT_APP_API_URL}/attendance/admin/punch`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      setSuccess('Manual attendance recorded successfully');
      setFormData({
        employeeId: '',
        date: '',
        punchIn: '',
        punchOut: '',
      });
    } catch (err) {
      console.error('Error recording manual attendance:', err);
      setError(err.response?.data?.message || 'Failed to record manual attendance');
    }
  };

  return (
    <div className="manual-attendance-container">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

          .manual-attendance-container {
            font-family: 'Poppins', sans-serif;
            color: #1e40af;
            background: #ffffff;
            padding: 2rem;
            border-radius: 1rem;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            margin: 1rem;
          }
          .manual-attendance-title {
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
          .form-label {
            font-size: 1rem;
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 0.5rem;
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
          .card {
            border-radius: 1rem;
            border: none;
            background: #ffffff;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            margin-bottom: 2rem;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            width: 100%;
            color: #1e40af;
            overflow: hidden;
          }
          .card:hover {
            transform: translateY(-8px);
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
          }
          .card-body {
            padding: 2rem;
          }
          @media (max-width: 576px) {
            .manual-attendance-container {
              padding: 1rem;
              margin: 0.5rem;
            }
            .manual-attendance-title {
              font-size: 1.6rem;
              margin-bottom: 1.5rem;
            }
            .alert {
              font-size: 0.9rem;
              padding: 0.8rem;
            }
            .btn-primary {
              padding: 0.6rem 1.5rem;
              font-size: 0.95rem;
            }
            .form-control, .form-select {
              font-size: 0.9rem;
              padding: 0.7rem;
            }
            .form-label {
              font-size: 0.9rem;
            }
            .card-body {
              padding: 1.5rem;
            }
          }
        `}
      </style>
      <div className="manual-attendance-container animate__animated animate__fadeIn">
        <h3 className="manual-attendance-title">Manual Attendance</h3>
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
        <Card className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.1s' }}>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group controlId="employeeId" className="mb-3">
                    <Form.Label>Select Employee</Form.Label>
                    <Form.Select
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Choose an employee...</option>
                      {employees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.employeeId} - {emp.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="date" className="mb-3">
                    <Form.Label>Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group controlId="punchIn" className="mb-3">
                    <Form.Label>Punch In Time (Optional)</Form.Label>
                    <Form.Control
                      type="time"
                      name="punchIn"
                      value={formData.punchIn}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="punchOut" className="mb-3">
                    <Form.Label>Punch Out Time (Optional)</Form.Label>
                    <Form.Control
                      type="time"
                      name="punchOut"
                      value={formData.punchOut}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <div className="text-center">
                <Button
                  variant="primary"
                  type="submit"
                  className="animate__animated animate__fadeIn"
                  style={{ animationDelay: '0.2s' }}
                >
                  <svg className="w-5 h-5 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                  Record Attendance
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default ManualAttendance;
