
import React from 'react';
import {
  FaGooglePlay,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaInstagram,
  FaYoutube,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt
} from 'react-icons/fa';
import './Footer.css';

const Footer = ({ darkMode = false }) => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: 'Features', href: '/features' },
      { name: 'Pricing', href: '/pricing' },
      { name: 'Integrations', href: '/integrations' },
      { name: 'API', href: '/api' }
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Careers', href: '/careers' },
      { name: 'Press', href: '/press' },
      { name: 'Contact', href: '/contact' }
    ],
    support: [
      { name: 'Help Center', href: '/help' },
      { name: 'Documentation', href: '/docs' },
      { name: 'Community', href: '/community' },
      { name: 'Status', href: '/status' }
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy-policy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'GDPR', href: '/gdpr' },
      { name: 'Compliance', href: '/compliance' }
    ]
  };

  const socialLinks = [
    { icon: <FaFacebook />, href: 'https://facebook.com/fintradify', label: 'Facebook' },
    { icon: <FaTwitter />, href: 'https://twitter.com/fintradify', label: 'Twitter' },
    { icon: <FaLinkedin />, href: 'https://linkedin.com/company/fintradify', label: 'LinkedIn' },
    { icon: <FaInstagram />, href: 'https://instagram.com/fintradify', label: 'Instagram' },
    { icon: <FaYoutube />, href: 'https://youtube.com/fintradify', label: 'YouTube' }
  ];

  return (
    <footer className={`footer ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-main">
          {/* Company Info */}
          <div className="footer-section company-info">
            <div className="footer-logo">
              <div className="logo-icon">F</div>
              <span className="logo-text">Fintradify</span>
            </div>
            <p className="company-description">
              Transform your HR operations with intelligent automation. Trusted by 1,250+ companies worldwide.
            </p>
            <div className="app-download">
              <h4>Download Our App</h4>
              <a
                href="https://play.google.com/store/apps/details?id=com.fintradify.hrportal"
                target="_blank"
                rel="noopener noreferrer"
                className="download-button playstore"
              >
                <FaGooglePlay />
                <div className="download-info">
                  <span className="download-text">Get it on</span>
                  <span className="store-name">Google Play</span>
                </div>
              </a>
            </div>

          </div>

          {/* Links Sections */}
          <div className="footer-section">
            <h3>Product</h3>
            <ul>
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <a href={link.href}>{link.name}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-section">
            <h3>Company</h3>
            <ul>
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <a href={link.href}>{link.name}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-section">
            <h3>Support</h3>
            <ul>
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <a href={link.href}>{link.name}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-section">
            <h3>Legal</h3>
            <ul>
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <a href={link.href}>{link.name}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="footer-contact">
          <div className="contact-item">
            <FaPhone />
            <span><strong>Call Us:</strong> +91 78360 09907</span>
          </div>
          <div className="contact-item">
            <FaEnvelope />
            <span><strong>Email:</strong> support@fintradify.com</span>
          </div>
          <div className="contact-item">
            <FaMapMarkerAlt />
            <span><strong>Address:</strong> C6, C Block, Sector 7, Noida, UP 201301</span>
          </div>
        </div>

        {/* Social Links */}
        <div className="footer-social">
          <h3>Follow Us</h3>
          <div className="social-links">
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="social-link"
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p>&copy; {currentYear} Fintradify HR Portal. All rights reserved.</p>
          <div className="footer-bottom-links">
            <a href="/privacy-policy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/cookies">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
