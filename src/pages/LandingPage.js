import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaUsers, 
  FaCalendarCheck, 
  FaFileInvoiceDollar, 
  FaTasks, 
  FaChartLine, 
  FaShieldAlt,
  FaArrowRight,
  FaPlay,
  FaStar,
  FaChevronDown,
  FaBuilding,
  FaUserCheck,
  FaClock,
  FaAward,
  FaLock,
  FaCloud,
  FaMobileAlt,
  FaSync,
  FaQuoteLeft,
  FaQuoteRight,
  FaCheck,
  FaSun,
  FaMoon,
  FaLinkedin,
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaYoutube
} from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './LandingPage.css';

const LandingPage = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [stats, setStats] = useState({
    companies: 0,
    employees: 0,
    processed: 0,
    efficiency: 0
  });
  const sectionRefs = useRef([]);

  // Statistics counter animation
  useEffect(() => {
    const targetStats = {
      companies: 1250,
      employees: 50000,
      processed: 245000,
      efficiency: 98
    };

    const duration = 2000;
    const steps = 60;
    const increment = targetStats.companies / steps;
    const interval = duration / steps;

    let currentStats = { ...stats };
    const timer = setInterval(() => {
      currentStats = {
        companies: Math.min(Math.ceil(currentStats.companies + increment), targetStats.companies),
        employees: Math.min(Math.ceil(currentStats.employees + (targetStats.employees / steps)), targetStats.employees),
        processed: Math.min(Math.ceil(currentStats.processed + (targetStats.processed / steps)), targetStats.processed),
        efficiency: Math.min(currentStats.efficiency + (targetStats.efficiency / steps), targetStats.efficiency)
      };
      setStats(currentStats);

      if (currentStats.companies >= targetStats.companies) {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  // Testimonial auto-rotate
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Intersection Observer for fade-in animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    sectionRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const testimonials = [
    {
      name: "Sarah Johnson",
      position: "HR Director, TechCorp",
      content: "Fintradify transformed our HR operations. The automation features saved us 40 hours weekly!",
      rating: 5,
      avatar: "SJ"
    },
    {
      name: "Michael Chen",
      position: "Operations Manager, GlobalBank",
      content: "The analytics dashboard provided insights we never had before. Employee satisfaction increased by 30%.",
      rating: 5,
      avatar: "MC"
    },
    {
      name: "Emma Rodriguez",
      position: "CEO, StartUpScale",
      content: "As a growing company, Fintradify scaled perfectly with our needs. The best investment we made.",
      rating: 4,
      avatar: "ER"
    }
  ];

  const features = [
    { icon: <FaUsers />, title: "Attendance Management", description: "Real-time biometric and mobile tracking with AI-powered analytics and automated reporting." },
    { icon: <FaCalendarCheck />, title: "Leave Management", description: "Smart workflow automation with policy enforcement, calendar integration, and mobile approvals." },
    { icon: <FaFileInvoiceDollar />, title: "Payroll Processing", description: "Automated salary calculations, tax compliance, digital payslips, and bank integration." },
    { icon: <FaTasks />, title: "Task Management", description: "Agile project tracking, team collaboration tools, and performance analytics dashboard." },
    { icon: <FaChartLine />, title: "Performance Analytics", description: "Advanced analytics with predictive insights, KPI tracking, and custom reporting." },
    { icon: <FaShieldAlt />, title: "Security & Compliance", description: "Enterprise-grade security, GDPR compliance, audit trails, and role-based access control." }
  ];

  const premiumFeatures = [
    "Advanced AI Analytics",
    "Custom Workflow Builder",
    "Dedicated Account Manager",
    "24/7 Premium Support",
    "API Integration",
    "Custom Branding",
    "Advanced Security Suite",
    "Multi-location Support",
    "Training & Onboarding",
    "SLA Guarantee"
  ];

  const clientLogos = [
    "TechCorp", "GlobalBank", "StartUpScale", "InnovateCo", "FutureLabs",
    "DigitalFirst", "CloudSystems", "DataSphere", "SmartSolutions", "NextGen"
  ];

  return (
    <div className={`landing-page ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Particle Background */}
      <div className="particles-container">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            opacity: 0.1 + Math.random() * 0.2
          }} />
        ))}
      </div>

      <Navbar darkMode={darkMode} />
      
      {/* Theme Toggle */}
      <button 
        className="theme-toggle"
        onClick={() => setDarkMode(!darkMode)}
        aria-label="Toggle dark mode"
      >
        {darkMode ? <FaSun /> : <FaMoon />}
      </button>

      {/* Hero Section */}
      <section ref={el => sectionRefs.current[0] = el} className="hero-section fade-in">
        <div className="hero-gradient-animation"></div>
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <FaAward /> Enterprise-Grade Solution
            </div>
            <h1 className="hero-title">
              Transform Your HR Operations with
              <span className="gradient-text"> Intelligent Automation</span>
            </h1>
            <p className="hero-subtitle">
              Streamline attendance, payroll, and performance management with our AI-powered platform. 
              Trusted by 1,250+ companies worldwide.
            </p>
            <div className="hero-buttons">
              <Link to="/login">
                <button className="cta-button primary">
                  Get Started Now
                  <FaArrowRight />
                </button>
              </Link>
              <button className="cta-button secondary">
                <FaPlay />
                Watch Demo
              </button>
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-value">{stats.companies.toLocaleString()}+</div>
                <div className="stat-label">Companies</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.employees.toLocaleString()}+</div>
                <div className="stat-label">Employees</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.processed.toLocaleString()}+</div>
                <div className="stat-label">Payrolls Processed</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.efficiency.toFixed(0)}%</div>
                <div className="stat-label">Efficiency Gain</div>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="dashboard-preview">
              {/* Dashboard visualization */}
              <div className="dashboard-card"></div>
              <div className="dashboard-card"></div>
              <div className="dashboard-card"></div>
            </div>
          </div>
        </div>
        <div className="scroll-indicator">
          <FaChevronDown />
        </div>
      </section>

      {/* Marquee Section */}
      <section className="marquee-section">
        <div className="marquee-track">
          <div className="marquee-content">
            {[...Array(3)].map((_, idx) => (
              <React.Fragment key={idx}>
                <span className="marquee-item"><FaCheck /> Enterprise Security</span>
                <span className="marquee-item"><FaCheck /> GDPR Compliant</span>
                <span className="marquee-item"><FaCheck /> 99.9% Uptime</span>
                <span className="marquee-item"><FaCheck /> 24/7 Support</span>
                <span className="marquee-item"><FaCheck /> Mobile App</span>
                <span className="marquee-item"><FaCheck /> API Access</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section ref={el => sectionRefs.current[1] = el} className="services-section fade-in">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Comprehensive HR Solutions</h2>
            <p className="section-subtitle">Everything you need to manage your workforce efficiently</p>
          </div>
          <div className="services-grid">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="service-card glassmorphic"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="service-icon">
                  {feature.icon}
                </div>
                <h3 className="service-title">{feature.title}</h3>
                <p className="service-description">{feature.description}</p>
                <div className="service-hover-effect"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Dashboard */}
      <section ref={el => sectionRefs.current[2] = el} className="stats-section fade-in">
        <div className="container">
          <div className="stats-dashboard glassmorphic">
            <div className="stats-header">
              <h3>Real-time Performance Metrics</h3>
              <div className="live-badge">
                <div className="pulse"></div>
                LIVE
              </div>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon"><FaBuilding /></div>
                <div className="stat-content">
                  <div className="stat-number">1,250</div>
                  <div className="stat-label">Active Companies</div>
                </div>
                <div className="stat-trend positive">+12% this month</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><FaUserCheck /></div>
                <div className="stat-content">
                  <div className="stat-number">50K+</div>
                  <div className="stat-label">Employees Managed</div>
                </div>
                <div className="stat-trend positive">+8% this month</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><FaClock /></div>
                <div className="stat-content">
                  <div className="stat-number">40hrs</div>
                  <div className="stat-label">Avg. Time Saved Weekly</div>
                </div>
                <div className="stat-trend positive">+15% efficiency</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><FaSync /></div>
                <div className="stat-content">
                  <div className="stat-number">99.9%</div>
                  <div className="stat-label">System Uptime</div>
                </div>
                <div className="stat-trend neutral">Stable</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section ref={el => sectionRefs.current[3] = el} className="testimonials-section fade-in">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Trusted by Industry Leaders</h2>
            <p className="section-subtitle">See what our clients say about us</p>
          </div>
          <div className="testimonials-container">
            <div className="testimonials-slider">
              {testimonials.map((testimonial, index) => (
                <div 
                  key={index}
                  className={`testimonial-card glassmorphic ${index === activeTestimonial ? 'active' : ''}`}
                  onClick={() => setActiveTestimonial(index)}
                >
                  <FaQuoteLeft className="quote-icon left" />
                  <div className="testimonial-content">
                    <p>{testimonial.content}</p>
                  </div>
                  <FaQuoteRight className="quote-icon right" />
                  <div className="testimonial-author">
                    <div className="author-avatar">
                      {testimonial.avatar}
                    </div>
                    <div className="author-info">
                      <h4>{testimonial.name}</h4>
                      <p>{testimonial.position}</p>
                    </div>
                  </div>
                  <div className="testimonial-rating">
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} className={i < testimonial.rating ? 'filled' : ''} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="testimonial-dots">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${index === activeTestimonial ? 'active' : ''}`}
                  onClick={() => setActiveTestimonial(index)}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Premium Features Table */}
      <section ref={el => sectionRefs.current[4] = el} className="features-section fade-in">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Compare Our Plans</h2>
            <p className="section-subtitle">Choose the perfect plan for your organization</p>
          </div>
          <div className="features-table glassmorphic">
            <div className="table-header">
              <div className="plan-header">
                <h3>Premium Features</h3>
                <div className="plan-badge premium">RECOMMENDED</div>
              </div>
            </div>
            <div className="table-body">
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="feature-row">
                  <div className="feature-name">
                    <FaCheck className="check-icon" />
                    {feature}
                  </div>
                  <div className="feature-availability">
                    <span className="available">Available</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="table-footer">
              <Link to="/login">
                <button className="cta-button primary large">
                  Get Premium Access
                  <FaArrowRight />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section ref={el => sectionRefs.current[5] = el} className="trust-section fade-in">
        <div className="container">
          <div className="trust-badges">
            <div className="trust-badge glassmorphic">
              <FaLock />
              <span>GDPR Compliant</span>
            </div>
            <div className="trust-badge glassmorphic">
              <FaShieldAlt />
              <span>SOC 2 Certified</span>
            </div>
            <div className="trust-badge glassmorphic">
              <FaCloud />
              <span>AWS Partner</span>
            </div>
            <div className="trust-badge glassmorphic">
              <FaMobileAlt />
              <span>Mobile First</span>
            </div>
          </div>
        </div>
      </section>

      {/* Video Demo */}
      <section ref={el => sectionRefs.current[6] = el} className="demo-section fade-in">
        <div className="container">
          <div className="demo-container glassmorphic">
            <div className="demo-content">
              <h3>See Fintradify in Action</h3>
              <p>Watch our 2-minute demo to see how Fintradify can transform your HR operations</p>
              <button className="play-button">
                <FaPlay />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Client Logos */}
      <section ref={el => sectionRefs.current[7] = el} className="clients-section fade-in">
        <div className="container">
          <div className="section-header">
            <h3 className="section-title">Trusted by Leading Companies</h3>
          </div>
          <div className="clients-grid">
            {clientLogos.map((logo, index) => (
              <div key={index} className="client-logo glassmorphic">
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section ref={el => sectionRefs.current[8] = el} className="final-cta-section fade-in">
        <div className="container">
          <div className="final-cta glassmorphic">
            <h2>Ready to Transform Your HR Management?</h2>
            <p>Join 1,250+ companies already using Fintradify</p>
            <Link to="/login">
              <button className="cta-button primary x-large">
                Start Your Free Trial
                <FaArrowRight />
              </button>
            </Link>
            <p className="cta-note">No credit card required • 14-day free trial • Full support included</p>
          </div>
        </div>
      </section>

      <Footer darkMode={darkMode} />
    </div>
  );
};

export default LandingPage;