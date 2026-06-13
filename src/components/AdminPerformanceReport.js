import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Form, Spinner, Table } from 'react-bootstrap';
import { FaAward, FaCalendarAlt, FaChartLine, FaGem, FaMedal, FaSearch, FaTrophy, FaUsers } from 'react-icons/fa';
import api from '../utils/axios';

const getBadgeIcon = (tier) => {
  const value = String(tier || '').toLowerCase();
  if (value === 'diamond') return <FaGem />;
  if (value === 'gold') return <FaTrophy />;
  if (value === 'silver') return <FaMedal />;
  return <FaAward />;
};

const scoreTone = (score) => {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'strong';
  if (score >= 70) return 'steady';
  return 'watch';
};

const AdminPerformanceReport = () => {
  const [performance, setPerformance] = useState({});
  const [selectedMonth, setSelectedMonth] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);

  const employees = useMemo(() => performance.employees || [], [performance]);
  const filteredEmployees = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return employees;
    return employees.filter((employee) => {
      const haystack = `${employee.name || ''} ${employee.employeeId || ''} ${employee.position || ''} ${employee.department || ''} ${employee.badge || ''}`.toLowerCase();
      return haystack.includes(value);
    });
  }, [employees, search]);

  const summary = useMemo(() => {
    const total = employees.length;
    const averageScore = total ? Math.round(employees.reduce((sum, employee) => sum + Number(employee.score || 0), 0) / total) : 0;
    const completedTasks = employees.reduce((sum, employee) => sum + Number(employee.completedTasks || 0), 0);
    const attendance = employees.reduce((sum, employee) => sum + Number(employee.approvedAttendance || 0), 0);
    const certificates = employees.reduce((sum, employee) => sum + Number(employee.certificates || 0), 0);
    const badgeCounts = employees.reduce((acc, employee) => {
      const tier = employee.badgeTier || 'bronze';
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {});
    const departments = employees.reduce((acc, employee) => {
      const key = employee.department || 'Operations';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      averageScore,
      completedTasks,
      attendance,
      certificates,
      badgeCounts,
      departments: Object.entries(departments).sort((a, b) => b[1] - a[1]).slice(0, 6),
    };
  }, [employees]);

  const fetchPerformance = async (month) => {
    setLoading(true);
    setError('');
    setEmailStatus(null);
    try {
      const response = await api.get('/performance/monthly', { params: month ? { month } : {} });
      const data = response.data?.data || {};
      setPerformance(data);
      setSelectedMonth(data.month || month || '');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load monthly performance report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  const handleMonthChange = (event) => {
    fetchPerformance(event.target.value);
  };

  const sendMonthlyEmails = async () => {
    setEmailSending(true);
    setEmailStatus(null);
    try {
      const response = await api.post('/performance/monthly-email', { month: selectedMonth });
      const data = response.data?.data || {};
      setEmailStatus({
        type: data.failed ? 'warning' : 'success',
        message: response.data?.message || `Monthly emails processed for ${performance.monthLabel || selectedMonth}.`,
      });
    } catch (err) {
      setEmailStatus({
        type: 'danger',
        message: err.response?.data?.message || 'Unable to send monthly performance emails.',
      });
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div className="admin-performance-report">
      <style>{`
        .admin-performance-report{display:grid;gap:20px}
        .performance-hero,.performance-panel,.performance-card{border:1px solid #e2e8f0;border-radius:14px;background:#fff;box-shadow:0 18px 42px rgba(15,23,42,.08)}
        .performance-hero{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,.45fr);gap:20px;align-items:center;padding:26px;background:linear-gradient(135deg,#fff,#f0fdfa)}
        .performance-eyebrow{margin:0 0 8px;color:#0f766e;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}
        .performance-hero h2{margin:0;color:#0f172a;font-size:clamp(28px,4vw,44px);font-weight:950;line-height:1.05}
        .performance-hero p{margin:12px 0 0;color:#475569;font-weight:650;line-height:1.7}
        .performance-controls{display:grid;gap:12px;padding:16px;border:1px solid #dbe3ef;border-radius:12px;background:#fff}
        .performance-field{display:grid;gap:7px}.performance-field label{color:#334155;font-weight:900;font-size:13px}
        .performance-email-button{display:flex;align-items:center;justify-content:center;gap:8px;border:0;border-radius:12px;background:#0f766e;color:#fff;font-weight:900;padding:12px 14px;box-shadow:0 14px 28px rgba(15,118,110,.18)}
        .performance-email-button:hover,.performance-email-button:focus{background:#115e59;color:#fff}
        .performance-search{position:relative}.performance-search svg{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:#0f766e}.performance-search input{padding-left:38px}
        .performance-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
        .performance-kpi{padding:18px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;box-shadow:0 12px 28px rgba(15,23,42,.06)}
        .performance-kpi span{display:flex;align-items:center;gap:8px;color:#64748b;font-size:12px;font-weight:900;text-transform:uppercase}.performance-kpi svg{color:#0f766e}
        .performance-kpi strong{display:block;margin-top:9px;color:#0f172a;font-size:30px;font-weight:950;line-height:1}
        .performance-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(300px,.85fr);gap:18px}
        .performance-panel{padding:20px}.performance-panel-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:16px}
        .performance-panel h3{margin:0;color:#0f172a;font-weight:950}.performance-pill{display:inline-flex;align-items:center;border-radius:999px;background:#ecfeff;color:#0f766e;padding:7px 11px;font-size:12px;font-weight:900}
        .performance-rank-list{display:grid;gap:12px}.performance-card{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:14px;align-items:center;padding:14px;box-shadow:none}
        .performance-rank{width:44px;height:44px;display:grid;place-items:center;border-radius:12px;background:#0f172a;color:#fff;font-weight:950}
        .performance-avatar{width:54px;height:54px;display:grid;place-items:center;border-radius:12px;background:#ccfbf1;color:#0f766e;font-size:22px;font-weight:950;overflow:hidden}.performance-avatar img{width:100%;height:100%;object-fit:cover}
        .performance-person{display:flex;gap:12px;align-items:center;min-width:0}.performance-person h4{margin:0;color:#0f172a;font-weight:950}.performance-person p{margin:4px 0 0;color:#64748b;font-size:13px;font-weight:750}
        .performance-badge{display:inline-flex;align-items:center;gap:7px;margin-top:7px;border-radius:999px;padding:5px 9px;font-size:11px;font-weight:950;text-transform:uppercase}
        .performance-badge.diamond{background:#ecfeff;color:#0e7490}.performance-badge.gold{background:#fef3c7;color:#92400e}.performance-badge.silver{background:#f8fafc;color:#475569}.performance-badge.bronze{background:#fff7ed;color:#9a3412}
        .performance-score{text-align:right}.performance-score strong{display:block;font-size:30px;line-height:1;font-weight:950}.performance-score.excellent strong{color:#0e7490}.performance-score.strong strong{color:#0f766e}.performance-score.steady strong{color:#b45309}.performance-score.watch strong{color:#be123c}.performance-score span{color:#64748b;font-size:12px;font-weight:850}
        .performance-breakdown{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:12px}.performance-breakdown span{border-radius:10px;background:#f8fafc;padding:8px;color:#64748b;font-size:12px;font-weight:850}.performance-breakdown strong{display:block;color:#0f172a;font-size:16px}
        .performance-side-grid{display:grid;gap:18px}.performance-bars{display:grid;gap:10px}.performance-bar-row{display:grid;grid-template-columns:88px minmax(0,1fr) 34px;gap:10px;align-items:center;color:#334155;font-size:13px;font-weight:850}.performance-bar{height:10px;border-radius:999px;background:#e2e8f0;overflow:hidden}.performance-bar i{display:block;height:100%;border-radius:999px;background:#0f766e}
        .performance-table{margin:0}.performance-table th{color:#64748b;font-size:12px;text-transform:uppercase}.performance-table td{vertical-align:middle;color:#334155;font-weight:700}
        .performance-empty{padding:28px;border:1px dashed #cbd5e1;border-radius:12px;background:#f8fafc;color:#64748b;font-weight:850;text-align:center}
        @media(max-width:1100px){.performance-hero,.performance-grid{grid-template-columns:1fr}.performance-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:640px){.performance-kpis,.performance-breakdown{grid-template-columns:1fr}.performance-card{grid-template-columns:1fr}.performance-score{text-align:left}.performance-panel-head{display:block}.performance-bar-row{grid-template-columns:1fr}.performance-rank{width:38px;height:38px}}
      `}</style>

      <section className="performance-hero">
        <div>
          <p className="performance-eyebrow">Monthly performance report</p>
          <h2>{performance.monthLabel || 'Current month'} employee performance tracking</h2>
          <p>
            This admin report uses the same live performance logic as the public page, with employee-level score,
            attendance, tasks, leave discipline, certificates, badges, and ranking in one dynamic view.
          </p>
        </div>
        <div className="performance-controls">
          <div className="performance-field">
            <label>Report month</label>
            <Form.Select value={selectedMonth} onChange={handleMonthChange} disabled={loading}>
              {(performance.availableMonths || []).map((month) => (
                <option key={month.key} value={month.key}>{month.label}</option>
              ))}
            </Form.Select>
          </div>
          <div className="performance-field">
            <label>Search employee</label>
            <div className="performance-search">
              <FaSearch />
              <Form.Control value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, ID, department, badge" />
            </div>
          </div>
          <Button className="performance-email-button" onClick={sendMonthlyEmails} disabled={loading || emailSending || !selectedMonth}>
            {emailSending ? <Spinner animation="border" size="sm" /> : <FaAward />}
            {emailSending ? 'Sending emails...' : 'Email monthly reports'}
          </Button>
        </div>
      </section>

      {error && <Alert variant="danger">{error}</Alert>}
      {emailStatus && <Alert variant={emailStatus.type}>{emailStatus.message}</Alert>}
      {loading ? (
        <div className="performance-empty"><Spinner animation="border" size="sm" /> Loading monthly performance...</div>
      ) : (
        <>
          <section className="performance-kpis">
            <div className="performance-kpi"><span><FaUsers /> Employees ranked</span><strong>{summary.total}</strong></div>
            <div className="performance-kpi"><span><FaChartLine /> Average score</span><strong>{summary.averageScore}</strong></div>
            <div className="performance-kpi"><span><FaCalendarAlt /> Attendance</span><strong>{summary.attendance}</strong></div>
            <div className="performance-kpi"><span><FaTrophy /> Completed tasks</span><strong>{summary.completedTasks}</strong></div>
          </section>

          <section className="performance-grid">
            <div className="performance-panel">
              <div className="performance-panel-head">
                <div>
                  <p className="performance-eyebrow">Ranked employees</p>
                  <h3>{filteredEmployees.length} employee records</h3>
                </div>
                <span className="performance-pill">{performance.monthLabel || selectedMonth}</span>
              </div>
              {filteredEmployees.length ? (
                <div className="performance-rank-list">
                  {filteredEmployees.map((employee) => (
                    <article className="performance-card" key={employee.employeeId || employee.name}>
                      <div className="performance-rank">#{employee.rank}</div>
                      <div>
                        <div className="performance-person">
                          <div className="performance-avatar">
                            {employee.profilePhoto ? <img src={employee.profilePhoto} alt={employee.name} /> : String(employee.name || 'E').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4>{employee.name || 'Employee'}</h4>
                            <p>{employee.employeeId || 'N/A'} | {employee.position || 'Team Member'} | {employee.department || 'Operations'}</p>
                            <span className={`performance-badge ${employee.badgeTier || 'bronze'}`}>{getBadgeIcon(employee.badgeTier)} {employee.badge}</span>
                          </div>
                        </div>
                        <div className="performance-breakdown">
                          <span>Attendance <strong>{employee.attendanceScore || 0}</strong></span>
                          <span>Tasks <strong>{employee.taskScore || 0}</strong></span>
                          <span>Leave <strong>{employee.leaveScore || 0}</strong></span>
                        </div>
                      </div>
                      <div className={`performance-score ${scoreTone(employee.score)}`}>
                        <strong>{employee.score}</strong>
                        <span>score</span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="performance-empty">No employee performance records match this search.</div>
              )}
            </div>

            <div className="performance-side-grid">
              <div className="performance-panel">
                <div className="performance-panel-head">
                  <div>
                    <p className="performance-eyebrow">Badge distribution</p>
                    <h3>Performance badges</h3>
                  </div>
                </div>
                <div className="performance-bars">
                  {['diamond', 'gold', 'silver', 'bronze'].map((tier) => {
                    const count = summary.badgeCounts[tier] || 0;
                    const percent = summary.total ? Math.round((count / summary.total) * 100) : 0;
                    return (
                      <div className="performance-bar-row" key={tier}>
                        <span>{tier}</span>
                        <div className="performance-bar"><i style={{ width: `${percent}%` }} /></div>
                        <strong>{count}</strong>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="performance-panel">
                <div className="performance-panel-head">
                  <div>
                    <p className="performance-eyebrow">Department spread</p>
                    <h3>Ranked employees by team</h3>
                  </div>
                </div>
                <div className="performance-bars">
                  {summary.departments.map(([department, count]) => {
                    const percent = summary.total ? Math.round((count / summary.total) * 100) : 0;
                    return (
                      <div className="performance-bar-row" key={department}>
                        <span>{department}</span>
                        <div className="performance-bar"><i style={{ width: `${percent}%` }} /></div>
                        <strong>{count}</strong>
                      </div>
                    );
                  })}
                  {!summary.departments.length && <div className="performance-empty">Department data is not available.</div>}
                </div>
              </div>

              <div className="performance-panel">
                <div className="performance-panel-head">
                  <div>
                    <p className="performance-eyebrow">Operational totals</p>
                    <h3>Month activity</h3>
                  </div>
                </div>
                <div className="table-responsive">
                  <Table className="performance-table">
                    <tbody>
                      <tr><td>Completed Tasks</td><td>{summary.completedTasks}</td></tr>
                      <tr><td>Approved Attendance</td><td>{summary.attendance}</td></tr>
                      <tr><td>Valid Certificates</td><td>{summary.certificates}</td></tr>
                      <tr><td>Top Employee</td><td>{employees[0]?.name || 'N/A'}</td></tr>
                    </tbody>
                  </Table>
                </div>
              </div>
            </div>
          </section>

          <section className="performance-panel">
            <div className="performance-panel-head">
              <div>
                <p className="performance-eyebrow">Detailed report</p>
                <h3>Employee-wise score table</h3>
              </div>
              <span className="performance-pill">{filteredEmployees.length} rows</span>
            </div>
            <div className="table-responsive">
              <Table className="performance-table table-hover">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Employee</th>
                    <th>Badge</th>
                    <th>Score</th>
                    <th>Attendance</th>
                    <th>Tasks</th>
                    <th>Leave</th>
                    <th>Certificates</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr key={`row-${employee.employeeId || employee.name}`}>
                      <td>#{employee.rank}</td>
                      <td>{employee.name} ({employee.employeeId || 'N/A'})</td>
                      <td>{employee.badge}</td>
                      <td>{employee.score}</td>
                      <td>{employee.approvedAttendance || 0} / {employee.attendanceScore || 0}</td>
                      <td>{employee.completedTasks || 0} / {employee.taskScore || 0}</td>
                      <td>{employee.leaveScore || 0}</td>
                      <td>{employee.certificates || 0}</td>
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

export default AdminPerformanceReport;
