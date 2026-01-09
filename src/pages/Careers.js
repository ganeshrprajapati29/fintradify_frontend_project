import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaMapMarkerAlt, FaClock, FaDollarSign, FaUsers, FaRocket, FaHeart, FaBalanceScale, FaCoffee } from 'react-icons/fa';

const Careers = () => {
  const { settings } = useSettings();
  const [darkMode, setDarkMode] = useState(settings.theme === 'dark');

  const jobOpenings = [
    {
      title: "Senior React Developer",
      location: "Noida, UP",
      type: "Full-time",
      salary: "₹12-18 LPA",
      description: "Build cutting-edge HR automation solutions using React and modern web technologies."
    },
    {
      title: "Backend Engineer (Node.js)",
      location: "Noida, UP",
      type: "Full-time",
      salary: "₹10-15 LPA",
      description: "Develop scalable APIs and microservices for our HR platform."
    },
    {
      title: "DevOps Engineer",
      location: "Remote",
      type: "Full-time",
      salary: "₹15-20 LPA",
      description: "Manage cloud infrastructure and CI/CD pipelines for high-availability systems."
    },
    {
      title: "Product Manager",
      location: "Noida, UP",
      type: "Full-time",
      salary: "₹18-25 LPA",
      description: "Drive product strategy and roadmap for our HR automation platform."
    },
    {
      title: "UI/UX Designer",
      location: "Noida, UP",
      type: "Full-time",
      salary: "₹8-12 LPA",
      description: "Design intuitive user experiences for our HR management solutions."
    },
    {
      title: "QA Engineer",
      location: "Noida, UP",
      type: "Full-time",
      salary: "₹6-10 LPA",
      description: "Ensure quality and reliability of our HR automation platform."
    }
  ];

  const benefits = [
    { icon: <FaDollarSign />, title: "Competitive Salary", description: "Attractive compensation with performance bonuses" },
    { icon: <FaUsers />, title: "Great Team", description: "Work with talented and passionate professionals" },
    { icon: <FaRocket />, title: "Growth Opportunities", description: "Continuous learning and career advancement" },
    { icon: <FaHeart />, title: "Health Benefits", description: "Comprehensive health insurance coverage" },
    { icon: <FaBalanceScale />, title: "Work-Life Balance", description: "Flexible working hours and remote options" },
    { icon: <FaCoffee />, title: "Modern Office", description: "Contemporary workspace with amenities" }
  ];

  return (
    <div>
      <Navbar darkMode={darkMode} onThemeToggle={() => setDarkMode(!darkMode)} />

      {/* Hero Section */}
      <section className="careers-hero" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '80px 0',
        textAlign: 'center'
      }}>
        <div className="container">
          <h1 style={{ fontSize: '3rem', marginBottom: '20px', fontWeight: 'bold' }}>Join Our Team</h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '30px', opacity: '0.9' }}>
            Help us transform HR operations with intelligent automation
          </p>
          <p style={{ fontSize: '1.1rem', opacity: '0.8' }}>
            We're building the future of HR management and looking for passionate individuals to join our mission.
          </p>
        </div>
      </section>

      {/* Why Join Us */}
      <section style={{ padding: '80px 0', backgroundColor: '#f8f9fa' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '50px', fontSize: '2.5rem', fontWeight: 'bold' }}>
            Why Join Fintradify?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
            {benefits.map((benefit, index) => (
              <div key={index} style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '10px',
                textAlign: 'center',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                transition: 'transform 0.3s ease'
              }}>
                <div style={{ fontSize: '3rem', color: '#667eea', marginBottom: '20px' }}>
                  {benefit.icon}
                </div>
                <h3 style={{ marginBottom: '15px', fontSize: '1.3rem' }}>{benefit.title}</h3>
                <p style={{ color: '#666', lineHeight: '1.6' }}>{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Job Openings */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '50px', fontSize: '2.5rem', fontWeight: 'bold' }}>
            Current Openings
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
            {jobOpenings.map((job, index) => (
              <div key={index} style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '10px',
                border: '1px solid #e5e7eb',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}>
                <h3 style={{ marginBottom: '15px', fontSize: '1.4rem', color: '#333' }}>{job.title}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#666' }}>
                    <FaMapMarkerAlt />
                    <span>{job.location}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#666' }}>
                    <FaClock />
                    <span>{job.type}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#666' }}>
                    <FaDollarSign />
                    <span>{job.salary}</span>
                  </div>
                </div>
                <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '20px' }}>{job.description}</p>
                <button style={{
                  backgroundColor: '#667eea',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'background-color 0.3s ease'
                }}>
                  Apply Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        backgroundColor: '#1e40af',
        color: 'white',
        padding: '60px 0',
        textAlign: 'center'
      }}>
        <div className="container">
          <h2 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>Ready to Make an Impact?</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '30px', opacity: '0.9' }}>
            Don't see a position that matches your skills? We're always looking for talented individuals.
          </p>
          <button style={{
            backgroundColor: 'white',
            color: '#1e40af',
            padding: '15px 30px',
            border: 'none',
            borderRadius: '5px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'transform 0.3s ease'
          }}>
            Send Us Your Resume
          </button>
        </div>
      </section>

      <Footer darkMode={darkMode} />
    </div>
  );
};

export default Careers;
