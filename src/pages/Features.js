import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaShieldAlt, FaChartLine, FaUsers, FaClock, FaMobileAlt, FaCloud } from 'react-icons/fa';

const Features = () => {
  const features = [
    {
      icon: <FaShieldAlt />,
      title: "Security & Compliance",
      description: "Enterprise-grade security, GDPR compliance, audit trails, and role-based access control."
    },
    {
      icon: <FaChartLine />,
      title: "Performance Analytics",
      description: "Advanced analytics with predictive insights, KPI tracking, and custom reporting."
    },
    {
      icon: <FaUsers />,
      title: "Employee Management",
      description: "Comprehensive employee lifecycle management from onboarding to offboarding."
    },
    {
      icon: <FaClock />,
      title: "Time & Attendance",
      description: "Automated attendance tracking, leave management, and timesheet automation."
    },
    {
      icon: <FaMobileAlt />,
      title: "Mobile App",
      description: "Access HR functions anywhere with our intuitive mobile application."
    },
    {
      icon: <FaCloud />,
      title: "Cloud Integration",
      description: "Seamless integration with popular cloud services and business applications."
    }
  ];

  return (
    <div>
      <Navbar />
      <div className="container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>Features</h1>
        <p style={{ textAlign: 'center', marginBottom: '50px', fontSize: '18px', color: '#666' }}>
          Discover the powerful features that make Fintradify the leading HR automation platform
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
          {features.map((feature, index) => (
            <div key={index} style={{
              backgroundColor: '#f8f9fa',
              padding: '30px',
              borderRadius: '10px',
              textAlign: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              transition: 'transform 0.3s ease'
            }}>
              <div style={{ fontSize: '48px', color: '#1e40af', marginBottom: '20px' }}>
                {feature.icon}
              </div>
              <h3 style={{ marginBottom: '15px', color: '#333' }}>{feature.title}</h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>{feature.description}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '60px', padding: '40px', backgroundColor: '#1e40af', color: 'white', borderRadius: '10px' }}>
          <h2 style={{ marginBottom: '20px' }}>Ready to Transform Your HR Operations?</h2>
          <p style={{ fontSize: '18px', marginBottom: '30px' }}>
            Join over 1,250 companies worldwide who trust Fintradify for their HR automation needs.
          </p>
          <button style={{
            backgroundColor: 'white',
            color: '#1e40af',
            padding: '15px 30px',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}>
            Get Started Today
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Features;
