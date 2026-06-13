import React from 'react';
import { Link } from 'react-router-dom';
import { FaCheckCircle, FaHeadset, FaShieldAlt, FaUsers } from 'react-icons/fa';
import { usePublicData } from '../contexts/PublicDataContext';
import PublicPageShell from './PublicPageShell';

const pricingHighlights = [
  [FaUsers, 'Scale by team size', 'Start with a small team and move to higher plans as your HR operations grow.'],
  [FaShieldAlt, 'Secure workflows', 'Admin and employee access stays separated through role-based portal flows.'],
  [FaHeadset, 'Implementation support', 'Get help with attendance, leave, salary documents, certificates, and setup.'],
];

const Pricing = () => {
  const { siteData } = usePublicData();
  const page = {
    title: 'Simple Plans for Growing Teams',
    eyebrow: 'Pricing',
    summary: 'Choose a package based on team size and workflow needs. Pricing content is served by the public backend so the website and sales pages stay aligned.',
  };

  return (
    <PublicPageShell page={page}>
      <section className="pricing-page">
        <div className="pricing-page__intro">
          {pricingHighlights.map(([Icon, title, detail]) => (
            <article key={title}>
              <Icon />
              <h3>{title}</h3>
              <p>{detail}</p>
            </article>
          ))}
        </div>

        <div className="pricing-page__grid">
        {(siteData.pricingPlans || []).map((plan) => (
          <article className={`pricing-page__card ${plan.popular ? 'is-popular' : ''}`} key={plan.name}>
            {plan.popular && <span className="public-card__popular">Most popular</span>}
            <h3>{plan.name}</h3>
            <p>{plan.description}</p>
            <div className="public-price">
              <strong>{plan.price}</strong>
              <span>{plan.period}</span>
            </div>
            <ul className="public-list">
              {(plan.features || []).map((feature) => (
                <li key={feature}><FaCheckCircle /> <span>{feature}</span></li>
              ))}
            </ul>
            <Link className={`public-button ${plan.popular ? 'primary' : ''}`} to="/contact">
              {plan.cta || 'Contact Sales'}
            </Link>
          </article>
        ))}
        </div>

        <div className="pricing-page__note">
          <div>
            <span>Need a custom rollout?</span>
            <h2>Enterprise setup can be tailored for your attendance policy, documents, and support needs.</h2>
          </div>
          <Link className="public-button primary" to="/contact">Talk to Sales</Link>
        </div>
      </section>
    </PublicPageShell>
  );
};

export default Pricing;
