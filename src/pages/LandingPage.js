import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowRight,
  FaAward,
  FaCalendarCheck,
  FaCheck,
  FaClock,
  FaFileInvoiceDollar,
  FaGem,
  FaMedal,
  FaShieldAlt,
  FaTasks,
  FaTrophy,
  FaUsers,
} from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { usePublicData } from '../contexts/PublicDataContext';
import api from '../utils/axios';
import './PublicPage.css';

const metricLabel = {
  employees: 'Active employees',
  attendanceToday: 'Attendance today',
  leaveRequests: 'Leave records',
  tasks: 'Tasks tracked',
};

const iconMap = [FaCalendarCheck, FaUsers, FaFileInvoiceDollar, FaTasks];

const workflowSteps = [
  {
    title: 'Employees start the day',
    detail: 'Punch-in, profile access, leave requests, and self-service records stay available from the employee portal.',
  },
  {
    title: 'Admins control operations',
    detail: 'HR teams review attendance, approve requests, assign tasks, and keep employee records accurate.',
  },
  {
    title: 'Documents stay ready',
    detail: 'Salary slips, offer letters, relieving letters, and operational reports use connected employee data.',
  },
];

const getBadgeIcon = (performer) => {
  const tier = String(performer.badgeTier || '').toLowerCase();
  if (tier === 'diamond') return <FaGem />;
  if (tier === 'gold') return <FaTrophy />;
  if (tier === 'silver') return <FaMedal />;
  if (tier === 'bronze') return <FaAward />;
  return Number(performer.rank) === 1 ? <FaTrophy /> : <FaAward />;
};

