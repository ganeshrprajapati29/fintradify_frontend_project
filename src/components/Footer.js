import React from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaFacebook, FaGooglePlay, FaInstagram, FaLinkedin, FaMapMarkerAlt, FaPhone, FaTwitter, FaYoutube } from 'react-icons/fa';
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

  return (
    <footer className={`public-footer ${darkMode ? 'is-dark' : ''}`}>
      <div className="public-footer__inner">
        <div className="public-footer__intro">
          <Link className="public-footer__brand" to="/">
            <span className="public-footer__mark">F</span>
            <span>{brand.name}</span>
          </Link>
          <p>{brand.tagline}</p>
          <a className="public-footer__store" href={brand.appUrl} target="_blank" rel="noopener noreferrer">
            <FaGooglePlay />
            <span>Get it on Google Play</span>
          </a>
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
        <span><FaPhone /> {brand.phone}</span>
        <span><FaEnvelope /> {brand.email}</span>
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
