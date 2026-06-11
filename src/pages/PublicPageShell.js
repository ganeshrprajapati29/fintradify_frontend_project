import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { usePublicData } from '../contexts/PublicDataContext';
import './PublicPage.css';

const formatNumber = (value) => {
  if (typeof value === 'string') return value;
  return Number(value || 0).toLocaleString('en-IN');
};

const PublicPageShell = ({ page, children, showMetrics = true }) => {
  const { siteData, loading, error } = usePublicData();
  const [darkMode] = useState(siteData.settings?.theme === 'dark');
  const metrics = siteData.metrics || {};

  return (
    <div className="public-page">
      <Navbar darkMode={darkMode} />
      <main>
        <section className="public-page__hero">
          <div className="public-page__inner public-page__hero-grid">
            <div>
              <span className="public-page__eyebrow">{page.eyebrow || 'Fintradify'}</span>
              <h1>{page.title}</h1>
              <p className="public-page__summary">{page.summary}</p>
              <div className="public-page__actions">
                <Link className="public-button primary" to="/login">Open Portal</Link>
                <Link className="public-button" to="/contact">Talk to Sales</Link>
              </div>
              {page.updatedAt && <p className="public-page__notice">Last updated: {page.updatedAt}</p>}
              {loading && <p className="public-page__notice">Loading live public data...</p>}
              {error && <p className="public-page__notice">{error}</p>}
            </div>

            {showMetrics && (
              <aside className="public-page__panel">
                <h2>Live Portal Snapshot</h2>
                <div className="public-page__metric-grid">
                  <div className="public-page__metric">
                    <strong>{formatNumber(metrics.employees)}</strong>
                    <span>Active employees</span>
                  </div>
                  <div className="public-page__metric">
                    <strong>{formatNumber(metrics.attendanceToday)}</strong>
                    <span>Attendance records today</span>
                  </div>
                  <div className="public-page__metric">
                    <strong>{formatNumber(metrics.leaveRequests)}</strong>
                    <span>Leave records</span>
                  </div>
                  <div className="public-page__metric">
                    <strong>{formatNumber(metrics.tasks)}</strong>
                    <span>Tasks tracked</span>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </section>

        <section className="public-page__body">
          <div className="public-page__inner">
            {children}
          </div>
        </section>
      </main>
      <Footer darkMode={darkMode} />
    </div>
  );
};

export default PublicPageShell;
