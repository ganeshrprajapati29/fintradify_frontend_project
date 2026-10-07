import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaBalanceScale,
  FaBookOpen,
  FaBriefcase,
  FaBroadcastTower,
  FaCheckCircle,
  FaCode,
  FaCookieBite,
  FaEnvelope,
  FaGlobe,
  FaHandshake,
  FaLayerGroup,
  FaLock,
  FaNewspaper,
  FaPlug,
  FaQuestionCircle,
  FaShieldAlt,
  FaUsers,
} from 'react-icons/fa';
import { usePublicData } from '../contexts/PublicDataContext';
import PublicPageShell from './PublicPageShell';

const titleFromKey = (pageKey) => pageKey
  .replace(/-/g, ' ')
  .replace(/\b\w/g, (char) => char.toUpperCase());

const pageDesign = {
  about: {
    Icon: FaUsers,
    accent: 'Company profile',
    ctaLabel: 'Talk to Team',
    ctaTo: '/contact',
    secondaryLabel: 'View Features',
    secondaryTo: '/features',
  },
  careers: {
    Icon: FaBriefcase,
    accent: 'Hiring and roles',
    ctaLabel: 'Apply by Email',
    ctaTo: 'mailto',
    secondaryLabel: 'Contact Team',
    secondaryTo: '/contact',
  },
  press: {
    Icon: FaNewspaper,
    accent: 'Newsroom',
    ctaLabel: 'Media Contact',
    ctaTo: 'mailto',
    secondaryLabel: 'About Aerowheels',
    secondaryTo: '/about',
  },
  integrations: {
    Icon: FaPlug,
    accent: 'Connected systems',
    ctaLabel: 'Discuss Integration',
    ctaTo: '/contact',
    secondaryLabel: 'View Features',
    secondaryTo: '/features',
  },
  api: {
    Icon: FaCode,
    accent: 'Portal and mobile app',
    ctaLabel: 'Read Guides',
    ctaTo: '/docs',
    secondaryLabel: 'Contact Support',
    secondaryTo: '/contact',
  },
  help: {
    Icon: FaQuestionCircle,
    accent: 'Support center',
    ctaLabel: 'Contact Support',
    ctaTo: '/contact',
    secondaryLabel: 'Documentation',
    secondaryTo: '/docs',
  },
  docs: {
    Icon: FaBookOpen,
    accent: 'Setup guides',
    ctaLabel: 'Open Portal',
    ctaTo: '/login',
    secondaryLabel: 'Help Center',
    secondaryTo: '/help',
  },
  status: {
    Icon: FaBroadcastTower,
    accent: 'Live availability',
    ctaLabel: 'Report Issue',
    ctaTo: '/contact',
    secondaryLabel: 'Help Center',
    secondaryTo: '/help',
  },
  privacy: {
    Icon: FaLock,
    accent: 'Data protection',
    ctaLabel: 'Privacy Contact',
    ctaTo: 'mailto',
    secondaryLabel: 'Compliance',
    secondaryTo: '/compliance',
  },
  terms: {
    Icon: FaBalanceScale,
    accent: 'Service terms',
    ctaLabel: 'Legal Contact',
    ctaTo: 'mailto',
    secondaryLabel: 'Privacy Policy',
    secondaryTo: '/privacy-policy',
  },
  cookies: {
    Icon: FaCookieBite,
    accent: 'Browser storage',
    ctaLabel: 'Privacy Policy',
    ctaTo: '/privacy-policy',
    secondaryLabel: 'Contact',
    secondaryTo: '/contact',
  },
  gdpr: {
    Icon: FaGlobe,
    accent: 'GDPR readiness',
    ctaLabel: 'Data Request',
    ctaTo: 'mailto',
    secondaryLabel: 'Compliance',
    secondaryTo: '/compliance',
  },
  compliance: {
    Icon: FaShieldAlt,
    accent: 'Trust controls',
    ctaLabel: 'Security Contact',
    ctaTo: 'mailto',
    secondaryLabel: 'Privacy Policy',
    secondaryTo: '/privacy-policy',
  },
};

const makeCtaTarget = (target, brand) => (target === 'mailto' ? `mailto:${brand.email || 'marketing@aerowheels.co.in'}` : target);

const PublicStaticPage = ({ pageKey }) => {
  const { siteData } = usePublicData();
  const brand = siteData.brand || {};
  const page = siteData.pages?.[pageKey] || {
    title: titleFromKey(pageKey),
    eyebrow: 'Aerowheels',
    summary: 'Attendance, leave, payroll documents and live tracking for growing teams.',
    sections: [],
  };
  const design = pageDesign[pageKey] || pageDesign.about;
  const HeroIcon = design.Icon;
  const sections = page.sections || [];
  const primaryTarget = makeCtaTarget(design.ctaTo, brand);
  const isExternalPrimary = primaryTarget.startsWith('mailto:') || primaryTarget.startsWith('http');

  return (
    <PublicPageShell page={page}>
      <section className={`public-dynamic-page page-${pageKey}`}>
        <div className="public-dynamic-page__overview">
          <article className="public-dynamic-page__lead">
            <span className="public-dynamic-page__icon"><HeroIcon /></span>
            <span className="public-dynamic-page__accent">{design.accent}</span>
            <h2>{page.title}</h2>
            <p>{page.summary}</p>
            <div className="public-dynamic-page__actions">
              {isExternalPrimary ? (
                <a className="public-button primary" href={primaryTarget}>{design.ctaLabel}</a>
              ) : (
                <Link className="public-button primary" to={primaryTarget}>{design.ctaLabel}</Link>
              )}
              <Link className="public-button" to={design.secondaryTo}>{design.secondaryLabel}</Link>
            </div>
          </article>

          <aside className="public-dynamic-page__snapshot">
            <h3>At a glance</h3>
            <div>
              <span>Company</span>
              <strong>{brand.shortName || brand.name || 'Aerowheels'}</strong>
            </div>
            <div>
              <span>Phone</span>
              <strong>{brand.phone || '01146658638'}</strong>
            </div>
            <div>
              <span>Support</span>
              <strong>{brand.email || 'marketing@aerowheels.co.in'}</strong>
            </div>
          </aside>
        </div>

        <div className="public-dynamic-page__grid">
          {sections.map((section, index) => (
            <article className="public-dynamic-card" key={section.title}>
              <div className="public-dynamic-card__top">
                <span className="public-dynamic-card__number">{String(index + 1).padStart(2, '0')}</span>
                <span className="public-card__icon" aria-hidden="true">
                  {index % 2 === 0 ? <FaLayerGroup /> : <FaHandshake />}
                </span>
              </div>
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

        <div className="public-dynamic-page__cta">
          <div>
            <span><FaEnvelope /> Talk to us</span>
            <h2>Want a walkthrough of AeroAttendance for your team? The Aerowheels team is happy to help.</h2>
          </div>
          <div className="public-dynamic-page__cta-actions">
            <Link className="public-button primary" to="/login">Open Portal</Link>
            <Link className="public-button" to="/contact">Contact Team</Link>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
};

export default PublicStaticPage;
