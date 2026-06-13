import React from 'react';
import { Link } from 'react-router-dom';
import { FaCheckCircle, FaEnvelope, FaHeadset, FaMapMarkerAlt, FaPhone, FaShieldAlt } from 'react-icons/fa';
import { usePublicData } from '../contexts/PublicDataContext';
import PublicPageShell from './PublicPageShell';

const Contact = () => {
  const { siteData } = usePublicData();
  const brand = siteData.brand || {};
  const page = siteData.pages?.contact || {
    title: 'Talk to Fintradify',
    eyebrow: 'Contact',
    summary: 'Reach the team for product questions, onboarding, support, or custom deployment discussions.',
  };
  const phoneHref = `tel:${String(brand.phone || '').replace(/\s+/g, '')}`;

  return (
    <PublicPageShell page={page}>
      <section className="contact-page">
        <div className="contact-page__cards">
          <a href={phoneHref}>
            <FaPhone />
            <span>Call Sales</span>
            <strong>{brand.phone}</strong>
          </a>
          <a href={`mailto:${brand.email}`}>
            <FaEnvelope />
            <span>Email Support</span>
            <strong>{brand.email}</strong>
          </a>
          <article>
            <FaMapMarkerAlt />
            <span>Office</span>
            <strong>{brand.address}</strong>
          </article>
        </div>

        <div className="contact-page__panel">
          <div>
            <span className="contact-page__eyebrow"><FaHeadset /> Faster response</span>
            <h2>Share your company size, required modules, and rollout timeline.</h2>
            <p>
              The Fintradify team can help with attendance setup, leave policy, salary documents,
              certificates, employee onboarding, and custom deployment planning.
            </p>
            <div className="contact-page__actions">
              <a className="public-button primary" href={`mailto:${brand.email}`}>Send Email</a>
              <Link className="public-button" to="/pricing">View Pricing</Link>
            </div>
          </div>
          <div className="contact-page__support">
            <FaShieldAlt />
            <h3>Support-ready details</h3>
            <ul>
              <li>Registered admin email</li>
              <li>Affected module name</li>
              <li>Employee ID or certificate number</li>
              <li>Screenshot or approximate issue time</li>
            </ul>
          </div>
        </div>

        <div className="contact-page__sections">
          {(page.sections || []).map((section) => (
            <article key={section.title}>
              <h3>{section.title}</h3>
              <p>{section.body}</p>
              {section.items && (
                <ul>
                  {section.items.map((item) => (
                    <li key={item}><FaCheckCircle /> <span>{item}</span></li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </section>
    </PublicPageShell>
  );
};

export default Contact;
