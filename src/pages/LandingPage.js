import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowRight,
  FaCalendarCheck,
  FaCheck,
  FaClock,
  FaFileInvoiceDollar,
  FaShieldAlt,
  FaTasks,
  FaUsers,
} from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { usePublicData } from '../contexts/PublicDataContext';
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

const LandingPage = () => {
  const { siteData, loading, error } = usePublicData();
  const { brand, metrics, features, pricingPlans, settings } = siteData;
  const metricEntries = ['employees', 'attendanceToday', 'leaveRequests', 'tasks'];

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
