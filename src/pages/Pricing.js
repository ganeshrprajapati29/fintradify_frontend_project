import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Pricing = () => {
  const { settings } = useSettings();
  const [darkMode, setDarkMode] = useState(settings.theme === 'dark');

  const pricingPlans = [
    {
      name: 'Starter',
      price: '₹999',
      period: '/month',
      description: 'Perfect for small teams',
      features: [
        'Up to 50 employees',
        'Basic attendance tracking',
        'Leave management',
        'Basic reporting',
        'Email support'
      ],
      popular: false
    },
    {
      name: 'Professional',
      price: '₹2,499',
      period: '/month',
      description: 'Ideal for growing companies',
      features: [
        'Up to 200 employees',
        'Advanced attendance tracking',
        'Advanced leave management',
        'Custom reporting',
        'Priority support',
        'Mobile app access',
        'API access'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'pricing',
      description: 'For large organizations',
      features: [
        'Unlimited employees',
        'All features included',
        'Custom integrations',
        'Dedicated account manager',
        '24/7 phone support',
        'On-premise deployment',
        'Advanced analytics'
      ],
      popular: false
    }
  ];

  return (
    <div>
      <Navbar darkMode={darkMode} onThemeToggle={() => setDarkMode(!darkMode)} />
      <div className="container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>Pricing Plans</h1>
        <p style={{ textAlign: 'center', marginBottom: '50px', color: '#666' }}>
          Choose the perfect plan for your organization's needs
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              style={{
                border: plan.popular ? '2px solid #667eea' : '1px solid #ddd',
                borderRadius: '10px',
                padding: '30px',
                textAlign: 'center',
                position: 'relative',
                backgroundColor: plan.popular ? '#f8f9ff' : 'white',
                boxShadow: plan.popular ? '0 4px 20px rgba(102, 126, 234, 0.1)' : '0 2px 10px rgba(0,0,0,0.1)'
              }}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#667eea',
                  color: 'white',
                  padding: '5px 15px',
                  borderRadius: '15px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  MOST POPULAR
                </div>
              )}

              <h3 style={{ marginBottom: '10px', fontSize: '24px' }}>{plan.name}</h3>
              <p style={{ color: '#666', marginBottom: '20px' }}>{plan.description}</p>

              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#667eea' }}>{plan.price}</span>
                <span style={{ color: '#666' }}>{plan.period}</span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '30px' }}>
                {plan.features.map((feature, idx) => (
                  <li key={idx} style={{ marginBottom: '10px', color: '#555' }}>
                    ✓ {feature}
                  </li>
                ))}
              </ul>

              <button
                style={{
                  backgroundColor: plan.popular ? '#667eea' : '#f0f0f0',
                  color: plan.popular ? 'white' : '#333',
                  border: 'none',
                  padding: '12px 30px',
                  borderRadius: '25px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
              </button>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '50px', padding: '30px', backgroundColor: '#f8f9ff', borderRadius: '10px' }}>
          <h3 style={{ marginBottom: '10px' }}>Need a Custom Solution?</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Contact our sales team for a personalized quote tailored to your specific requirements.
          </p>
          <button
            style={{
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              padding: '12px 30px',
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Contact Sales
          </button>
        </div>
      </div>
      <Footer darkMode={darkMode} />
    </div>
  );
};

export default Pricing;
