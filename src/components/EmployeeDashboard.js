/*
 * Dependency Note:
 * Uses react-chartjs-2@4.3.1 and chart.js@3.9.1 for charts, compatible with React 17 to avoid useSyncExternalStore errors.
 * Install: npm install chart.js@3.9.1 react-chartjs-2@4.3.1
 * If child components (AttendanceTable, LeaveRequest, SalarySlip, EmployeeForm) use recharts, install recharts@2.1.16.
 * If react-redux is used, install react-redux@7.2.9.
 * Remove conflicting versions: npm uninstall recharts react-redux (then reinstall correct versions).
 */

import React, { useState, useEffect, useRef } from 'react';
import { Navbar, Nav, Button, Container, Card, Offcanvas, Alert, Modal, Form, Spinner } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
  Filler,
} from 'chart.js';
import AttendanceTable from './AttendanceTable';
import LeaveRequest from './LeaveRequest';
import SalarySlip from './SalarySlip';
import Profile from './ProfileDisplay';
import EmployeeProfileEdit from './EmployeeProfileEdit';
import AttendanceCalendar from './AttendanceCalendar';
import EmployeeSettings from './EmployeeSettings';
import EmployeePasswordSettings from './EmployeePasswordSettings';
import EmployeeTasks from './EmployeeTasks';
import EmployeeReimbursement from './EmployeeReimbursement';
import Notification from './Notification';
import CertificateManager from './CertificateManager';
import DocumentSubmission from './DocumentSubmission';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, Tooltip, Legend, LineElement, PointElement, ArcElement, Filler);

