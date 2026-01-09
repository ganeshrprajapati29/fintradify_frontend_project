import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { FaUsers, FaAward, FaGlobe, FaRocket, FaShieldAlt, FaHandshake, FaLightbulb, FaHeart, FaTrophy, FaChartLine, FaStar } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const AboutUs = () => {
  const { settings } = useSettings();
  const [darkMode, setDarkMode] = useState(settings.theme === 'dark');

  const achievements = [
    { icon: <FaUsers />, number: '1,250+', label: 'Companies Served' },
    { icon: <FaGlobe />, number: '50,000+', label: 'Employees Managed' },
    { icon: <FaAward />, number: '98%', label: 'Customer Satisfaction' },
    { icon: <FaTrophy />, number: '25+', label: 'Countries' }
  ];

  const values = [
    {
      icon: <FaRocket />,
      title: 'Innovation',
      description: 'We continuously push boundaries with cutting-edge HR technology and AI-driven solutions.'
    },
    {
      icon: <FaShieldAlt />,
      title: 'Security',
      description: 'Enterprise-grade security and compliance are at the core of everything we do.'
    },
    {
      icon: <FaHandshake />,
      title: 'Partnership',
      description: 'We build lasting relationships with our clients, becoming true partners in their success.'
    },
    {
      icon: <FaLightbulb />,
      title: 'Excellence',
      description: 'We strive for excellence in every aspect of our service delivery and customer experience.'
    },
    {
      icon: <FaHeart />,
      title: 'Empathy',
      description: 'We understand the human side of HR and design solutions that enhance employee experiences.'
    },
    {
      icon: <FaChartLine />,
      title: 'Growth',
      description: 'We help businesses grow by providing scalable HR solutions that adapt to their needs.'
    }
  ];

  const milestones = [
    { year: '2020', event: 'Fintradify founded with vision to revolutionize HR management' },
    { year: '2021', event: 'Launched core HR automation platform with 100+ initial clients' },
    { year: '2022', event: 'Expanded to 500+ companies, added AI-powered analytics' },
    { year: '2023', event: 'Reached 1,000+ clients, launched mobile apps and advanced integrations' },
    { year: '2024', event: 'Global expansion, 1,250+ companies, industry-leading innovation' }
  ];

  return (
    <div>
      <Navbar darkMode={darkMode} onThemeToggle={() => setDarkMode(!darkMode)} />

      {/* Hero Section */}
      <section style={{
        background: darkMode
          ? 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '80px 0',
        textAlign: 'center'
      }}>
        <div className="container">
          <h1 style={{ fontSize: '3.5rem', marginBottom: '20px', fontWeight: 'bold' }}>About Fintradify</h1>
          <p style={{ fontSize: '1.3rem', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
            Transforming HR management through intelligent automation, empowering businesses to focus on what matters most - their people.
          </p>
        </div>
      </section>

      {/* Achievements Section */}
      <section style={{ padding: '60px 0', backgroundColor: darkMode ? '#1a202c' : '#f8fafc' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', marginBottom: '60px' }}>
            {achievements.map((achievement, index) => (
              <div key={index} style={{
                backgroundColor: darkMode ? '#2d3748' : 'white',
                padding: '40px 30px',
                borderRadius: '15px',
                textAlign: 'center',
                boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)',
                transition: 'transform 0.3s ease'
              }}>
                <div style={{ fontSize: '3rem', color: '#667eea', marginBottom: '20px' }}>
                  {achievement.icon}
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: darkMode ? '#63b3ed' : '#2b6cb0', marginBottom: '10px' }}>
                  {achievement.number}
                </div>
                <div style={{ fontSize: '1.1rem', color: darkMode ? '#a0aec0' : '#718096' }}>
                  {achievement.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container" style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto' }}>

        {/* Our Story */}
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{
            color: darkMode ? '#63b3ed' : '#2b6cb0',
            fontSize: '2.5rem',
            marginBottom: '30px',
            textAlign: 'center'
          }}>Our Story</h2>
          <div style={{
            backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
            padding: '40px',
            borderRadius: '15px',
            marginBottom: '40px'
          }}>
            <p style={{
              fontSize: '1.2rem',
              lineHeight: '1.8',
              color: darkMode ? '#e2e8f0' : '#2d3748',
              marginBottom: '20px'
            }}>
              Founded in 2020, Fintradify emerged from a simple yet powerful idea: HR management should be as dynamic
              and intelligent as the people it serves. Our founders, experienced HR professionals and technology experts,
              recognized that traditional HR systems were holding businesses back from achieving their full potential.
            </p>
            <p style={{
              fontSize: '1.2rem',
              lineHeight: '1.8',
              color: darkMode ? '#e2e8f0' : '#2d3748'
            }}>
              Today, we serve over 1,250 companies across 25+ countries, managing HR operations for more than 50,000
              employees. Our platform combines cutting-edge technology with deep HR expertise to deliver solutions that
              are not just efficient, but transformative.
            </p>
          </div>
        </section>

        {/* Mission & Vision */}
        <section style={{ marginBottom: '60px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '40px' }}>
            <div style={{
              backgroundColor: darkMode ? '#2d3748' : 'white',
              padding: '40px',
              borderRadius: '15px',
              boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <FaRocket style={{ fontSize: '3rem', color: '#667eea', marginBottom: '20px' }} />
                <h3 style={{ color: darkMode ? '#63b3ed' : '#2b6cb0', fontSize: '1.8rem', marginBottom: '20px' }}>Our Mission</h3>
              </div>
              <p style={{
                fontSize: '1.1rem',
                lineHeight: '1.7',
                color: darkMode ? '#e2e8f0' : '#2d3748',
                textAlign: 'center'
              }}>
                To empower businesses with cutting-edge HR technology that simplifies complex processes,
                enhances employee experiences, and drives organizational success through intelligent automation.
              </p>
            </div>

            <div style={{
              backgroundColor: darkMode ? '#2d3748' : 'white',
              padding: '40px',
              borderRadius: '15px',
              boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <FaStar style={{ fontSize: '3rem', color: '#667eea', marginBottom: '20px' }} />
                <h3 style={{ color: darkMode ? '#63b3ed' : '#2b6cb0', fontSize: '1.8rem', marginBottom: '20px' }}>Our Vision</h3>
              </div>
              <p style={{
                fontSize: '1.1rem',
                lineHeight: '1.7',
                color: darkMode ? '#e2e8f0' : '#2d3748',
                textAlign: 'center'
              }}>
                To be the global standard for HR automation, enabling organizations worldwide to focus on what matters most -
                their people - by providing unparalleled HR technology solutions that adapt and grow with their business.
              </p>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{
            color: darkMode ? '#63b3ed' : '#2b6cb0',
            fontSize: '2.5rem',
            marginBottom: '30px',
            textAlign: 'center'
          }}>Our Values</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
            {values.map((value, index) => (
              <div key={index} style={{
                backgroundColor: darkMode ? '#2d3748' : 'white',
                padding: '30px',
                borderRadius: '15px',
                boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)',
                textAlign: 'center',
                transition: 'transform 0.3s ease'
              }}>
                <div style={{ fontSize: '2.5rem', color: '#667eea', marginBottom: '20px' }}>
                  {value.icon}
                </div>
                <h4 style={{
                  color: darkMode ? '#63b3ed' : '#2b6cb0',
                  fontSize: '1.3rem',
                  marginBottom: '15px',
                  fontWeight: 'bold'
                }}>{value.title}</h4>
                <p style={{
                  color: darkMode ? '#a0aec0' : '#718096',
                  lineHeight: '1.6'
                }}>{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Company Milestones */}
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{
            color: darkMode ? '#63b3ed' : '#2b6cb0',
            fontSize: '2.5rem',
            marginBottom: '30px',
            textAlign: 'center'
          }}>Our Journey</h2>
          <div style={{
            backgroundColor: darkMode ? '#2d3748' : '#f7fafc',
            padding: '40px',
            borderRadius: '15px'
          }}>
            <div style={{ position: 'relative' }}>
              {milestones.map((milestone, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '30px',
                  paddingLeft: '30px',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    left: '0',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '12px',
                    height: '12px',
                    backgroundColor: '#667eea',
                    borderRadius: '50%',
                    border: `3px solid ${darkMode ? '#2d3748' : '#f7fafc'}`
                  }}></div>
                  {index < milestones.length - 1 && (
                    <div style={{
                      position: 'absolute',
                      left: '5px',
                      top: '12px',
                      width: '2px',
                      height: 'calc(100% + 18px)',
                      backgroundColor: '#667eea',
                      opacity: 0.3
                    }}></div>
                  )}
                  <div style={{ marginLeft: '20px' }}>
                    <div style={{
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      color: '#667eea',
                      marginBottom: '5px'
                    }}>{milestone.year}</div>
                    <div style={{
                      fontSize: '1rem',
                      color: darkMode ? '#e2e8f0' : '#2d3748',
                      lineHeight: '1.6'
                    }}>{milestone.event}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Leadership Team */}
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{
            color: darkMode ? '#63b3ed' : '#2b6cb0',
            fontSize: '2.5rem',
            marginBottom: '30px',
            textAlign: 'center'
          }}>Leadership Team</h2>
          <div style={{
            backgroundColor: darkMode ? '#2d3748' : 'white',
            padding: '40px',
            borderRadius: '15px',
            boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '1.2rem',
              lineHeight: '1.8',
              color: darkMode ? '#e2e8f0' : '#2d3748',
              marginBottom: '30px'
            }}>
              Our diverse leadership team combines decades of HR expertise with cutting-edge technology innovation.
              Led by industry veterans and supported by talented engineers and HR specialists, we work together to
              deliver exceptional solutions that drive business success.
            </p>
            <div style={{ marginBottom: '30px' }}>
              <h4 style={{
                color: darkMode ? '#63b3ed' : '#2b6cb0',
                fontSize: '1.4rem',
                marginBottom: '10px'
              }}></h4>
              <p style={{
                color: darkMode ? '#a0aec0' : '#718096',
                fontSize: '1rem'
              }}></p>
            </div>
            <p style={{
              fontSize: '1rem',
              color: darkMode ? '#a0aec0' : '#718096',
              fontStyle: 'italic'
            }}>
              "Our mission is to make HR management as dynamic and intelligent as the people it serves."
            </p>
          </div>
        </section>

        {/* Contact CTA */}
        <section style={{
          background: darkMode
            ? 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '60px 40px',
          borderRadius: '15px',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '2.2rem', marginBottom: '20px' }}>Ready to Transform Your HR Operations?</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '30px', opacity: '0.9' }}>
            Join over 1,250 companies worldwide who trust Fintradify for their HR management needs.
          </p>
          <div style={{ marginTop: '30px' }}>
            <p style={{ fontSize: '1rem', opacity: '0.8' }}>
              <strong>Contact Us:</strong><br/>
              Call Us: +91 78360 09907<br/>
              Email: support@fintradify.com<br/>
              Address: C6, C Block, Sector 7, Noida, UP 201301
            </p>
          </div>
        </section>
      </div>

      <Footer darkMode={darkMode} />
    </div>
  );
};

export default AboutUs;
