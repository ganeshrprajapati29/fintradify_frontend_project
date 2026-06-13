import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaBell,
  FaCalendarCheck,
  FaChartLine,
  FaCheckCircle,
  FaClipboardList,
  FaFileInvoiceDollar,
  FaLayerGroup,
  FaShieldAlt,
  FaTasks,
  FaUmbrellaBeach,
  FaUsers,
} from 'react-icons/fa';
import { usePublicData } from '../contexts/PublicDataContext';
import PublicPageShell from './PublicPageShell';

const featureIcons = [
  FaCalendarCheck,
  FaUmbrellaBeach,
  FaFileInvoiceDollar,
  FaTasks,
  FaUsers,
  FaShieldAlt,
  FaBell,
  FaChartLine,
];

const capabilityRows = [
  ['Live HR data', 'Attendance, leave, tasks, salary documents, and employee records stay connected through one backend.'],
  ['Admin control', 'Admins can manage daily operations, approvals, employee details, certificates, and documents from one place.'],
  ['Employee self-service', 'Employees can access profile, attendance, leave, salary, certificates, and updates without manual follow-up.'],
];

const workflowSteps = [
  ['01', 'Capture', 'Employees punch in, request leave, and submit work updates from their portal.'],
  ['02', 'Review', 'Admins approve attendance, manage requests, assign tasks, and keep records clean.'],
  ['03', 'Generate', 'HR creates salary slips, certificates, offer letters, and reports from connected data.'],
];

const Features = () => {
  const { siteData } = usePublicData();
  const page = {
    title: 'HR Features That Work Together',
    eyebrow: 'Product',
    summary: 'Attendance, leave, salary documents, task assignment, notifications, and employee self-service are connected through one live HR portal.',
  };

  return (
    <PublicPageShell page={page}>
      <section className="features-showcase">
        <div className="features-showcase__heading">
          <span>Connected Modules</span>
          <h2>Built for the work HR teams repeat every day.</h2>
          <p>Each module is designed to share employee data cleanly, so admins do not have to maintain separate sheets for routine operations.</p>
        </div>

        <div className="features-showcase__grid">
          {(siteData.features || []).map((feature, index) => {
            const Icon = featureIcons[index % featureIcons.length];
            return (
              <article className="features-showcase__card" key={feature.title}>
                <div className="features-showcase__icon"><Icon /></div>
                <span>{feature.metric}</span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <small><FaCheckCircle /> Included in portal workflow</small>
              </article>
            );
          })}
        </div>
      </section>

      <section className="features-ops">
        <div className="features-ops__panel">
          <span className="features-ops__icon"><FaLayerGroup /></span>
          <h2>One system for admin and employee operations.</h2>
          <p>
            Fintradify keeps daily HR actions practical: record attendance, approve requests,
            assign work, publish documents, and verify employee certificates from public pages.
          </p>
          <div className="features-ops__actions">
            <Link className="public-button primary" to="/login">Open Portal</Link>
            <Link className="public-button" to="/verify-certificate">Find Employee</Link>
          </div>
        </div>

        <div className="features-ops__list">
          {capabilityRows.map(([title, detail]) => (
            <article key={title}>
              <FaCheckCircle />
              <div>
                <h3>{title}</h3>
                <p>{detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="features-workflow">
        {workflowSteps.map(([step, title, detail]) => (
          <article key={title}>
            <strong>{step}</strong>
            <h3>{title}</h3>
            <p>{detail}</p>
          </article>
        ))}
      </section>
    </PublicPageShell>
  );
};

export default Features;
