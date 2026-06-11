import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Alert } from 'react-bootstrap';

const EmployeeTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/teams`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setTeams(Array.isArray(res.data?.data) ? res.data.data : []);
      setError('');
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError(err.response?.data?.message || 'Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const formatTime = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatus = (value) => String(value || '').trim().toLowerCase();

  const allEmployees = useMemo(
    () => teams.flatMap((team) => (team.employees || []).map((employee) => ({ ...employee, teamName: team.teamName }))),
    [teams]
  );

  const stats = useMemo(() => {
    const activeNow = allEmployees.filter((employee) => employee.isActive).length;
    const totalTasks = allEmployees.reduce((sum, employee) => sum + (employee.todaysTasks?.length || 0), 0);
    const completedTasks = allEmployees.reduce(
      (sum, employee) => sum + (employee.todaysTasks || []).filter((task) => ['completed', 'done'].includes(getStatus(task.status))).length,
      0
    );
    const totalHours = allEmployees.reduce((sum, employee) => sum + (Number(employee.hoursWorked) || 0), 0);

    return {
      totalTeams: teams.length,
      totalEmployees: allEmployees.length,
      activeNow,
      inactiveNow: Math.max(allEmployees.length - activeNow, 0),
      totalTasks,
      completedTasks,
      totalHours,
    };
  }, [allEmployees, teams.length]);

  const filteredTeams = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return teams
      .map((team) => {
        const employees = (team.employees || []).filter((employee) => {
          const matchesQuery = !normalizedQuery || [
            team.teamName,
            employee.name,
            employee.employeeId,
            employee.position,
            employee.department,
          ].some((value) => String(value || '').toLowerCase().includes(normalizedQuery));

          const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && employee.isActive) ||
            (statusFilter === 'inactive' && !employee.isActive);

          return matchesQuery && matchesStatus;
        });

        return { ...team, employees };
      })
      .filter((team) => team.employees.length > 0 || (!normalizedQuery && statusFilter === 'all'));
  }, [query, statusFilter, teams]);

  return (
    <div className="teams-page">
      <style>
        {`
          .teams-page {
            color: #0f172a;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }
          .teams-hero,
          .teams-panel,
          .team-card,
          .team-member-card,
          .teams-kpi-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 0.85rem;
            box-shadow: 0 12px 30px rgba(15, 23, 42, 0.07);
          }
          .teams-hero {
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
          .teams-eyebrow,
          .team-eyebrow,
          .teams-kpi-label {
            margin: 0;
            color: #64748b;
            font-size: 0.76rem;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .teams-title {
            margin: 0.2rem 0 0;
            color: #0f172a;
            font-size: clamp(1.45rem, 3vw, 2.1rem);
            font-weight: 850;
            line-height: 1.15;
          }
          .teams-subtitle {
            margin: 0.45rem 0 0;
            color: #64748b;
            font-size: 0.95rem;
          }
          .teams-refresh-btn,
          .teams-filter-btn {
            border: 1px solid #bfdbfe;
            background: #ffffff;
            color: #1d4ed8;
            border-radius: 0.65rem;
            padding: 0.62rem 0.85rem;
            font-weight: 800;
            transition: all 0.2s ease;
          }
          .teams-refresh-btn:hover,
          .teams-filter-btn:hover,
          .teams-filter-btn.active {
            background: #eff6ff;
            border-color: #93c5fd;
            transform: translateY(-1px);
          }
          .teams-kpi-grid {
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 1rem;
          }
          .teams-kpi-card {
            padding: 1rem;
            position: relative;
            overflow: hidden;
          }
          .teams-kpi-card::after {
            content: '';
            position: absolute;
            right: -24px;
            top: -24px;
            width: 70px;
            height: 70px;
            border-radius: 50%;
            background: var(--accent, #dbeafe);
            opacity: 0.55;
          }
          .teams-kpi-value {
            margin: 0.35rem 0 0.15rem;
            color: #0f172a;
            font-size: 1.8rem;
            font-weight: 850;
          }
          .teams-kpi-note {
            margin: 0;
            color: #64748b;
            font-size: 0.86rem;
          }
          .teams-toolbar {
            display: grid;
            grid-template-columns: minmax(240px, 1fr) auto;
            gap: 0.75rem;
            align-items: center;
          }
          .teams-search {
            width: 100%;
            min-height: 44px;
            border: 1px solid #cbd5e1;
            border-radius: 0.75rem;
            background: #ffffff;
            color: #0f172a;
            padding: 0.65rem 0.85rem;
            font-weight: 700;
          }
          .teams-search:focus {
            outline: none;
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
          }
          .teams-filter-group {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
            justify-content: flex-end;
          }
          .teams-list {
            display: grid;
            gap: 1rem;
          }
          .team-card {
            padding: 1.1rem;
          }
          .team-card-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 1rem;
            margin-bottom: 1rem;
          }
          .team-title {
            margin: 0.18rem 0 0;
            color: #0f172a;
            font-size: 1.18rem;
            font-weight: 850;
          }
          .team-meta {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
            justify-content: flex-end;
          }
          .teams-pill {
            border: 1px solid #dbeafe;
            border-radius: 999px;
            background: #ffffff;
            color: #1e40af;
            padding: 0.38rem 0.65rem;
            font-size: 0.8rem;
            font-weight: 800;
            white-space: nowrap;
          }
          .team-member-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 0.9rem;
          }
          .team-member-card {
            padding: 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.85rem;
          }
          .team-member-head {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            min-width: 0;
          }
          .team-avatar {
            width: 52px;
            height: 52px;
            border-radius: 16px;
            background: linear-gradient(135deg, #2563eb, #14b8a6);
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            overflow: hidden;
            flex: 0 0 auto;
            box-shadow: 0 12px 24px rgba(37, 99, 235, 0.16);
          }
          .team-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .team-member-name,
          .team-member-role {
            display: block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .team-member-name {
            color: #0f172a;
            font-size: 0.98rem;
            font-weight: 850;
          }
          .team-member-role {
            color: #64748b;
            font-size: 0.82rem;
            margin-top: 0.12rem;
          }
          .team-status-row {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
          }
          .team-status {
            border-radius: 999px;
            padding: 0.35rem 0.62rem;
            font-size: 0.75rem;
            font-weight: 850;
            text-transform: capitalize;
          }
          .team-status.active,
          .team-status.completed,
          .team-status.done {
            color: #047857;
            background: #d1fae5;
          }
          .team-status.inactive,
          .team-status.pending {
            color: #92400e;
            background: #fef3c7;
          }
          .team-status.rejected,
          .team-status.urgent,
          .team-status.high {
            color: #b91c1c;
            background: #fee2e2;
          }
          .team-metrics {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.55rem;
          }
          .team-metric {
            border: 1px solid #e2e8f0;
            border-radius: 0.65rem;
            background: #f8fafc;
            padding: 0.65rem;
          }
          .team-metric span {
            display: block;
            color: #64748b;
            font-size: 0.72rem;
            font-weight: 800;
            text-transform: uppercase;
          }
          .team-metric strong {
            display: block;
            color: #0f172a;
            font-size: 0.9rem;
            margin-top: 0.18rem;
            word-break: break-word;
          }
          .team-task-list {
            display: grid;
            gap: 0.45rem;
          }
          .team-task-row {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 0.5rem;
            align-items: center;
            border: 1px solid #e2e8f0;
            border-radius: 0.62rem;
            background: #ffffff;
            padding: 0.55rem;
            color: #334155;
            font-size: 0.82rem;
            font-weight: 700;
          }
          .team-task-title {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .teams-empty {
            min-height: 170px;
            border: 1px dashed #cbd5e1;
            border-radius: 0.85rem;
            background: #f8fafc;
            color: #64748b;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 1rem;
            font-weight: 700;
          }
          @media (max-width: 1200px) {
            .team-member-grid,
            .teams-kpi-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }
          @media (max-width: 768px) {
            .teams-hero,
            .team-card-header {
              flex-direction: column;
              align-items: flex-start;
            }
            .teams-toolbar {
              grid-template-columns: 1fr;
            }
            .teams-filter-group,
            .team-meta {
              justify-content: flex-start;
            }
            .team-member-grid,
            .teams-kpi-grid {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      <section className="teams-hero">
        <div>
          <p className="teams-eyebrow">Team operations</p>
          <h3 className="teams-title">Employee Teams</h3>
          <p className="teams-subtitle">Live team grouping with today's attendance, working hours, and assigned tasks.</p>
        </div>
        <button type="button" className="teams-refresh-btn" onClick={fetchTeams} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </section>

      {error && <Alert variant="danger">{error}</Alert>}

      <section className="teams-kpi-grid">
        <div className="teams-kpi-card" style={{ '--accent': '#bfdbfe' }}>
          <p className="teams-kpi-label">Teams</p>
          <h4 className="teams-kpi-value">{stats.totalTeams}</h4>
          <p className="teams-kpi-note">Dynamic groups</p>
        </div>
        <div className="teams-kpi-card" style={{ '--accent': '#bae6fd' }}>
          <p className="teams-kpi-label">Employees</p>
          <h4 className="teams-kpi-value">{stats.totalEmployees}</h4>
          <p className="teams-kpi-note">Active records</p>
        </div>
        <div className="teams-kpi-card" style={{ '--accent': '#bbf7d0' }}>
          <p className="teams-kpi-label">Punched In</p>
          <h4 className="teams-kpi-value">{stats.activeNow}</h4>
          <p className="teams-kpi-note">{stats.inactiveNow} not punched in</p>
        </div>
        <div className="teams-kpi-card" style={{ '--accent': '#fed7aa' }}>
          <p className="teams-kpi-label">Today's Tasks</p>
          <h4 className="teams-kpi-value">{stats.totalTasks}</h4>
          <p className="teams-kpi-note">{stats.completedTasks} completed</p>
        </div>
        <div className="teams-kpi-card" style={{ '--accent': '#fecdd3' }}>
          <p className="teams-kpi-label">Hours</p>
          <h4 className="teams-kpi-value">{stats.totalHours.toFixed(1)}</h4>
          <p className="teams-kpi-note">Tracked today</p>
        </div>
      </section>

      <section className="teams-toolbar">
        <input
          className="teams-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search team, employee, ID, department, or position"
        />
        <div className="teams-filter-group" aria-label="Team status filters">
          {['all', 'active', 'inactive'].map((filter) => (
            <button
              key={filter}
              type="button"
              className={`teams-filter-btn ${statusFilter === filter ? 'active' : ''}`}
              onClick={() => setStatusFilter(filter)}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="teams-empty">Loading team data...</div>
      ) : filteredTeams.length ? (
        <section className="teams-list">
          {filteredTeams.map((team, index) => {
            const employees = team.employees || [];
            const activeCount = employees.filter((employee) => employee.isActive).length;
            const taskCount = employees.reduce((sum, employee) => sum + (employee.todaysTasks?.length || 0), 0);
            const teamHours = employees.reduce((sum, employee) => sum + (Number(employee.hoursWorked) || 0), 0);

            return (
              <article key={team.teamName || index} className="team-card animate__animated animate__fadeInUp" style={{ animationDelay: `${0.05 * index}s` }}>
                <div className="team-card-header">
                  <div>
                    <p className="team-eyebrow">Team</p>
                    <h4 className="team-title">{team.teamName || 'No Team'}</h4>
                  </div>
                  <div className="team-meta">
                    <span className="teams-pill">{employees.length} members</span>
                    <span className="teams-pill">{activeCount} punched in</span>
                    <span className="teams-pill">{teamHours.toFixed(1)} hrs</span>
                    <span className="teams-pill">{taskCount} tasks</span>
                  </div>
                </div>

                {employees.length ? (
                  <div className="team-member-grid">
                    {employees.map((employee) => (
                      <div key={employee._id} className="team-member-card">
                        <div className="team-member-head">
                          <div className="team-avatar">
                            {employee.profilePhoto ? (
                              <img src={employee.profilePhoto} alt={employee.name || 'Employee'} />
                            ) : (
                              (employee.name || 'U')[0].toUpperCase()
                            )}
                          </div>
                          <div className="min-width-0">
                            <strong className="team-member-name">{employee.name || 'N/A'}</strong>
                            <span className="team-member-role">{employee.position || employee.department || 'Team member'}</span>
                          </div>
                        </div>

                        <div className="team-status-row">
                          <span className={`team-status ${employee.isActive ? 'active' : 'inactive'}`}>
                            {employee.isActive ? 'Punched in' : 'Not punched in'}
                          </span>
                          {employee.attendanceStatus && (
                            <span className={`team-status ${getStatus(employee.attendanceStatus)}`}>
                              {employee.attendanceStatus}
                            </span>
                          )}
                        </div>

                        <div className="team-metrics">
                          <div className="team-metric"><span>Employee ID</span><strong>{employee.employeeId || 'N/A'}</strong></div>
                          <div className="team-metric"><span>Hours</span><strong>{(Number(employee.hoursWorked) || 0).toFixed(2)} hrs</strong></div>
                          <div className="team-metric"><span>Punch In</span><strong>{formatTime(employee.punchIn)}</strong></div>
                          <div className="team-metric"><span>Punch Out</span><strong>{formatTime(employee.punchOut)}</strong></div>
                        </div>

                        {employee.todaysTasks?.length ? (
                          <div className="team-task-list">
                            {employee.todaysTasks.slice(0, 3).map((task, taskIndex) => (
                              <div className="team-task-row" key={`${employee._id}-${task.title}-${taskIndex}`}>
                                <span className="team-task-title">{task.title || 'Untitled task'}</span>
                                <span className={`team-status ${getStatus(task.priority || task.status)}`}>
                                  {task.priority || task.status || 'Task'}
                                </span>
                              </div>
                            ))}
                            {employee.todaysTasks.length > 3 && (
                              <div className="team-task-row">
                                <span className="team-task-title">More tasks</span>
                                <span className="team-status pending">+{employee.todaysTasks.length - 3}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="teams-empty" style={{ minHeight: '64px' }}>No tasks assigned today.</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="teams-empty">No employees found in this team.</div>
                )}
              </article>
            );
          })}
        </section>
      ) : (
        <div className="teams-empty">No teams match the selected search or status filter.</div>
      )}
    </div>
  );
};

export default EmployeeTeams;