const EmployeeDashboard = () => {
  const [profile, setProfile] = useState({});
  const [activeTab, setActiveTab] = useState('profile');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  const [showSidebar, setShowSidebar] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [dashboardTasks, setDashboardTasks] = useState([]);
  const [dashboardReimbursements, setDashboardReimbursements] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState(null);
  const [error, setError] = useState('');
  const [taskMessage, setTaskMessage] = useState('');
  const [quickTask, setQuickTask] = useState(null);
  const [quickTaskNote, setQuickTaskNote] = useState('');
  const [quickTaskLoading, setQuickTaskLoading] = useState(false);
  const [quickUpdatingTaskId, setQuickUpdatingTaskId] = useState('');
  const history = useHistory();
  const authHeaders = { Authorization: `Bearer ${localStorage.getItem('token')}` };
  const lastLocationSentRef = useRef({ at: 0, latitude: null, longitude: null });

  const getArrayPayload = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.records)) return payload.records;
    if (Array.isArray(payload?.data?.records)) return payload.data.records;
    return [];
  };

  const getHoursWorked = (att) => {
    if (att?.hoursWorked !== undefined && att?.hoursWorked !== null) {
      return Number(att.hoursWorked) || 0;
    }

    if (att?.punchOut && att?.punchIn) {
      return Number(((new Date(att.punchOut) - new Date(att.punchIn)) / (1000 * 60 * 60)).toFixed(2)) || 0;
    }

    return 0;
  };

  const getStatus = (value) => String(value || '').trim().toLowerCase();

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
          headers: authHeaders,
        });
        setProfile(res.data.data || {});
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
          headers: authHeaders,
        });
        const processedData = getArrayPayload(res.data)
          .filter((att) => att?.date)
          .map(att => ({
            date: new Date(att.date).toISOString().split('T')[0],
            hoursWorked: getHoursWorked(att),
            status: att.status || att.attendanceStatus || 'Present',
          }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setAttendanceData(processedData);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch attendance data');
        console.error('Error fetching attendance:', err);
      }
    };
    fetchAttendance();
  }, []);

  // Fetch real dashboard widgets
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [taskRes, reimbursementRes, leaveRes] = await Promise.allSettled([
          axios.get(`${process.env.REACT_APP_API_URL}/tasks/my-tasks`, { headers: authHeaders }),
          axios.get(`${process.env.REACT_APP_API_URL}/reimbursements/my`, { headers: authHeaders }),
          axios.get(`${process.env.REACT_APP_API_URL}/leaves/my-balances`, { headers: authHeaders }),
        ]);

        if (taskRes.status === 'fulfilled') {
          setDashboardTasks(getArrayPayload(taskRes.value.data));
        }

        if (reimbursementRes.status === 'fulfilled') {
          setDashboardReimbursements(getArrayPayload(reimbursementRes.value.data));
        }

        if (leaveRes.status === 'fulfilled') {
          setLeaveBalances(leaveRes.value.data?.data || leaveRes.value.data || null);
        }
      } catch (err) {
        console.error('Error fetching dashboard widgets:', err);
      }
    };

    fetchDashboardData();
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keep employee location fresh for admin live tracking whenever the portal is open.
  useEffect(() => {
    if (!navigator.geolocation) return undefined;

    let cancelled = false;
    let batteryLevel = null;

    if (navigator.getBattery) {
      navigator.getBattery()
        .then((battery) => {
          batteryLevel = Math.round((battery.level || 0) * 100);
        })
        .catch(() => {});
    }

    const sendLocation = async (position) => {
      if (cancelled) return;

      const { latitude, longitude, accuracy, speed, heading, altitude } = position.coords;
      const last = lastLocationSentRef.current;
      const now = Date.now();
      const movedEnough =
        last.latitude === null ||
        Math.abs(latitude - last.latitude) > 0.0001 ||
        Math.abs(longitude - last.longitude) > 0.0001;

      if (!movedEnough && now - last.at < 60000) return;

      lastLocationSentRef.current = { at: now, latitude, longitude };

      try {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/tracking/update-location`,
          {
            latitude,
            longitude,
            accuracy,
            speed,
            heading,
            altitude,
            batteryLevel,
            source: 'gps',
            deviceInfo: navigator.userAgent,
          },
          { headers: authHeaders }
        );
      } catch (err) {
        console.warn('Location update skipped:', err.response?.data?.message || err.message);
      }
    };

    const watcherId = navigator.geolocation.watchPosition(
      sendLocation,
      () => {},
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
    );

    return () => {
      cancelled = true;
      navigator.geolocation.clearWatch(watcherId);
    };
  }, []);

  // Chart data
  const chartData = attendanceData.slice(-14).map((item) => ({
    date: item.date,
    hoursWorked: parseFloat(item.hoursWorked) || 0,
  }));

  const monthKey = new Date().toISOString().slice(0, 7);
  const monthlyAttendance = attendanceData.filter((item) => item.date?.startsWith(monthKey));
  const totalMonthlyHours = monthlyAttendance.reduce((sum, item) => sum + (Number(item.hoursWorked) || 0), 0);
  const pendingTasks = dashboardTasks.filter((task) => !['completed', 'done'].includes(getStatus(task.status))).length;
  const completedTasks = dashboardTasks.filter((task) => ['completed', 'done'].includes(getStatus(task.status))).length;
  const taskCompletionRate = dashboardTasks.length ? Math.round((completedTasks / dashboardTasks.length) * 100) : 0;
  const pendingReimbursements = dashboardReimbursements.filter((item) => ['pending', 'submitted'].includes(getStatus(item.status))).length;
  const approvedReimbursementAmount = dashboardReimbursements
    .filter((item) => getStatus(item.status) === 'approved')
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const paidLeaveBalance = leaveBalances?.paidLeaveBalance ?? profile.paidLeaveBalance ?? 0;
  const unpaidLeaveBalance = leaveBalances?.unpaidLeaveBalance ?? profile.unpaidLeaveBalance ?? 0;
  const totalLeaveBalance = Number(paidLeaveBalance || 0) + Number(unpaidLeaveBalance || 0);
  const recentTasks = [...dashboardTasks]
    .sort((a, b) => new Date(a.dueDate || a.createdAt || 0) - new Date(b.dueDate || b.createdAt || 0))
    .slice(0, 5);

  const updateDashboardTask = (taskId, payload) => {
    setDashboardTasks((currentTasks) => currentTasks.map((task) => (
      task._id === taskId ? { ...task, ...payload } : task
    )));
  };

  const handleQuickStartTask = async (taskId) => {
    setQuickUpdatingTaskId(taskId);
    setTaskMessage('');
    try {
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/tasks/${taskId}`,
        { status: 'in-progress' },
        { headers: authHeaders }
      );
      updateDashboardTask(taskId, res.data?.data || { status: 'in-progress' });
      setError('');
      setTaskMessage('Task moved to in progress.');
    } catch (err) {
      setTaskMessage('');
      setError(err.response?.data?.message || 'Failed to start task');
    } finally {
      setQuickUpdatingTaskId('');
    }
  };

  const openQuickSubmitTask = (task) => {
    setQuickTask(task);
    setQuickTaskNote(task.submissionNote || '');
    setTaskMessage('');
    setError('');
  };

  const closeQuickSubmitTask = () => {
    if (quickTaskLoading) return;
    setQuickTask(null);
    setQuickTaskNote('');
  };

  const handleQuickSubmitTask = async () => {
    if (!quickTask?._id) return;
    setQuickTaskLoading(true);
    try {
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/tasks/${quickTask._id}`,
        { status: 'completed', submissionNote: quickTaskNote },
        { headers: authHeaders }
      );
      updateDashboardTask(quickTask._id, res.data?.data || {
        status: 'completed',
        submissionNote: quickTaskNote,
        submittedAt: new Date().toISOString(),
      });
      setQuickTask(null);
      setQuickTaskNote('');
      setError('');
      setTaskMessage('Task submitted successfully.');
    } catch (err) {
      setTaskMessage('');
      setError(err.response?.data?.message || 'Failed to submit task');
    } finally {
      setQuickTaskLoading(false);
    }
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

  const navItems = [
    { key: 'profile', label: 'Dashboard' },
    { key: 'attendance-calendar', label: 'Calendar' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'leaves', label: 'Leave Requests' },
    { key: 'tasks', label: 'My Tasks' },
    { key: 'salary', label: 'Salary Slips' },
    { key: 'certificates', label: 'Certificates' },
    { key: 'documents', label: 'Documents' },
    { key: 'reimbursements', label: 'Reimbursements' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'settings', label: 'Settings' },
    { key: 'change-password', label: 'Change Password' },
    { key: 'edit-profile', label: 'Edit Profile' },
  ];

  const navGroups = [
    { title: 'Overview', items: ['profile'] },
    { title: 'Attendance', items: ['attendance-calendar', 'attendance', 'leaves'] },
    { title: 'Work', items: ['tasks', 'reimbursements'] },
    { title: 'Documents', items: ['salary', 'certificates', 'documents'] },
    { title: 'Account', items: ['notifications', 'settings', 'change-password', 'edit-profile'] },
  ];

  const activeNavItem = navItems.find((item) => item.key === activeTab) || navItems[0];

  const renderNavIcon = (tab) => (
    <svg className="employee-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      {tab === 'profile' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7m-9 11v-6h4v6m5-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-8 0H6a1 1 0 01-1-1V10" />}
      {tab === 'attendance-calendar' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
      {tab === 'attendance' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />}
      {tab === 'leaves' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5h6m-6 4h6m-7 4h8M5 4h14v16H5z" />}
      {tab === 'tasks' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5h11M9 12h11M9 19h11M4 5l1 1 2-2M4 12l1 1 2-2M4 19l1 1 2-2" />}
      {tab === 'salary' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-2.21 0-4 1.12-4 2.5S9.79 13 12 13s4 1.12 4 2.5S14.21 18 12 18m0-10V6m0 12v2M4 6h16v12H4z" />}
      {tab === 'certificates' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7 3h10a2 2 0 012 2v14l-3-2-3 2-3-2-3 2V5a2 2 0 012-2z" />}
      {tab === 'documents' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6M7 3h7l5 5v13a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />}
      {tab === 'reimbursements' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18v10H3zM7 11h.01M17 13a2 2 0 100-4 2 2 0 000 4z" />}
      {tab === 'notifications' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 01-6 0" />}
      {tab === 'settings' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.3 4.3a1.7 1.7 0 013.4 0 1.7 1.7 0 002.6 1.1 1.7 1.7 0 012.4 2.4 1.7 1.7 0 001.1 2.6 1.7 1.7 0 010 3.4 1.7 1.7 0 00-1.1 2.6 1.7 1.7 0 01-2.4 2.4 1.7 1.7 0 00-2.6 1.1 1.7 1.7 0 01-3.4 0 1.7 1.7 0 00-2.6-1.1 1.7 1.7 0 01-2.4-2.4 1.7 1.7 0 00-1.1-2.6 1.7 1.7 0 010-3.4 1.7 1.7 0 001.1-2.6 1.7 1.7 0 012.4-2.4 1.7 1.7 0 002.6-1.1z" />}
      {tab === 'settings' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />}
      {tab === 'change-password' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11V8a4 4 0 10-8 0v3m8 0h2a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6a2 2 0 012-2h8zm6 4l2 2 4-4" />}
      {tab === 'edit-profile' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 3l5 5L10 19H5v-5L16 3z" />}
    </svg>
  );

  const renderEmployeeGroupedNav = () => (
    <Nav className="employee-sidebar-nav sidebar-grouped-nav">
      {navGroups.map((group) => {
        const isOpen = group.items.includes(activeTab);
        return (
          <details className="sidebar-group" key={group.title} open={isOpen}>
            <summary className="sidebar-group-title">
              <span>{group.title}</span>
              <svg className="sidebar-group-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 9l6 6 6-6" />
              </svg>
            </summary>
            <div className="sidebar-group-items">
              {group.items.map((key) => {
                const item = navItems.find((navItem) => navItem.key === key);
                if (!item) return null;
                return (
                  <Nav.Link
                    key={item.key}
                    className={`animate__animated animate__fadeInLeft ${activeTab === item.key ? 'active' : ''}`}
                    onClick={() => handleTabClick(item.key)}
                    aria-current={activeTab === item.key ? 'page' : undefined}
                  >
                    {renderNavIcon(item.key)}
                    <span>{item.label}</span>
                  </Nav.Link>
                );
              })}
            </div>
          </details>
        );
      })}
    </Nav>
  );

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
            width: 292px;
            background: #ffffff;
            color: #0f172a;
            padding: 1rem;
            box-shadow: 12px 0 36px rgba(15, 23, 42, 0.08);
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            z-index: 1000;
            transition: transform 0.3s ease-in-out;
            border-right: 1px solid #e2e8f0;
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          .employee-sidebar-brand {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem;
            border-radius: 0.85rem;
            background: linear-gradient(135deg, #eff6ff, #ffffff);
            border: 1px solid #dbeafe;
          }
          .employee-sidebar-logo {
            width: 44px;
            height: 44px;
            border-radius: 14px;
            background: linear-gradient(135deg, #2563eb, #14b8a6);
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            font-weight: 800;
            box-shadow: 0 10px 22px rgba(37, 99, 235, 0.2);
            flex: 0 0 auto;
          }
          .employee-sidebar-brand h4,
          .offcanvas-title {
            font-size: 1rem;
            font-weight: 800;
            letter-spacing: 0;
            margin: 0;
            color: #0f172a;
            text-shadow: none;
          }
          .employee-sidebar-brand span {
            display: block;
            color: #64748b;
            font-size: 0.76rem;
            font-weight: 700;
            margin-top: 0.15rem;
          }
          .employee-sidebar-user {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem;
            border-radius: 0.85rem;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
          }
          .employee-sidebar-avatar {
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background: #dbeafe;
            color: #1d4ed8;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            overflow: hidden;
            flex: 0 0 auto;
          }
          .employee-sidebar-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .employee-sidebar-user strong {
            display: block;
            color: #0f172a;
            font-size: 0.92rem;
            line-height: 1.15;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .employee-sidebar-user span {
            display: block;
            color: #64748b;
            font-size: 0.76rem;
            margin-top: 0.2rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .employee-sidebar-nav {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            overflow-y: auto;
            padding-right: 0.2rem;
          }
          .employee-sidebar-nav:not(.sidebar-grouped-nav) {
            display: flex;
          }
          .sidebar-grouped-nav {
            display: none;
          }
          .sidebar-group {
            border: 1px solid #e2e8f0;
            border-radius: 0.85rem;
            background: #ffffff;
            overflow: hidden;
          }
          .sidebar-group[open] {
            background: #f8fafc;
            border-color: #bfdbfe;
          }
          .sidebar-group-title {
            list-style: none;
            cursor: pointer;
            min-height: 42px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.75rem;
            padding: 0.68rem 0.75rem;
            color: #0f172a;
            font-size: 0.76rem;
            font-weight: 900;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .sidebar-group-title::-webkit-details-marker {
            display: none;
          }
          .sidebar-group-chevron {
            width: 16px;
            height: 16px;
            color: #64748b;
            transition: transform 0.2s ease;
            flex: 0 0 auto;
          }
          .sidebar-group[open] .sidebar-group-chevron {
            transform: rotate(180deg);
          }
          .sidebar-group-items {
            display: flex;
            flex-direction: column;
            gap: 0.2rem;
            padding: 0 0.45rem 0.45rem;
          }
          .employee-sidebar-nav::-webkit-scrollbar {
            width: 6px;
          }
          .employee-sidebar-nav::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 999px;
          }
          .nav-link {
            color: #475569 !important;
            padding: 0.52rem 0.62rem;
            border-radius: 0.62rem;
            margin: 0;
            font-size: 0.84rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 0.55rem;
            transition: all 0.2s ease;
            position: relative;
            overflow: hidden;
            min-height: 34px;
            border: 1px solid transparent;
            white-space: nowrap;
          }
          .nav-link:hover {
            background: #f1f5f9;
            color: #1d4ed8 !important;
            border-color: #e2e8f0;
            transform: translateX(3px);
          }
          .nav-link.active {
            background: #eff6ff;
            color: #1d4ed8 !important;
            font-weight: 800;
            border-color: #bfdbfe;
            box-shadow: 0 10px 20px rgba(37, 99, 235, 0.08);
          }
          .nav-link.active::after {
            content: '';
            position: absolute;
            right: 0.45rem;
            width: 6px;
            height: 18px;
            border-radius: 999px;
            background: #2563eb;
          }
          .employee-nav-icon {
            width: 16px;
            height: 16px;
            flex-shrink: 0;
            padding: 0.32rem;
            box-sizing: content-box;
            border-radius: 0.65rem;
            color: #1d4ed8;
            background: #eef6ff;
          }
          .nav-link.active .employee-nav-icon {
            color: #ffffff;
            background: linear-gradient(135deg, #2563eb, #14b8a6);
          }
          .employee-sidebar-footer {
            margin-top: auto;
            border-radius: 0.85rem;
            border: 1px solid #e2e8f0;
            background: #f8fafc;
            padding: 0.8rem;
          }
          .employee-sidebar-footer span {
            display: block;
            color: #64748b;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
          }
          .employee-sidebar-footer strong {
            display: block;
            color: #0f172a;
            font-size: 0.9rem;
            margin-top: 0.2rem;
            word-break: break-word;
          }
          .min-width-0 {
            min-width: 0;
          }
          .content-area {
            flex-grow: 1;
            margin-left: 292px;
            padding: 2.5rem;
            background: #ffffff;
            min-height: 100vh;
            transition: margin-left 0.3s ease-in-out;
            overflow-x: hidden;
          }
          .employee-topbar {
            background: rgba(255, 255, 255, 0.94) !important;
            border: 1px solid #e2e8f0;
            border-radius: 0.85rem;
            box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
            padding: 0.75rem;
            position: sticky;
            top: 1rem;
            z-index: 990;
            backdrop-filter: blur(16px);
          }
          .employee-topbar-inner {
            width: 100%;
            display: grid;
            grid-template-columns: auto minmax(0, 1fr) auto;
            align-items: center;
            gap: 0.85rem;
          }
          .employee-topbar-title {
            min-width: 0;
          }
          .employee-topbar-title span {
            display: block;
            color: #64748b;
            font-size: 0.76rem;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .employee-topbar-title strong {
            display: block;
            color: #0f172a;
            font-size: 1.18rem;
            font-weight: 900;
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .employee-topbar-actions {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 0.55rem;
            min-width: 0;
          }
          .employee-topbar-action-icon {
            width: 18px;
            height: 18px;
            flex: 0 0 auto;
          }
          .employee-time-chip,
          .employee-profile-chip {
            display: inline-flex;
            align-items: center;
            gap: 0.55rem;
            min-height: 42px;
            border: 1px solid #e2e8f0;
            border-radius: 999px;
            background: #f8fafc;
            color: #334155;
            padding: 0.45rem 0.72rem;
            font-size: 0.84rem;
            font-weight: 800;
            white-space: nowrap;
          }
          .employee-profile-chip {
            max-width: 220px;
            border-radius: 0.85rem;
            background: #ffffff;
          }
          .employee-profile-chip-avatar {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: linear-gradient(135deg, #2563eb, #14b8a6);
            color: #ffffff;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 0.85rem;
            font-weight: 900;
            overflow: hidden;
            flex: 0 0 auto;
          }
          .employee-profile-chip-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .employee-profile-chip-text {
            min-width: 0;
          }
          .employee-profile-chip-text strong,
          .employee-profile-chip-text span {
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .employee-profile-chip-text strong {
            color: #0f172a;
            font-size: 0.84rem;
            line-height: 1.15;
          }
          .employee-profile-chip-text span {
            color: #64748b;
            font-size: 0.72rem;
            margin-top: 0.12rem;
          }
          .employee-topbar-icon-btn,
          .employee-topbar-logout {
            min-height: 42px;
            border-radius: 0.75rem;
            border: 1px solid #dbeafe;
            background: #ffffff;
            color: #1d4ed8;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.45rem;
            font-weight: 800;
            box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
            transition: all 0.2s ease;
          }
          .employee-topbar-icon-btn {
            width: 42px;
            padding: 0;
          }
          .employee-topbar-icon-btn svg {
            width: 20px;
            height: 20px;
          }
          .employee-topbar-logout {
            padding: 0.45rem 0.78rem;
            color: #b91c1c;
            border-color: #fecaca;
          }
          .employee-topbar-logout span {
            line-height: 1;
          }
          .employee-topbar-icon-btn:hover,
          .employee-topbar-logout:hover {
            transform: translateY(-1px);
            background: #eff6ff;
            color: #1d4ed8;
            border-color: #93c5fd;
          }
          .employee-topbar-logout:hover {
            background: #fef2f2;
            color: #b91c1c;
            border-color: #fca5a5;
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
            background: #ffffff;
            border: 1px solid #dbeafe;
            color: #ffffff !important;
            border-radius: 0.7rem;
            padding: 0.6rem;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 1.5rem;
            font-weight: 600;
            box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
            position: relative;
            overflow: hidden;
            min-width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .sidebar-toggle:hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 24px rgba(37, 99, 235, 0.14);
            background: #eff6ff;
          }
          .sidebar-toggle:active {
            transform: scale(0.95);
          }
          .sidebar-toggle svg {
            width: 24px;
            height: 24px;
            stroke-width: 2.5;
            color: #1d4ed8;
          }
          .offcanvas {
            background: #ffffff;
            color: #0f172a;
            width: 300px;
            border-radius: 0 1rem 1rem 0;
            border-right: 1px solid #e2e8f0;
            z-index: 1050;
          }
          .offcanvas-header {
            border-bottom: 1px solid #e2e8f0;
            padding: 1rem;
          }
          .offcanvas-title {
            font-size: 1rem;
            font-weight: 800;
            color: #0f172a;
          }
          .offcanvas .nav-link {
            color: #475569 !important;
            margin: 0;
            font-size: 0.95rem;
            padding: 0.72rem 0.75rem;
          }
          .btn-close {
            background-color: #eff6ff;
            border-radius: 0.7rem;
            opacity: 1;
            width: 34px;
            height: 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          }
          .btn-close:hover {
            transform: scale(1.05);
            box-shadow: 0 8px 18px rgba(37, 99, 235, 0.12);
          }
          .alert {
            border-radius: 0.6rem;
            background: rgba(239, 68, 68, 0.2);
            backdrop-filter: blur(10px);
            color: #1e40af;
            border: 1px solid rgba(239, 68, 68, 0.3);
          }
          .employee-dashboard-modern {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            color: #0f172a;
          }
          .employee-hero-card {
            background:
              radial-gradient(circle at 90% 10%, rgba(14, 165, 233, 0.16), transparent 32%),
              linear-gradient(135deg, #ffffff 0%, #f8fbff 56%, #eef7ff 100%);
            border: 1px solid #dbeafe;
            border-radius: 0.9rem;
            padding: 1.5rem;
            box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 1.5rem;
            align-items: center;
          }
          .employee-hero-profile {
            display: flex;
            align-items: center;
            gap: 1rem;
            min-width: 0;
          }
          .employee-avatar-xl {
            width: 76px;
            height: 76px;
            border-radius: 24px;
            background: linear-gradient(135deg, #2563eb, #06b6d4);
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            font-weight: 800;
            box-shadow: 0 14px 28px rgba(37, 99, 235, 0.22);
            overflow: hidden;
            flex: 0 0 auto;
          }
          .employee-avatar-xl img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .employee-hero-eyebrow,
          .employee-panel-eyebrow,
          .employee-kpi-label {
            margin: 0;
            color: #64748b;
            font-size: 0.78rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .employee-hero-title {
            margin: 0.2rem 0;
            color: #0f172a;
            font-size: clamp(1.55rem, 3vw, 2.35rem);
            font-weight: 800;
            line-height: 1.12;
          }
          .employee-hero-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 0.65rem;
          }
          .employee-pill {
            border: 1px solid #dbeafe;
            border-radius: 999px;
            background: #ffffff;
            color: #1e40af;
            padding: 0.42rem 0.72rem;
            font-size: 0.82rem;
            font-weight: 700;
          }
          .employee-hero-actions {
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-end;
            gap: 0.65rem;
          }
          .employee-action-btn {
            border: 1px solid #bfdbfe;
            background: #ffffff;
            color: #1d4ed8;
            border-radius: 0.65rem;
            padding: 0.65rem 0.9rem;
            font-weight: 700;
            box-shadow: 0 8px 18px rgba(30, 64, 175, 0.08);
            transition: all 0.2s ease;
          }
          .employee-action-btn:hover {
            background: #eff6ff;
            transform: translateY(-2px);
          }
          .employee-kpi-grid {
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 1rem;
          }
          .employee-kpi-card,
          .employee-panel {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 0.85rem;
            box-shadow: 0 12px 30px rgba(15, 23, 42, 0.07);
          }
          .employee-kpi-card {
            padding: 1rem;
            position: relative;
            overflow: hidden;
          }
          .employee-kpi-card::after {
            content: '';
            position: absolute;
            right: -24px;
            top: -24px;
            width: 70px;
            height: 70px;
            border-radius: 50%;
            background: var(--accent, #dbeafe);
            opacity: 0.5;
          }
          .employee-kpi-value {
            margin: 0.35rem 0 0.15rem;
            color: #0f172a;
            font-size: 1.8rem;
            font-weight: 800;
          }
          .employee-kpi-note {
            margin: 0;
            color: #64748b;
            font-size: 0.86rem;
          }
          .employee-dashboard-grid {
            display: grid;
            grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
            gap: 1rem;
            align-items: start;
          }
          .employee-panel {
            padding: 1.1rem;
          }
          .employee-panel-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 1rem;
            margin-bottom: 1rem;
          }
          .employee-panel-title {
            margin: 0.2rem 0 0;
            color: #0f172a;
            font-size: 1.1rem;
            font-weight: 800;
          }
          .employee-empty-state {
            min-height: 180px;
            border: 1px dashed #cbd5e1;
            border-radius: 0.75rem;
            background: #f8fafc;
            color: #64748b;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 1rem;
            font-weight: 600;
          }
          .employee-task-list {
            display: grid;
            gap: 0.75rem;
          }
          .employee-task-row {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 0.75rem;
            align-items: center;
            padding: 0.85rem;
            border: 1px solid #e2e8f0;
            border-radius: 0.7rem;
            background: #f8fafc;
          }
          .employee-task-title {
            margin: 0;
            color: #0f172a;
            font-weight: 800;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .employee-task-meta {
            margin: 0.25rem 0 0;
            color: #64748b;
            font-size: 0.85rem;
          }
          .employee-task-side {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            flex-wrap: wrap;
            gap: 0.45rem;
          }
          .employee-task-submit {
            border: 0;
            border-radius: 999px;
            background: #0f766e;
            color: #ffffff;
            font-size: 0.75rem;
            font-weight: 800;
            padding: 0.36rem 0.72rem;
            line-height: 1;
          }
          .employee-task-submit:hover,
          .employee-task-submit:focus {
            background: #115e59;
            color: #ffffff;
          }
          .employee-task-start {
            background: #2563eb;
          }
          .employee-task-start:hover,
          .employee-task-start:focus {
            background: #1d4ed8;
          }
          .employee-status {
            border-radius: 999px;
            padding: 0.35rem 0.65rem;
            font-size: 0.75rem;
            font-weight: 800;
            text-transform: capitalize;
            color: #1e40af;
            background: #dbeafe;
          }
          .employee-status.completed,
          .employee-status.done,
          .employee-status.approved {
            color: #047857;
            background: #d1fae5;
          }
          .employee-status.rejected {
            color: #b91c1c;
            background: #fee2e2;
          }
          .employee-mini-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.75rem;
          }
          .employee-mini-card {
            border: 1px solid #e2e8f0;
            border-radius: 0.7rem;
            background: #f8fafc;
            padding: 0.9rem;
          }
          .employee-mini-card span {
            display: block;
            color: #64748b;
            font-size: 0.78rem;
            font-weight: 700;
            text-transform: uppercase;
          }
          .employee-mini-card strong {
            display: block;
            margin-top: 0.25rem;
            color: #0f172a;
            font-size: 1.1rem;
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
            .employee-hero-card,
            .employee-dashboard-grid {
              grid-template-columns: 1fr;
            }
            .employee-hero-actions {
              justify-content: flex-start;
            }
            .employee-kpi-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .employee-topbar-inner {
              grid-template-columns: auto minmax(0, 1fr);
            }
            .employee-topbar-actions {
              grid-column: 1 / -1;
              justify-content: space-between;
              flex-wrap: wrap;
            }
            .employee-profile-chip {
              flex: 1 1 190px;
              max-width: none;
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
            .employee-hero-profile {
              align-items: flex-start;
            }
            .employee-avatar-xl {
              width: 60px;
              height: 60px;
              border-radius: 18px;
              font-size: 1.55rem;
            }
            .employee-topbar {
              top: 0.75rem;
              padding: 0.65rem;
              margin-bottom: 1.5rem !important;
            }
            .employee-topbar-title span {
              font-size: 0.68rem;
            }
            .employee-topbar-title strong {
              font-size: 1rem;
            }
            .employee-time-chip {
              display: none;
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
            .employee-hero-card,
            .employee-panel {
              padding: 1rem;
            }
            .employee-kpi-grid,
            .employee-mini-grid {
              grid-template-columns: 1fr;
            }
            .employee-action-btn {
              width: 100%;
            }
            .employee-task-row {
              grid-template-columns: 1fr;
            }
            .employee-task-side {
              justify-content: flex-start;
            }
            .employee-topbar-actions {
              gap: 0.45rem;
            }
            .employee-profile-chip {
              flex: 1 1 100%;
              order: 3;
            }
            .employee-topbar-logout {
              flex: 1 1 auto;
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
        <div className="sidebar d-none d-lg-flex">
          <div className="employee-sidebar-brand">
            <div className="employee-sidebar-logo">F</div>
            <div>
              <h4>Fintradify</h4>
              <span>Employee portal</span>
            </div>
          </div>
          <div className="employee-sidebar-user">
            <div className="employee-sidebar-avatar">
              {profile.profilePhoto ? <img src={profile.profilePhoto} alt={profile.name || 'Employee'} /> : (profile.name || 'E')[0].toUpperCase()}
            </div>
            <div className="min-width-0">
              <strong>{profile.name || 'Employee'}</strong>
              <span>{profile.position || profile.employeeId || 'Team member'}</span>
            </div>
          </div>
          {renderEmployeeGroupedNav()}
          <Nav className="employee-sidebar-nav">
            {navItems.map((item) => (
              <Nav.Link
                key={item.key}
                className={`animate__animated animate__fadeInLeft ${activeTab === item.key ? 'active' : ''}`}
                style={{ animationDelay: `${0.04 * navItems.findIndex((navItem) => navItem.key === item.key)}s` }}
                onClick={() => handleTabClick(item.key)}
                aria-current={activeTab === item.key ? 'page' : undefined}
              >
                {renderNavIcon(item.key)}
                <span>{item.label}</span>
              </Nav.Link>
            ))}
          </Nav>
          <div className="employee-sidebar-footer">
            <span>Signed in as</span>
            <strong>{profile.email || 'Employee account'}</strong>
          </div>
        </div>

        {/* Main Content */}
        <div className="content-area">
          <Navbar bg="light" variant="light" className="employee-topbar mb-5">
            <Container fluid className="px-0">
              <div className="employee-topbar-inner">
              <Button
                variant="primary"
                className="sidebar-toggle d-lg-none"
                onClick={() => setShowSidebar(true)}
                aria-label="Open employee menu"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
                <div className="employee-topbar-title">
                  <span>Employee Portal</span>
                  <strong>{activeNavItem.label}</strong>
                </div>
                <div className="employee-topbar-actions">
                  <div className="employee-time-chip d-none d-md-inline-flex">
                    <svg className="employee-topbar-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{currentTime}</span>
                  </div>
                  <button
                    type="button"
                    className="employee-profile-chip"
                    onClick={() => handleTabClick('profile')}
                    aria-label="Open dashboard profile"
                  >
                    <span className="employee-profile-chip-avatar">
                      {profile.profilePhoto ? <img src={profile.profilePhoto} alt={profile.name || 'Employee'} /> : (profile.name || 'E')[0].toUpperCase()}
                    </span>
                    <span className="employee-profile-chip-text">
                      <strong>{profile.name || 'Employee'}</strong>
                      <span>{profile.employeeId || profile.position || 'Team member'}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="employee-topbar-icon-btn"
                    onClick={() => handleTabClick('notifications')}
                    aria-label="Notifications"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.73 21a2 2 0 01-3.46 0" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="employee-topbar-logout"
                    onClick={handleLogout}
                    aria-label="Logout from employee portal"
                  >
                    <svg className="employee-topbar-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H9m4 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </Container>
          </Navbar>

          {/* Sidebar for Mobile (Offcanvas) */}
          <Offcanvas show={showSidebar} onHide={() => setShowSidebar(false)} placement="start" className="d-lg-none">
            <Offcanvas.Header closeButton>
              <Offcanvas.Title className="animate__animated animate__zoomIn">Employee Menu</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <div className="employee-sidebar-brand mb-3">
                <div className="employee-sidebar-logo">F</div>
                <div>
                  <h4>Fintradify</h4>
                  <span>Employee portal</span>
                </div>
              </div>
              <div className="employee-sidebar-user mb-3">
                <div className="employee-sidebar-avatar">
                  {profile.profilePhoto ? <img src={profile.profilePhoto} alt={profile.name || 'Employee'} /> : (profile.name || 'E')[0].toUpperCase()}
                </div>
                <div className="min-width-0">
                  <strong>{profile.name || 'Employee'}</strong>
                  <span>{profile.position || profile.employeeId || 'Team member'}</span>
                </div>
              </div>
              {renderEmployeeGroupedNav()}
              <Nav className="employee-sidebar-nav">
                {navItems.map((item) => (
                  <Nav.Link
                    key={item.key}
                    className={`animate__animated animate__fadeInLeft ${activeTab === item.key ? 'active' : ''}`}
                    style={{ animationDelay: `${0.04 * navItems.findIndex((navItem) => navItem.key === item.key)}s` }}
                    onClick={() => handleTabClick(item.key)}
                    aria-current={activeTab === item.key ? 'page' : undefined}
                  >
                    {renderNavIcon(item.key)}
                    <span>{item.label}</span>
                  </Nav.Link>
                ))}
              </Nav>
              <div className="employee-sidebar-footer mt-3">
                <span>Signed in as</span>
                <strong>{profile.email || 'Employee account'}</strong>
                <button
                  type="button"
                  className="employee-topbar-logout w-100 mt-3"
                  onClick={handleLogout}
                  aria-label="Logout from employee portal"
                >
                  <svg className="employee-topbar-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H9m4 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
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
            {taskMessage && (
              <Alert
                variant="success"
                className="mb-4 animate__animated animate__fadeIn"
                role="status"
              >
                {taskMessage}
              </Alert>
            )}
            {activeTab === 'profile' && (
              <div className="employee-dashboard-modern animate__animated animate__fadeInUp">
                <section className="employee-hero-card">
                  <div className="employee-hero-profile">
                    <div className="employee-avatar-xl">
                      {profile.profilePhoto ? (
                        <img src={profile.profilePhoto} alt={profile.name || 'Employee'} />
                      ) : (
                        <span>{(profile.name || 'E')[0].toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <p className="employee-hero-eyebrow">Employee dashboard</p>
                      <h1 className="employee-hero-title">{getGreeting()}, {profile.name || 'Employee'}</h1>
                      <div className="employee-hero-meta">
                        <span className="employee-pill">{profile.position || 'Team Member'}</span>
                        <span className="employee-pill">ID: {profile.employeeId || 'N/A'}</span>
                        <span className="employee-pill">{currentTime}</span>
                      </div>
                    </div>
                  </div>
                  <div className="employee-hero-actions">
                    <button type="button" className="employee-action-btn" onClick={() => handleTabClick('attendance')}>Attendance</button>
                    <button type="button" className="employee-action-btn" onClick={() => handleTabClick('leaves')}>Apply Leave</button>
                    <button type="button" className="employee-action-btn" onClick={() => handleTabClick('tasks')}>My Tasks</button>
                    <button type="button" className="employee-action-btn" onClick={() => handleTabClick('salary')}>Salary Slips</button>
                    <button type="button" className="employee-action-btn" onClick={() => handleTabClick('certificates')}>Certificates</button>
                    <button type="button" className="employee-action-btn" onClick={() => handleTabClick('documents')}>Documents</button>
                  </div>
                </section>

                <section className="employee-kpi-grid">
                  <div className="employee-kpi-card" style={{ '--accent': '#bfdbfe' }}>
                    <p className="employee-kpi-label">Present Days</p>
                    <h2 className="employee-kpi-value">{monthlyAttendance.length}</h2>
                    <p className="employee-kpi-note">This month attendance records</p>
                  </div>
                  <div className="employee-kpi-card" style={{ '--accent': '#bae6fd' }}>
                    <p className="employee-kpi-label">Monthly Hours</p>
                    <h2 className="employee-kpi-value">{totalMonthlyHours.toFixed(1)}</h2>
                    <p className="employee-kpi-note">Calculated from punch in/out</p>
                  </div>
                  <div className="employee-kpi-card" style={{ '--accent': '#fed7aa' }}>
                    <p className="employee-kpi-label">Pending Tasks</p>
                    <h2 className="employee-kpi-value">{pendingTasks}</h2>
                    <p className="employee-kpi-note">{taskCompletionRate}% task completion</p>
                  </div>
                  <div className="employee-kpi-card" style={{ '--accent': '#bbf7d0' }}>
                    <p className="employee-kpi-label">Leave Balance</p>
                    <h2 className="employee-kpi-value">{totalLeaveBalance}</h2>
                    <p className="employee-kpi-note">Paid {paidLeaveBalance} / Unpaid {unpaidLeaveBalance}</p>
                  </div>
                  <div className="employee-kpi-card" style={{ '--accent': '#fecdd3' }}>
                    <p className="employee-kpi-label">Reimbursements</p>
                    <h2 className="employee-kpi-value">{pendingReimbursements}</h2>
                    <p className="employee-kpi-note">Approved Rs. {approvedReimbursementAmount.toLocaleString('en-IN')}</p>
                  </div>
                </section>

                <section className="employee-dashboard-grid">
                  <div className="employee-panel">
                    <div className="employee-panel-header">
                      <div>
                        <p className="employee-panel-eyebrow">Attendance insight</p>
                        <h2 className="employee-panel-title">Recent hours trend</h2>
                      </div>
                      <span className="employee-pill">{chartData.length} records</span>
                    </div>
                    {chartData.length ? (
                      <div className="chart-container">
                        <Line
                          data={{
                            labels: chartData.map((item) => item.date),
                            datasets: [
                              {
                                label: 'Daily Hours',
                                data: chartData.map((item) => item.hoursWorked),
                                borderColor: '#2563eb',
                                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                                fill: true,
                                tension: 0.36,
                              },
                              {
                                label: 'Target Hours',
                                data: chartData.map(() => 8),
                                borderColor: '#14b8a6',
                                backgroundColor: 'rgba(20, 184, 166, 0.08)',
                                borderDash: [6, 6],
                                fill: false,
                                tension: 0.3,
                              },
                            ],
                          }}
                          options={chartOptions}
                        />
                      </div>
                    ) : (
                      <div className="employee-empty-state">No attendance records available yet.</div>
                    )}
                  </div>

                  <div className="employee-panel">
                    <div className="employee-panel-header">
                      <div>
                        <p className="employee-panel-eyebrow">Work queue</p>
                        <h2 className="employee-panel-title">Upcoming tasks</h2>
                      </div>
                      <button type="button" className="employee-action-btn" onClick={() => handleTabClick('tasks')}>View all</button>
                    </div>
                    {recentTasks.length ? (
                      <div className="employee-task-list">
                        {recentTasks.map((task) => {
                          const taskStatus = getStatus(task.status);
                          const isUpdating = quickUpdatingTaskId === task._id;
                          return (
                            <div className="employee-task-row" key={task._id || task.id || task.title}>
                              <div>
                                <p className="employee-task-title">{task.title || task.taskName || 'Untitled task'}</p>
                                <p className="employee-task-meta">
                                  Due {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-IN') : 'N/A'}
                                  {task.submittedAt ? ` | Submitted ${new Date(task.submittedAt).toLocaleDateString('en-IN')}` : ''}
                                </p>
                              </div>
                              <div className="employee-task-side">
                                <span className={`employee-status ${taskStatus}`}>{task.status || 'Pending'}</span>
                                {taskStatus === 'pending' && (
                                  <button
                                    type="button"
                                    className="employee-task-submit employee-task-start"
                                    onClick={() => handleQuickStartTask(task._id)}
                                    disabled={isUpdating}
                                  >
                                    {isUpdating ? 'Starting...' : 'Start'}
                                  </button>
                                )}
                                {taskStatus === 'in-progress' && (
                                  <button
                                    type="button"
                                    className="employee-task-submit"
                                    onClick={() => openQuickSubmitTask(task)}
                                  >
                                    Submit
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="employee-empty-state">No assigned tasks found.</div>
                    )}
                  </div>
                </section>

                <section className="employee-dashboard-grid">
                  <div className="employee-panel">
                    <div className="employee-panel-header">
                      <div>
                        <p className="employee-panel-eyebrow">Profile summary</p>
                        <h2 className="employee-panel-title">Your employee details</h2>
                      </div>
                      <button type="button" className="employee-action-btn" onClick={() => handleTabClick('edit-profile')}>Edit</button>
                    </div>
                    <div className="employee-mini-grid">
                      <div className="employee-mini-card"><span>Email</span><strong>{profile.email || 'N/A'}</strong></div>
                      <div className="employee-mini-card"><span>Phone</span><strong>{profile.phone || 'N/A'}</strong></div>
                      <div className="employee-mini-card"><span>Department</span><strong>{profile.department || 'N/A'}</strong></div>
                      <div className="employee-mini-card"><span>Paid leave</span><strong>{profile.isEligibleForPaidLeaves ? 'Eligible' : 'Not eligible'}</strong></div>
                    </div>
                  </div>

                  <div className="employee-panel">
                    <div className="employee-panel-header">
                      <div>
                        <p className="employee-panel-eyebrow">Claims overview</p>
                        <h2 className="employee-panel-title">Reimbursement status</h2>
                      </div>
                      <button type="button" className="employee-action-btn" onClick={() => handleTabClick('reimbursements')}>Open</button>
                    </div>
                    <div className="employee-mini-grid">
                      <div className="employee-mini-card"><span>Total claims</span><strong>{dashboardReimbursements.length}</strong></div>
                      <div className="employee-mini-card"><span>Pending</span><strong>{pendingReimbursements}</strong></div>
                      <div className="employee-mini-card"><span>Approved amount</span><strong>Rs. {approvedReimbursementAmount.toLocaleString('en-IN')}</strong></div>
                      <div className="employee-mini-card"><span>Leaves left</span><strong>{totalLeaveBalance} days</strong></div>
                    </div>
                  </div>
                </section>
              </div>
            )}
            {activeTab === 'edit-profile' && (
              <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.1s' }}>
                <EmployeeProfileEdit />
              </div>
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
            {activeTab === 'tasks' && (
              <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.4s' }}>
                <EmployeeTasks />
              </div>
            )}
            {activeTab === 'salary' && (
              <Card className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.4s' }}>
                <Card.Body>
                  <Card.Title className="animate__animated animate__zoomIn">Salary Slips</Card.Title>
                  <SalarySlip />
                </Card.Body>
              </Card>
            )}
            {activeTab === 'certificates' && (
              <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.4s' }}>
                <CertificateManager />
              </div>
            )}
            {activeTab === 'documents' && (
              <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.4s' }}>
                <DocumentSubmission />
              </div>
            )}
            {activeTab === 'reimbursements' && (
              <Card className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.45s' }}>
                <Card.Body>
                  <Card.Title className="animate__animated animate__zoomIn">Reimbursements</Card.Title>
                  <EmployeeReimbursement />
                </Card.Body>
              </Card>
            )}
            {activeTab === 'notifications' && (
              <Card className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.5s' }}>
                <Card.Body>
                  <Card.Title className="animate__animated animate__zoomIn">Notifications</Card.Title>
                  <Notification userId={profile._id} role="employee" />
                </Card.Body>
              </Card>
            )}
            {activeTab === 'settings' && (
              <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.6s' }}>
                <EmployeeSettings />
              </div>
            )}
            {activeTab === 'change-password' && (
              <Card className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.6s' }}>
                <Card.Body>
                  <Card.Title className="animate__animated animate__zoomIn">Change Password</Card.Title>
                  <EmployeePasswordSettings />
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
            <Modal show={Boolean(quickTask)} onHide={closeQuickSubmitTask} centered>
              <Modal.Header closeButton>
                <Modal.Title>Submit Task</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <p className="mb-2 fw-bold">{quickTask?.title || 'Task'}</p>
                <p className="text-muted mb-3">Add a short completion note before submitting this task.</p>
                <Form.Group>
                  <Form.Label>Submission note</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={quickTaskNote}
                    onChange={(event) => setQuickTaskNote(event.target.value)}
                    placeholder="Write completion details, links, remarks, or handover notes..."
                  />
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="outline-secondary" onClick={closeQuickSubmitTask} disabled={quickTaskLoading}>Cancel</Button>
                <Button variant="success" onClick={handleQuickSubmitTask} disabled={quickTaskLoading}>
                  {quickTaskLoading ? <><Spinner animation="border" size="sm" className="me-2" />Submitting...</> : 'Submit Task'}
                </Button>
              </Modal.Footer>
            </Modal>
          </Container>
        </div>
      </div>
    </>
  );
};

export default EmployeeDashboard;
