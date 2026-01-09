import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSun, FaMoon } from 'react-icons/fa';

const CustomNavbar = ({ darkMode = false, onThemeToggle }) => {
  return (
    <Navbar
      bg={darkMode ? 'dark' : 'light'}
      variant={darkMode ? 'dark' : 'light'}
      expand="lg"
      fixed="top"
      className="py-2"
      style={{
        backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
        boxShadow: darkMode ? '0 4px 20px rgba(0, 0, 0, 0.4)' : '0 4px 20px rgba(0, 0, 0, 0.08)',
        backdropFilter: 'blur(10px)',
        borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
      }}
    >
      <Container fluid className="px-4">
        {/* Logo Section */}
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center me-4">
          <div
            style={{
              width: '45px',
              height: '45px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.2rem',
              marginRight: '12px',
              boxShadow: '0 6px 12px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 8px 16px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 6px 12px rgba(102, 126, 234, 0.3)';
            }}
          >
            F
          </div>
          <span
            style={{
              fontSize: '1.4rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Fintradify
          </span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" className="border-0" />

        <Navbar.Collapse id="basic-navbar-nav">
          <div className="d-flex align-items-center ms-auto">
            <Nav className="d-flex me-3">
              <Nav.Link
                as={Link}
                to="/"
                className="mx-2 px-3 py-2 rounded-pill"
                style={{
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  transition: 'all 0.3s ease',
                  color: darkMode ? '#fff' : '#333',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Home
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/features"
                className="mx-2 px-3 py-2 rounded-pill"
                style={{
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  transition: 'all 0.3s ease',
                  color: darkMode ? '#fff' : '#333',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Features
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/contact"
                className="mx-2 px-3 py-2 rounded-pill"
                style={{
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  transition: 'all 0.3s ease',
                  color: darkMode ? '#fff' : '#333',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Contact
              </Nav.Link>
            </Nav>

            {/* Theme Toggle */}
            <Button
              variant="link"
              className="me-3 p-2 d-flex align-items-center justify-content-center"
              onClick={onThemeToggle}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                color: darkMode ? '#fff' : '#333',
                border: 'none',
                transition: 'all 0.3s ease',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                e.target.style.transform = 'scale(1.1) rotate(15deg)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.transform = 'scale(1) rotate(0deg)';
              }}
            >
              {/* {darkMode ? <FaSun size={18} /> : <FaMoon size={18} />} */}
            </Button>

            {/* Login Button */}
            <Button
              as={Link}
              to="/login"
              className="px-4 py-2 fw-semibold border-0 d-flex align-items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '25px',
                fontSize: '0.95rem',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                transition: 'all 0.3s ease',
                textDecoration: 'none',
                color: 'white',
                minWidth: '100px',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px) scale(1.02)';
                e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
              }}
            >
              <span>Login</span>
            </Button>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default CustomNavbar;
