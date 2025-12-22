/*
 * Dependency Note:
 * Uses react-chartjs-2@4.3.1 and chart.js@3.9.1 for charts, compatible with React 17 to avoid useSyncExternalStore errors.
 * Install: npm install chart.js@3.9.1 react-chartjs-2@4.3.1
 * If child components (AttendanceTable, LeaveRequest, SalarySlip, EmployeeForm) use recharts, install recharts@2.1.16.
 * If react-redux is used, install react-redux@7.2.9.
 * Remove conflicting versions: npm uninstall recharts react-redux (then reinstall correct versions).
 */

import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Button, Container, Card, Offcanvas, Alert } from 'react-bootstrap';
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
import AttendanceTable from './AttendanceTable';
import LeaveRequest from './LeaveRequest';
import SalarySlip from './SalarySlip';
import EmployeeForm from './EmployeeForm';
import AttendanceCalendar from './AttendanceCalendar';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css';

// Register Chart.js components
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const EmployeeDashboard = () => {
  const [profile, setProfile] = useState({});
  const [activeTab, setActiveTab] = useState('profile');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  const [showSidebar, setShowSidebar] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [error, setError] = useState('');
  const history = useHistory();

  // Dynamic greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/employees/profile`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setProfile(res.data || {});
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch profile');
        console.error('Error fetching profile:', err);
      }
    };
    fetchProfile();
  }, []);

  // Fetch attendance data for chart
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/attendance/my-attendance`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const processedData = (res.data || []).map(att => {
          const hoursWorked = att.punchOut && att.punchIn
            ? ((new Date(att.punchOut) - new Date(att.punchIn)) / (1000 * 60 * 60)).toFixed(2)
            : '0.00';
          return {
            date: new Date(att.date).toISOString().split('T')[0],
            hoursWorked: parseFloat(hoursWorked),
          };
        });
        setAttendanceData(processedData);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch attendance data');
        console.error('Error fetching attendance:', err);
      }
    };
    fetchAttendance();
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Chart data
  const chartData = attendanceData.length
    ? attendanceData.map((item) => ({
        date: item.date,
        hoursWorked: parseFloat(item.hoursWorked) || 0,
      }))
    : [
        { date: '2025-09-06', hoursWorked: 8 },
        { date: '2025-09-07', hoursWorked: 7.5 },
        { date: '2025-09-08', hoursWorked: 8 },
        { date: '2025-09-09', hoursWorked: 6.5 },
        { date: '2025-09-10', hoursWorked: 7 },
        { date: '2025-09-11', hoursWorked: 8 },
        { date: '2025-09-12', hoursWorked: 7.5 },
      ];

  const chartConfig = {
    labels: chartData.map((item) => item.date),
    datasets: [
      {
        label: 'Hours Worked',
        data: chartData.map((item) => item.hoursWorked),
        backgroundColor: '#1e40af',
        borderColor: '#1e40af',
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
          maxTicksLimit: 7, // Limit number of ticks for better mobile display
          autoSkip: true,
        },
      },
      y: {
        grid: {
          color: '#bfdbfe',
        },
        ticks: {
          color: '#1e40af',
          beginAtZero: true,
          stepSize: 1, // Consistent step size for clarity
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: '#1e40af',
          font: {
            size: 12, // Smaller font for mobile
          },
        },
      },
      tooltip: {
        backgroundColor: '#f8fafc',
        titleColor: '#1e40af',
        bodyColor: '#1e40af',
        borderColor: '#bfdbfe',
        borderWidth: 1,
        cornerRadius: 6,
        padding: 8,
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
            background: linear-gradient(135deg, #ffffff 60%, #e0f2fe 100%);
            color: #1e40af;
            overflow-x: hidden;
          }
          .main-container {
            display: flex;
            min-height: 100vh;
            width: 100vw;
            overflow-x: hidden;
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
          .sidebar h4, .offcanvas-title {
            font-size: 1.8rem;
            font-weight: 700;
            letter-spacing: 0.8px;
            margin-bottom: 2.5rem;
            text-align: center;
            color: #1e40af;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .nav-link {
            color: #1e40af !important;
            padding: 1rem 1.5rem;
            border-radius: 0.6rem;
            margin: 0.5rem 0.5rem;
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
            overflow-x: hidden;
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
          .card-title {
            font-size: 1.8rem;
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 1.5rem;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .card-body p {
            font-size: 1.1rem;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .card-body p strong {
            color: #1e40af;
            width: 150px;
            font-weight: 600;
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
          .btn-primary svg {
            width: 24px;
            height: 24px;
            margin-right: 0.75rem;
            vertical-align: middle;
          }
          .sidebar-toggle {
            display: none;
            background: linear-gradient(135deg, #1e40af, #3b82f6);
            border: 2px solid #3b82f6;
            color: #ffffff !important;
            border-radius: 0.8rem;
            padding: 0.75rem 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 1.5rem;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
            position: relative;
            overflow: hidden;
            min-width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .sidebar-toggle::before {
            content: '';
            position: absolute;
            left: -100%;
            top: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            transition: left 0.4s ease;
          }
          .sidebar-toggle:hover::before {
            left: 100%;
          }
          .sidebar-toggle:hover {
            transform: scale(1.1) rotate(90deg);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
            background: linear-gradient(135deg, #3b82f6, #1e40af);
            filter: brightness(1.1);
          }
          .sidebar-toggle:active {
            transform: scale(0.95);
          }
          .sidebar-toggle svg {
            width: 28px;
            height: 28px;
            stroke-width: 2.5;
          }
          .offcanvas {
            background: linear-gradient(135deg, #f0f9ff 0%, #bfdbfe 100%);
            color: #1e40af;
            width: 280px;
            border-radius: 0 1rem 1rem 0;
            border-right: 2px solid rgba(30, 64, 175, 0.2);
            z-index: 1050;
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
          .offcanvas .nav-link {
            color: #1e40af !important;
            margin: 0.5rem 0.5rem;
            font-size: 1.1rem;
            padding: 1rem 1.5rem;
          }
          .btn-close {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            border-radius: 50%;
            opacity: 1;
            width: 35px;
            height: 35px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
          }
          .btn-close:hover {
            transform: scale(1.1) rotate(90deg);
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5);
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
            width: 100%;
            height: 300px;
            max-width: 100%;
            overflow: hidden;
            margin: 0 auto;
          }
          .chart-container canvas {
            width: 100% !important;
            height: 100% !important;
            max-width: 100%;
            max-height: 100%;
          }
          @media (max-width: 992px) {
            .sidebar {
              transform: translateX(-100%);
            }
            .content-area {
              margin-left: 0;
              padding: 1.5rem;
            }
            .sidebar-toggle {
              display: flex !important;
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
          @media (max-width: 768px) {
            .navbar .container {
              padding: 0 0.5rem;
            }
            .sidebar-toggle {
              min-width: 45px;
              height: 45px;
              padding: 0.6rem;
            }
            .sidebar-toggle svg {
              width: 24px;
              height: 24px;
            }
            .navbar-brand {
              font-size: 1.3rem;
              margin-left: 0.5rem;
            }
            .navbar-text {
              display: none !important;
            }
            .btn-outline-light {
              padding: 0.4rem 1rem;
              font-size: 0.85rem;
            }
            .chart-container {
              height: 220px;
            }
          }
          @media (max-width: 576px) {
            .content-area {
              padding: 1rem;
            }
            .card {
              margin: 0 0.5rem 1.5rem;
            }
            .card-title {
              font-size: 1.6rem;
            }
            .card-body p {
              font-size: 0.95rem;
            }
            .card-body p strong {
              width: 120px;
            }
            .btn-primary {
              padding: 0.6rem 1.5rem;
              font-size: 0.95rem;
            }
            .btn-primary svg {
              width: 20px;
              height: 20px;
            }
            .offcanvas {
              width: 260px;
            }
            .offcanvas .nav-link {
              font-size: 0.95rem;
              padding: 0.8rem 1.2rem;
            }
            .offcanvas .nav-link svg {
              width: 20px;
              height: 20px;
            }
            .sidebar-toggle {
              min-width: 42px;
              height: 42px;
              padding: 0.5rem;
            }
            .sidebar-toggle svg {
              width: 22px;
              height: 22px;
            }
            .navbar-brand {
              font-size: 1.2rem;
            }
            .btn-outline-light {
              padding: 0.35rem 0.8rem;
              font-size: 0.8rem;
            }
            .chart-container {
              height: 200px;
            }
          }
          @media (max-width: 400px) {
            .offcanvas {
              width: 240px;
            }
            .offcanvas .nav-link {
              font-size: 0.9rem;
              padding: 0.7rem 1rem;
            }
            .offcanvas .nav-link svg {
              width: 18px;
              height: 18px;
            }
            .card-title {
              font-size: 1.4rem;
            }
            .card-body p {
              font-size: 0.9rem;
            }
            .card-body p strong {
              width: 100px;
            }
            .btn-primary {
              padding: 0.5rem 1.2rem;
              font-size: 0.9rem;
            }
            .btn-primary svg {
              width: 18px;
              height: 18px;
            }
            .sidebar-toggle {
              min-width: 40px;
              height: 40px;
              padding: 0.4rem;
            }
            .sidebar-toggle svg {
              width: 20px;
              height: 20px;
            }
            .navbar-brand {
              font-size: 1.1rem;
            }
            .btn-outline-light {
              padding: 0.3rem 0.6rem;
              font-size: 0.75rem;
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
          <h4 className="animate__animated animate__zoomIn">Fintradify Employee</h4>
              <Nav className="flex-column">
                {['profile', 'attendance-calendar', 'attendance', 'leaves', 'salary', 'edit-profile'].map((tab) => (
                  <Nav.Link
                    key={tab}
                    className={`animate__animated animate__fadeInLeft ${activeTab === tab ? 'active' : ''}`}
                    style={{ animationDelay: `${0.1 * ['profile', 'attendance-calendar', 'attendance', 'leaves', 'salary', 'edit-profile'].indexOf(tab)}s` }}
                    onClick={() => handleTabClick(tab)}
                    aria-current={activeTab === tab ? 'page' : undefined}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {tab === 'profile' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />}
                      {tab === 'attendance-calendar' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
                      {tab === 'attendance' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />}
                      {tab === 'leaves' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />}
                      {tab === 'salary' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
                      {tab === 'edit-profile' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />}
                    </svg>
                    {tab.charAt(0).toUpperCase() + tab.slice(1).replace('attendance-calendar', 'Attendance Calendar').replace('leaves', 'Leave Requests').replace('salary', 'Salary Slips').replace('edit-profile', 'Edit Profile')}
                  </Nav.Link>
                ))}
              </Nav>
        </div>

        {/* Main Content */}
        <div className="content-area">
          <Navbar bg="light" variant="light" className="mb-5">
            <Container>
              <Button
                variant="primary"
                className="sidebar-toggle d-lg-none animate__animated animate__bounceIn"
                onClick={() => setShowSidebar(true)}
                aria-label="Toggle sidebar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
              <Navbar.Brand className="animate__animated animate__zoomIn">Fintradify Employee</Navbar.Brand>
              <Navbar.Text className="ms-auto animate__animated animate__fadeIn d-none d-md-block">{currentTime}</Navbar.Text>
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
            <Offcanvas.Header closeButton>
              <Offcanvas.Title className="animate__animated animate__zoomIn">Fintradify Employee</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <Nav className="flex-column">
                {['profile', 'attendance-calendar', 'attendance', 'leaves', 'salary', 'edit-profile'].map((tab) => (
                  <Nav.Link
                    key={tab}
                    className={`animate__animated animate__fadeInLeft ${activeTab === tab ? 'active' : ''}`}
                    style={{ animationDelay: `${0.1 * ['profile', 'attendance-calendar', 'attendance', 'leaves', 'salary', 'edit-profile'].indexOf(tab)}s` }}
                    onClick={() => handleTabClick(tab)}
                    aria-current={activeTab === tab ? 'page' : undefined}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {tab === 'profile' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />}
                      {tab === 'attendance-calendar' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
                      {tab === 'attendance' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />}
                      {tab === 'leaves' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />}
                      {tab === 'salary' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
                      {tab === 'edit-profile' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />}
                    </svg>
                    {tab.charAt(0).toUpperCase() + tab.slice(1).replace('attendance-calendar', 'Attendance Calendar').replace('leaves', 'Leave Requests').replace('salary', 'Salary Slips').replace('edit-profile', 'Edit Profile')}
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
            {activeTab === 'profile' && (
              <Card className="animate__animated animate__fadeInUp">
                <Card.Body>
                  <h3 className="mb-4 fw-bold text-primary-800">{getGreeting()}, {profile.name || 'Employee'}!</h3>
                  <h5 className="text-primary-600 mb-3">Your Weekly Attendance</h5>
                  <div className="mb-4 chart-container">
                    <Bar data={chartConfig} options={chartOptions} />
                  </div>
                  <Card.Title className="animate__animated animate__zoomIn">Profile</Card.Title>
                  <p>
                    <strong>Employee ID:</strong> {profile.employeeId || 'N/A'}
                  </p>
                  <p>
                    <strong>Name:</strong> {profile.name || 'N/A'}
                  </p>
                  <p>
                    <strong>Email:</strong> {profile.email || 'N/A'}
                  </p>
                  <p>
                    <strong>Phone:</strong> {profile.phone || 'N/A'}
                  </p>
                  <p>
                    <strong>Position:</strong> {profile.position || 'N/A'}
                  </p>
                  {attendanceData.length === 0 && !error && (
                    <p className="text-muted mt-4">No attendance data available.</p>
                  )}
                  <Button
                    variant="primary"
                    onClick={() => handleTabClick('edit-profile')}
                    className="animate__animated animate__fadeIn"
                    style={{ animationDelay: '0.2s' }}
                    aria-label="Edit Profile"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profile
                  </Button>
                </Card.Body>
              </Card>
            )}
            {activeTab === 'edit-profile' && (
              <Card className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.1s' }}>
                <Card.Body>
                  <Card.Title className="animate__animated animate__zoomIn">Edit Profile</Card.Title>
                  <EmployeeForm employee={profile} isEmployee />
                </Card.Body>
              </Card>
            )}
            {activeTab === 'attendance-calendar' && (
              <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.1s' }}>
                <AttendanceCalendar />
              </div>
            )}
            {activeTab === 'attendance' && (
              <Card className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.2s' }}>
                <Card.Body>
                  <Card.Title className="animate__animated animate__zoomIn">Attendance</Card.Title>
                  <AttendanceTable isEmployee />
                </Card.Body>
              </Card>
            )}
            {activeTab === 'leaves' && (
              <Card className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.3s' }}>
                <Card.Body>
                  <Card.Title className="animate__animated animate__zoomIn">Leave Requests</Card.Title>
                  <LeaveRequest />
                </Card.Body>
              </Card>
            )}
            {activeTab === 'salary' && (
              <Card className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.4s' }}>
                <Card.Body>
                  <Card.Title className="animate__animated animate__zoomIn">Salary Slips</Card.Title>
                  <SalarySlip />
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

export default EmployeeDashboard;