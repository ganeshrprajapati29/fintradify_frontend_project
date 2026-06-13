import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Form, Spinner, Table } from 'react-bootstrap';
import { FaCalendarCheck, FaChartPie, FaClipboardList, FaDownload, FaFileCsv, FaFileInvoiceDollar, FaRedo, FaUsers } from 'react-icons/fa';
import api from '../utils/axios';

const getRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.records)) return payload.records;
  if (Array.isArray(payload?.data?.records)) return payload.data.records;
  return [];
};

const getStatus = (value) => String(value || '').trim().toLowerCase();
const getAmount = (value) => Number(value?.netSalary || value?.amount || value?.approvedAmount || value?.claimAmount || 0) || 0;
const formatMoney = (value) => `Rs. ${Math.round(Number(value) || 0).toLocaleString('en-IN')}`;
const toDateInput = (date) => date.toISOString().slice(0, 10);
const defaultRange = () => {
  const now = new Date();
  return {
    from: toDateInput(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: toDateInput(now),
  };
};
const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
const getRecordDate = (record, fallback) => parseDate(
  record?.date ||
  record?.createdAt ||
  record?.updatedAt ||
  record?.startDate ||
  record?.issueDate ||
  record?.payDate ||
  record?.submittedAt ||
  fallback
);
const inRange = (date, range) => {
  const parsed = parseDate(date);
  if (!parsed) return true;
  const from = range.from ? new Date(`${range.from}T00:00:00`) : null;
  const to = range.to ? new Date(`${range.to}T23:59:59`) : null;
  return (!from || parsed >= from) && (!to || parsed <= to);
};
const csvEscape = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
const downloadCsv = (fileName, rows) => {
  const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const AdminReportsCenter = ({ onNavigate }) => {
  const [data, setData] = useState({
    employees: [],
    leaves: [],
    tasks: [],
    salary: [],
    reimbursements: [],
    attendanceOverview: {},
    metrics: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState(defaultRange);

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const [metrics, employees, leaves, tasks, salary, reimbursements, attendanceOverview] = await Promise.allSettled([
        api.get('/dashboard/metrics'),
        api.get('/employees'),
        api.get('/leaves'),
        api.get('/tasks'),
        api.get('/salary'),
        api.get('/reimbursements'),
        api.get('/attendance/overview'),
      ]);

      setData({
        metrics: metrics.status === 'fulfilled' ? (metrics.value.data?.data || metrics.value.data || {}) : {},
        employees: employees.status === 'fulfilled' ? getRows(employees.value.data) : [],
        leaves: leaves.status === 'fulfilled' ? getRows(leaves.value.data) : [],
        tasks: tasks.status === 'fulfilled' ? getRows(tasks.value.data) : [],
        salary: salary.status === 'fulfilled' ? getRows(salary.value.data) : [],
        reimbursements: reimbursements.status === 'fulfilled' ? getRows(reimbursements.value.data) : [],
        attendanceOverview: attendanceOverview.status === 'fulfilled' ? (attendanceOverview.value.data || {}) : {},
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load reports center.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const attendanceRows = useMemo(() => {
    return Object.entries(data.attendanceOverview || {}).flatMap(([date, rows]) => (
      (Array.isArray(rows) ? rows : []).map((row) => ({ ...row, reportDate: row.date || date }))
    ));
  }, [data.attendanceOverview]);

  const rangedData = useMemo(() => ({
    employees: data.employees.filter((employee) => inRange(getRecordDate(employee, employee.joiningDate), range)),
    leaves: data.leaves.filter((leave) => inRange(getRecordDate(leave, leave.startDate), range)),
    tasks: data.tasks.filter((task) => inRange(getRecordDate(task, task.createdAt), range)),
    salary: data.salary.filter((slip) => inRange(getRecordDate(slip, `${slip.month || ''}-01`), range)),
    reimbursements: data.reimbursements.filter((item) => inRange(getRecordDate(item, item.createdAt), range)),
    attendance: attendanceRows.filter((row) => inRange(getRecordDate(row, row.reportDate), range)),
  }), [data, attendanceRows, range]);

  const summary = useMemo(() => {
    const activeEmployees = data.employees.filter((employee) => getStatus(employee.status || 'active') === 'active').length;
    const attendanceDays = new Set(rangedData.attendance.map((row) => row.reportDate)).size;
    const completedTasks = rangedData.tasks.filter((task) => ['completed', 'done'].includes(getStatus(task.status))).length;
    const pendingTasks = rangedData.tasks.length - completedTasks;
    const pendingLeaves = rangedData.leaves.filter((leave) => getStatus(leave.status) === 'pending').length;
    const approvedLeaves = rangedData.leaves.filter((leave) => getStatus(leave.status) === 'approved').length;
    const payrollTotal = rangedData.salary.reduce((sum, slip) => sum + getAmount(slip), 0);
    const pendingClaims = rangedData.reimbursements.filter((item) => getStatus(item.status) === 'pending').length;
    const approvedClaims = rangedData.reimbursements
      .filter((item) => getStatus(item.status) === 'approved')
      .reduce((sum, item) => sum + getAmount(item), 0);

    return {
      activeEmployees,
      attendanceDays,
      attendanceRows: rangedData.attendance.length,
      completedTasks,
      pendingTasks,
      pendingLeaves,
      approvedLeaves,
      payrollTotal,
      pendingClaims,
      approvedClaims,
    };
  }, [data.employees, rangedData]);

  const departmentRows = useMemo(() => {
    const map = data.employees.reduce((acc, employee) => {
      const key = employee.department || employee.team || 'Unassigned';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [data.employees]);

  const recentActivity = useMemo(() => [
    ['Employees', `${data.employees.length} total / ${summary.activeEmployees} active`, 'employee-list'],
    ['Attendance', `${summary.attendanceRows} records across ${summary.attendanceDays} days`, 'attendance'],
    ['Tasks', `${summary.completedTasks} completed / ${summary.pendingTasks} pending`, 'tasks'],
    ['Leaves', `${summary.pendingLeaves} pending / ${summary.approvedLeaves} approved`, 'leaves'],
    ['Payroll', `${data.salary.length} slips / ${formatMoney(summary.payrollTotal)}`, 'salary'],
    ['Claims', `${summary.pendingClaims} pending / ${formatMoney(summary.approvedClaims)} approved`, 'reimbursements'],
  ], [data, summary]);

  const csvReports = useMemo(() => ({
    employees: [
      ['Employee ID', 'Name', 'Email', 'Phone', 'Position', 'Department', 'Status', 'Joining Date', 'Salary'],
      ...rangedData.employees.map((employee) => [
        employee.employeeId,
        employee.name,
        employee.email,
        employee.phone,
        employee.position,
        employee.department || employee.team,
        employee.status || 'active',
        employee.joiningDate,
        employee.salary,
      ]),
    ],
    attendance: [
      ['Date', 'Employee ID', 'Name', 'Punch In', 'Punch Out', 'Hours Worked', 'Status'],
      ...rangedData.attendance.map((row) => [
        row.reportDate || row.date,
        row.employeeId || row.employee?.employeeId,
        row.name || row.employee?.name,
        row.punchIn,
        row.punchOut,
        row.hoursWorked,
        row.status,
      ]),
    ],
    tasks: [
      ['Title', 'Employee', 'Employee ID', 'Status', 'Priority', 'Due Date', 'Created At', 'Updated At'],
      ...rangedData.tasks.map((task) => [
        task.title,
        task.employee?.name || task.assignedTo?.name,
        task.employee?.employeeId || task.assignedTo?.employeeId,
        task.status,
        task.priority,
        task.dueDate,
        task.createdAt,
        task.updatedAt,
      ]),
    ],
    leaves: [
      ['Employee', 'Employee ID', 'Type', 'Status', 'Start Date', 'End Date', 'Days', 'Reason'],
      ...rangedData.leaves.map((leave) => [
        leave.employee?.name,
        leave.employee?.employeeId,
        leave.type || leave.leaveType,
        leave.status,
        leave.startDate,
        leave.endDate,
        leave.days || leave.totalDays,
        leave.reason,
      ]),
    ],
    payroll: [
      ['Employee', 'Employee ID', 'Month', 'Amount', 'Net Salary', 'Status', 'Pay Date'],
      ...rangedData.salary.map((slip) => [
        slip.employee?.name,
        slip.employee?.employeeId,
        slip.month,
        slip.amount,
        slip.netSalary,
        slip.status,
        slip.payDate,
      ]),
    ],
    reimbursements: [
      ['Employee', 'Employee ID', 'Title', 'Category', 'Claim Amount', 'Approved Amount', 'Status', 'Created At'],
      ...rangedData.reimbursements.map((item) => [
        item.employee?.name,
        item.employee?.employeeId,
        item.title || item.description,
        item.category,
        item.claimAmount || item.amount,
        item.approvedAmount,
        item.status,
        item.createdAt,
      ]),
    ],
    summary: [
      ['Metric', 'Value'],
      ['Range From', range.from],
      ['Range To', range.to],
      ['Active Employees', summary.activeEmployees],
      ['Attendance Records', summary.attendanceRows],
      ['Attendance Days', summary.attendanceDays],
      ['Completed Tasks', summary.completedTasks],
      ['Pending Tasks', summary.pendingTasks],
      ['Pending Leaves', summary.pendingLeaves],
      ['Approved Leaves', summary.approvedLeaves],
      ['Payroll Total', summary.payrollTotal],
      ['Pending Claims', summary.pendingClaims],
      ['Approved Claims Amount', summary.approvedClaims],
    ],
  }), [rangedData, range, summary]);

  const exportCsv = (type) => {
    const label = type.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    downloadCsv(`fintradify-${label}-report-${range.from || 'start'}-to-${range.to || 'today'}.csv`, csvReports[type] || csvReports.summary);
  };

  const exportAttendanceCsv = async () => {
    if (!range.from || !range.to) {
      setError('Please select both from date and to date before downloading attendance CSV.');
      return;
    }

    setError('');
    try {
      const response = await api.get('/attendance/download', {
        params: { startDate: range.from, endDate: range.to },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/csv; charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance-${range.from}-${range.to}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Error downloading attendance CSV in attendance module format.');
    }
  };

  const exportAllCsv = () => {
    const rows = [
      ['Fintradify Reports Center Export'],
      ['Range From', range.from],
      ['Range To', range.to],
      [],
      ...csvReports.summary,
      [],
      ['Employees'],
      ...csvReports.employees,
      [],
      ['Attendance'],
      ...csvReports.attendance,
      [],
      ['Tasks'],
      ...csvReports.tasks,
      [],
      ['Leaves'],
      ...csvReports.leaves,
      [],
      ['Payroll'],
      ...csvReports.payroll,
      [],
      ['Reimbursements'],
      ...csvReports.reimbursements,
    ];
    downloadCsv(`fintradify-all-reports-${range.from || 'start'}-to-${range.to || 'today'}.csv`, rows);
  };

  return (
    <div className="admin-reports-center">
      <style>{`
        .admin-reports-center{display:grid;gap:20px;color:#0f172a}
        .reports-hero,.reports-card,.reports-panel{background:#fff;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 18px 42px rgba(15,23,42,.08)}
        .reports-hero{display:flex;justify-content:space-between;gap:18px;align-items:center;padding:26px;background:linear-gradient(135deg,#fff,#eff6ff)}
        .reports-eyebrow{margin:0 0 8px;color:#1d4ed8;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}
        .reports-hero h2{margin:0;color:#0f172a;font-size:clamp(28px,4vw,44px);line-height:1.06;font-weight:950}.reports-hero p{margin:12px 0 0;color:#475569;font-weight:650;line-height:1.7}
        .reports-export-panel{display:grid;gap:12px;padding:16px;border:1px solid #dbe3ef;border-radius:12px;background:#fff;min-width:320px}
        .reports-range{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.reports-range label{display:block;color:#334155;font-size:12px;font-weight:900;text-transform:uppercase;margin-bottom:5px}
        .reports-export-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
        .reports-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.reports-card{padding:18px}
        .reports-card span{display:flex;align-items:center;gap:8px;color:#64748b;font-size:12px;font-weight:900;text-transform:uppercase}.reports-card svg{color:#0f766e}
        .reports-card strong{display:block;margin-top:10px;color:#0f172a;font-size:30px;line-height:1;font-weight:950}.reports-card small{display:block;margin-top:7px;color:#64748b;font-weight:750}
        .reports-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.7fr);gap:18px}.reports-panel{padding:20px}
        .reports-panel-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:16px}.reports-panel h3{margin:0;color:#0f172a;font-weight:950}
        .reports-action-list{display:grid;gap:10px}.reports-action{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:14px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc}
        .reports-action strong{display:block;color:#0f172a}.reports-action span{display:block;color:#64748b;font-size:13px;font-weight:750}
        .reports-mini-btn{border:1px solid #cbd5e1;border-radius:8px;background:#fff;color:#0f172a;font-weight:900;min-height:36px;padding:0 12px}
        .reports-bars{display:grid;gap:10px}.reports-bar-row{display:grid;grid-template-columns:120px minmax(0,1fr) 34px;gap:10px;align-items:center;color:#334155;font-size:13px;font-weight:850}
        .reports-bar{height:10px;border-radius:999px;background:#e2e8f0;overflow:hidden}.reports-bar i{display:block;height:100%;border-radius:999px;background:#1d4ed8}
        .reports-empty{padding:28px;border:1px dashed #cbd5e1;border-radius:12px;background:#f8fafc;text-align:center;color:#64748b;font-weight:850}
        .reports-download-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}.reports-download-grid button{min-height:42px}
        @media(max-width:1100px){.reports-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.reports-grid{grid-template-columns:1fr}.reports-hero{align-items:flex-start;flex-direction:column}.reports-export-panel{width:100%}.reports-download-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
        @media(max-width:620px){.reports-kpis,.reports-range,.reports-export-actions,.reports-download-grid{grid-template-columns:1fr}.reports-bar-row{grid-template-columns:1fr}.reports-action{align-items:flex-start;flex-direction:column}}
      `}</style>

      <section className="reports-hero">
        <div>
          <p className="reports-eyebrow">Dynamic admin reports</p>
          <h2>Reports Center</h2>
          <p>Live HR summary for employees, attendance, tasks, leave, payroll, and reimbursements using current backend records.</p>
        </div>
        <div className="reports-export-panel">
          <div className="reports-range">
            <div>
              <label>From date</label>
              <Form.Control type="date" value={range.from} onChange={(event) => setRange({ ...range, from: event.target.value })} />
            </div>
            <div>
              <label>To date</label>
              <Form.Control type="date" value={range.to} onChange={(event) => setRange({ ...range, to: event.target.value })} />
            </div>
          </div>
          <div className="reports-export-actions">
            <Button variant="outline-primary" onClick={fetchReports} disabled={loading}><FaRedo /> Refresh</Button>
            <Button variant="success" onClick={exportAllCsv} disabled={loading}><FaFileCsv /> Export All CSV</Button>
          </div>
        </div>
      </section>

      {error && <Alert variant="danger">{error}</Alert>}
      {loading ? (
        <div className="reports-empty"><Spinner animation="border" size="sm" /> Loading reports...</div>
      ) : (
        <>
          <section className="reports-kpis">
            <div className="reports-card"><span><FaUsers /> Active Employees</span><strong>{summary.activeEmployees}</strong><small>{data.employees.length} total records</small></div>
            <div className="reports-card"><span><FaCalendarCheck /> Attendance Records</span><strong>{summary.attendanceRows}</strong><small>{summary.attendanceDays} tracked days</small></div>
            <div className="reports-card"><span><FaClipboardList /> Pending Tasks</span><strong>{summary.pendingTasks}</strong><small>{summary.completedTasks} completed</small></div>
            <div className="reports-card"><span><FaFileInvoiceDollar /> Payroll Total</span><strong>{formatMoney(summary.payrollTotal)}</strong><small>{data.salary.length} salary slips</small></div>
          </section>

          <section className="reports-panel">
            <div className="reports-panel-head">
              <div>
                <p className="reports-eyebrow">CSV downloads</p>
                <h3>Download range-wise reports</h3>
              </div>
              <span className="text-muted fw-bold">{range.from} to {range.to}</span>
            </div>
            <div className="reports-download-grid">
              <Button variant="outline-dark" onClick={() => exportCsv('summary')}><FaDownload /> Summary</Button>
              <Button variant="outline-dark" onClick={() => exportCsv('employees')}><FaDownload /> Employees</Button>
              <Button variant="outline-dark" onClick={exportAttendanceCsv}><FaDownload /> Attendance</Button>
              <Button variant="outline-dark" onClick={() => exportCsv('tasks')}><FaDownload /> Tasks</Button>
              <Button variant="outline-dark" onClick={() => exportCsv('leaves')}><FaDownload /> Leaves</Button>
              <Button variant="outline-dark" onClick={() => exportCsv('payroll')}><FaDownload /> Payroll</Button>
              <Button variant="outline-dark" onClick={() => exportCsv('reimbursements')}><FaDownload /> Claims</Button>
            </div>
          </section>

          <section className="reports-grid">
            <div className="reports-panel">
              <div className="reports-panel-head">
                <div>
                  <p className="reports-eyebrow">Quick report drill-down</p>
                  <h3>Open operational modules</h3>
                </div>
              </div>
              <div className="reports-action-list">
                {recentActivity.map(([title, detail, tab]) => (
                  <div className="reports-action" key={title}>
                    <div><strong>{title}</strong><span>{detail}</span></div>
                    <button className="reports-mini-btn" type="button" onClick={() => onNavigate?.(tab)}>Open</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="reports-panel">
              <div className="reports-panel-head">
                <div>
                  <p className="reports-eyebrow">People distribution</p>
                  <h3>Department strength</h3>
                </div>
                <FaChartPie />
              </div>
              <div className="reports-bars">
                {departmentRows.length ? departmentRows.map(([department, count]) => {
                  const percent = data.employees.length ? Math.round((count / data.employees.length) * 100) : 0;
                  return (
                    <div className="reports-bar-row" key={department}>
                      <span>{department}</span>
                      <div className="reports-bar"><i style={{ width: `${percent}%` }} /></div>
                      <strong>{count}</strong>
                    </div>
                  );
                }) : <div className="reports-empty">Department data not available.</div>}
              </div>
            </div>
          </section>

          <section className="reports-panel">
            <div className="reports-panel-head">
              <div>
                <p className="reports-eyebrow">Snapshot table</p>
                <h3>Module health</h3>
              </div>
            </div>
            <div className="table-responsive">
              <Table hover>
                <thead><tr><th>Module</th><th>Live Count</th><th>Attention Needed</th><th>Action</th></tr></thead>
                <tbody>
                  {recentActivity.map(([title, detail, tab]) => (
                    <tr key={`row-${title}`}>
                      <td>{title}</td>
                      <td>{detail}</td>
                      <td>{['Tasks', 'Leaves', 'Claims'].includes(title) ? 'Review pending items' : 'Monitor regularly'}</td>
                      <td><button className="reports-mini-btn" type="button" onClick={() => onNavigate?.(tab)}>Open {title}</button></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default AdminReportsCenter;
