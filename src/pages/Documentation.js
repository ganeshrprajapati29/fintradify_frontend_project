import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Documentation = () => {
  const { settings } = useSettings();
  const [darkMode, setDarkMode] = useState(settings.theme === 'dark');

  const docSections = [
    {
      title: 'Getting Started',
      icon: '🚀',
      items: [
        'Quick Start Guide',
        'System Requirements',
        'Installation Guide',
        'First Login Setup'
      ]
    },
    {
      title: 'User Guides',
      icon: '👥',
      items: [
        'Employee Onboarding',
        'Attendance Tracking',
        'Leave Management',
        'Payroll Overview',
        'Task Management'
      ]
    },
    {
      title: 'Admin Guides',
      icon: '⚙️',
      items: [
        'Admin Dashboard',
        'Employee Management',
        'Settings Configuration',
        'Reports & Analytics',
        'System Administration'
      ]
    },
    {
      title: 'API Reference',
      icon: '🔌',
      items: [
        'Authentication',
        'Endpoints',
        'Rate Limits',
        'Error Handling',
        'Webhooks'
      ]
    },
    {
      title: 'Troubleshooting',
      icon: '🔧',
      items: [
        'Common Issues',
        'Error Messages',
        'Performance Tips',
        'Support Resources'
      ]
    },
    {
      title: 'Best Practices',
      icon: '✨',
      items: [
        'Security Guidelines',
        'Data Management',
        'User Training',
        'Compliance Standards'
      ]
    }
  ];

  const quickLinks = [
    { title: 'Video Tutorials', description: 'Step-by-step video guides', icon: '🎥' },
    { title: 'FAQ', description: 'Frequently asked questions', icon: '❓' },
    { title: 'Release Notes', description: 'Latest updates and features', icon: '📋' },
    { title: 'Community Forum', description: 'Connect with other users', icon: '💬' }
  ];

  return (
    <div>
      <Navbar darkMode={darkMode} onThemeToggle={() => setDarkMode(!darkMode)} />
      <div className="container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>Documentation</h1>
        <p style={{ textAlign: 'center', marginBottom: '40px', color: '#666' }}>
          Everything you need to know about using Fintradify effectively
        </p>

        {/* Search Bar */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ position: 'relative', maxWidth: '500px', margin: '0 auto' }}>
            <input
              type="text"
              placeholder="Search documentation..."
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: '25px',
                border: '1px solid #ddd',
                fontSize: '16px',
                paddingRight: '50px'
              }}
            />
            <button
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                cursor: 'pointer'
              }}
            >
              🔍
            </button>
          </div>
        </div>

        {/* Documentation Sections */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px', marginBottom: '50px' }}>
          {docSections.map((section, index) => (
            <div key={index} style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '25px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '24px', marginRight: '10px' }}>{section.icon}</span>
                <h3 style={{ margin: 0, color: '#333' }}>{section.title}</h3>
              </div>

              <ul style={{ listStyle: 'none', padding: 0 }}>
                {section.items.map((item, idx) => (
                  <li key={idx} style={{ marginBottom: '10px' }}>
                    <a
                      href="#"
                      style={{
                        color: '#667eea',
                        textDecoration: 'none',
                        fontSize: '14px',
                        display: 'block',
                        padding: '5px 0'
                      }}
                      onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div style={{ backgroundColor: '#f8f9ff', padding: '40px', borderRadius: '15px', marginBottom: '40px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Quick Links</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            {quickLinks.map((link, index) => (
              <div key={index} style={{ textAlign: 'center', padding: '20px', backgroundColor: 'white', borderRadius: '10px' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>{link.icon}</div>
                <h4 style={{ marginBottom: '10px', color: '#333' }}>{link.title}</h4>
                <p style={{ color: '#666', marginBottom: '15px' }}>{link.description}</p>
                <button
                  style={{
                    backgroundColor: '#667eea',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Learn More
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Help Section */}
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '10px' }}>
          <h3 style={{ marginBottom: '10px' }}>Still Need Help?</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
            <button
              style={{
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '25px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Contact Support
            </button>
            <button
              style={{
                backgroundColor: '#f0f0f0',
                color: '#333',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '25px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Join Community
            </button>
          </div>
        </div>
      </div>
      <Footer darkMode={darkMode} />
    </div>
  );
};

export default Documentation;
