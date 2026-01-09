import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaSlack, FaMicrosoft, FaGoogle, FaDropbox, FaGithub, FaAws, FaSalesforce, FaBolt } from 'react-icons/fa';

const Integrations = () => {
  const { settings } = useSettings();
  const [darkMode, setDarkMode] = useState(settings.theme === 'dark');

  const integrations = [
    {
      icon: <FaSlack />,
      name: "Slack",
      description: "Seamless communication and notifications integration"
    },
    {
      icon: <FaMicrosoft />,
      name: "Microsoft 365",
      description: "Complete integration with Office 365 suite"
    },
    {
      icon: <FaGoogle />,
      name: "Google Workspace",
      description: "Full integration with Google Workspace tools"
    },
    {
      icon: <FaDropbox />,
      name: "Dropbox",
      description: "Secure file storage and sharing integration"
    },
    {
      icon: <FaGithub />,
      name: "GitHub",
      description: "Developer tools and version control integration"
    },
    {
      icon: <FaAws />,
      name: "AWS",
      description: "Cloud infrastructure and services integration"
    },
    {
      icon: <FaSalesforce />,
      name: "Salesforce",
      description: "CRM and sales data synchronization"
    },
    {
      icon: <FaBolt />,
      name: "Zapier",
      description: "Connect with 3,000+ apps through automation"
    }
  ];

  return (
    <div>
      <Navbar darkMode={darkMode} onThemeToggle={() => setDarkMode(!darkMode)} />
      <div className="container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>Integrations</h1>
        <p style={{ textAlign: 'center', marginBottom: '50px', fontSize: '18px', color: '#666' }}>
          Connect Fintradify with your favorite tools and services
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px' }}>
          {integrations.map((integration, index) => (
            <div key={index} style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '10px',
              textAlign: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb',
              transition: 'transform 0.3s ease'
            }}>
              <div style={{ fontSize: '48px', color: '#1e40af', marginBottom: '20px' }}>
                {integration.icon}
              </div>
              <h3 style={{ marginBottom: '15px', color: '#333' }}>{integration.name}</h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>{integration.description}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '60px', padding: '40px', backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
          <h2 style={{ marginBottom: '20px' }}>API Integration</h2>
          <p style={{ fontSize: '18px', marginBottom: '30px', color: '#666' }}>
            Our comprehensive REST API allows you to integrate Fintradify with any system or build custom applications.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <button style={{
              backgroundColor: '#1e40af',
              color: 'white',
              padding: '12px 25px',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>
              View API Docs
            </button>
            <button style={{
              backgroundColor: 'white',
              color: '#1e40af',
              padding: '12px 25px',
              border: '2px solid #1e40af',
              borderRadius: '5px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>
              Request Integration
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <h2 style={{ marginBottom: '20px' }}>Don't See Your Tool?</h2>
          <p style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>
            We're constantly adding new integrations. Let us know what you'd like to see next.
          </p>
          <button style={{
            backgroundColor: '#10b981',
            color: 'white',
            padding: '12px 25px',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}>
            Suggest Integration
          </button>
        </div>
      </div>
      <Footer darkMode={darkMode} />
    </div>
  );
};

export default Integrations;
