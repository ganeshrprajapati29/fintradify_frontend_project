import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Table, Modal } from 'react-bootstrap';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css';

const EmployeeForm = ({ employee, isEmployee }) => {
  const [formData, setFormData] = useState({
    name: employee ? employee.name : '',
    email: employee ? employee.email : '',
    phone: employee ? employee.phone : '',
    position: employee ? employee.position : '',
    salary: employee && employee.salary !== 'N/A' ? employee.salary : '',
    password: '',
  });
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const fetchEmployees = async () => {
    if (isEmployee) return; // Employees don't fetch employee list
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/employees`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setEmployees(res.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError(err.response?.data?.message || 'Error fetching employees');
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [isEmployee]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEmployee) {
      setError('Employees cannot add new employees');
      return;
    }
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/employees`,
        formData,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setFormData({ name: '', email: '', phone: '', position: '', salary: '', password: '' });
      fetchEmployees();
      setError('');
      alert('Employee added successfully');
    } catch (err) {
      console.error('Add employee error:', err);
      setError(err.response?.data?.message || 'Error adding employee');
    }
  };

  const handleEdit = (emp) => {
    setSelectedEmployee(emp);
    setFormData({
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      position: emp.position,
      salary: emp.salary !== 'N/A' ? emp.salary : '',
      password: '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        isEmployee
          ? `${process.env.REACT_APP_API_URL}/employees/profile`
          : `${process.env.REACT_APP_API_URL}/employees/${selectedEmployee._id}`,
        formData,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setShowEditModal(false);
      fetchEmployees();
      setError('');
      alert('Profile updated successfully');
    } catch (err) {
      console.error('Update employee error:', err);
      setError(err.response?.data?.message || 'Error updating profile');
    }
  };

  const handleDelete = async (id) => {
    if (isEmployee) {
      setError('Employees cannot delete accounts');
      return;
    }
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/employees/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        fetchEmployees();
        setError('');
        alert('Employee deleted successfully');
      } catch (err) {
        console.error('Delete employee error:', err);
        setError(err.response?.data?.message || 'Error deleting employee');
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="employee-form-container">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

          .employee-form-container {
            font-family: 'Poppins', sans-serif;
            color: #1e40af;
            background: #ffffff;
            padding: 1.5rem;
            border-radius: 1rem;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            margin: 1rem;
          }
          .form-title, .table-title {
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
          .form-control:disabled {
            background: #e5e7eb;
            border-color: #d1d5db;
            color: #6b7280;
            opacity: 0.6;
          }
          .btn-primary, .btn-warning, .btn-danger {
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
          .btn-primary::before, .btn-warning::before, .btn-danger::before {
            content: '';
            position: absolute;
            left: -100%;
            top: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.4), transparent);
            transition: left 0.4s ease;
          }
          .btn-primary:hover::before, .btn-warning:hover::before, .btn-danger:hover::before {
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
            border-color: #facc15;
            background: linear-gradient(90deg, #fefce8, #fef08a);
            color: #713f12;
          }
          .btn-warning:hover {
            background: linear-gradient(90deg, #ca8a04, #eab308) !important;
            border-color: #eab308 !important;
            color: #fff !important;
            transform: scale(1.05);
            box-shadow: 0 6px 16px rgba(234, 179, 8, 0.5);
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
          .btn-primary svg, .btn-warning svg, .btn-danger svg {
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
          .modal-content {
            background: #ffffff;
            border: 2px solid rgba(30, 64, 175, 0.2);
            border-radius: 1rem;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            color: #1e40af;
          }
          .modal-header {
            border-bottom: 2px solid rgba(30, 64, 175, 0.2);
            padding: 1.5rem;
          }
          .modal-title {
            font-size: 1.8rem;
            font-weight: 700;
            color: #1e40af;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .modal-footer {
            border-top: 2px solid rgba(30, 64, 175, 0.2);
            padding: 1rem;
          }
          .btn-close {
            background: none;
            color: #1e40af;
            opacity: 0.8;
            transition: opacity 0.3s ease;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
          }
          .btn-close:hover {
            opacity: 1;
            filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.3));
          }
          @media (max-width: 576px) {
            .employee-form-container {
              padding: 1rem;
              margin: 0.5rem;
            }
            .form-title, .table-title {
              font-size: 1.6rem;
              margin-bottom: 1.5rem;
            }
            .alert {
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
            .btn-primary, .btn-warning, .btn-danger {
              padding: 0.6rem 1.5rem;
              font-size: 0.95rem;
            }
            .btn-primary svg, .btn-warning svg, .btn-danger svg {
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
            .modal-title {
              font-size: 1.6rem;
            }
          }
          @media (max-width: 400px) {
            .form-title, .table-title {
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
            .btn-primary, .btn-warning, .btn-danger {
              padding: 0.5rem 1.2rem;
              font-size: 0.9rem;
            }
            .btn-primary svg, .btn-warning svg, .btn-danger svg {
              width: 18px;
              height: 18px;
            }
            .table th, .table td {
              padding: 0.6rem;
              font-size: 0.8rem;
            }
            .modal-title {
              font-size: 1.4rem;
            }
          }
        `}
      </style>
      <div className="employee-form-container animate__animated animate__fadeIn">
        {isEmployee ? (
          <>
            <h3 className="form-title animate__animated animate__zoomIn">Edit Profile</h3>
            {error && (
              <Alert variant="danger" className="animate__animated animate__fadeIn">
                {error}
              </Alert>
            )}
            <Form onSubmit={handleUpdate}>
              <Form.Group controlId="name" className="mb-3 animate__animated animate__fadeIn" style={{ animationDelay: '0.1s' }}>
                <Form.Label>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Name
                </Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              <Form.Group controlId="email" className="mb-3 animate__animated animate__fadeIn" style={{ animationDelay: '0.2s' }}>
                <Form.Label>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isEmployee}
                />
              </Form.Group>
              <Form.Group controlId="phone" className="mb-3 animate__animated animate__fadeIn" style={{ animationDelay: '0.3s' }}>
                <Form.Label>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Phone
                </Form.Label>
                <Form.Control
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              <Form.Group controlId="position" className="mb-3 animate__animated animate__fadeIn" style={{ animationDelay: '0.4s' }}>
                <Form.Label>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Position
                </Form.Label>
                <Form.Control
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  required
                  disabled={isEmployee}
                />
              </Form.Group>
              <Form.Group controlId="password" className="mb-3 animate__animated animate__fadeIn" style={{ animationDelay: '0.5s' }}>
                <Form.Label>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 1.104-.896 2-2 2s-2-.896-2-2 2-4 2-4 2 .896 2 2zm0 0c0 1.104-.896 2-2 2s-2-.896-2-2m0 0V7m0 0V5a2 2 0 012-2h2a2 2 0 012 2v2m-4 4v4m0 0v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2h7" />
                  </svg>
                  Password (optional)
                </Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter new password or leave blank"
                />
              </Form.Group>
              <Button
                variant="primary"
                type="submit"
                className="animate__animated animate__fadeIn"
                style={{ animationDelay: '0.6s' }}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Update Profile
              </Button>
            </Form>
          </>
        ) : (
          <>
            <h3 className="form-title animate__animated animate__zoomIn">Add Employee</h3>
            {error && (
              <Alert variant="danger" className="animate__animated animate__fadeIn">
                {error}
              </Alert>
            )}
            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="name" className="mb-3 animate__animated animate__fadeIn" style={{ animationDelay: '0.1s' }}>
                <Form.Label>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Name
                </Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              <Form.Group controlId="email" className="mb-3 animate__animated animate__fadeIn" style={{ animationDelay: '0.2s' }}>
                <Form.Label>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              <Form.Group controlId="phone" className="mb-3 animate__animated animate__fadeIn" style={{ animationDelay: '0.3s' }}>
                <Form.Label>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Phone
                </Form.Label>
                <Form.Control
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              <Form.Group controlId="position" className="mb-3 animate__animated animate__fadeIn" style={{ animationDelay: '0.4s' }}>
                <Form.Label>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Position
                </Form.Label>
                <Form.Control
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              <Form.Group controlId="salary" className="mb-3 animate__animated animate__fadeIn" style={{ animationDelay: '0.5s' }}>
                <Form.Label>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Monthly Salary (₹)
                </Form.Label>
                <Form.Control
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="Enter monthly salary (optional)"
                  min="0"
                  step="0.01"
                />
              </Form.Group>
              <Form.Group controlId="password" className="mb-3 animate__animated animate__fadeIn" style={{ animationDelay: '0.6s' }}>
                <Form.Label>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 1.104-.896 2-2 2s-2-.896-2-2 2-4 2-4 2 .896 2 2zm0 0c0 1.104-.896 2-2 2s-2-.896-2-2m0 0V7m0 0V5a2 2 0 012-2h2a2 2 0 012 2v2m-4 4v4m0 0v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2h7" />
                  </svg>
                  Password
                </Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Leave blank to generate random password"
                />
              </Form.Group>
              <Button
                variant="primary"
                type="submit"
                className="animate__animated animate__fadeIn"
                style={{ animationDelay: '0.7s' }}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Employee
              </Button>
            </Form>

            <h3 className="table-title mt-5 animate__animated animate__zoomIn">Employee List</h3>
            <div className="table-responsive">
              <Table className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.8s' }}>
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Position</th>
                    <th>Salary (₹)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length > 0 ? (
                    employees.map((emp, index) => (
                      <tr key={emp._id} className="animate__animated animate__fadeIn" style={{ animationDelay: `${0.05 * index}s` }}>
                        <td>{emp.employeeId || 'N/A'}</td>
                        <td>{emp.name}</td>
                        <td>{emp.email}</td>
                        <td>{emp.phone}</td>
                        <td>{emp.position}</td>
                        <td>{emp.salary !== 'N/A' ? `₹${parseFloat(emp.salary).toFixed(2)}` : 'N/A'}</td>
                        <td>
                          <Button
                            variant="warning"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEdit(emp)}
                          >
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(emp._id)}
                          >
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="table-empty">No employees available</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </>
        )}

        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} className="animate__animated animate__fadeIn">
          <Modal.Header closeButton>
            <Modal.Title>Edit Employee</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleUpdate}>
              <Form.Group controlId="name" className="mb-3 animate__animated animate__fadeIn" style={{ animationDelay: '0.1s' }}>
                <Form.Label>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Name
                </Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              <Form.Group controlId="email" className="mb-3 animate__animated animate__fadeIn" style={{ animationDelay: '0.2s' }}>
                <Form.Label>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              <Form.Group controlId="phone" className="mb-3 animate__animated animate__fadeIn" style={{ animationDelay: '0.3s' }}>
                <Form.Label>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Phone
                </Form.Label>
                <Form.Control
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              <Form.Group controlId="position" className="mb-3 animate__animated animate__fadeIn" style={{ animationDelay: '0.4s' }}>
                <Form.Label>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Position
                </Form.Label>
                <Form.Control
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              <Form.Group controlId="salary" className="mb-3 animate__animated animate__fadeIn" style={{ animationDelay: '0.5s' }}>
                <Form.Label>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Monthly Salary (₹)
                </Form.Label>
                <Form.Control
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="Enter monthly salary (optional)"
                  min="0"
                  step="0.01"
                />
              </Form.Group>
              <Form.Group controlId="password" className="mb-3 animate__animated animate__fadeIn" style={{ animationDelay: '0.6s' }}>
                <Form.Label>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 1.104-.896 2-2 2s-2-.896-2-2 2-4 2-4 2 .896 2 2zm0 0c0 1.104-.896 2-2 2s-2-.896-2-2m0 0V7m0 0V5a2 2 0 012-2h2a2 2 0 012 2v2m-4 4v4m0 0v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2h7" />
                  </svg>
                  Password (optional)
                </Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter new password or leave blank"
                />
              </Form.Group>
              <Button
                variant="primary"
                type="submit"
                className="animate__animated animate__fadeIn"
                style={{ animationDelay: '0.7s' }}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Update Employee
              </Button>
            </Form>
          </Modal.Body>
        </Modal>
      </div>
    </div>
  );
};

export default EmployeeForm;