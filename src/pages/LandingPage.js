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
  FaYoutube,
  FaCogs,
  FaRobot,
  FaChartBar,
  FaDatabase,
  FaHandshake,
  FaGlobe,
  FaRocket,
  FaBell,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt
} from 'react-icons/fa';
import { MdDashboard, MdSecurity, MdIntegrationInstructions } from 'react-icons/md';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './LandingPage.css';

const LandingPage = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);
  const [stats, setStats] = useState({
    companies: 0,
    employees: 0,
    processed: 0,
    efficiency: 0
  });
  const [email, setEmail] = useState('');
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

  // Feature showcase auto-rotate
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % featuresShowcase.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Intersection Observer for animations
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
      name: "Rajesh Kumar",
      position: "HR Manager, Tata Consultancy Services",
      content: "Fintradify transformed our HR operations completely. The automation features saved us 40 hours weekly!",
      rating: 5,
      avatar: "RK",
      companyLogo: "TCS"
    },
    {
      name: "Priya Sharma",
      position: "Operations Director, Infosys",
      content: "The analytics dashboard provided insights we never had before. Employee satisfaction increased by 30%.",
      rating: 5,
      avatar: "PS",
      companyLogo: "Infosys"
    },
    {
      name: "Amit Patel",
      position: "CEO, TechMahindra Solutions",
      content: "As our company grows, Fintradify scales perfectly. This has been our best investment.",
      rating: 5,
      avatar: "AP",
      companyLogo: "TechM"
    }
  ];

  const features = [
    { 
      icon: <MdDashboard />, 
      title: "Smart Dashboard", 
      description: "Real-time analytics and customizable widgets for comprehensive HR overview.",
      color: "#3B82F6"
    },
    { 
      icon: <FaRobot />, 
      title: "AI-Powered Automation", 
      description: "Intelligent automation for payroll, attendance, and performance reviews.",
      color: "#10B981"
    },
   
    { 
      icon: <MdSecurity />, 
      title: "Enterprise Security", 
      description: "Military-grade encryption, GDPR compliance, and audit trails.",
      color: "#EF4444"
    },
    { 
      icon: <MdIntegrationInstructions />, 
      title: "Seamless Integration", 
      description: "Integrate with existing ERP, accounting, and communication tools.",
      color: "#F59E0B"
    },
    { 
      icon: <FaMobileAlt />, 
      title: "Mobile-First Design", 
      description: "Fully responsive mobile app for employees and managers.",
      color: "#EC4899"
    }
  ];

  const featuresShowcase = [
    {
      title: "Attendance Management",
      description: "Biometric, mobile, and facial recognition attendance with AI-powered anomaly detection.",
      image: "https://snacknation.com/wp-content/uploads/2023/06/Paychex-Payroll-e1693270315828.jpg"
    },
    {
      title: "Payroll Processing",
      description: "Automated salary calculations, tax compliance, and direct bank integration.",
      image: "https://snacknation.com/wp-content/uploads/2022/04/onpay-office-management-e1706289438224.png"
    },
    {
      title: "Performance Management",
      description: "360-degree reviews, OKR tracking, and continuous feedback system.",
      image: "https://www.sumhr.com/wp-content/uploads/2022/12/perf-dash.png"
    },
    {
      title: "Employee Self-Service",
      description: "Leave applications, document access, and profile management portal.",
      image: "https://i.pinimg.com/736x/c3/83/85/c38385bcf6b2e0c7d25ff349912dd0eb.jpg"
    }
  ];

  const premiumFeatures = [
    "Advanced AI Analytics Dashboard",
    "Custom Workflow Builder",
    "Dedicated Account Manager",
    "24/7 Premium Support with SLA",
    "Unlimited API Integrations",
    "Custom Branding & White Labeling",
    "Advanced Security Suite",
    "Multi-location Global Support",
    "Training & Onboarding Sessions",
    "99.9% Uptime Guarantee"
  ];

  const clientLogos = [
    "TATA", "Infosys", "Wipro", "HCL", "Tech Mahindra",
    "Accenture", "Capgemini", "Cognizant", "IBM", "Microsoft"
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "Free",
      period: "/month",
      description: "Perfect for small teams",
      features: ["Up to 50 employees", "Basic HR Management", "Email Support", "Standard Reports"],
      cta: "Start Free Trial",
      popular: false
    },
    {
      name: "Professional",
      price: "$9",
      period: "/month",
      description: "For growing businesses",
      features: ["Up to 500 employees", "Advanced Analytics", "Priority Support", "Custom Workflows", "API Access"],
      cta: "Get Started",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "Unlimited",
      description: "For large organizations",
      features: ["Unlimited Employees", "Dedicated Instance", "24/7 Phone Support", "Custom Development", "SLA Guarantee"],
      cta: "Contact Sales",
      popular: false
    }
  ];

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email) {
      alert(`Thank you for subscribing with ${email}`);
      setEmail('');
    }
  };

  return (
    <div className={`landing-page ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Animated Background Elements */}
      <div className="background-elements">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
        <div className="floating-shape shape-4"></div>
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
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <FaAward /> Trusted by {stats.companies.toLocaleString()}+ Companies
            </div>
            <h1 className="hero-title">
              Modern HR Management
              <span className="gradient-text"> Made Simple</span>
            </h1>
            <p className="hero-subtitle">
              Fintradify HR Portal is a comprehensive cloud-based HR management solution that 
              automates attendance tracking, payroll processing, performance management, and 
              employee engagement. Built for modern enterprises with scalability and security 
              at its core.
            </p>
            <div className="hero-buttons">
              <Link to="/login">
                <button className="cta-button primary text-light">
                  Start 14-Day Free Trial
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
                <div className="stat-icon"><FaBuilding /></div>
                <div className="stat-value">{stats.companies.toLocaleString()}+</div>
                <div className="stat-label">Companies</div>
              </div>
              <div className="stat-item">
                <div className="stat-icon"><FaUsers /></div>
                <div className="stat-value">{stats.employees.toLocaleString()}+</div>
                <div className="stat-label">Employees</div>
              </div>
              <div className="stat-item">
                <div className="stat-icon"><FaFileInvoiceDollar /></div>
                <div className="stat-value">${(stats.processed/1000).toFixed(0)}M+</div>
                <div className="stat-label">Processed</div>
              </div>
              <div className="stat-item">
                <div className="stat-icon"><FaChartLine /></div>
                <div className="stat-value">{stats.efficiency.toFixed(0)}%</div>
                <div className="stat-label">Efficiency Gain</div>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="dashboard-preview">
              <div className="dashboard-header">
                <div className="dashboard-title">Fintradify Dashboard</div>
                <div className="dashboard-status">
                  <div className="status-pulse"></div>
                  Live Dashboard
                </div>
              </div>
              <div className="dashboard-content">
                <div className="metric-row">
                  <div className="metric-card">
                    <div className="metric-label">Active Employees</div>
                    <div className="metric-value">1,247</div>
                    <div className="metric-trend up">+12%</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Attendance Rate</div>
                    <div className="metric-value">98.5%</div>
                    <div className="metric-trend up">+2.1%</div>
                  </div>
                </div>
                <div className="chart-container">
                  <div className="chart-title">Weekly Performance</div>
                  <div className="chart-placeholder">
                    <div style={{
                      width: '100%',
                      height: '140px',
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      padding: '15px',
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      <svg viewBox="0 0 320 120" style={{width: '100%', height: '100%'}}>
                        <defs>
                          <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{stopColor:'#3B82F6', stopOpacity:1}} />
                            <stop offset="100%" style={{stopColor:'#1D4ED8', stopOpacity:1}} />
                          </linearGradient>
                        </defs>

                        {/* Grid lines */}
                        <line x1="30" y1="20" x2="30" y2="100" stroke="#E5E7EB" strokeWidth="1"/>
                        <line x1="30" y1="100" x2="290" y2="100" stroke="#E5E7EB" strokeWidth="1"/>
                        <line x1="30" y1="75" x2="290" y2="75" stroke="#F3F4F6" strokeWidth="1"/>
                        <line x1="30" y1="50" x2="290" y2="50" stroke="#F3F4F6" strokeWidth="1"/>
                        <line x1="30" y1="25" x2="290" y2="25" stroke="#F3F4F6" strokeWidth="1"/>

                        {/* Bars with data */}
                        {[
                          { day: 'Mon', value: 65 },
                          { day: 'Tue', value: 80 },
                          { day: 'Wed', value: 45 },
                          { day: 'Thu', value: 90 },
                          { day: 'Fri', value: 70 },
                          { day: 'Sat', value: 85 },
                          { day: 'Sun', value: 60 }
                        ].map((item, i) => {
                          const barHeight = (item.value / 100) * 70;
                          const x = 40 + (i * 35);
                          return (
                            <g key={i}>
                              <rect
                                x={x}
                                y={100 - barHeight}
                                width="25"
                                height={barHeight}
                                fill="url(#barGradient)"
                                rx="3"
                                className="chart-bar-svg"
                              />
                              <text
                                x={x + 12.5}
                                y="115"
                                textAnchor="middle"
                                fontSize="9"
                                fill="#6B7280"
                                fontWeight="500"
                              >
                                {item.day}
                              </text>
                            </g>
                          );
                        })}

                        {/* Y-axis labels */}
                        <text x="25" y="105" textAnchor="end" fontSize="8" fill="#9CA3AF">0</text>
                        <text x="25" y="80" textAnchor="end" fontSize="8" fill="#9CA3AF">25</text>
                        <text x="25" y="55" textAnchor="end" fontSize="8" fill="#9CA3AF">50</text>
                        <text x="25" y="30" textAnchor="end" fontSize="8" fill="#9CA3AF">75</text>
                        <text x="25" y="5" textAnchor="end" fontSize="8" fill="#9CA3AF">100</text>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="recent-activity">
                  <div className="activity-title">Recent Activities</div>
                  <div className="activity-item">
                    <div className="activity-icon"><FaUserCheck /></div>
                    <div className="activity-text">5 new employees onboarded</div>
                    <div className="activity-time">2 min ago</div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon"><FaCalendarCheck /></div>
                    <div className="activity-text">Monthly payroll processed</div>
                    <div className="activity-time">1 hour ago</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="scroll-indicator">
          <FaChevronDown />
        </div>
      </section>

      {/* Trust Bar */}
      <section className="trust-bar">
        <div className="container">
          <div className="trust-title">Trusted by industry leaders</div>
          <div className="trust-logos">
            {clientLogos.slice(0, 6).map((logo, index) => (
              <div key={index} className="trust-logo">{logo}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={el => sectionRefs.current[1] = el} className="features-section fade-in">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Powerful Features for Modern HR</h2>
            <p className="section-subtitle">Everything you need to manage your workforce efficiently and effectively</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon-wrapper" style={{backgroundColor: `${feature.color}15`}}>
                  <div className="feature-icon" style={{color: feature.color}}>
                    {feature.icon}
                  </div>
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                <div className="feature-hover-line"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Showcase */}
      <section ref={el => sectionRefs.current[2] = el} className="showcase-section fade-in">
        <div className="container">
          <div className="showcase-content">
            <div className="showcase-text">
              <h2>Complete HR Suite in One Platform</h2>
              <p>Fintradify provides an all-in-one solution that covers every aspect of human resource management, from recruitment to retirement.</p>
              <div className="showcase-list">
                {featuresShowcase.map((item, index) => (
                  <div 
                    key={index} 
                    className={`showcase-list-item ${index === activeFeature ? 'active' : ''}`}
                    onMouseEnter={() => setActiveFeature(index)}
                  >
                    <div className="list-item-header">
                      <FaCheck className="check-icon" />
                      <span>{item.title}</span>
                    </div>
                    <p className="list-item-description">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="showcase-visual">
              <div className="showcase-image">
                <img
                  src={featuresShowcase[activeFeature].image}
                  alt={featuresShowcase[activeFeature].title}
                  className="showcase-screenshot"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="image-placeholder" style={{display: 'none'}}>
                  <div className="placeholder-icon">
                    <FaChartLine size={48} />
                  </div>
                  <p>Dashboard Preview</p>
                </div>
                <div className="showcase-indicators">
                  {featuresShowcase.map((_, index) => (
                    <button
                      key={index}
                      className={`indicator ${index === activeFeature ? 'active' : ''}`}
                      onClick={() => setActiveFeature(index)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section ref={el => sectionRefs.current[3] = el} className="benefits-section fade-in">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why Choose Fintradify?</h2>
            <p className="section-subtitle">Transform your HR operations with our comprehensive platform</p>
          </div>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon"><FaClock /></div>
              <h3>Save 40+ Hours Monthly</h3>
              <p>Automate routine HR tasks and focus on strategic initiatives</p>
            </div>
           
            <div className="benefit-card">
              <div className="benefit-icon"><FaShieldAlt /></div>
              <h3>Enterprise Security</h3>
              <p>SOC 2 compliant with end-to-end encryption and regular audits</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon"><FaSync /></div>
              <h3>Seamless Integration</h3>
              <p>Connect with your existing tools via our extensive API library</p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Dashboard */}
      <section ref={el => sectionRefs.current[4] = el} className="stats-dashboard-section fade-in">
        <div className="container">
          <div className="dashboard-card">
            <div className="dashboard-header">
              <h3>Real-time Performance Metrics</h3>
              <div className="dashboard-badge">
                <span className="live-dot"></span>
                LIVE DATA
              </div>
            </div>
            <div className="stats-grid">
              <div className="stat-card-large">
                <div className="stat-icon-large"><FaBuilding /></div>
                <div className="stat-content-large">
                  <div className="stat-number-large">{stats.companies.toLocaleString()}</div>
                  <div className="stat-label-large">Active Companies</div>
                  <div className="stat-trend-large positive">+12% this month</div>
                </div>
              </div>
              <div className="stat-card-large">
                <div className="stat-icon-large"><FaUserCheck /></div>
                <div className="stat-content-large">
                  <div className="stat-number-large">{stats.employees.toLocaleString()}</div>
                  <div className="stat-label-large">Employees Managed</div>
                  <div className="stat-trend-large positive">+8% this month</div>
                </div>
              </div>
              <div className="stat-card-large">
                <div className="stat-icon-large"><FaFileInvoiceDollar /></div>
                <div className="stat-content-large">
                  <div className="stat-number-large">${(stats.processed/1000000).toFixed(1)}M</div>
                  <div className="stat-label-large">Payroll Processed</div>
                  <div className="stat-trend-large positive">+15% efficiency</div>
                </div>
              </div>
              <div className="stat-card-large">
                <div className="stat-icon-large"><FaSync /></div>
                <div className="stat-content-large">
                  <div className="stat-number-large">99.9%</div>
                  <div className="stat-label-large">System Uptime</div>
                  <div className="stat-trend-large neutral">Stable</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section ref={el => sectionRefs.current[5] = el} className="testimonials-section fade-in">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">What Our Clients Say</h2>
            <p className="section-subtitle">Join thousands of satisfied customers who transformed their HR operations</p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className={`testimonial-card ${index === activeTestimonial ? 'active' : ''}`}
                onClick={() => setActiveTestimonial(index)}
              >
                <div className="testimonial-header">
                  <div className="company-logo">{testimonial.companyLogo}</div>
                  <div className="testimonial-rating">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <FaStar key={i} className="star-icon" />
                    ))}
                  </div>
                </div>
                <div className="testimonial-content">
                  <FaQuoteLeft className="quote-icon" />
                  <p>{testimonial.content}</p>
                  <FaQuoteRight className="quote-icon" />
                </div>
                <div className="testimonial-author">
                  <div className="author-avatar">{testimonial.avatar}</div>
                  <div className="author-info">
                    <h4>{testimonial.name}</h4>
                    <p>{testimonial.position}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="testimonial-controls">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`control-dot ${index === activeTestimonial ? 'active' : ''}`}
                onClick={() => setActiveTestimonial(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section ref={el => sectionRefs.current[6] = el} className="pricing-section fade-in">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Simple, Transparent Pricing</h2>
            <p className="section-subtitle">Choose the perfect plan for your organization's needs</p>
          </div>
          <div className="pricing-grid">
            {pricingPlans.map((plan, index) => (
              <div key={index} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
                {plan.popular && <div className="popular-badge">Most Popular</div>}
                <div className="plan-header">
                  <h3 className="plan-name">{plan.name}</h3>
                  <div className="plan-price">
                    <span className="price">{plan.price}</span>
                    <span className="period">{plan.period}</span>
                  </div>
                  <p className="plan-description">{plan.description}</p>
                </div>
                <div className="plan-features">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="feature-item">
                      <FaCheck className="feature-check" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="plan-footer">
                  <button className={`plan-button ${plan.popular ? 'primary' : 'secondary'}`}>
                    {plan.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={el => sectionRefs.current[7] = el} className="cta-section fade-in">
        <div className="container">
          <div className="cta-card">
            <div className="cta-content">
              <h2>Ready to Transform Your HR Operations?</h2>
              <p>Join 1,250+ companies who trust Fintradify with their HR management</p>
              <div className="cta-buttons">
                <Link to="/login">
                  <button className="cta-button primary large">
                    Start Your Free Trial
                    <FaArrowRight />
                  </button>
                </Link>
                <button className="cta-button outline">
                  Schedule a Demo
                </button>
              </div>
            </div>
            <div className="cta-stats">
              <div className="cta-stat">
                <div className="stat-number">14-day</div>
                <div className="stat-label">Free Trial</div>
              </div>
              <div className="cta-stat">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Support</div>
              </div>
              <div className="cta-stat">
                <div className="stat-number">99.9%</div>
                <div className="stat-label">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section ref={el => sectionRefs.current[8] = el} className="newsletter-section fade-in">
        <div className="container">
          <div className="newsletter-card">
            <div className="newsletter-content">
              <h3>Stay Updated with HR Trends</h3>
              <p>Subscribe to our newsletter for the latest HR insights, product updates, and industry best practices.</p>
            </div>
            <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
              <div className="form-group">
                <input
                  type="email"
                  placeholder="Enter your work email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="subscribe-button">
                  Subscribe
                  <FaArrowRight />
                </button>
              </div>
              <p className="form-note">We respect your privacy. Unsubscribe at any time.</p>
            </form>
          </div>
        </div>
      </section>

      <Footer darkMode={darkMode} />
    </div>
  );
};

export default LandingPage;