import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaCheckCircle, FaExclamationTriangle, FaClock, FaServer, FaDatabase, FaGlobe } from 'react-icons/fa';

const Status = () => {
  const { settings } = useSettings();
  const [darkMode, setDarkMode] = useState(settings.theme === 'dark');

  const services = [
    {
      name: "Web Application",
      status: "operational",
      uptime: "99.9%",
      icon: <FaGlobe />
    },
    {
      name: "API Services",
      status: "operational",
      uptime: "99.8%",
      icon: <FaServer />
    },
    {
      name: "Database",
      status: "operational",
      uptime: "99.9%",
      icon: <FaDatabase />
    },
    {
      name: "Mobile App",
      status: "operational",
      uptime: "99.7%",
      icon: <FaServer />
    }
  ];

  const incidents = [
    {
      date: "2024-01-15",
      title: "Scheduled Maintenance",
      description: "Routine maintenance completed successfully",
      status: "resolved",
      duration: "2 hours"
    },
    {
      date: "2024-01-10",
      title: "API Rate Limiting Issue",
      description: "Temporary rate limiting resolved",
      status: "resolved",
      duration: "15 minutes"
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational': return '#10b981';
      case 'degraded': return '#f59e0b';
      case 'outage': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational': return <FaCheckCircle />;
      case 'degraded': return <FaExclamationTriangle />;
      case 'outage': return <FaExclamationTriangle />;
      default: return <FaClock />;
    }
  };

  return (
    <div>
      <Navbar darkMode={darkMode} onThemeToggle={() => setDarkMode(!darkMode)} />

      {/* Header */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '60px 0',
        textAlign: 'center'
      }}>
        <div className="container">
          <h1 style={{ fontSize: '3rem', marginBottom: '20px', fontWeight: 'bold' }}>System Status</h1>
          <p style={{ fontSize: '1.2rem', opacity: '0.9' }}>
            Real-time status of all Fintradify services and systems
          </p>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            padding: '10px 20px',
            borderRadius: '25px',
            marginTop: '20px'
          }}>
            <FaCheckCircle />
            <span>All Systems Operational</span>
          </div>
        </div>
      </section>

      {/* Services Status */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '50px', fontSize: '2.5rem', fontWeight: 'bold' }}>
            Service Status
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
            {services.map((service, index) => (
              <div key={index} style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '10px',
                border: '1px solid #e5e7eb',
                textAlign: 'center',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  fontSize: '3rem',
                  color: getStatusColor(service.status),
                  marginBottom: '20px'
                }}>
                  {service.icon}
                </div>
                <h3 style={{ marginBottom: '15px', fontSize: '1.3rem' }}>{service.name}</h3>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: getStatusColor(service.status),
                  color: 'white',
                  padding: '5px 15px',
                  borderRadius: '20px',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  marginBottom: '15px'
                }}>
                  {getStatusIcon(service.status)}
                  <span style={{ textTransform: 'capitalize' }}>{service.status}</span>
                </div>
                <p style={{ color: '#666', marginBottom: '10px' }}>Uptime: {service.uptime}</p>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>Last 30 days</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Incidents */}
      <section style={{ padding: '80px 0', backgroundColor: '#f8f9fa' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '50px', fontSize: '2.5rem', fontWeight: 'bold' }}>
            Recent Incidents
          </h2>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {incidents.map((incident, index) => (
              <div key={index} style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '10px',
                marginBottom: '20px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div>
                    <h3 style={{ marginBottom: '5px', fontSize: '1.2rem' }}>{incident.title}</h3>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>{incident.date}</p>
                  </div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    padding: '5px 12px',
                    borderRadius: '15px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    textTransform: 'capitalize'
                  }}>
                    {incident.status}
                  </div>
                </div>
                <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '10px' }}>{incident.description}</p>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>Duration: {incident.duration}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe to Updates */}
      <section style={{
        backgroundColor: '#1e40af',
        color: 'white',
        padding: '60px 0',
        textAlign: 'center'
      }}>
        <div className="container">
          <h2 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>Stay Updated</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '30px', opacity: '0.9' }}>
            Get notified about system status changes and maintenance schedules.
          </p>
          <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="email"
                placeholder="Enter your email"
                style={{
                  flex: 1,
                  padding: '15px',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '1rem'
                }}
              />
              <button style={{
                backgroundColor: 'white',
                color: '#1e40af',
                padding: '15px 25px',
                border: 'none',
                borderRadius: '5px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}>
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer darkMode={darkMode} />
    </div>
  );
};

export default Status;
