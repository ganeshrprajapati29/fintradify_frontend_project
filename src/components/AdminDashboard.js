 import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { useHistory } from 'react-router-dom';
import { Container, Navbar, Nav, Button, Card, Table, Alert, Offcanvas, Badge } from 'react-bootstrap';
import {
  Chart as ChartJS,
  BarElement,
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
import AttendanceList from './AttendanceList';
import LeaveRequest from './LeaveRequest';
import SalarySlip from './SalarySlip';
import ManualAttendance from './ManualAttendance';
import ActiveAttendance from './ActiveAttendance';
import PaidLeaves from './PaidLeaves';
import EmployeeForm from './EmployeeForm';
import AdminSettings from './AdminSettings';
import AdminTasks from './AdminTasks';
import AdminReimbursement from './AdminReimbursement';
import Notification from './Notification';
import EmployeeTeams from './EmployeeTeams';
import EmployeeTracking from './EmployeeTracking';
import RelievingLetter from './RelievingLetter';
import OfferLetter from './OfferLetter';
import CertificateManager from './CertificateManager';
import DocumentSubmission from './DocumentSubmission';
import AdminCredentials from './AdminCredentials';
import AdminPerformanceReport from './AdminPerformanceReport';
import AdminReportsCenter from './AdminReportsCenter';
import AdminComplianceCenter from './AdminComplianceCenter';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css';

// Register Chart.js components
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, LineElement, PointElement, ArcElement, Filler);

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ADMIN_TABS = [
  'overview',
  'reports-center',
  'add-employee',
  'edit-employee',
  'employee-list',
  'block-employees',
  'unblock-employees',
  'teams',
  'tracking',
  'attendance',
  'manual-attendance',
  'active-attendance',
  'leaves',
  'paid-leaves',
  'monthly-performance',
  'tasks',
  'salary',
  'relieving-letter',
  'offer-letter',
  'certificates',
  'documents',
  'compliance-center',
  'reimbursements',
  'notifications',
  'login-credentials',
  'settings',
];

const TAB_LABELS = {
  overview: 'Dashboard',
  'reports-center': 'Reports Center',
  'add-employee': 'Add Employee',
  'edit-employee': 'Edit Employee',
  'employee-list': 'Employee List',
  'block-employees': 'Block Employees',
  'unblock-employees': 'Unblock Employees',
  teams: 'Teams',
  tracking: 'Tracking',
  attendance: 'Attendance',
  'manual-attendance': 'Manual Attendance',
  'active-attendance': 'Active Attendance',
  leaves: 'Leave Requests',
  'paid-leaves': 'Paid Leaves',
  'monthly-performance': 'Monthly Performance',
  tasks: 'Tasks',
  salary: 'Salary Slips',
  'relieving-letter': 'Relieving Letter',
  'offer-letter': 'Offer Letter',
  certificates: 'Certificates',
  documents: 'Documents',
  'compliance-center': 'Compliance Center',
  reimbursements: 'Reimbursements',
  notifications: 'Notifications',
  'login-credentials': 'Login Credentials',
  settings: 'Settings',
};

const ADMIN_NAV_GROUPS = [
  { title: 'Overview', items: ['overview', 'reports-center'] },
  { title: 'People', items: ['add-employee', 'edit-employee', 'employee-list', 'block-employees', 'unblock-employees', 'teams', 'tracking'] },
  { title: 'Attendance & Leave', items: ['attendance', 'manual-attendance', 'active-attendance', 'leaves', 'paid-leaves'] },
  { title: 'Work & Payroll', items: ['monthly-performance', 'tasks', 'salary', 'reimbursements'] },
  { title: 'HR Documents', items: ['relieving-letter', 'offer-letter', 'certificates', 'documents', 'compliance-center'] },
  { title: 'System', items: ['notifications', 'login-credentials', 'settings'] },
];

