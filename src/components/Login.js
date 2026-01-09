import React, { useState, useEffect, useRef } from 'react';
import { Container, Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [showOtp, setShowOtp] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState('admin');
  const [isLoading, setIsLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const otpRefs = useRef([]);
  const history = useHistory();

  // OTP Timer countdown
  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((timer) => {
          if (timer <= 1) {
            setCanResend(true);
            return 0;
          }
          return timer - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Sanitize input to prevent XSS
  const sanitizeInput = (input) => {
    return input.replace(/[<>"'&]/g, '');
  };

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Allow only digits
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input
    if (value && index < 3) {
      otpRefs.current[index + 1].focus();
    }
  };

  // Handle OTP key down (backspace)
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  // Handle login submission
  const handleLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      if (!email || (role === 'admin' && !password) || (role === 'employee' && showOtp && otp.join('').length !== 4)) {
        throw new Error('Please fill in all required fields');
      }

      if (role === 'admin') {
        const res = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, {
          email: sanitizeInput(email),
          password: sanitizeInput(password),
        });
        localStorage.setItem('token', res.data.token);
        history.push('/admin');
      } else {
        if (!showOtp) {
          const res = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, {
            email: sanitizeInput(email),
          });
          if (res.data.message === 'OTP sent to email') {
            setShowOtp(true);
            setOtpTimer(60);
            setCanResend(false);
          } else {
            throw new Error('Error sending OTP');
          }
        } else {
          const res = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, {
            email: sanitizeInput(email),
            otp: otp.join(''),
          });
          localStorage.setItem('token', res.data.token);
          history.push('/employee');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Server error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP resend
  const handleResendOTP = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, {
        email: sanitizeInput(email),
      });
      if (res.data.message === 'OTP sent to email') {
        setOtpTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '']);
        otpRefs.current[0].focus();
      } else {
        throw new Error('Error resending OTP');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error resending OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Format timer
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        background: `linear-gradient(135deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.8) 100%), url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Overlay */}
      <div
        className="position-absolute w-100 h-100"
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1,
        }}
      />

      <Container className="position-relative" style={{ zIndex: 2, maxWidth: '450px' }}>
        <div
          className="bg-white shadow-lg rounded-4 p-5 animate__animated animate__fadeInUp"
          style={{
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          {/* Logo and Title */}
          <div className="text-center mb-4">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
              style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
                <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 7C13.1 7 14 7.9 14 9C14 10.1 13.1 11 12 11C10.9 11 10 10.1 10 9C10 7.9 10.9 7 12 7ZM12 17C10 17 8.5 15.5 8.5 14V13C8.5 12.4 8.9 12 9.5 12H14.5C15.1 12 15.5 12.4 15.5 13V14C15.5 15.5 14 17 12 17Z" />
              </svg>
            </div>
            <h1
              className="h3 fw-bold mb-2"
              style={{
                color: '#2d3748',
                fontSize: '1.75rem',
              }}
            >
              Fintradify HR Portal
            </h1>
            <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>
              Secure access to your HR dashboard
            </p>
          </div>

          {/* Role Selection */}
          <div className="d-flex mb-4 bg-light rounded-3 p-1">
            <Button
              variant={role === 'admin' ? 'primary' : 'light'}
              className="flex-fill rounded-2 me-1"
              onClick={() => {
                setRole('admin');
                setShowOtp(false);
                setEmail('');
                setPassword('');
                setOtp(['', '', '', '']);
                setError('');
                setOtpTimer(0);
                setCanResend(false);
              }}
              style={{
                border: 'none',
                fontWeight: '600',
                transition: 'all 0.3s ease',
              }}
            >
              Admin
            </Button>
            <Button
              variant={role === 'employee' ? 'primary' : 'light'}
              className="flex-fill rounded-2 ms-1"
              onClick={() => {
                setRole('employee');
                setShowOtp(false);
                setEmail('');
                setPassword('');
                setOtp(['', '', '', '']);
                setError('');
                setOtpTimer(0);
                setCanResend(false);
              }}
              style={{
                border: 'none',
                fontWeight: '600',
                transition: 'all 0.3s ease',
              }}
            >
              Employee
            </Button>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert
              variant="danger"
              className="mb-4 border-0 rounded-3"
              style={{
                backgroundColor: '#fed7d7',
                color: '#c53030',
                border: '1px solid #feb2b2',
              }}
            >
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <Form>
            <Form.Group className="mb-3">
              <div className="position-relative">
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(sanitizeInput(e.target.value))}
                  placeholder="Enter your email address"
                  className="rounded-3 border-0"
                  style={{
                    padding: '12px 45px 12px 15px',
                    backgroundColor: '#f7fafc',
                    fontSize: '0.95rem',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
                  }}
                  disabled={isLoading}
                />
                <div
                  className="position-absolute"
                  style={{
                    right: '15px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#a0aec0',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                </div>
              </div>
            </Form.Group>

            {role === 'admin' && (
              <Form.Group className="mb-3">
                <div className="position-relative">
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(sanitizeInput(e.target.value))}
                    placeholder="Enter your password"
                    className="rounded-3 border-0"
                    style={{
                      padding: '12px 45px 12px 15px',
                      backgroundColor: '#f7fafc',
                      fontSize: '0.95rem',
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
                    }}
                    disabled={isLoading}
                  />
                  <div
                    className="position-absolute"
                    style={{
                      right: '15px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#a0aec0',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm3 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
                    </svg>
                  </div>
                </div>
              </Form.Group>
            )}

            {role === 'employee' && showOtp && (
              <div className="mb-3">
                <div className="d-flex justify-content-between gap-2 mb-2">
                  {otp.map((digit, index) => (
                    <Form.Control
                      key={index}
                      type="text"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      maxLength="1"
                      className="text-center border-0 rounded-3"
                      style={{
                        width: '50px',
                        height: '50px',
                        backgroundColor: '#f7fafc',
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
                      }}
                      disabled={isLoading}
                      ref={(el) => (otpRefs.current[index] = el)}
                    />
                  ))}
                </div>
                <p className="text-center text-muted mb-2" style={{ fontSize: '0.85rem' }}>
                  Enter the 4-digit OTP sent to your email
                </p>
                {otpTimer > 0 ? (
                  <p className="text-center text-muted" style={{ fontSize: '0.8rem' }}>
                    Resend OTP in {formatTimer(otpTimer)}
                  </p>
                ) : canResend && (
                  <div className="text-center">
                    <Button
                      variant="link"
                      onClick={handleResendOTP}
                      disabled={isLoading}
                      style={{
                        color: '#667eea',
                        textDecoration: 'none',
                        fontSize: '0.85rem',
                        padding: '0',
                      }}
                    >
                      {isLoading ? 'Sending...' : 'Resend OTP'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleLogin}
              className="w-100 rounded-3 border-0 mb-3"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '12px',
                fontWeight: '600',
                fontSize: '1rem',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Processing...
                </>
              ) : (
                role === 'admin' ? 'Sign In' : showOtp ? 'Verify OTP' : 'Send OTP'
              )}
            </Button>
          </Form>

          {/* Footer Links */}
          <div className="text-center">
            <Button
              variant="link"
              onClick={() => setShowPrivacyModal(true)}
              style={{
                color: '#667eea',
                textDecoration: 'none',
                fontSize: '0.85rem',
                padding: '0',
              }}
            >
              Privacy Policy
            </Button>
          </div>

          <div className="text-center mt-3">
            <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>
              © {new Date().getFullYear()} Fintradify. All rights reserved.
            </p>
          </div>
        </div>
      </Container>

      {/* Privacy Policy Modal */}
      <Modal
        show={showPrivacyModal}
        onHide={() => setShowPrivacyModal(false)}
        centered
        size="lg"
        style={{ backdropFilter: 'blur(5px)' }}
      >
        <Modal.Header
          closeButton
          style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            borderBottom: '1px solid rgba(30, 64, 175, 0.2)',
          }}
        >
          <Modal.Title style={{ color: '#1e40af', fontWeight: '600' }}>
            Privacy Policy
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            background: '#ffffff',
            color: '#1e3a8a',
            lineHeight: '1.6',
            maxHeight: '60vh',
            overflowY: 'auto',
          }}
        >
          <h5>Introduction</h5>
          <p>
            At Fintradify, we are committed to protecting your privacy. This Privacy Policy outlines how we collect, use, and safeguard your personal information when you use our HR Portal.
          </p>
          <h5>Data Collection</h5>
          <p>
            We collect personal information such as your email address and, for admin users, passwords, to facilitate secure access to our services. For employees, we may send one-time passwords (OTPs) to verify your identity.
          </p>
          <h5>Data Usage</h5>
          <p>
            Your data is used solely for authentication, account management, and providing access to the HR Portal. We do not share your information with third parties except as required by law.
          </p>
          <h5>Data Security</h5>
          <p>
            We implement industry-standard encryption and security measures to protect your data from unauthorized access, alteration, or disclosure.
          </p>
          <h5>Your Rights</h5>
          <p>
            You have the right to access, update, or delete your personal information. Contact us at hr@fintradify.com for assistance.
          </p>
          <h5>Changes to This Policy</h5>
          <p>
            We may update this Privacy Policy periodically. Any changes will be posted on this page, and the updated policy will take effect immediately.
          </p>
          <p>
            For more details, please contact us at hr@fintradify.com.
          </p>
        </Modal.Body>
        <Modal.Footer
          style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            borderTop: '1px solid rgba(30, 64, 175, 0.2)',
          }}
        >
          <Button
            variant="outline-primary"
            onClick={() => setShowPrivacyModal(false)}
            style={{
              borderRadius: '10px',
              padding: '8px 20px',
              fontWeight: '600',
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Enhanced CSS */}
      <style>
        {`
          .form-control:focus {
            outline: none !important;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2) !important;
            border-color: #667eea !important;
          }
          .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            border: none !important;
          }
          .btn-primary:hover {
            background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%) !important;
          }
        `}
      </style>
    </div>
  );
};

export default Login;
