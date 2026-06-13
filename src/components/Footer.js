import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaEnvelope, FaFacebook, FaGooglePlay, FaInstagram, FaLinkedin, FaMapMarkerAlt, FaPhone, FaTwitter, FaYoutube } from 'react-icons/fa';
import { usePublicData } from '../contexts/PublicDataContext';
import './Footer.css';

const groups = {
  Product: [
    ['Features', '/features'],
    ['Pricing', '/pricing'],
    ['Integrations', '/integrations'],
    ['API', '/api'],
  ],
  Company: [
    ['About', '/about'],
    ['Careers', '/careers'],
    ['Press', '/press'],
    ['Contact', '/contact'],
  ],
  Support: [
    ['Help Center', '/help'],
    ['Documentation', '/docs'],
    ['Community', '/community'],
    ['Status', '/status'],
  ],
  Legal: [
    ['Privacy', '/privacy-policy'],
    ['Terms', '/terms'],
    ['Cookies', '/cookies'],
    ['GDPR', '/gdpr'],
    ['Compliance', '/compliance'],
  ],
};

const socials = [
  [FaFacebook, 'Facebook', 'https://facebook.com/fintradify'],
  [FaTwitter, 'Twitter', 'https://twitter.com/fintradify'],
  [FaLinkedin, 'LinkedIn', 'https://linkedin.com/company/fintradify'],
  [FaInstagram, 'Instagram', 'https://instagram.com/fintradify'],
  [FaYoutube, 'YouTube', 'https://youtube.com/fintradify'],
];

const Footer = ({ darkMode = false }) => {
  const { siteData } = usePublicData();
  const brand = siteData.brand;
  const logoSrc = brand.logo || '/fintradify-logo.png';

  return (
    <footer
      className={`public-footer ${darkMode ? 'is-dark' : ''}`}
      style={{ '--footer-logo-watermark': `url("${logoSrc}")` }}
    >
      <div className="public-footer__inner">
        <div className="public-footer__intro">
          <Link className="public-footer__brand" to="/">
            <span className="public-footer__logo-wrap">
              <img src={logoSrc} alt={brand.shortName || 'Fintradify'} className="public-footer__logo-img" />
            </span>
            <span className="public-footer__brand-copy">
              <strong>{brand.shortName || 'Fintradify'}</strong>
              <small>HR Portal</small>
            </span>
          </Link>
          <p>{brand.tagline}</p>
          <div className="public-footer__actions">
            <a className="public-footer__store" href={brand.appUrl} target="_blank" rel="noopener noreferrer">
              <FaGooglePlay />
              <span>Google Play</span>
            </a>
            <Link className="public-footer__cta" to="/verify-certificate">
              Find Employee <FaArrowRight />
            </Link>
          </div>
        </div>

        {Object.entries(groups).map(([title, links]) => (
          <div className="public-footer__group" key={title}>
            <h3>{title}</h3>
            {links.map(([label, to]) => (
              <Link key={to} to={to}>{label}</Link>
            ))}
          </div>
        ))}
      </div>

      <div className="public-footer__contact">
        <a href={`tel:${String(brand.phone || '').replace(/\s+/g, '')}`}><FaPhone /> {brand.phone}</a>
        <a href={`mailto:${brand.email}`}><FaEnvelope /> {brand.email}</a>
        <span><FaMapMarkerAlt /> {brand.address}</span>
      </div>

      <div className="public-footer__bottom">
        <span>&copy; {new Date().getFullYear()} {brand.name}. All rights reserved.</span>
        <div>
          {socials.map(([Icon, label, href]) => (
            <a key={label} href={href} aria-label={label} target="_blank" rel="noopener noreferrer">
              <Icon />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
