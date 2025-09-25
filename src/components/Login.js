import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [showOtp, setShowOtp] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState('admin');
  const [time, setTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const otpRefs = useRef([]);
  const history = useHistory();

  // Live clock update
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
      className="min-vh-100 w-100 d-flex align-items-center justify-content-center position-relative"
      style={{
        background: 'linear-gradient(135deg, #e6f0fa 0%, #d1e3f6 50%, #a3c7ed 100%)',
        padding: '1rem',
        margin: 0,
        overflow: 'hidden',
      }}
    >
      {/* Decorative Background Elements */}
      <div className="position-absolute w-100 h-100" style={{ zIndex: 1 }}>
        <div
          className="position-absolute"
          style={{
            width: '250px',
            height: '250px',
            background: 'linear-gradient(135deg, #2563eb, #1e40af)',
            borderRadius: '50%',
            top: '-100px',
            right: '-50px',
            opacity: '0.15',
          }}
        />
        <div
          className="position-absolute"
          style={{
            width: '350px',
            height: '350px',
            background: 'linear-gradient(135deg, #60a5fa, #2563eb)',
            borderRadius: '50%',
            top: '50px',
            right: '-150px',
            opacity: '0.1',
          }}
        />
        <div
          className="position-absolute"
          style={{
            width: '200px',
            height: '200px',
            background: 'linear-gradient(135deg, #1e40af, #1e3a8a)',
            borderRadius: '50%',
            bottom: '-75px',
            left: '-50px',
            opacity: '0.12',
          }}
        />
        <svg
          className="position-absolute"
          style={{
            bottom: '0',
            left: '0',
            width: '400px',
            height: '200px',
            opacity: '0.15',
            zIndex: 1,
          }}
          viewBox="0 0 400 200"
          fill="none"
        >
          <path d="M0 200C100 150 200 100 400 80V200H0Z" fill="url(#blueGradient)" />
          <defs>
            <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e40af" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <Container className="position-relative" style={{ zIndex: 2, maxWidth: '1200px' }}>
        <Row className="align-items-center justify-content-center g-0 shadow-lg flex-column flex-lg-row">
          {/* Branding and Info (Sidebar) */}
          <Col
            xs={12}
            lg={6}
            className="d-flex flex-column align-items-center justify-content-center p-4 animate__animated animate__fadeInLeft"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(241,245,249,0.9) 100%)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px 24px 0 0',
              minHeight: 'auto',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            <div
              className="mb-4 d-flex align-items-center justify-content-center"
              style={{
                width: '250px',
                height: '200px',
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                borderRadius: '20px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(30, 64, 175, 0.2)',
              }}
            >
              <div className="text-center">
                <div
                  className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                  style={{
                    width: '70px',
                    height: '70px',
                    background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
                    borderRadius: '15px',
                    boxShadow: '0 8px 20px rgba(30, 64, 175, 0.3)',
                  }}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
                    <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 7C13.1 7 14 7.9 14 9C14 10.1 13.1 11 12 11C10.9 11 10 10.1 10 9C10 7.9 10.9 7 12 7ZM12 17C10 17 8.5 15.5 8.5 14V13C8.5 12.4 8.9 12 9.5 12H14.5C15.1 12 15.5 12.4 15.5 13V14C15.5 15.5 14 17 12 17Z" />
                  </svg>
                </div>
                <div className="d-flex justify-content-center align-items-center">
                  <div
                    className="me-2"
                    style={{
                      width: '40px',
                      height: '40px',
                      background: '#dbeafe',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#1e40af">
                      <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 5.5V11H9V5.5L3 7V9H21Z" />
                    </svg>
                  </div>
                  <div
                    className="ms-2"
                    style={{
                      width: '40px',
                      height: '40px',
                      background: '#dbeafe',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#1e40af">
                      <path d="M16 4C18.2 4 20 5.8 20 8S18.2 12 16 12S12 10.2 12 8S13.8 4 16 4ZM16 14C20.4 14 24 15.8 24 18V20H8V18C8 15.8 11.6 14 16 14Z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div
                className="position-absolute"
                style={{
                  width: '15px',
                  height: '15px',
                  background: '#2563eb',
                  borderRadius: '50%',
                  top: '15px',
                  left: '25px',
                  opacity: '0.4',
                }}
              />
              <div
                className="position-absolute"
                style={{
                  width: '10px',
                  height: '10px',
                  background: '#1e40af',
                  borderRadius: '50%',
                  bottom: '25px',
                  right: '30px',
                  opacity: '0.5',
                }}
              />
            </div>

            <div className="text-center mb-4">
              <h1
                className="display-4 fw-bold mb-2"
                style={{
                  color: '#1e40af',
                  fontSize: 'clamp(2rem, 5vw, 2.5rem)',
                  textShadow: '0 2px 8px rgba(30, 64, 175, 0.1)',
                }}
              >
                {time.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true,
                })}
              </h1>
              <p
                className="fs-5 mb-3"
                style={{
                  color: '#64748b',
                  fontWeight: '500',
                }}
              >
                {`${DAYS[time.getDay()]}, ${MONTHS[time.getMonth()]} ${time.getDate()}, ${time.getFullYear()}`}
              </p>
            </div>

            <div className="text-center mb-4">
              <h2
                className="fw-bold mb-2"
                style={{
                  color: '#1e40af',
                  fontSize: 'clamp(1.8rem, 4vw, 2.2rem)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                Fintradify
              </h2>
              <p
                className="fs-6 text-muted"
                style={{
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                }}
              >
                HR Portal
              </p>
            </div>

            <div className="text-center">
              <p
                className="fs-6 mb-2"
                style={{
                  color: '#1e40af',
                  fontWeight: '600',
                }}
              >
                Office Hours
              </p>
              <p
                className="fs-6 text-muted"
                style={{
                  lineHeight: '1.6',
                }}
              >
                Monday - Saturday: 10:00 AM - 6:00 PM
                <br />
                Sunday: Closed
              </p>
            </div>
          </Col>

          {/* Login Form */}
          <Col
            xs={12}
            lg={6}
            className="d-flex flex-column justify-content-center p-4 animate__animated animate__fadeInRight"
            style={{
              background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
              borderRadius: '0 0 24px 24px',
              minHeight: 'auto',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            <div className="p-4 p-lg-5">
              <div className="text-center mb-4">
                <h2
                  className="fw-bold mb-3"
                  style={{
                    color: '#ffffff',
                    fontSize: '2rem',
                    letterSpacing: '0.05em',
                  }}
                >
                  Welcome Back
                </h2>
              </div>

              <div
                className="mb-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '6px',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div className="d-flex">
                  <Button
                    variant="outline-light"
                    className={`flex-fill me-2 ${role === 'admin' ? 'active' : ''}`}
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
                      background: role === 'admin' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                      border: role === 'admin' ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid transparent',
                      borderRadius: '10px',
                      padding: '10px',
                      fontWeight: '600',
                      color: '#ffffff',
                      transition: 'all 0.3s ease',
                    }}
                    aria-pressed={role === 'admin'}
                  >
                    Admin
                  </Button>
                  <Button
                    variant="outline-light"
                    className={`flex-fill ms-2 ${role === 'employee' ? 'active' : ''}`}
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
                      background: role === 'employee' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                      border: role === 'employee' ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid transparent',
                      borderRadius: '10px',
                      padding: '10px',
                      fontWeight: '600',
                      color: '#ffffff',
                      transition: 'all 0.3s ease',
                    }}
                    aria-pressed={role === 'employee'}
                  >
                    Employee
                  </Button>
                </div>
              </div>

              {error && (
                <Alert
                  variant="danger"
                  className="mb-4 border-0 animate__animated animate__shakeX"
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    backdropFilter: 'blur(10px)',
                    color: '#ffffff',
                    borderRadius: '10px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                  }}
                  role="alert"
                >
                  {error}
                </Alert>
              )}

              <Form>
                <Form.Group className="mb-3" controlId="email">
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(sanitizeInput(e.target.value))}
                    required
                    placeholder="Enter your email"
                    className="border-0"
                    style={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '10px',
                      padding: '12px 15px',
                      fontSize: '1rem',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                    }}
                    disabled={isLoading}
                    aria-required="true"
                  />
                </Form.Group>

                {role === 'admin' && (
                  <Form.Group className="mb-3" controlId="password">
                    <Form.Control
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(sanitizeInput(e.target.value))}
                      required
                      placeholder="Enter your password"
                      className="border-0"
                      style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '10px',
                        padding: '12px 15px',
                        fontSize: '1rem',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                      }}
                      disabled={isLoading}
                      aria-required="true"
                    />
                  </Form.Group>
                )}

                {role === 'employee' && showOtp && (
                  <div className="mb-3">
                    <div className="d-flex justify-content-between gap-2">
                      {otp.map((digit, index) => (
                        <Form.Control
                          key={index}
                          type="text"
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          maxLength="1"
                          className="border-0 text-center"
                          style={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: '10px',
                            padding: '12px',
                            fontSize: '1.2rem',
                            fontWeight: '600',
                            width: '60px',
                            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                          }}
                          disabled={isLoading}
                          ref={(el) => (otpRefs.current[index] = el)}
                          aria-label={`OTP digit ${index + 1}`}
                          aria-required="true"
                        />
                      ))}
                    </div>
                    <p
                      className="text-center mt-2"
                      style={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '0.85rem',
                      }}
                    >
                      Enter the 4-digit OTP sent to your email
                    </p>
                    {otpTimer > 0 ? (
                      <p
                        className="text-center mt-2"
                        style={{
                          color: 'rgba(255, 255, 255, 0.8)',
                          fontSize: '0.85rem',
                        }}
                      >
                        Resend OTP in {formatTimer(otpTimer)}
                      </p>
                    ) : canResend && (
                      <Button
                        variant="link"
                        onClick={handleResendOTP}
                        disabled={isLoading}
                        style={{
                          color: '#ffffff',
                          textDecoration: 'underline',
                          fontSize: '0.85rem',
                          padding: '0',
                        }}
                        aria-label="Resend OTP"
                      >
                        {isLoading ? 'Sending...' : 'Resend OTP'}
                      </Button>
                    )}
                  </div>
                )}

                <Button
                  onClick={handleLogin}
                  className="w-100 d-flex align-items-center justify-content-center border-0 mt-3"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    borderRadius: '10px',
                    padding: '12px',
                    fontWeight: '600',
                    fontSize: '1rem',
                    boxShadow: '0 6px 20px rgba(245, 158, 11, 0.3)',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 25px rgba(245, 158, 11, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.3)';
                  }}
                  disabled={isLoading}
                  aria-label={role === 'admin' ? 'Sign In' : showOtp ? 'Verify OTP' : 'Send OTP'}
                >
                  {isLoading ? (
                    <>
                      <Spinner animation="border" size="sm" style={{ marginRight: '8px' }} aria-hidden="true" />
                      Loading...
                    </>
                  ) : (
                    role === 'admin' ? 'Sign In' : showOtp ? 'Verify OTP' : 'Send OTP'
                  )}
                </Button>

                <div className="text-center mt-3">
                  <Button
                    variant="link"
                    onClick={() => setShowPrivacyModal(true)}
                    style={{
                      color: '#ffffff',
                      textDecoration: 'underline',
                      fontSize: '0.85rem',
                      padding: '0',
                    }}
                    aria-label="View Privacy Policy"
                  >
                    Privacy Policy
                  </Button>
                </div>
              </Form>
            </div>
          </Col>
        </Row>

        <div className="text-center mt-4">
          <p
            className="text-muted"
            style={{
              fontSize: '0.85rem',
              color: '#64748b',
            }}
          >
            © {new Date().getFullYear()} Fintradify. All rights reserved.
          </p>
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
          .btn:disabled {
            opacity: 0.6 !important;
            cursor: not-allowed !important;
            transform: none !important;
          }
          .form-control:focus {
            outline: none !important;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.3) !important;
          }
          .btn:hover:not(:disabled) {
            transform: translateY(-2px);
          }
          @media (max-width: 991.98px) {
            .row {
              flex-direction: column !important;
            }
            .col-lg-6:first-child {
              border-radius: 24px 24px 0 0 !important;
              min-height: auto !important;
              padding-bottom: 0 !important;
            }
            .col-lg-6:last-child {
              border-radius: 0 0 24px 24px !important;
              min-height: auto !important;
              padding-top: 0 !important;
            }
            .container {
              max-width: 100% !important;
              padding: 0 15px !important;
            }
            .mb-4 {
              margin-bottom: 1.5rem !important;
            }
            .p-4 {
              padding: 1rem !important;
            }
            .p-lg-5 {
              padding: 1rem !important;
            }
            .form-control {
              font-size: 0.9rem !important;
            }
            .otp-input {
              width: 50px !important;
              font-size: 1rem !important;
            }
            .text-center h2 {
              font-size: 1.5rem !important;
            }
            .display-4 {
              font-size: 1.8rem !important;
            }
            .fs-5 {
              font-size: 1rem !important;
            }
            .fs-6 {
              font-size: 0.85rem !important;
            }
          }
          .form-control::placeholder {
            color: #94a3b8 !important;
            opacity: 1;
          }
          .otp-input {
            transition: all 0.3s ease;
          }
          .otp-input:focus {
            transform: scale(1.05);
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.3) !important;
          }
        `}
      </style>
    </div>
  );
};

export default Login;