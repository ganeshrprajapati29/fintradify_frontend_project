import React from 'react';
import { Link } from 'react-router-dom';
import { FaCheckCircle, FaLayerGroup } from 'react-icons/fa';
import { usePublicData } from '../contexts/PublicDataContext';
import PublicPageShell from './PublicPageShell';

const titleFromKey = (pageKey) => pageKey
  .replace(/-/g, ' ')
  .replace(/\b\w/g, (char) => char.toUpperCase());

const PublicStaticPage = ({ pageKey }) => {
  const { siteData } = usePublicData();
  const page = siteData.pages?.[pageKey] || {
    title: titleFromKey(pageKey),
    eyebrow: 'Fintradify',
    summary: 'This page is connected to the public content API and will update when backend content is changed.',
    sections: [],
  };

  return (
    <PublicPageShell page={page}>
      <div className="public-section-grid">
        {(page.sections || []).map((section) => (
          <article className="public-card" key={section.title}>
            <span className="public-card__icon" aria-hidden="true">
              <FaLayerGroup />
            </span>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
            {section.items && (
              <ul className="public-list">
                {section.items.map((item) => (
                  <li key={item}>
                    <FaCheckCircle />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>

      <div style={{ height: 40 }} />

      <article className="public-card">
        <h2>Connected Platform Data</h2>
        <p>
          This page is served through the public content API and uses the same brand, contact, settings,
          and operational metrics that power the landing page.
        </p>
        <div className="public-page__actions">
          <Link className="public-button primary" to="/login">Open Portal</Link>
          <Link className="public-button" to="/contact">Contact Team</Link>
        </div>
      </article>
    </PublicPageShell>
  );
};

export default PublicStaticPage;