const LandingPage = () => {
  const { siteData, loading, error } = usePublicData();
  const { brand, metrics, features, pricingPlans, settings, performance } = siteData;
  const [performanceData, setPerformanceData] = useState(performance || {});
  const [selectedMonth, setSelectedMonth] = useState(performance?.month || '');
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [performanceError, setPerformanceError] = useState('');
  const metricEntries = ['employees', 'attendanceToday', 'leaveRequests', 'tasks'];
  const employees = useMemo(() => performanceData?.employees || [], [performanceData]);
  const hasPerformanceMonths = (performanceData?.availableMonths || []).length > 0;

  useEffect(() => {
    if (!performance?.month && !performance?.employees?.length) return;
    setPerformanceData(performance);
    setSelectedMonth(performance.month || '');
  }, [performance]);

  const handleMonthChange = async (event) => {
    const month = event.target.value;
    setSelectedMonth(month);
    setPerformanceLoading(true);
    setPerformanceError('');

    try {
      const response = await api.get('/public/performance', { params: { month } });
      setPerformanceData(response.data?.data || {});
    } catch (err) {
      setPerformanceError(err.response?.data?.message || 'Unable to load monthly performance');
    } finally {
      setPerformanceLoading(false);
    }
  };

  return (
    <div className="public-page">
      <Navbar darkMode={settings?.theme === 'dark'} />
      <main>
        <section className="landing-hero">
          <div className="public-page__inner landing-hero__grid">
            <div className="landing-hero__copy">
              <span className="public-page__eyebrow">Live HR Portal</span>
              <h1>{brand.name} built for clean daily HR operations.</h1>
              <p>
                {brand.tagline} Manage attendance, leave, salary documents, employee records,
                task ownership, and support workflows from one connected system.
              </p>
              <div className="landing-hero__actions">
                <Link className="public-button primary landing-button" to="/login">
                  Login to Portal <FaArrowRight />
                </Link>
                <Link className="public-button landing-button" to="/pricing">View Pricing</Link>
              </div>
              <div className="landing-hero__badges">
                <span><FaShieldAlt /> Role-based access</span>
                <span><FaClock /> Live settings</span>
                <span><FaFileInvoiceDollar /> HR documents</span>
              </div>
              {loading && <p className="public-page__notice">Loading live public data...</p>}
              {error && <p className="public-page__notice">{error}</p>}
            </div>

            <aside className="landing-dashboard" aria-label="Live HR dashboard preview">
              <div className="landing-dashboard__top">
                <div>
                  <span>Today</span>
                  <h2>Operations Overview</h2>
                </div>
                <strong>Live</strong>
              </div>
              <div className="landing-dashboard__metrics">
                {metricEntries.map((key) => (
                  <div className="landing-dashboard__metric" key={key}>
                    <strong>{Number(metrics?.[key] || 0).toLocaleString('en-IN')}</strong>
                    <span>{metricLabel[key]}</span>
                  </div>
                ))}
              </div>
              <div className="landing-dashboard__chart">
                {[44, 72, 58, 86, 64, 78, 92].map((height, index) => (
                  <span key={height + index} style={{ height: `${height}%` }} />
                ))}
              </div>
              <div className="landing-dashboard__activity">
                <span><FaCalendarCheck /> Attendance window: {settings?.workStartTime || '09:00'} - {settings?.workEndTime || '18:00'}</span>
                <span><FaTasks /> Task and leave records synced from backend</span>
              </div>
            </aside>
          </div>
        </section>

        <section className="public-page__body">
          <div className="public-page__inner">
            <div className="landing-section-heading">
              <span>Platform modules</span>
              <h2>Everything your HR team needs, connected properly.</h2>
            </div>

            <div className="landing-feature-grid">
              {(features || []).slice(0, 6).map((feature, index) => {
                const Icon = iconMap[index % iconMap.length];
                return (
                  <article className="landing-feature-card" key={feature.title}>
                    <span><Icon /></span>
                    <small>{feature.metric}</small>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </article>
                );
              })}
            </div>

            {hasPerformanceMonths && (
              <section className="landing-performers" id="monthly-performance">
                <div className="landing-section-heading landing-performance-heading">
                  <div>
                    <span>Monthly performance</span>
                    <h2>Eligible employees ranked for {performanceData.monthLabel || 'this month'}.</h2>
                    <p>Only employees who joined on or before this month are shown. Score is calculated from monthly attendance quality, task completion, leave discipline, and valid HR certificates.</p>
                  </div>
                  <label className="landing-month-select">
                    <span>View month</span>
                    <select value={selectedMonth} onChange={handleMonthChange}>
                      {(performanceData.availableMonths || []).map((month) => (
                        <option key={month.key} value={month.key}>{month.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
                {performanceError && <p className="public-page__notice">{performanceError}</p>}
                {performanceLoading && <p className="public-page__notice">Loading monthly performance...</p>}
                {employees.length > 0 ? (
                  <div className="landing-performer-grid">
                    {employees.map((performer) => (
                      <article className={`landing-performer-card rank-${performer.rank}`} key={performer.employeeId || performer.name}>
                        <div className="landing-performer-rank">#{performer.rank}</div>
                        <div className="landing-performer-photo">
                          {performer.profilePhoto ? (
                            <img src={performer.profilePhoto} alt={performer.name} />
                          ) : (
                            <span>{String(performer.name || 'E').charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="landing-performer-info">
                          <small className={`landing-performer-badge badge-${performer.badgeTier || 'bronze'}`}>
                            {getBadgeIcon(performer)}
                            {performer.badge}
                          </small>
                          <h3>{performer.name}</h3>
                          <p>{performer.position} | {performer.department}</p>
                          {performer.joiningMonthLabel && (
                            <p className="landing-performer-joining">Performance visible from {performer.joiningMonthLabel}</p>
                          )}
                        </div>
                        <div className="landing-performer-score">
                          <strong>{performer.score}</strong>
                          <span>Performance score</span>
                        </div>
                        <div className="landing-performer-stats">
                          <span><strong>{performer.completedTasks || 0}</strong> tasks</span>
                          <span><strong>{performer.approvedAttendance || 0}</strong> attendance</span>
                          <span><strong>{performer.certificates || 0}</strong> certificates</span>
                        </div>
                        <div className="landing-score-breakdown">
                          <span>Attendance <strong>{performer.attendanceScore || 0}</strong></span>
                          <span>Tasks <strong>{performer.taskScore || 0}</strong></span>
                          <span>Leave <strong>{performer.leaveScore || 0}</strong></span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="landing-performance-empty">
                    No employees are eligible for {performanceData.monthLabel || 'this month'} because their joining month is later.
                  </div>
                )}
              </section>
            )}

            <section className="landing-workflow">
              <div className="landing-section-heading align-left">
                <span>Daily workflow</span>
                <h2>From first punch-in to final report, the flow stays visible.</h2>
              </div>
              <div className="landing-workflow__steps">
                {workflowSteps.map((step, index) => (
                  <article key={step.title}>
                    <strong>{String(index + 1).padStart(2, '0')}</strong>
                    <h3>{step.title}</h3>
                    <p>{step.detail}</p>
                  </article>
                ))}
              </div>
            </section>

            <div className="landing-insight-grid">
              <article className="landing-insight-card is-primary">
                <h2>Configured Working Policy</h2>
                <p>
                  Work timing is live from backend settings: {settings?.workStartTime || '09:00'} to {settings?.workEndTime || '18:00'}.
                  Working days: {(settings?.workingDays || []).join(', ')}.
                </p>
              </article>
              <article className="landing-insight-card">
                <h2>Why Teams Choose It</h2>
                <ul className="public-list">
                  <li><FaCheck /> Admin and employee portals are connected.</li>
                  <li><FaCheck /> Attendance, leave, salary documents, and tasks use backend data.</li>
                  <li><FaCheck /> Public pages now load from one API contract.</li>
                </ul>
              </article>
            </div>

            <div className="landing-insight-grid">
              <article className="landing-insight-card">
                <h2>Daily HR Workflow</h2>
                <p>
                  Start the day with attendance visibility, handle employee requests during the day,
                  assign work from the admin portal, and keep salary/document workflows ready when needed.
                </p>
                <ul className="public-list">
                  <li>Employees punch in, request leave, and view their own records.</li>
                  <li>Admins approve requests, monitor late attendance, and manage teams.</li>
                  <li>HR can generate documents using connected employee data.</li>
                </ul>
              </article>
              <article className="landing-insight-card is-dark">
                <h2>Professional Public Website</h2>
                <p>
                  Public pages now use dynamic backend content for product, company, legal, support,
                  community, integrations, API, and status pages, keeping the website consistent with the portal.
                </p>
                <ul className="public-list">
                  <li>One public content endpoint for all website pages.</li>
                  <li>Live aggregate metrics from backend collections.</li>
                  <li>Reusable responsive layout for every route.</li>
                </ul>
              </article>
            </div>

            <div className="landing-section-heading">
              <span>Plans</span>
              <h2>Start small, then scale your HR operations.</h2>
            </div>

            <div className="landing-pricing-strip">
              {(pricingPlans || []).slice(0, 3).map((plan) => (
                <article className="landing-price-card" key={plan.name}>
                  {plan.popular && <span className="public-card__popular">Most popular</span>}
                  <h3>{plan.name}</h3>
                  <p>{plan.description}</p>
                  <div className="public-price">
                    <strong>{plan.price}</strong>
                    <span>{plan.period}</span>
                  </div>
                  <Link className={`public-button ${plan.popular ? 'primary' : ''}`} to="/pricing">Compare Plan</Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer darkMode={settings?.theme === 'dark'} />
    </div>
  );
};

export default LandingPage;
