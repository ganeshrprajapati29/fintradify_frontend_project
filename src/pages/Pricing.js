import React from 'react';
import { Link } from 'react-router-dom';
import { usePublicData } from '../contexts/PublicDataContext';
import PublicPageShell from './PublicPageShell';

const Pricing = () => {
  const { siteData } = usePublicData();
  const page = {
    title: 'Simple Plans for Growing Teams',
    eyebrow: 'Pricing',
    summary: 'Choose a package based on team size and workflow needs. Pricing content is served by the public backend so the website and sales pages stay aligned.',
  };

  return (
    <PublicPageShell page={page}>
      <div className="public-pricing-grid">
        {(siteData.pricingPlans || []).map((plan) => (
          <article className="public-card" key={plan.name}>
            {plan.popular && <span className="public-card__popular">Most popular</span>}
            <h3>{plan.name}</h3>
            <p>{plan.description}</p>
            <div className="public-price">
              <strong>{plan.price}</strong>
              <span>{plan.period}</span>
            </div>
            <ul className="public-list">
              {(plan.features || []).map((feature) => <li key={feature}>{feature}</li>)}
            </ul>
            <Link className={`public-button ${plan.popular ? 'primary' : ''}`} to="/contact">
              {plan.cta || 'Contact Sales'}
            </Link>
          </article>
        ))}
      </div>
    </PublicPageShell>
  );
};

export default Pricing;
