import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Compliance = () => {
  const { settings } = useSettings();
  const [darkMode, setDarkMode] = useState(settings.theme === 'dark');

  const complianceStandards = [
    {
      name: 'GDPR',
      fullName: 'General Data Protection Regulation',
      description: 'EU regulation for data protection and privacy',
      status: 'Compliant',
      lastAudit: '2024-01-15',
      icon: '🇪🇺'
    },
    {
      name: 'SOC 2',
      fullName: 'System and Organization Controls 2',
      description: 'Security, availability, and confidentiality controls',
      status: 'Compliant',
      lastAudit: '2024-02-01',
      icon: '🔒'
    },
    {
      name: 'ISO 27001',
      fullName: 'Information Security Management Systems',
      description: 'International standard for information security',
      status: 'Certified',
      lastAudit: '2023-12-10',
      icon: '🏆'
    },
    {
      name: 'HIPAA',
      fullName: 'Health Insurance Portability and Accountability Act',
      description: 'US healthcare data protection standard',
      status: 'Compliant',
      lastAudit: '2024-01-20',
      icon: '🏥'
    },
    {
      name: 'PCI DSS',
      fullName: 'Payment Card Industry Data Security Standard',
      description: 'Payment card data security requirements',
      status: 'Compliant',
      lastAudit: '2024-02-15',
      icon: '💳'
    },
    {
      name: 'CCPA',
      fullName: 'California Consumer Privacy Act',
      description: 'California privacy rights for consumers',
      status: 'Compliant',
      lastAudit: '2024-01-30',
      icon: '🌴'
    }
  ];

  const securityMeasures = [
    {
      category: 'Data Protection',
      measures: [
        'End-to-end encryption for all data',
        'Regular security audits and penetration testing',
        'Multi-factor authentication (MFA)',
        'Role-based access control (RBAC)',
        'Data backup and disaster recovery'
      ]
    },
    {
      category: 'Network Security',
      measures: [
        'DDoS protection and monitoring',
        'Web Application Firewall (WAF)',
        'SSL/TLS encryption for all connections',
        'Regular vulnerability scanning',
        'Intrusion detection systems'
      ]
    },
    {
      category: 'Operational Security',
      measures: [
        '24/7 security monitoring',
        'Incident response procedures',
        'Regular security training for staff',
        'Third-party risk assessments',
        'Compliance monitoring and reporting'
      ]
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Compliant': return '#28a745';
      case 'Certified': return '#007bff';
      case 'Pending': return '#ffc107';
      default: return '#6c757d';
    }
  };

  return (
    <div>
      <Navbar darkMode={darkMode} onThemeToggle={() => setDarkMode(!darkMode)} />
      <div className="container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>Compliance & Security</h1>
        <p style={{ textAlign: 'center', marginBottom: '40px', color: '#666' }}>
          Fintradify maintains the highest standards of security and compliance
        </p>

        {/* Compliance Standards */}
        <div style={{ marginBottom: '50px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Compliance Standards</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '25px' }}>
            {complianceStandards.map((standard, index) => (
              <div key={index} style={{
                border: '1px solid #ddd',
                borderRadius: '15px',
                padding: '25px',
                backgroundColor: 'white',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                  <span style={{ fontSize: '30px', marginRight: '15px' }}>{standard.icon}</span>
                  <div>
                    <h3 style={{ margin: 0, marginBottom: '5px' }}>{standard.name}</h3>
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{standard.fullName}</p>
                  </div>
                </div>

                <p style={{ color: '#666', marginBottom: '15px' }}>{standard.description}</p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    backgroundColor: getStatusColor(standard.status),
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {standard.status}
                  </span>
                  <span style={{ color: '#666', fontSize: '14px' }}>
                    Last audit: {standard.lastAudit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Measures */}
        <div style={{ marginBottom: '50px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Security Measures</h2>
          <div style={{ display: 'grid', gap: '30px' }}>
            {securityMeasures.map((category, index) => (
              <div key={index} style={{
                backgroundColor: '#f8f9ff',
                borderRadius: '15px',
                padding: '30px'
              }}>
                <h3 style={{ marginBottom: '20px', color: '#333' }}>{category.category}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                  {category.measures.map((measure, idx) => (
                    <div key={idx} style={{
                      backgroundColor: 'white',
                      padding: '15px',
                      borderRadius: '10px',
                      borderLeft: '4px solid #667eea'
                    }}>
                      <span style={{ color: '#28a745', marginRight: '10px' }}>✓</span>
                      {measure}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div style={{ marginBottom: '50px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Certifications & Audits</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '15px',
              padding: '25px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>🏆</div>
              <h3 style={{ marginBottom: '10px' }}>ISO 27001 Certified</h3>
              <p style={{ color: '#666', marginBottom: '15px' }}>
                Internationally recognized standard for information security management systems.
              </p>
              <div style={{ color: '#666', fontSize: '14px' }}>
                Certificate valid until: 2026-12-10
              </div>
            </div>

            <div style={{
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '15px',
              padding: '25px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔒</div>
              <h3 style={{ marginBottom: '10px' }}>SOC 2 Type II</h3>
              <p style={{ color: '#666', marginBottom: '15px' }}>
                Comprehensive audit of our security, availability, and confidentiality controls.
              </p>
              <div style={{ color: '#666', fontSize: '14px' }}>
                Report available upon request
              </div>
            </div>

            <div style={{
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '15px',
              padding: '25px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>🇪🇺</div>
              <h3 style={{ marginBottom: '10px' }}>GDPR Compliant</h3>
              <p style={{ color: '#666', marginBottom: '15px' }}>
                Fully compliant with EU General Data Protection Regulation requirements.
              </p>
              <div style={{ color: '#666', fontSize: '14px' }}>
                Data Protection Officer: dpo@fintradify.com
              </div>
            </div>
          </div>
        </div>

        {/* Contact for Compliance */}
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8f9ff', borderRadius: '15px' }}>
          <h2 style={{ marginBottom: '15px' }}>Questions About Compliance?</h2>
          <p style={{ color: '#666', marginBottom: '25px' }}>
            Our compliance team is available to answer any questions about our security measures and certifications.
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
              Contact Compliance Team
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
              Download Security Overview
            </button>
          </div>
        </div>
      </div>
      <Footer darkMode={darkMode} />
    </div>
  );
};

export default Compliance;
