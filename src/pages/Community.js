import React from 'react';
import { Link } from 'react-router-dom';
import { FaBullhorn, FaCheckCircle, FaComments, FaGraduationCap, FaLightbulb } from 'react-icons/fa';
import { usePublicData } from '../contexts/PublicDataContext';
import PublicPageShell from './PublicPageShell';

const communityTracks = [
  [FaGraduationCap, 'Product Webinars', 'Learn attendance setup, employee self-service, salary documents, certificates, and task workflows.'],
  [FaLightbulb, 'Implementation Guidance', 'Use practical checklists for onboarding employees, policies, roles, and document flows.'],
  [FaComments, 'Feedback Loop', 'Share workflow improvements, product requests, bug reports, and documentation suggestions.'],
];

const Community = () => {
  const { siteData } = usePublicData();
  const page = siteData.pages?.community || {
    title: 'Fintradify Community',
    eyebrow: 'Community',
    summary: 'Connect with product updates, HR workflow guidance, webinars, and implementation support for your team.',
  };

  return (
    <PublicPageShell page={page}>
      <section className="community-page">
        <div className="community-page__banner">
          <div>
            <span><FaBullhorn /> Community Hub</span>
            <h2>Practical HR operations guidance for real teams.</h2>
            <p>Stay close to product updates, rollout guidance, and operating practices that help admins and employees use the portal properly.</p>
          </div>
          <Link className="public-button primary" to="/contact">Join Updates</Link>
        </div>

        <div className="community-page__grid">
          {communityTracks.map(([Icon, title, detail]) => (
            <article key={title}>
              <Icon />
              <h3>{title}</h3>
              <p>{detail}</p>
            </article>
          ))}
        </div>

        <div className="community-page__checklist">
          {(page.sections || []).slice(0, 3).map((section) => (
            <article key={section.title}>
              <h3>{section.title}</h3>
              <p>{section.body}</p>
              {section.items && (
                <ul>
                  {section.items.slice(0, 4).map((item) => (
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

export default Community;
