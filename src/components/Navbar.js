import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';
import { usePublicData } from '../contexts/PublicDataContext';
import './Navbar.css';

const navItems = [
  { label: 'Features', to: '/features' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Community', to: '/community' },
  { label: 'Contact', to: '/contact' },
];

const Navbar = ({ darkMode = false }) => {
  const { siteData } = usePublicData();
  const brand = siteData.brand;

  return (
    <header className={`public-navbar ${darkMode ? 'is-dark' : ''}`}>
      <div className="public-navbar__inner">
        <Link className="public-navbar__brand" to="/">
          {brand.logo ? (
            <img src={brand.logo} alt={brand.shortName} className="public-navbar__logo-img" />
          ) : (
            <span className="public-navbar__logo-mark">F</span>
          )}
          <span>{brand.shortName || brand.name}</span>
        </Link>

        <input id="public-nav-toggle" className="public-navbar__toggle" type="checkbox" />
        <label className="public-navbar__toggle-button" htmlFor="public-nav-toggle" aria-label="Toggle navigation">
          <FaBars />
        </label>

        <nav className="public-navbar__links">
          {navItems.map((item) => (
            <NavLink key={item.to} exact={item.to === '/'} to={item.to} activeClassName="active">
              {item.label}
            </NavLink>
          ))}
          <Link className="public-navbar__login" to="/login">Login</Link>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
