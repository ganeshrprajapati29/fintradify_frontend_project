import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Button, Container, Card, Offcanvas, Table, Alert } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import EmployeeForm from './EmployeeForm';
import AttendanceTable from './AttendanceTable';
import LeaveRequest from './LeaveRequest';
import SalarySlip from './SalarySlip';
import ManualAttendance from './ManualAttendance';
import PaidLeaves from './PaidLeaves';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css';

// Register Chart.js components
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];


// EmployeeList component
const EmployeeList = ({ mode }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/employees`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setEmployees(res.data);
      setError('');
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleTerminate = async (id) => {
    if (!window.confirm('Are you sure you want to block this employee?')) return;
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/employees/${id}/block`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      fetchEmployees(); // Refresh list
    } catch (err) {
      console.error('Error blocking employee:', err);
      setError('Failed to block employee');
    }
  };

  const handleEnable = async (id) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/employees/${id}/unblock`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      fetchEmployees(); // Refresh list
    } catch (err) {
      console.error('Error unblocking employee:', err);
      setError('Failed to unblock employee');
    }
  };

  if (loading) return <div>Loading employees...</div>;

  const filteredEmployees = mode === 'block' ? employees.filter(emp => emp.status === 'active') :
                           mode === 'unblock' ? employees.filter(emp => emp.status !== 'active') :
                           employees;

  return (
    <div>
      <h5 className="text-primary-600 mb-3">
        {mode === 'block' ? 'Block Employees' : mode === 'unblock' ? 'Unblock Employees' : 'Employee List'}
      </h5>
      {error && <Alert variant="danger">{error}</Alert>}
      <div className="table-responsive">
        <Table className="table table-bordered table-hover">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Position</th>
              <th>Email</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((emp, index) => (
              <tr key={emp._id} className="animate__animated animate__fadeIn" style={{ animationDelay: `${0.05 * index}s` }}>
                <td>{emp.employeeId}</td>
                <td>{emp.name}</td>
                <td>{emp.position}</td>
                <td>{emp.email}</td>
                <td>
                  <span className={`badge ${emp.status === 'active' ? 'bg-success' : 'bg-danger'}`}>
                    {emp.status}
                  </span>
                </td>
                <td>
                  {mode === 'block' && emp.status === 'active' && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleTerminate(emp._id)}
                    >
                      Block
                    </Button>
                  )}
                  {mode === 'unblock' && emp.status !== 'active' && (
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={() => handleEnable(emp._id)}
                    >
                      Unblock
                    </Button>
                  )}
                  {!mode && (
                    <>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleTerminate(emp._id)}
                        disabled={emp.status !== 'active'}
                        style={{ marginRight: '5px' }}
                      >
                        Block
                      </Button>
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => handleEnable(emp._id)}
                        disabled={emp.status === 'active'}
                      >
                        Unblock
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  const [overview, setOverview] = useState({});
  const [showSidebar, setShowSidebar] = useState(false);
  const [error, setError] = useState('');
  const history = useHistory();

  // Dynamic greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Live clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch attendance overview
  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/attendance/overview`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setOverview(res.data);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch attendance overview');
        console.error('Error fetching overview:', err);
      }
    };
    fetchOverview();
  }, []);

  // Chart data
  const chartData = Object.keys(overview).length
    ? Object.keys(overview).map((date) => ({
        date,
        totalHours: overview[date].reduce((sum, att) => sum + (parseFloat(att.hoursWorked) || 0), 0),
        employeesPresent: overview[date].length,
      }))
    : [
        { date: '2025-09-10', totalHours: 48, employeesPresent: 6 },
        { date: '2025-09-11', totalHours: 52, employeesPresent: 7 },
        { date: '2025-09-12', totalHours: 45, employeesPresent: 5 },
      ];

  // Chart.js configuration
  const chartConfig = {
    labels: chartData.map((item) => item.date),
    datasets: [
      {
        label: 'Total Hours Worked',
        data: chartData.map((item) => item.totalHours),
        backgroundColor: '#1e40af',
        borderColor: '#1e40af',
        borderWidth: 1,
      },
      {
        label: 'Employees Present',
        data: chartData.map((item) => item.employeesPresent),
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          color: '#bfdbfe',
        },
        ticks: {
          color: '#1e40af',
        },
      },
      y: {
        grid: {
          color: '#bfdbfe',
        },
        ticks: {
          color: '#1e40af',
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: '#1e40af',
        },
      },
      tooltip: {
        backgroundColor: '#f8fafc',
        titleColor: '#1e40af',
        bodyColor: '#1e40af',
        borderColor: '#bfdbfe',
        borderWidth: 1,
        cornerRadius: 6,
      },
    },
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    history.push('/');
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setShowSidebar(false);
  };

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

          body {
            font-family: 'Poppins', sans-serif;
            margin: 0;
            background: linear-gradient(135deg, #e6f0fa 0%, #d1e3f6 50%, #a3c7ed 100%);
            color: #1e40af;
            overflow-x: hidden;
          }
          .main-container {
            display: flex;
            min-height: 100vh;
            width: 100vw;
          }
          .sidebar {
            width: 280px;
            background: linear-gradient(135deg, #f0f9ff 0%, #bfdbfe 100%);
            color: #1e40af;
            padding: 2rem 1rem;
            box-shadow: 8px 0 20px rgba(0, 0, 0, 0.1);
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            z-index: 1000;
            transition: transform 0.3s ease-in-out;
            border-right: 2px solid rgba(30, 64, 175, 0.2);
          }
          .sidebar h4 {
            font-size: 1.8rem;
            font-weight: 700;
            letter-spacing: 0.8px;
            margin-bottom: 1.5rem;
            text-align: center;
            color: #1e40af;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .sidebar .office-hours {
            font-size: 0.9rem;
            color: #64748b;
            text-align: center;
            margin-bottom: 2rem;
            line-height: 1.6;
          }
          .nav-link {
            color: #1e40af !important;
            padding: 1rem 1.5rem;
            border-radius: 0.6rem;
            margin: 0.5rem;
            font-size: 1.1rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 1rem;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          .nav-link::before {
            content: '';
            position: absolute;
            left: -100%;
            top: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent);
            transition: left 0.4s ease;
          }
          .nav-link:hover::before {
            left: 100%;
          }
          .nav-link:hover {
            background: rgba(59, 130, 246, 0.2);
            transform: translateX(8px);
            color: #3b82f6 !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .nav-link.active {
            background: linear-gradient(90deg, #1e40af, #3b82f6);
            color: #fff !important;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
            transform: scale(1.02);
          }
          .nav-link svg {
            width: 24px;
            height: 24px;
            flex-shrink: 0;
          }
          .content-area {
            flex-grow: 1;
            margin-left: 280px;
            padding: 2.5rem;
            background: #ffffff;
            min-height: 100vh;
            transition: margin-left 0.3s ease-in-out;
          }
          .navbar {
            background: linear-gradient(90deg, #f0f9ff, #bfdbfe) !important;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
            padding: 1rem;
            position: sticky;
            top: 0;
            z-index: 999;
            border-bottom: 2px solid rgba(30, 64, 175, 0.2);
          }
          .navbar-brand {
            font-size: 1.8rem;
            font-weight: 700;
            color: #1e40af;
            letter-spacing: 0.5px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .navbar-text {
            color: #374151;
            font-size: 1rem;
            font-weight: 500;
          }
          .btn-outline-light {
            border-color: #3b82f6;
            color: #3b82f6;
            font-weight: 600;
            padding: 0.6rem 2rem;
            border-radius: 0.6rem;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          .btn-outline-light::before {
            content: '';
            position: absolute;
            left: -100%;
            top: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.4), transparent);
            transition: left 0.4s ease;
          }
          .btn-outline-light:hover::before {
            left: 100%;
          }
          .btn-outline-light:hover {
            background: #3b82f6 !important;
            border-color: #3b82f6 !important;
            color: #fff !important;
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
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
          .table {
            border-radius: 0.6rem;
            overflow: hidden;
            background: #f8fafc;
            color: #1e40af;
            border: 1px solid rgba(30, 64, 175, 0.2);
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
          .form-label {
            color: #1e40af;
            font-weight: 600;
            font-size: 1rem;
            margin-bottom: 0.5rem;
          }
          .form-control {
            background-color: #f8fafc;
            border-color: #bfdbfe;
            border-radius: 0.6rem;
            padding: 0.8rem;
            font-size: 1rem;
            transition: all 0.3s ease;
          }
          .form-control:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
          }
          .form-control:hover {
            border-color: #3b82f6;
          }
          .text-primary-800 {
            color: #1e40af;
            font-weight: 600;
          }
          .text-primary-600 {
            color: #3b82f6;
            font-weight: 500;
          }
          .sidebar-toggle {
            display: none;
            font-size: 2rem;
            color: #3b82f6;
            background: none;
            border: none;
            padding: 0.5rem;
            cursor: pointer;
            transition: all 0.3s ease;
            border-radius: 0.5rem;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          }
          .sidebar-toggle:hover {
            transform: rotate(90deg) scale(1.1);
            background: rgba(59, 130, 246, 0.1);
            filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.5));
          }
          .offcanvas {
            background: linear-gradient(135deg, #f0f9ff 0%, #bfdbfe 100%);
            color: #1e40af;
            width: 280px;
            border-radius: 0 1rem 1rem 0;
            border-right: 2px solid rgba(30, 64, 175, 0.2);
          }
          .offcanvas .nav-link {
            color: #1e40af !important;
            margin: 0.5rem;
            font-size: 1.1rem;
            padding: 1rem 1.5rem;
          }
          .offcanvas-header {
            border-bottom: 2px solid rgba(30, 64, 175, 0.2);
            padding: 1.5rem;
          }
          .offcanvas-title {
            font-size: 1.8rem;
            font-weight: 700;
            color: #1e40af;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .alert {
            border-radius: 0.6rem;
            background: rgba(239, 68, 68, 0.2);
            backdrop-filter: blur(10px);
            color: #1e40af;
            border: 1px solid rgba(239, 68, 68, 0.3);
          }
          .chart-container {
            position: relative;
            height: 300px;
            width: 100%;
          }
          @media (max-width: 992px) {
            .sidebar {
              transform: translateX(-100%);
            }
            .sidebar.active {
              transform: translateX(0);
            }
            .content-area {
              margin-left: 0;
              padding: 1.5rem;
            }
            .sidebar-toggle {
              display: block;
            }
            .navbar-brand {
              font-size: 1.5rem;
            }
            .btn-outline-light {
              padding: 0.5rem 1.5rem;
              font-size: 0.95rem;
            }
            .navbar-text {
              font-size: 0.9rem;
            }
            .chart-container {
              height: 250px;
            }
          }
          @media (max-width: 576px) {
            .content-area {
              padding: 1rem;
            }
            .card {
              margin: 0 0.5rem 1.5rem;
            }
            .table th, .table td {
              padding: 0.8rem;
              font-size: 0.85rem;
            }
            .navbar-brand {
              font-size: 1.3rem;
            }
            .navbar-text {
              font-size: 0.8rem;
            }
            .form-control {
              font-size: 0.9rem;
              padding: 0.7rem;
            }
            .form-label {
              font-size: 0.9rem;
            }
            .chart-container {
              height: 200px;
            }
          }
          @media (max-width: 400px) {
            .offcanvas {
              width: 240px;
            }
            .nav-link {
              font-size: 0.95rem;
              padding: 0.8rem 1.2rem;
            }
            .nav-link svg {
              width: 20px;
              height: 20px;
            }
            .sidebar h4, .offcanvas-title {
              font-size: 1.5rem;
            }
            .chart-container {
              height: 180px;
            }
          }
        `}
      </style>
      <div className="main-container">
        {/* Sidebar for Desktop */}
        <div className="sidebar d-none d-lg-block">
          <h4 className="animate__animated animate__zoomIn">Fintradify Admin</h4>
          <div className="office-hours animate__animated animate__fadeIn" style={{ animationDelay: '0.2s' }}>
            <p><strong>Office Hours</strong></p>
            <p>Monday - Saturday: 10:00 AM - 6:00 PM<br />Sunday: Closed</p>
          </div>
          <Nav className="flex-column">
            {['overview', 'add-employee', 'employee-list', 'block-employees', 'unblock-employees', 'attendance', 'manual-attendance', 'leaves', 'paid-leaves', 'salary'].map((tab) => (
              <Nav.Link
                key={tab}
                className={`animate__animated animate__fadeInLeft ${activeTab === tab ? 'active' : ''}`}
                style={{ animationDelay: `${0.1 * ['overview', 'add-employee', 'employee-list', 'block-employees', 'unblock-employees', 'attendance', 'manual-attendance', 'leaves', 'paid-leaves', 'salary'].indexOf(tab)}s` }}
                onClick={() => handleTabClick(tab)}
                aria-current={activeTab === tab ? 'page' : undefined}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {tab === 'overview' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2M9 19" />}
                  {tab === 'add-employee' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />}
                  {tab === 'employee-list' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />}
                  {tab === 'block-employees' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />}
                  {tab === 'unblock-employees' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
                  {tab === 'attendance' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
                  {tab === 'manual-attendance' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />}
                  {tab === 'leaves' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />}
                  {tab === 'paid-leaves' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
                  {tab === 'salary' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
                </svg>
                {tab.charAt(0).toUpperCase() + tab.slice(1).replace('overview', 'Dashboard').replace('add-employee', 'Add Employee').replace('employee-list', 'Employee List').replace('block-employees', 'Block Employees').replace('unblock-employees', 'Unblock Employees').replace('salary', 'Salary Slips')}
              </Nav.Link>
            ))}
          </Nav>
        </div>

        {/* Main Content */}
        <div className="content-area">
          <Navbar bg="light" variant="light" className="mb-5">
            <Container>
              <Button
                variant="link"
                className="sidebar-toggle d-lg-none"
                onClick={() => setShowSidebar(true)}
                aria-label="Toggle Sidebar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
              <Navbar.Brand className="animate__animated animate__zoomIn">Fintradify Admin</Navbar.Brand>
              <Navbar.Text className="ms-auto animate__animated animate__fadeIn">
                {currentTime.split(',')[0]} | {DAYS[new Date().getDay()]}, {MONTHS[new Date().getMonth()]} {new Date().getDate()}, {new Date().getFullYear()}
              </Navbar.Text>
              <Button
                variant="outline-light"
                onClick={handleLogout}
                className="animate__animated animate__fadeIn"
                style={{ animationDelay: '0.3s' }}
                aria-label="Logout"
              >
                Logout
              </Button>
            </Container>
          </Navbar>

          {/* Sidebar for Mobile (Offcanvas) */}
          <Offcanvas show={showSidebar} onHide={() => setShowSidebar(false)} placement="start" className="d-lg-none">
            <Offcanvas.Header closeButton closeVariant="white">
              <Offcanvas.Title className="animate__animated animate__zoomIn">Fintradify Admin</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <div className="office-hours animate__animated animate__fadeIn" style={{ animationDelay: '0.2s' }}>
                <p><strong>Office Hours</strong></p>
                <p>Monday - Saturday: 10:00 AM - 6:00 PM<br />Sunday: Closed</p>
              </div>
              <Nav className="flex-column">
                {['overview', 'add-employee', 'employee-list', 'attendance', 'manual-attendance', 'leaves', 'paid-leaves', 'salary'].map((tab) => (
                  <Nav.Link
                    key={tab}
                    className={`animate__animated animate__fadeInLeft ${activeTab === tab ? 'active' : ''}`}
                    style={{ animationDelay: `${0.1 * ['overview', 'add-employee', 'employee-list', 'attendance', 'manual-attendance', 'leaves', 'paid-leaves', 'salary'].indexOf(tab)}s` }}
                    onClick={() => handleTabClick(tab)}
                    aria-current={activeTab === tab ? 'page' : undefined}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {tab === 'overview' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2M9 19" />}
                      {tab === 'add-employee' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />}
                      {tab === 'employee-list' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />}
                      {tab === 'attendance' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
                      {tab === 'leaves' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />}
                      {tab === 'salary' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
                    </svg>
                    {tab.charAt(0).toUpperCase() + tab.slice(1).replace('overview', 'Dashboard').replace('add-employee', 'Add Employee').replace('employee-list', 'Employee List').replace('salary', 'Salary Slips')}
                  </Nav.Link>
                ))}
              </Nav>
            </Offcanvas.Body>
          </Offcanvas>

          <Container fluid>
            {error && (
              <Alert
                variant="danger"
                className="mb-4 animate__animated animate__shakeX"
                role="alert"
              >
                {error}
              </Alert>
            )}
            {activeTab === 'overview' && (
              <Card className="animate__animated animate__fadeInUp">
                <Card.Body>
                  <h3 className="mb-4 fw-bold text-primary-800">{getGreeting()}, Welcome to Fintradify!</h3>
                  <h5 className="text-primary-600 mb-3">Attendance Dashboard</h5>
                  <div className="mb-4 chart-container">
                    <Bar data={chartConfig} options={chartOptions} />
                  </div>
                  <h5 className="text-primary-600 mb-3">Summary Statistics</h5>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <Card className="text-center">
                        <Card.Body>
                          <h6 className="text-primary-800">Total Employees</h6>
                          <p className="fs-4 text-primary-600">{chartData.reduce((max, curr) => Math.max(max, curr.employeesPresent), 0)}</p>
                        </Card.Body>
                      </Card>
                    </div>
                    <div className="col-md-4 mb-3">
                      <Card className="text-center">
                        <Card.Body>
                          <h6 className="text-primary-800">Average Hours/Day</h6>
                          <p className="fs-4 text-primary-600">
                            {(chartData.reduce((sum, curr) => sum + curr.totalHours, 0) / chartData.length || 0).toFixed(1)}
                          </p>
                        </Card.Body>
                      </Card>
                    </div>
                    <div className="col-md-4 mb-3">
                      <Card className="text-center">
                        <Card.Body>
                          <h6 className="text-primary-800">Attendance Rate</h6>
                          <p className="fs-4 text-primary-600">
                            {((chartData.reduce((sum, curr) => sum + curr.employeesPresent, 0) / (chartData.length * 10)) * 100 || 70).toFixed(1)}%
                          </p>
                        </Card.Body>
                      </Card>
                    </div>
                  </div>
                  {Object.keys(overview).length === 0 && !error && (
                    <p className="text-muted mt-4">No attendance data available.</p>
                  )}
                  {Object.keys(overview).sort((a, b) => new Date(b) - new Date(a)).map((date) => (
                    <div key={date} className="mb-5">
                      <h5 className="text-primary-600 mb-3">{date}</h5>
                      <div className="table-responsive">
                        <Table className="table table-bordered table-hover">
                          <thead>
                            <tr>
                              <th>Employee ID</th>
                              <th>Name</th>
                              <th>Punch In</th>
                              <th>Punch Out</th>
                              <th>Hours Worked</th>
                            </tr>
                          </thead>
                          <tbody>
                            {overview[date].map((att, index) => (
                              <tr key={index} className="animate__animated animate__fadeIn" style={{ animationDelay: `${0.05 * index}s` }}>
                                <td>{att.employeeId}</td>
                                <td>{att.name}</td>
                                <td>{att.punchIn}</td>
                                <td>{att.punchOut || 'N/A'}</td>
                                <td>{att.hoursWorked || 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            )}
            {activeTab === 'add-employee' && (
              <Card className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.1s' }}>
                <Card.Body>
                  <h3 className="mb-4 fw-bold text-primary-800">Add Employee</h3>
                  <EmployeeForm />
                </Card.Body>
              </Card>
            )}
            {activeTab === 'employee-list' && (
              <Card className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.2s' }}>
                <Card.Body>
                  <h3 className="mb-4 fw-bold text-primary-800">Employee List</h3>
                  <EmployeeList />
                </Card.Body>
              </Card>
            )}
            {activeTab === 'block-employees' && (
              <Card className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.25s' }}>
                <Card.Body>
                  <h3 className="mb-4 fw-bold text-primary-800">Block Employees</h3>
                  <EmployeeList mode="block" />
                </Card.Body>
              </Card>
            )}
            {activeTab === 'unblock-employees' && (
              <Card className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.25s' }}>
                <Card.Body>
                  <h3 className="mb-4 fw-bold text-primary-800">Unblock Employees</h3>
                  <EmployeeList mode="unblock" />
                </Card.Body>
              </Card>
            )}
            {activeTab === 'attendance' && (
              <Card className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.3s' }}>
                <Card.Body>
                  <h3 className="mb-4 fw-bold text-primary-800">Attendance Details</h3>
                  <AttendanceTable />
                </Card.Body>
              </Card>
            )}
            {activeTab === 'leaves' && (
              <Card className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.4s' }}>
                <Card.Body>
                  <h3 className="mb-4 fw-bold text-primary-800">Leave Requests</h3>
                  <LeaveRequest isAdmin />
                </Card.Body>
              </Card>
            )}
            {activeTab === 'manual-attendance' && (
              <Card className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.4s' }}>
                <Card.Body>
                  <h3 className="mb-4 fw-bold text-primary-800">Manual Attendance</h3>
                  <ManualAttendance />
                </Card.Body>
              </Card>
            )}
            {activeTab === 'paid-leaves' && (
              <Card className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.5s' }}>
                <Card.Body>
                  <h3 className="mb-4 fw-bold text-primary-800">Paid Leaves</h3>
                  <PaidLeaves isAdmin />
                </Card.Body>
              </Card>
            )}
            {activeTab === 'salary' && (
              <Card className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.6s' }}>
                <Card.Body>
                  <h3 className="mb-4 fw-bold text-primary-800">Salary Slips</h3>
                  <SalarySlip isAdmin />
                </Card.Body>
              </Card>
            )}
            <div className="text-center mt-4">
              <p
                className="text-muted"
                style={{
                  fontSize: '0.85rem',
                  color: '#64748b',
                }}
              >
                © {new Date().getFullYear()} Fintradify. All rights reserved.
              </p>
            </div>
          </Container>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;