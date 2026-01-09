import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Card, Row, Col, Table, Modal } from 'react-bootstrap';
import axios from 'axios';
import moment from 'moment';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css';

const ManualAttendance = () => {
  const [employees, setEmployees] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [startDate, setStartDate] = useState(moment().format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(moment().format('YYYY-MM-DD'));
  const [formData, setFormData] = useState({
    employeeId: '',
    date: moment().format('YYYY-MM-DD'),
    punchIn: '',
    punchOut: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [editForm, setEditForm] = useState({ punchIn: '', punchOut: '', holiday: false, halfDay: false });
  const [loading, setLoading] = useState(false);

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
    fetchAttendances();
  }, []);

  const fetchAttendances = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/attendance?startDate=${startDate}&endDate=${endDate}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setAttendances(res.data);
    } catch (err) {
      console.error('Error fetching attendances:', err);
      setError('Failed to fetch attendances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendances();
  }, [startDate, endDate]);

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

      setSuccess('Manual attendance recorded/updated successfully');

      setFormData({
        employeeId: '',
        date: moment().format('YYYY-MM-DD'),
        punchIn: '',
        punchOut: '',
      });
      fetchAttendances();
    } catch (err) {
      console.error('Error recording manual attendance:', err);
      setError(err.response?.data?.message || 'Failed to record manual attendance');
    }
  };

  const handleEdit = (attendance) => {
    setEditingAttendance(attendance);
    setEditForm({
      punchIn: attendance.punchIn ? moment(attendance.punchIn).format('HH:mm') : '',
      punchOut: attendance.punchOut ? moment(attendance.punchOut).format('HH:mm') : '',
      holiday: attendance.holiday || false,
      halfDay: attendance.halfDay || false,
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/attendance/admin/delete/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setSuccess('Attendance record deleted successfully');
        fetchAttendances();
      } catch (err) {
        console.error('Delete error:', err);
        setError(err.response?.data?.message || 'Failed to delete attendance');
      }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        punchIn: editForm.punchIn ? `${editingAttendance.date.split('T')[0]}T${editForm.punchIn}:00` : null,
        punchOut: editForm.punchOut ? `${editingAttendance.date.split('T')[0]}T${editForm.punchOut}:00` : null,
        holiday: editForm.holiday,
        halfDay: editForm.halfDay,
      };

      await axios.put(`${process.env.REACT_APP_API_URL}/attendance/admin/edit/${editingAttendance._id}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      setSuccess('Attendance updated successfully');
      setShowEditModal(false);
      fetchAttendances();
    } catch (err) {
      console.error('Edit error:', err);
      setError(err.response?.data?.message || 'Failed to update attendance');
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
        <Card className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.3s' }}>
          <Card.Body>
            <h4 className="mb-3">All Employee Attendances</h4>
            <Form className="mb-3">
              <Row>
                <Col md={6}>
                  <Form.Group controlId="startDate">
                    <Form.Label>Start Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="endDate">
                    <Form.Label>End Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
            <div className="table-responsive">
              <Table striped bordered hover className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.4s' }}>
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Date</th>
                    <th>Punch In</th>
                    <th>Punch Out</th>
                    <th>Holiday</th>
                    <th>Half Day</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="text-center">
                        <div className="d-flex justify-content-center align-items-center">
                          <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          Loading attendances...
                        </div>
                      </td>
                    </tr>
                  ) : attendances.length > 0 ? (
                    attendances.map((att, index) => (
                      <tr key={att._id} className="animate__animated animate__fadeIn" style={{ animationDelay: `${0.05 * index}s` }}>
                        <td>{att.employee?.employeeId || 'N/A'}</td>
                        <td>{att.employee?.name || 'N/A'}</td>
                        <td>{moment(att.date).format('YYYY-MM-DD')}</td>
                        <td>{att.punchIn ? moment(att.punchIn).format('HH:mm:ss') : '-'}</td>
                        <td>{att.punchOut ? moment(att.punchOut).format('HH:mm:ss') : '-'}</td>
                        <td>{att.holiday ? 'Yes' : 'No'}</td>
                        <td>{att.halfDay ? 'Yes' : 'No'}</td>
                        <td>
                          <Button variant="warning" size="sm" onClick={() => handleEdit(att)} className="me-2">
                            Edit
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleDelete(att._id)}>
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center">No attendance records available</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Edit Attendance</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleEditSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group controlId="editPunchIn" className="mb-3">
                    <Form.Label>Punch In Time</Form.Label>
                    <Form.Control
                      type="time"
                      value={editForm.punchIn}
                      onChange={(e) => setEditForm({ ...editForm, punchIn: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="editPunchOut" className="mb-3">
                    <Form.Label>Punch Out Time</Form.Label>
                    <Form.Control
                      type="time"
                      value={editForm.punchOut}
                      onChange={(e) => setEditForm({ ...editForm, punchOut: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Check
                    type="checkbox"
                    label="Holiday"
                    checked={editForm.holiday}
                    onChange={(e) => setEditForm({ ...editForm, holiday: e.target.checked })}
                  />
                </Col>
                <Col md={6}>
                  <Form.Check
                    type="checkbox"
                    label="Half Day"
                    checked={editForm.halfDay}
                    onChange={(e) => setEditForm({ ...editForm, halfDay: e.target.checked })}
                  />
                </Col>
              </Row>
              <div className="text-center mt-3">
                <Button variant="primary" type="submit">
                  Update Attendance
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>
      </div>
    </div>
  );
};

export default ManualAttendance;