const renderAdminNavIcon = (tab) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    {tab === 'overview' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 19V9m5 10V5m5 14v-7m5 7V3" />}
    {tab === 'reports-center' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 19h16M7 16V9m5 7V5m5 11v-4M6 5h12" />}
    {['add-employee', 'edit-employee', 'employee-list', 'block-employees', 'unblock-employees', 'teams'].includes(tab) && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m4 6v-2a4 4 0 00-8 0v2m12-10a4 4 0 11-8 0 4 4 0 018 0zm6 1a3 3 0 11-6 0 3 3 0 016 0z" />}
    {tab === 'tracking' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11a3 3 0 100-6 3 3 0 000 6zm0 10s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z" />}
    {['attendance', 'manual-attendance', 'active-attendance', 'leaves', 'paid-leaves'].includes(tab) && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3M5 11h14M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
    {['tasks', 'salary', 'reimbursements'].includes(tab) && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5h11M9 12h11M9 19h11M4 5l1 1 2-2M4 12l1 1 2-2M4 19l1 1 2-2" />}
    {tab === 'monthly-performance' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 19V9m5 10V5m5 14v-7m5 7V3M4 19h16" />}
    {['relieving-letter', 'offer-letter', 'certificates', 'documents'].includes(tab) && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6M7 3h7l5 5v13a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />}
    {tab === 'compliance-center' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3l7 4v5c0 5-3.2 8-7 9-3.8-1-7-4-7-9V7l7-4zm-3 9l2 2 4-5" />}
    {tab === 'notifications' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 01-6 0" />}
    {tab === 'login-credentials' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11V8a4 4 0 10-8 0v3m8 0h2a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6a2 2 0 012-2h8zm6 4l2 2 4-4" />}
    {tab === 'settings' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.3 4.3a1.7 1.7 0 013.4 0 1.7 1.7 0 002.6 1.1 1.7 1.7 0 012.4 2.4 1.7 1.7 0 001.1 2.6 1.7 1.7 0 010 3.4 1.7 1.7 0 00-1.1 2.6 1.7 1.7 0 01-2.4 2.4 1.7 1.7 0 00-2.6 1.1 1.7 1.7 0 01-3.4 0 1.7 1.7 0 00-2.6-1.1 1.7 1.7 0 01-2.4-2.4 1.7 1.7 0 00-1.1-2.6 1.7 1.7 0 010-3.4 1.7 1.7 0 001.1-2.6 1.7 1.7 0 012.4-2.4 1.7 1.7 0 002.6-1.1z" />}
  </svg>
);

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

  const getEmployeeStatus = (emp) => emp.status || 'active';
  const filteredEmployees = mode === 'block' ? employees.filter(emp => getEmployeeStatus(emp) === 'active') :
                           mode === 'unblock' ? employees.filter(emp => getEmployeeStatus(emp) !== 'active') :
                           employees;
  const activeEmployees = employees.filter((emp) => (emp.status || 'active') === 'active').length;
  const inactiveEmployees = Math.max(employees.length - activeEmployees, 0);
  const pageTitle = mode === 'block' ? 'Block Employees' : mode === 'unblock' ? 'Unblock Employees' : 'Employee List';
  const pageSubtitle = mode === 'block'
    ? 'Review active employees and block access when required.'
    : mode === 'unblock'
      ? 'Restore access for blocked or inactive employees.'
      : 'View employee records, status, profile details, and account actions.';
  const emptyText = mode === 'block'
    ? 'No active employees are available to block.'
    : mode === 'unblock'
      ? 'No blocked or inactive employees are available to unblock.'
      : 'No employees found for this view.';

  if (loading) {
    return (
      <div className="admin-directory">
        <div className="admin-directory-empty">Loading employees...</div>
      </div>
    );
  }

  return (
    <div className="admin-directory">
      <section className="admin-directory-hero">
        <div>
          <p className="admin-directory-eyebrow">Employee directory</p>
          <h3>{pageTitle}</h3>
          <p>{pageSubtitle}</p>
        </div>
        <div className="admin-directory-stats">
          <span>{employees.length} total</span>
          <span>{activeEmployees} active</span>
          <span>{inactiveEmployees} inactive</span>
        </div>
      </section>
      {error && <Alert variant="danger">{error}</Alert>}
      <section className="admin-directory-card">
        <div className="admin-directory-card-header">
          <div>
            <p className="admin-directory-eyebrow">Records</p>
            <h4>{filteredEmployees.length} employees shown</h4>
          </div>
        </div>
        {filteredEmployees.length ? (
        <div className="table-responsive">
        <Table className="admin-directory-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Position</th>
              <th>Email</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((emp, index) => (
              <tr key={emp._id} className="animate__animated animate__fadeIn" style={{ animationDelay: `${0.05 * index}s` }}>
                <td>
                  <div className="admin-directory-person">
                    <div className="admin-directory-avatar">
                      {emp.profilePhoto ? (
                        <img src={emp.profilePhoto} alt={emp.name || 'Employee'} />
                      ) : (
                        (emp.name || 'U')[0].toUpperCase()
                      )}
                    </div>
                    <div>
                      <strong>{emp.name || 'N/A'}</strong>
                      <span>{emp.employeeId || 'N/A'}</span>
                    </div>
                  </div>
                </td>
                <td>{emp.position || emp.department || 'N/A'}</td>
                <td>{emp.email || 'N/A'}</td>
                <td>
                  <span className={`admin-status ${(emp.status || 'active') === 'active' ? 'active' : 'blocked'}`}>
                    {emp.status || 'active'}
                  </span>
                </td>
                <td>
                  {mode === 'block' && getEmployeeStatus(emp) === 'active' && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="admin-directory-danger"
                      onClick={() => handleTerminate(emp._id)}
                    >
                      Block
                    </Button>
                  )}
                  {mode === 'unblock' && emp.status !== 'active' && (
                    <Button
                      variant="outline-success"
                      size="sm"
                      className="admin-directory-success"
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
                        className="admin-directory-danger me-2"
                        onClick={() => handleTerminate(emp._id)}
                        disabled={getEmployeeStatus(emp) !== 'active'}
                      >
                        Block
                      </Button>
                      <Button
                        variant="outline-success"
                        size="sm"
                        className="admin-directory-success"
                        onClick={() => handleEnable(emp._id)}
                        disabled={getEmployeeStatus(emp) === 'active'}
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
        ) : (
          <div className="admin-directory-empty">{emptyText}</div>
        )}
      </section>
    </div>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  const [overview, setOverview] = useState({});
  const [showSidebar, setShowSidebar] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState({});
  const [notificationCount, setNotificationCount] = useState(0);
  const [dashboardMetrics, setDashboardMetrics] = useState({});
  const [dashboardEmployees, setDashboardEmployees] = useState([]);
  const [dashboardLeaves, setDashboardLeaves] = useState([]);
  const [dashboardTasks, setDashboardTasks] = useState([]);
  const [dashboardSalarySlips, setDashboardSalarySlips] = useState([]);
  const [dashboardReimbursements, setDashboardReimbursements] = useState([]);
  const history = useHistory();
  const authHeaders = { Authorization: `Bearer ${localStorage.getItem('token')}` };

  const getArrayPayload = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.records)) return payload.records;
    if (Array.isArray(payload?.data?.records)) return payload.data.records;
    return [];
  };

  const getStatus = (value) => String(value || '').trim().toLowerCase();

  const getAmount = (value) => Number(value?.netSalary || value?.amount || value?.salary || 0) || 0;

  const formatCurrency = (value) => `Rs. ${(Number(value) || 0).toLocaleString('en-IN')}`;

  // Dynamic greeting based on time
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
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/employees/profile`, { headers: authHeaders });
        setProfile(res.data || {});
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };
    fetchProfile();
  }, []);

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
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/attendance/overview`, { headers: authHeaders });
        setOverview(res.data);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch attendance overview');
        console.error('Error fetching overview:', err);
      }
    };
    fetchOverview();
  }, []);

  // Fetch real admin dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [metricsRes, employeesRes, leavesRes, tasksRes, salaryRes, reimbursementRes] = await Promise.allSettled([
          axios.get(`${process.env.REACT_APP_API_URL}/dashboard/metrics`, { headers: authHeaders }),
          axios.get(`${process.env.REACT_APP_API_URL}/employees`, { headers: authHeaders }),
          axios.get(`${process.env.REACT_APP_API_URL}/leaves`, { headers: authHeaders }),
          axios.get(`${process.env.REACT_APP_API_URL}/tasks`, { headers: authHeaders }),
          axios.get(`${process.env.REACT_APP_API_URL}/salary`, { headers: authHeaders }),
          axios.get(`${process.env.REACT_APP_API_URL}/reimbursements`, { headers: authHeaders }),
        ]);

        if (metricsRes.status === 'fulfilled') {
          setDashboardMetrics(metricsRes.value.data?.data || metricsRes.value.data || {});
        }

        if (employeesRes.status === 'fulfilled') {
          setDashboardEmployees(getArrayPayload(employeesRes.value.data));
        }

        if (leavesRes.status === 'fulfilled') {
          setDashboardLeaves(getArrayPayload(leavesRes.value.data));
        }

        if (tasksRes.status === 'fulfilled') {
          setDashboardTasks(getArrayPayload(tasksRes.value.data));
        }

        if (salaryRes.status === 'fulfilled') {
          setDashboardSalarySlips(getArrayPayload(salaryRes.value.data));
        }

        if (reimbursementRes.status === 'fulfilled') {
          setDashboardReimbursements(getArrayPayload(reimbursementRes.value.data));
        }
      } catch (err) {
        console.error('Error fetching admin dashboard data:', err);
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch notification count
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/notifications/count`, { headers: authHeaders });
        setNotificationCount(res.data.count || 0);
      } catch (err) {
        console.error('Error fetching notification count:', err);
      }
    };
    fetchNotificationCount();
  }, []);

  // Chart data
  const chartData = Object.keys(overview || {})
    .sort((a, b) => new Date(a) - new Date(b))
    .map((date) => ({
      date,
      totalHours: overview[date].reduce((sum, att) => sum + (parseFloat(att.hoursWorked) || 0), 0),
      employeesPresent: overview[date].length,
    }));

  const totalEmployees = dashboardEmployees.length || dashboardMetrics.totalEmployees || 0;
  const activeEmployees = dashboardEmployees.filter((emp) => getStatus(emp.status || 'active') === 'active').length;
  const presentToday = dashboardMetrics.presentToday || chartData[chartData.length - 1]?.employeesPresent || 0;
  const attendanceRate = totalEmployees ? Math.round((presentToday / totalEmployees) * 100) : (dashboardMetrics.todaysAttendance || 0);
  const totalTrackedHours = chartData.reduce((sum, item) => sum + item.totalHours, 0);
  const averageHours = chartData.length ? totalTrackedHours / chartData.length : 0;
  const pendingLeaves = dashboardLeaves.filter((leave) => getStatus(leave.status) === 'pending').length || dashboardMetrics.pendingLeaves || 0;
  const approvedLeaves = dashboardLeaves.filter((leave) => getStatus(leave.status) === 'approved').length || dashboardMetrics.approvedLeaves || 0;
  const rejectedLeaves = dashboardLeaves.filter((leave) => getStatus(leave.status) === 'rejected').length || dashboardMetrics.rejectedLeaves || 0;
  const pendingTasks = dashboardTasks.filter((task) => !['completed', 'done'].includes(getStatus(task.status))).length;
  const completedTasks = dashboardTasks.filter((task) => ['completed', 'done'].includes(getStatus(task.status))).length;
  const taskCompletionRate = dashboardTasks.length ? Math.round((completedTasks / dashboardTasks.length) * 100) : 0;
  const pendingReimbursements = dashboardReimbursements.filter((item) => ['pending', 'submitted'].includes(getStatus(item.status))).length;
  const approvedReimbursementAmount = dashboardReimbursements
    .filter((item) => getStatus(item.status) === 'approved')
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlySalary = dashboardSalarySlips
    .filter((slip) => String(slip.month || '').startsWith(currentMonth))
    .reduce((sum, slip) => sum + getAmount(slip), 0) || dashboardMetrics.monthlySalary || 0;
  const recentAttendanceRows = Object.keys(overview || {})
    .sort((a, b) => new Date(b) - new Date(a))
    .flatMap((date) => (overview[date] || []).map((att) => ({ ...att, date })))
    .slice(0, 8);
  const departmentEntries = Object.entries(
    dashboardEmployees.reduce((acc, emp) => {
      const label = emp.department || emp.position || 'Unassigned';
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const salaryTrendEntries = Object.entries(
    dashboardSalarySlips.reduce((acc, slip) => {
      const month = slip.month || 'Unmapped';
      acc[month] = (acc[month] || 0) + getAmount(slip);
      return acc;
    }, {})
  ).sort((a, b) => new Date(`${a[0]}-01`) - new Date(`${b[0]}-01`)).slice(-6);
  const activeNavLabel = TAB_LABELS[activeTab] || 'Dashboard';

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

  const renderAdminGroupedNav = () => (
    <Nav className="admin-sidebar-nav sidebar-grouped-nav">
      {ADMIN_NAV_GROUPS.map((group) => {
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
              {group.items.map((tab) => (
                <Nav.Link
                  key={tab}
                  className={`animate__animated animate__fadeInLeft ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => handleTabClick(tab)}
                  aria-current={activeTab === tab ? 'page' : undefined}
                >
                  {renderAdminNavIcon(tab)}
                  <span>{TAB_LABELS[tab] || tab}</span>
                </Nav.Link>
              ))}
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
            overflow-y: auto;
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
          .sidebar {
            width: 292px;
            background: #ffffff;
            color: #0f172a;
            padding: 1rem;
            box-shadow: 12px 0 36px rgba(15, 23, 42, 0.08);
            border-right: 1px solid #e2e8f0;
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          .content-area {
            margin-left: 292px;
            background: #ffffff;
            overflow-x: hidden;
          }
          .admin-sidebar-brand,
          .admin-sidebar-user {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem;
            border-radius: 0.85rem;
            border: 1px solid #dbeafe;
            background: linear-gradient(135deg, #eff6ff, #ffffff);
          }
          .admin-sidebar-user {
            background: #f8fafc;
            border-color: #e2e8f0;
          }
          .admin-sidebar-logo,
          .admin-sidebar-avatar {
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
            overflow: hidden;
            flex: 0 0 auto;
          }
          .admin-sidebar-avatar {
            border-radius: 50%;
            background: #dbeafe;
            color: #1d4ed8;
            box-shadow: none;
          }
          .admin-sidebar-avatar img,
          .admin-profile-chip-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .admin-sidebar-brand h4,
          .admin-sidebar-user strong {
            display: block;
            margin: 0;
            color: #0f172a;
            font-size: 1rem;
            font-weight: 800;
            letter-spacing: 0;
            text-shadow: none;
            text-align: left;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .admin-sidebar-brand span,
          .admin-sidebar-user span {
            display: block;
            color: #64748b;
            font-size: 0.76rem;
            font-weight: 700;
            margin-top: 0.15rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .admin-sidebar-nav {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            overflow-y: auto;
            padding-right: 0.2rem;
          }
          .admin-sidebar-nav:not(.sidebar-grouped-nav) {
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
          .admin-sidebar-nav::-webkit-scrollbar {
            width: 6px;
          }
          .admin-sidebar-nav::-webkit-scrollbar-thumb {
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
            gap: 0.55rem;
            min-height: 34px;
            border: 1px solid transparent;
            white-space: nowrap;
          }
          .nav-link::before {
            display: none;
          }
          .nav-link:hover {
            background: #f1f5f9;
            color: #1d4ed8 !important;
            border-color: #e2e8f0;
            transform: translateX(3px);
            box-shadow: none;
          }
          .nav-link.active {
            background: #eff6ff;
            color: #1d4ed8 !important;
            font-weight: 800;
            border-color: #bfdbfe;
            box-shadow: 0 10px 20px rgba(37, 99, 235, 0.08);
            transform: none;
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
          .nav-link svg {
            width: 16px;
            height: 16px;
            flex-shrink: 0;
            padding: 0.32rem;
            box-sizing: content-box;
            border-radius: 0.65rem;
            color: #1d4ed8;
            background: #eef6ff;
          }
          .nav-link.active svg {
            color: #ffffff;
            background: linear-gradient(135deg, #2563eb, #14b8a6);
          }
          .admin-sidebar-footer {
            margin-top: auto;
            border-radius: 0.85rem;
            border: 1px solid #e2e8f0;
            background: #f8fafc;
            padding: 0.8rem;
          }
          .admin-sidebar-footer span {
            display: block;
            color: #64748b;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
          }
          .admin-sidebar-footer strong {
            display: block;
            color: #0f172a;
            font-size: 0.9rem;
            margin-top: 0.2rem;
            word-break: break-word;
          }
          .min-width-0 {
            min-width: 0;
          }
          .admin-topbar {
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
          .admin-topbar-inner {
            width: 100%;
            display: grid;
            grid-template-columns: auto minmax(0, 1fr) auto;
            align-items: center;
            gap: 0.85rem;
          }
          .admin-topbar-title {
            min-width: 0;
          }
          .admin-topbar-title span {
            display: block;
            color: #64748b;
            font-size: 0.76rem;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .admin-topbar-title strong {
            display: block;
            color: #0f172a;
            font-size: 1.18rem;
            font-weight: 900;
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .admin-topbar-actions {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 0.55rem;
            min-width: 0;
          }
          .admin-time-chip,
          .admin-profile-chip {
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
          .admin-profile-chip {
            max-width: 220px;
            border-radius: 0.85rem;
            background: #ffffff;
          }
          .admin-profile-chip-avatar {
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
          .admin-profile-chip-text {
            min-width: 0;
          }
          .admin-profile-chip-text strong,
          .admin-profile-chip-text span {
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .admin-profile-chip-text strong {
            color: #0f172a;
            font-size: 0.84rem;
            line-height: 1.15;
          }
          .admin-profile-chip-text span {
            color: #64748b;
            font-size: 0.72rem;
            margin-top: 0.12rem;
          }
          .admin-topbar-icon-btn,
          .admin-topbar-logout {
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
            position: relative;
          }
          .admin-topbar-icon-btn {
            width: 42px;
            padding: 0;
          }
          .admin-topbar-icon-btn svg,
          .admin-topbar-action-icon {
            width: 18px;
            height: 18px;
            flex: 0 0 auto;
          }
          .admin-topbar-logout {
            padding: 0.45rem 0.78rem;
            color: #b91c1c;
            border-color: #fecaca;
          }
          .admin-topbar-icon-btn:hover,
          .admin-topbar-logout:hover {
            transform: translateY(-1px);
            background: #eff6ff;
            color: #1d4ed8;
            border-color: #93c5fd;
          }
          .admin-topbar-logout:hover {
            background: #fef2f2;
            color: #b91c1c;
            border-color: #fca5a5;
          }
          .admin-dashboard-modern {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            color: #0f172a;
          }
          .admin-hero-card,
          .admin-panel,
          .admin-kpi-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 0.85rem;
            box-shadow: 0 12px 30px rgba(15, 23, 42, 0.07);
          }
          .admin-hero-card {
            background:
              radial-gradient(circle at 90% 10%, rgba(14, 165, 233, 0.16), transparent 32%),
              linear-gradient(135deg, #ffffff 0%, #f8fbff 56%, #eef7ff 100%);
            border-color: #dbeafe;
            padding: 1.5rem;
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 1.5rem;
            align-items: center;
          }
          .admin-hero-eyebrow,
          .admin-panel-eyebrow,
          .admin-kpi-label {
            margin: 0;
            color: #64748b;
            font-size: 0.78rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .admin-hero-title {
            margin: 0.2rem 0;
            color: #0f172a;
            font-size: clamp(1.55rem, 3vw, 2.35rem);
            font-weight: 800;
            line-height: 1.12;
          }
          .admin-hero-meta,
          .admin-hero-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 0.55rem;
            margin-top: 0.65rem;
          }
          .admin-hero-actions {
            justify-content: flex-end;
            margin-top: 0;
          }
          .admin-pill {
            border: 1px solid #dbeafe;
            border-radius: 999px;
            background: #ffffff;
            color: #1e40af;
            padding: 0.42rem 0.72rem;
            font-size: 0.82rem;
            font-weight: 700;
          }
          .admin-action-btn {
            border: 1px solid #bfdbfe;
            background: #ffffff;
            color: #1d4ed8;
            border-radius: 0.65rem;
            padding: 0.65rem 0.9rem;
            font-weight: 700;
            box-shadow: 0 8px 18px rgba(30, 64, 175, 0.08);
            transition: all 0.2s ease;
          }
          .admin-action-btn:hover {
            background: #eff6ff;
            transform: translateY(-2px);
          }
          .admin-kpi-grid {
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 1rem;
          }
          .admin-kpi-card {
            padding: 1rem;
            position: relative;
            overflow: hidden;
          }
          .admin-kpi-card::after {
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
          .admin-kpi-value {
            margin: 0.35rem 0 0.15rem;
            color: #0f172a;
            font-size: 1.8rem;
            font-weight: 800;
          }
          .admin-kpi-note {
            margin: 0;
            color: #64748b;
            font-size: 0.86rem;
          }
          .admin-dashboard-grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(320px, 0.8fr);
            gap: 1rem;
            align-items: start;
          }
          .admin-panel {
            padding: 1.1rem;
          }
          .admin-panel-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 1rem;
            margin-bottom: 1rem;
          }
          .admin-panel-title {
            margin: 0.2rem 0 0;
            color: #0f172a;
            font-size: 1.1rem;
            font-weight: 800;
          }
          .admin-empty-state {
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
          .admin-mini-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.75rem;
          }
          .admin-mini-card {
            border: 1px solid #e2e8f0;
            border-radius: 0.7rem;
            background: #f8fafc;
            padding: 0.9rem;
          }
          .admin-mini-card span {
            display: block;
            color: #64748b;
            font-size: 0.78rem;
            font-weight: 700;
            text-transform: uppercase;
          }
          .admin-mini-card strong {
            display: block;
            margin-top: 0.25rem;
            color: #0f172a;
            font-size: 1.1rem;
          }
          .admin-table-card {
            overflow: hidden;
          }
          .admin-table {
            margin: 0;
          }
          .admin-table thead {
            background: #f8fafc;
            color: #475569;
          }
          .admin-table thead th {
            border-bottom: 1px solid #e2e8f0;
            font-size: 0.76rem;
            letter-spacing: 0.06em;
          }
          .admin-table tbody tr:hover {
            background: #f8fafc;
            transform: none;
          }
          .admin-status {
            border-radius: 999px;
            padding: 0.35rem 0.65rem;
            font-size: 0.75rem;
            font-weight: 800;
            text-transform: capitalize;
            color: #1e40af;
            background: #dbeafe;
          }
          .admin-status.completed,
          .admin-status.done,
          .admin-status.approved,
          .admin-status.active {
            color: #047857;
            background: #d1fae5;
          }
          .admin-status.rejected,
          .admin-status.blocked {
            color: #b91c1c;
            background: #fee2e2;
          }
          .admin-directory {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            color: #0f172a;
          }
          .admin-directory-hero,
          .admin-directory-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 0.85rem;
            box-shadow: 0 12px 30px rgba(15, 23, 42, 0.07);
          }
          .admin-directory-hero {
            background:
              radial-gradient(circle at 92% 8%, rgba(14, 165, 233, 0.14), transparent 30%),
              linear-gradient(135deg, #ffffff 0%, #f8fbff 55%, #eef7ff 100%);
            border-color: #dbeafe;
            padding: 1.35rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
          }
          .admin-directory-eyebrow {
            margin: 0;
            color: #64748b;
            font-size: 0.76rem;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .admin-directory-hero h3,
          .admin-directory-card-header h4 {
            margin: 0.2rem 0 0;
            color: #0f172a;
            font-weight: 850;
          }
          .admin-directory-hero h3 {
            font-size: clamp(1.45rem, 3vw, 2.1rem);
          }
          .admin-directory-hero p:not(.admin-directory-eyebrow) {
            margin: 0.45rem 0 0;
            color: #64748b;
            font-size: 0.95rem;
          }
          .admin-directory-stats {
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-end;
            gap: 0.5rem;
          }
          .admin-directory-stats span {
            border: 1px solid #bfdbfe;
            border-radius: 999px;
            background: #ffffff;
            color: #1d4ed8;
            padding: 0.48rem 0.75rem;
            font-size: 0.85rem;
            font-weight: 800;
            white-space: nowrap;
          }
          .admin-directory-card {
            padding: 1.1rem;
            overflow: hidden;
          }
          .admin-directory-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            margin-bottom: 1rem;
          }
          .admin-directory-table {
            width: 100%;
            margin: 0;
            border: 1px solid #e2e8f0;
            border-radius: 0.75rem;
            overflow: hidden;
            background: #ffffff;
          }
          .admin-directory-table thead {
            background: #f8fafc;
            color: #475569;
          }
          .admin-directory-table thead th {
            border-bottom: 1px solid #e2e8f0;
            font-size: 0.76rem;
            letter-spacing: 0.06em;
            text-transform: uppercase;
          }
          .admin-directory-table th,
          .admin-directory-table td {
            padding: 0.95rem;
            border-color: #e2e8f0;
            color: #334155;
            vertical-align: middle;
          }
          .admin-directory-table tbody tr:hover {
            background: #f8fafc;
            transform: none;
          }
          .admin-directory-person {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            min-width: 220px;
          }
          .admin-directory-avatar {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: linear-gradient(135deg, #2563eb, #14b8a6);
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            overflow: hidden;
            flex: 0 0 auto;
          }
          .admin-directory-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .admin-directory-person strong,
          .admin-directory-person span {
            display: block;
          }
          .admin-directory-person strong {
            color: #0f172a;
            font-weight: 850;
          }
          .admin-directory-person span {
            color: #64748b;
            font-size: 0.82rem;
            margin-top: 0.1rem;
          }
          .admin-directory-danger,
          .admin-directory-success {
            border-radius: 0.6rem !important;
            padding: 0.45rem 0.75rem !important;
            font-size: 0.82rem !important;
            font-weight: 800 !important;
            box-shadow: none !important;
          }
          .admin-directory-danger {
            border: 1px solid #fecaca !important;
            background: #fef2f2 !important;
            color: #b91c1c !important;
          }
          .admin-directory-success {
            border: 1px solid #bbf7d0 !important;
            background: #f0fdf4 !important;
            color: #047857 !important;
          }
          .admin-directory-empty {
            min-height: 150px;
            border: 1px dashed #cbd5e1;
            border-radius: 0.75rem;
            background: #f8fafc;
            color: #64748b;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 1rem;
            font-weight: 700;
          }
          .chart-container canvas {
            width: 100% !important;
            height: 100% !important;
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
            .admin-topbar-inner {
              grid-template-columns: auto minmax(0, 1fr);
            }
            .admin-topbar-actions {
              grid-column: 1 / -1;
              justify-content: space-between;
              flex-wrap: wrap;
            }
            .admin-profile-chip {
              flex: 1 1 190px;
              max-width: none;
            }
            .admin-hero-card,
            .admin-dashboard-grid {
              grid-template-columns: 1fr;
            }
            .admin-hero-actions {
              justify-content: flex-start;
            }
            .admin-directory-hero {
              align-items: flex-start;
              flex-direction: column;
            }
            .admin-directory-stats {
              justify-content: flex-start;
            }
            .admin-kpi-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
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
            .admin-topbar {
              top: 0.75rem;
              padding: 0.65rem;
              margin-bottom: 1.5rem !important;
            }
            .admin-time-chip {
              display: none;
            }
            .admin-topbar-title span {
              font-size: 0.68rem;
            }
            .admin-topbar-title strong {
              font-size: 1rem;
            }
            .admin-profile-chip {
              flex: 1 1 100%;
              order: 3;
            }
            .admin-topbar-logout,
            .admin-action-btn {
              flex: 1 1 auto;
            }
            .admin-kpi-grid,
            .admin-mini-grid {
              grid-template-columns: 1fr;
            }
            .admin-hero-card,
            .admin-panel {
              padding: 1rem;
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
        <div className="sidebar d-none d-lg-flex">
          <div className="admin-sidebar-brand">
            <div className="admin-sidebar-logo">F</div>
            <div>
              <h4>Fintradify</h4>
              <span>Admin portal</span>
            </div>
          </div>
          <div className="admin-sidebar-user">
            <div className="admin-sidebar-avatar">
              {profile.profilePhoto ? <img src={profile.profilePhoto} alt={profile.name || 'Admin'} /> : (profile.name || 'A')[0].toUpperCase()}
            </div>
            <div className="min-width-0">
              <strong>{profile.name || 'Admin'}</strong>
              <span>{profile.position || profile.employeeId || 'Operations lead'}</span>
            </div>
          </div>
          {renderAdminGroupedNav()}
          <Nav className="admin-sidebar-nav">
            {ADMIN_TABS.map((tab) => (
              <Nav.Link
                key={tab}
                className={`animate__animated animate__fadeInLeft ${activeTab === tab ? 'active' : ''}`}
                style={{ animationDelay: `${0.04 * ADMIN_TABS.findIndex((navItem) => navItem === tab)}s` }}
                onClick={() => handleTabClick(tab)}
                aria-current={activeTab === tab ? 'page' : undefined}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {tab === 'overview' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2M9 19" />}
                  {tab === 'add-employee' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />}
                  {tab === 'edit-employee' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />}
                  {tab === 'employee-list' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />}
                  {tab === 'block-employees' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />}
                  {tab === 'unblock-employees' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
                  {tab === 'attendance' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
                  {tab === 'manual-attendance' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />}
                  {tab === 'active-attendance' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
                  {tab === 'leaves' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />}
                  {tab === 'paid-leaves' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
                  {tab === 'tasks' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />}
                  {tab === 'salary' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
                  {tab === 'relieving-letter' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
                  {tab === 'offer-letter' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
                  {tab === 'certificates' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7 3h10a2 2 0 012 2v14l-3-2-3 2-3-2-3 2V5a2 2 0 012-2z" />}
                  {tab === 'documents' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6M7 3h7l5 5v13a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />}
                  {tab === 'reimbursements' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />}
                  {tab === 'notifications' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />}
                  {tab === 'teams' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />}
                  {tab === 'tracking' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />}
                  {tab === 'login-credentials' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11V8a4 4 0 10-8 0v3m8 0h2a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6a2 2 0 012-2h8zm6 4l2 2 4-4" />}
                  {tab === 'settings' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />}
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{TAB_LABELS[tab] || tab}</span>
              </Nav.Link>
            ))}
          </Nav>
          <div className="admin-sidebar-footer">
            <span>Signed in as</span>
            <strong>{profile.email || 'Admin account'}</strong>
          </div>
        </div>

        {/* Main Content */}
        <div className="content-area">
          <Navbar bg="light" variant="light" className="admin-topbar mb-5">
            <Container fluid className="px-0">
              <div className="admin-topbar-inner">
              <Button
                variant="primary"
                className="sidebar-toggle d-lg-none"
                onClick={() => setShowSidebar(true)}
                aria-label="Open admin menu"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
                <div className="admin-topbar-title">
                  <span>Admin Portal</span>
                  <strong>{activeNavLabel}</strong>
                </div>
                <div className="admin-topbar-actions">
                  <div className="admin-time-chip d-none d-md-inline-flex">
                    <svg className="admin-topbar-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{currentTime.split(',')[0]} | {DAYS[new Date().getDay()]}, {MONTHS[new Date().getMonth()]} {new Date().getDate()}</span>
                  </div>
                  <button
                    type="button"
                    className="admin-profile-chip"
                    onClick={() => handleTabClick('overview')}
                    aria-label="Open admin dashboard"
                  >
                    <span className="admin-profile-chip-avatar">
                      {profile.profilePhoto ? <img src={profile.profilePhoto} alt={profile.name || 'Admin'} /> : (profile.name || 'A')[0].toUpperCase()}
                    </span>
                    <span className="admin-profile-chip-text">
                      <strong>{profile.name || 'Admin'}</strong>
                      <span>{profile.employeeId || profile.position || 'Operations lead'}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="admin-topbar-icon-btn"
                    onClick={() => handleTabClick('settings')}
                    aria-label="Settings"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.3 4.3a1.7 1.7 0 013.4 0 1.7 1.7 0 002.6 1.1 1.7 1.7 0 012.4 2.4 1.7 1.7 0 001.1 2.6 1.7 1.7 0 010 3.4 1.7 1.7 0 00-1.1 2.6 1.7 1.7 0 01-2.4 2.4 1.7 1.7 0 00-2.6 1.1 1.7 1.7 0 01-3.4 0 1.7 1.7 0 00-2.6-1.1 1.7 1.7 0 01-2.4-2.4 1.7 1.7 0 00-1.1-2.6 1.7 1.7 0 010-3.4 1.7 1.7 0 001.1-2.6 1.7 1.7 0 012.4-2.4 1.7 1.7 0 002.6-1.1z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="admin-topbar-icon-btn"
                    onClick={() => handleTabClick('notifications')}
                    aria-label="Notifications"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.73 21a2 2 0 01-3.46 0" />
                    </svg>
                    {notificationCount > 0 && (
                      <Badge pill bg="danger" className="position-absolute top-0 start-100 translate-middle" style={{ fontSize: '0.7rem' }}>
                        {notificationCount > 99 ? '99+' : notificationCount}
                      </Badge>
                    )}
                  </button>
                  <button
                    type="button"
                    className="admin-topbar-logout"
                    onClick={handleLogout}
                    aria-label="Logout from admin portal"
                  >
                    <svg className="admin-topbar-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
              <Offcanvas.Title className="animate__animated animate__zoomIn">Admin Menu</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <div className="admin-sidebar-brand mb-3">
                <div className="admin-sidebar-logo">F</div>
                <div>
                  <h4>Fintradify</h4>
                  <span>Admin portal</span>
                </div>
              </div>
              <div className="admin-sidebar-user mb-3">
                <div className="admin-sidebar-avatar">
                  {profile.profilePhoto ? <img src={profile.profilePhoto} alt={profile.name || 'Admin'} /> : (profile.name || 'A')[0].toUpperCase()}
                </div>
                <div className="min-width-0">
                  <strong>{profile.name || 'Admin'}</strong>
                  <span>{profile.position || profile.employeeId || 'Operations lead'}</span>
                </div>
              </div>
              {renderAdminGroupedNav()}
              <Nav className="admin-sidebar-nav">
                {ADMIN_TABS.map((tab) => (
                  <Nav.Link
                    key={tab}
                    className={`animate__animated animate__fadeInLeft ${activeTab === tab ? 'active' : ''}`}
                    style={{ animationDelay: `${0.04 * ADMIN_TABS.findIndex((navItem) => navItem === tab)}s` }}
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
                      {tab === 'login-credentials' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11V8a4 4 0 10-8 0v3m8 0h2a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6a2 2 0 012-2h8zm6 4l2 2 4-4" />}
                    </svg>
                    <span>{TAB_LABELS[tab] || tab}</span>
                  </Nav.Link>
                ))}
              </Nav>
              <div className="admin-sidebar-footer mt-3">
                <span>Signed in as</span>
                <strong>{profile.email || 'Admin account'}</strong>
                <button
                  type="button"
                  className="admin-topbar-logout w-100 mt-3"
                  onClick={handleLogout}
                  aria-label="Logout from admin portal"
                >
                  <svg className="admin-topbar-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
            {activeTab === 'overview' && (
              <div className="admin-dashboard-modern animate__animated animate__fadeInUp">
                <section className="admin-hero-card">
                  <div>
                    <p className="admin-hero-eyebrow">Admin dashboard</p>
                    <h1 className="admin-hero-title">{getGreeting()}, {profile.name || 'Admin'}</h1>
                    <div className="admin-hero-meta">
                      <span className="admin-pill">{activeEmployees} active employees</span>
                      <span className="admin-pill">{presentToday} present today</span>
                      <span className="admin-pill">{currentTime}</span>
                    </div>
                  </div>
                  <div className="admin-hero-actions">
                    <button type="button" className="admin-action-btn" onClick={() => handleTabClick('add-employee')}>Add Employee</button>
                    <button type="button" className="admin-action-btn" onClick={() => handleTabClick('attendance')}>Attendance</button>
                    <button type="button" className="admin-action-btn" onClick={() => handleTabClick('leaves')}>Review Leaves</button>
                    <button type="button" className="admin-action-btn" onClick={() => handleTabClick('tasks')}>Assign Tasks</button>
                  </div>
                </section>

                <section className="admin-kpi-grid">
                  <div className="admin-kpi-card" style={{ '--accent': '#bfdbfe' }}>
                    <p className="admin-kpi-label">Total Employees</p>
                    <h2 className="admin-kpi-value">{totalEmployees}</h2>
                    <p className="admin-kpi-note">{activeEmployees} active accounts</p>
                  </div>
                  <div className="admin-kpi-card" style={{ '--accent': '#bae6fd' }}>
                    <p className="admin-kpi-label">Attendance Today</p>
                    <h2 className="admin-kpi-value">{attendanceRate}%</h2>
                    <p className="admin-kpi-note">{presentToday} present employees</p>
                  </div>
                  <div className="admin-kpi-card" style={{ '--accent': '#fed7aa' }}>
                    <p className="admin-kpi-label">Pending Leaves</p>
                    <h2 className="admin-kpi-value">{pendingLeaves}</h2>
                    <p className="admin-kpi-note">{approvedLeaves} approved / {rejectedLeaves} rejected</p>
                  </div>
                  <div className="admin-kpi-card" style={{ '--accent': '#bbf7d0' }}>
                    <p className="admin-kpi-label">Task Completion</p>
                    <h2 className="admin-kpi-value">{taskCompletionRate}%</h2>
                    <p className="admin-kpi-note">{pendingTasks} tasks pending</p>
                  </div>
                  <div className="admin-kpi-card" style={{ '--accent': '#fecdd3' }}>
                    <p className="admin-kpi-label">Monthly Payroll</p>
                    <h2 className="admin-kpi-value">{formatCurrency(monthlySalary)}</h2>
                    <p className="admin-kpi-note">{dashboardSalarySlips.length} salary slips</p>
                  </div>
                </section>

                <section className="admin-dashboard-grid">
                  <div className="admin-panel">
                    <div className="admin-panel-header">
                      <div>
                        <p className="admin-panel-eyebrow">Attendance insight</p>
                        <h2 className="admin-panel-title">Daily presence and hours</h2>
                      </div>
                      <span className="admin-pill">{chartData.length} days</span>
                    </div>
                    {chartData.length ? (
                      <div className="chart-container">
                        <Bar data={chartConfig} options={chartOptions} />
                      </div>
                    ) : (
                      <div className="admin-empty-state">No attendance records available yet.</div>
                    )}
                  </div>

                  <div className="admin-panel">
                    <div className="admin-panel-header">
                      <div>
                        <p className="admin-panel-eyebrow">Workload</p>
                        <h2 className="admin-panel-title">Operational summary</h2>
                      </div>
                      <button type="button" className="admin-action-btn" onClick={() => handleTabClick('tasks')}>Open tasks</button>
                    </div>
                    <div className="admin-mini-grid">
                      <div className="admin-mini-card"><span>Total tasks</span><strong>{dashboardTasks.length}</strong></div>
                      <div className="admin-mini-card"><span>Completed</span><strong>{completedTasks}</strong></div>
                      <div className="admin-mini-card"><span>Claims pending</span><strong>{pendingReimbursements}</strong></div>
                      <div className="admin-mini-card"><span>Approved claims</span><strong>{formatCurrency(approvedReimbursementAmount)}</strong></div>
                    </div>
                  </div>
                </section>

                <section className="admin-dashboard-grid">
                  <div className="admin-panel">
                    <div className="admin-panel-header">
                      <div>
                        <p className="admin-panel-eyebrow">Trend</p>
                        <h2 className="admin-panel-title">Employee presence trend</h2>
                      </div>
                      <span className="admin-pill">Avg {averageHours.toFixed(1)} hrs/day</span>
                    </div>
                    {chartData.length ? (
                      <div className="chart-container">
                        <Line
                          data={{
                            labels: chartData.map((item) => item.date),
                            datasets: [
                              {
                                label: 'Employees Present',
                                data: chartData.map((item) => item.employeesPresent),
                                borderColor: '#2563eb',
                                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                                fill: true,
                                tension: 0.36,
                              },
                              {
                                label: 'Total Hours',
                                data: chartData.map((item) => item.totalHours),
                                borderColor: '#14b8a6',
                                backgroundColor: 'rgba(20, 184, 166, 0.08)',
                                fill: true,
                                tension: 0.36,
                              },
                            ],
                          }}
                          options={chartOptions}
                        />
                      </div>
                    ) : (
                      <div className="admin-empty-state">Attendance trend will appear after punch records are available.</div>
                    )}
                  </div>

                  <div className="admin-panel">
                    <div className="admin-panel-header">
                      <div>
                        <p className="admin-panel-eyebrow">Leave pipeline</p>
                        <h2 className="admin-panel-title">Leave distribution</h2>
                      </div>
                      <button type="button" className="admin-action-btn" onClick={() => handleTabClick('leaves')}>Review</button>
                    </div>
                    {dashboardLeaves.length ? (
                      <div className="chart-container">
                        <Pie
                          data={{
                            labels: ['Approved', 'Pending', 'Rejected'],
                            datasets: [
                              {
                                data: [approvedLeaves, pendingLeaves, rejectedLeaves],
                                backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                                borderColor: ['#10b981', '#f59e0b', '#ef4444'],
                                borderWidth: 1,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { labels: { color: '#1e40af' }, position: 'bottom' },
                              tooltip: chartOptions.plugins.tooltip,
                            },
                          }}
                        />
                      </div>
                    ) : (
                      <div className="admin-empty-state">No leave requests found.</div>
                    )}
                  </div>
                </section>

                <section className="admin-dashboard-grid">
                  <div className="admin-panel">
                    <div className="admin-panel-header">
                      <div>
                        <p className="admin-panel-eyebrow">People</p>
                        <h2 className="admin-panel-title">Department strength</h2>
                      </div>
                      <button type="button" className="admin-action-btn" onClick={() => handleTabClick('employee-list')}>Employees</button>
                    </div>
                    {departmentEntries.length ? (
                      <div className="chart-container">
                        <Doughnut
                          data={{
                            labels: departmentEntries.map(([label]) => label),
                            datasets: [
                              {
                                data: departmentEntries.map(([, count]) => count),
                                backgroundColor: ['#2563eb', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b'],
                                borderColor: ['#2563eb', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b'],
                                borderWidth: 1,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { labels: { color: '#1e40af' }, position: 'bottom' },
                              tooltip: chartOptions.plugins.tooltip,
                            },
                          }}
                        />
                      </div>
                    ) : (
                      <div className="admin-empty-state">Department data will appear after employee records are added.</div>
                    )}
                  </div>

                  <div className="admin-panel">
                    <div className="admin-panel-header">
                      <div>
                        <p className="admin-panel-eyebrow">Payroll</p>
                        <h2 className="admin-panel-title">Salary trend</h2>
                      </div>
                      <button type="button" className="admin-action-btn" onClick={() => handleTabClick('salary')}>Payroll</button>
                    </div>
                    {salaryTrendEntries.length ? (
                      <div className="chart-container">
                        <Line
                          data={{
                            labels: salaryTrendEntries.map(([month]) => month),
                            datasets: [
                              {
                                label: 'Payroll Amount',
                                data: salaryTrendEntries.map(([, amount]) => amount),
                                borderColor: '#8b5cf6',
                                backgroundColor: 'rgba(139, 92, 246, 0.12)',
                                fill: true,
                                tension: 0.36,
                              },
                            ],
                          }}
                          options={chartOptions}
                        />
                      </div>
                    ) : (
                      <div className="admin-empty-state">Salary trend will appear after salary slips are generated.</div>
                    )}
                  </div>
                </section>

                <section className="admin-panel admin-table-card">
                  <div className="admin-panel-header">
                    <div>
                      <p className="admin-panel-eyebrow">Live records</p>
                      <h2 className="admin-panel-title">Recent attendance</h2>
                    </div>
                    <button type="button" className="admin-action-btn" onClick={() => handleTabClick('attendance')}>View all</button>
                  </div>
                  {recentAttendanceRows.length ? (
                    <div className="table-responsive">
                      <Table className="admin-table table-hover">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Employee ID</th>
                            <th>Name</th>
                            <th>Punch In</th>
                            <th>Punch Out</th>
                            <th>Hours</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentAttendanceRows.map((att, index) => (
                            <tr key={`${att.date}-${att.employeeId}-${index}`}>
                              <td>{att.date}</td>
                              <td>{att.employeeId || 'N/A'}</td>
                              <td>{att.name || 'N/A'}</td>
                              <td>{att.punchIn || 'N/A'}</td>
                              <td>{att.punchOut || 'N/A'}</td>
                              <td><span className="admin-status active">{att.hoursWorked || 'N/A'}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div className="admin-empty-state">No recent attendance rows available.</div>
                  )}
                </section>
              </div>
            )}
            {activeTab === 'reports-center' && (
              <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.15s' }}>
                <AdminReportsCenter onNavigate={handleTabClick} />
              </div>
            )}
            {activeTab === 'add-employee' && (
              <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.1s' }}>
                <EmployeeForm />
              </div>
            )}
            {activeTab === 'edit-employee' && (
              <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.15s' }}>
                <EmployeeForm mode="edit" />
              </div>
            )}
            {activeTab === 'employee-list' && (
              <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.2s' }}>
                <EmployeeList />
              </div>
            )}
            {activeTab === 'block-employees' && (
              <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.25s' }}>
                <EmployeeList mode="block" />
              </div>
            )}
            {activeTab === 'unblock-employees' && (
              <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.25s' }}>
                <EmployeeList mode="unblock" />
              </div>
            )}
            {activeTab === 'attendance' && (
              <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.3s' }}>
                <AttendanceTable />
              </div>
            )}
            {activeTab === 'approved-attendance' && (
              <Card className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.35s' }}>
                <Card.Body>
                  <h3 className="mb-4 fw-bold text-primary-800">Approved Attendance</h3>
                  <AttendanceList status="approved" />
                </Card.Body>
              </Card>
            )}
            {activeTab === 'rejected-attendance' && (
              <Card className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.35s' }}>
                <Card.Body>
                  <h3 className="mb-4 fw-bold text-primary-800">Rejected Attendance</h3>
                  <AttendanceList status="rejected" />
                </Card.Body>
              </Card>
            )}
            {activeTab === 'leaves' && (
              <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.4s' }}>
                <LeaveRequest isAdmin />
              </div>
            )}
            {activeTab === 'manual-attendance' && (
              <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.4s' }}>
                <ManualAttendance />
              </div>
            )}
            {activeTab === 'active-attendance' && (
              <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.45s' }}>
                <ActiveAttendance />
              </div>
            )}
            {activeTab === 'paid-leaves' && (
              <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.5s' }}>
                <PaidLeaves isAdmin />
              </div>
            )}
            {activeTab === 'monthly-performance' && (
              <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.5s' }}>
                <AdminPerformanceReport />
              </div>
            )}
            {activeTab === 'tasks' && (
              <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.5s' }}>
                <AdminTasks />
              </div>
            )}
            {activeTab === 'salary' && (
              <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.6s' }}>
                <SalarySlip isAdmin />
              </div>
            )}
            {activeTab === 'relieving-letter' && (
              <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.65s' }}>
                <RelievingLetter />
              </div>
            )}
            {activeTab === 'offer-letter' && (
              <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.65s' }}>
                <OfferLetter />
              </div>
            )}
            {activeTab === 'certificates' && (
              <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.65s' }}>
                <CertificateManager isAdmin />
              </div>
            )}
            {activeTab === 'documents' && (
              <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.65s' }}>
                <DocumentSubmission isAdmin />
              </div>
            )}
            {activeTab === 'compliance-center' && (
              <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.65s' }}>
                <AdminComplianceCenter onNavigate={handleTabClick} />
              </div>
            )}
            {activeTab === 'reimbursements' && (
              <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.65s' }}>
                <AdminReimbursement />
              </div>
            )}
            {activeTab === 'notifications' && (
              <div className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.65s' }}>
                <Notification userId={profile._id} role="admin" />
              </div>
            )}
            {activeTab === 'teams' && (
              <Card className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.25s' }}>
                <Card.Body>
                  <h3 className="mb-4 fw-bold text-primary-800">Employee Teams</h3>
                  <EmployeeTeams />
                </Card.Body>
              </Card>
            )}
            {activeTab === 'tracking' && (
              <Card className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.25s' }}>
                <Card.Body>
                  <h3 className="mb-4 fw-bold text-primary-800">Employee Tracking</h3>
                  <EmployeeTracking />
                </Card.Body>
              </Card>
            )}
            {activeTab === 'login-credentials' && (
              <Card className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.7s' }}>
                <Card.Body>
                  <h3 className="mb-4 fw-bold text-primary-800">Login Credentials</h3>
                  <AdminCredentials />
                </Card.Body>
              </Card>
            )}
            {activeTab === 'settings' && (
              <Card className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.7s' }}>
                <Card.Body>
                  <h3 className="mb-4 fw-bold text-primary-800">Settings</h3>
                  <AdminSettings />
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
