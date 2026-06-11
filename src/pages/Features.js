import React from 'react';
import { usePublicData } from '../contexts/PublicDataContext';
import PublicPageShell from './PublicPageShell';

const Features = () => {
  const { siteData } = usePublicData();
  const page = {
    title: 'HR Features That Work Together',
    eyebrow: 'Product',
    summary: 'Attendance, leave, salary documents, task assignment, notifications, and employee self-service are connected through one live HR portal.',
  };

  return (
    <PublicPageShell page={page}>
      <div className="public-feature-grid">
        {(siteData.features || []).map((feature) => (
          <article className="public-card" key={feature.title}>
            <span className="public-card__metric">{feature.metric}</span>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </article>
        ))}
      </div>
    </PublicPageShell>
  );
};

export default Features;
