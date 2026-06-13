import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { Link, useHistory } from 'react-router-dom';
import {
  FaArrowLeft,
  FaBuilding,
  FaCheckCircle,
  FaEnvelope,
  FaKey,
  FaLock,
  FaShieldAlt,
  FaUserTie,
} from 'react-icons/fa';
import api from '../utils/axios';
import { usePublicData } from '../contexts/PublicDataContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [showOtp, setShowOtp] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState('admin');
  const [employeeLoginMethod, setEmployeeLoginMethod] = useState('password');
  const [isLoading, setIsLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const otpRefs = useRef([]);
  const history = useHistory();
  const { siteData } = usePublicData();
  const brand = siteData.brand || {};

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

  const sanitizeInput = (input) => input.replace(/[<>"'&]/g, '');

  const resetRoleState = (nextRole) => {
    setRole(nextRole);
    setShowOtp(false);
    setEmail('');
    setPassword('');
    setOtp(['', '', '', '']);
    setEmployeeLoginMethod('password');
    setError('');
    setOtpTimer(0);
    setCanResend(false);
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const nextOtp = [...otp];
    nextOtp[index] = value;
    setOtp(nextOtp);

    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleLogin = async (event) => {
    event?.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const needsPassword = role === 'admin' || (role === 'employee' && employeeLoginMethod === 'password');
      const needsOtp = role === 'employee' && employeeLoginMethod === 'otp' && showOtp;

      if (!email || (needsPassword && !password) || (needsOtp && otp.join('').length !== 4)) {
        throw new Error('Please fill in all required fields.');
      }

      if (role === 'admin' || employeeLoginMethod === 'password') {
        const res = await api.post('/auth/login', {
          email: sanitizeInput(email),
          password: sanitizeInput(password),
        });
        localStorage.setItem('token', res.data.token);
        history.push(role === 'admin' ? '/admin' : '/employee');
        return;
      }

      if (!showOtp) {
        const res = await api.post('/auth/login', {
          email: sanitizeInput(email),
        });
        if (res.data.message === 'OTP sent to email') {
          setShowOtp(true);
          setOtpTimer(60);
          setCanResend(false);
          return;
        }
        throw new Error('Error sending OTP.');
      }

      const res = await api.post('/auth/login', {
        email: sanitizeInput(email),
        otp: otp.join(''),
      });
      localStorage.setItem('token', res.data.token);
      history.push('/employee');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Server error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', {
        email: sanitizeInput(email),
      });
      if (res.data.message === 'OTP sent to email') {
        setOtpTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '']);
        otpRefs.current[0]?.focus();
      } else {
        throw new Error('Error resending OTP.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error resending OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const switchEmployeeMethod = (method) => {
    setEmployeeLoginMethod(method);
    setShowOtp(false);
    setPassword('');
    setOtp(['', '', '', '']);
    setError('');
    setOtpTimer(0);
    setCanResend(false);
  };

  return (
    <main className="login-page">
      <section className="login-page__story">
        <Link className="login-page__back" to="/">
          <FaArrowLeft /> Back to website
        </Link>

        <div className="login-page__brand">
          <span>F</span>
          <div>
            <strong>{brand.name || 'Fintradify HR Portal'}</strong>
            <small>Secure workforce access</small>
          </div>
        </div>

        <h1>One secure entry point for HR admins and employees.</h1>
        <p>
          Access attendance, leave, salary documents, task assignment, employee records,
          and self-service workflows through a clean role-based login experience.
        </p>

        <div className="login-page__benefits">
          <span><FaShieldAlt /> Protected admin dashboard</span>
          <span><FaKey /> Password and OTP login for employees</span>
          <span><FaBuilding /> Company settings connected</span>
        </div>
      </section>

      <section className="login-page__form-wrap">
        <div className="login-card">
          <div className="login-card__header">
            <span className="login-card__icon">
              {role === 'admin' ? <FaUserTie /> : <FaShieldAlt />}
            </span>
            <div>
              <h2>{role === 'admin' ? 'Manager Login' : 'Employee Login'}</h2>
              <p>{role === 'admin' ? 'Use your Manager email and password.' : 'Use password login or receive a secure email OTP.'}</p>
            </div>
          </div>

          <div className="login-role-tabs" role="tablist" aria-label="Select login role">
            <button
              type="button"
              className={role === 'admin' ? 'active' : ''}
              onClick={() => resetRoleState('admin')}
            >
              Admin
            </button>
            <button
              type="button"
              className={role === 'employee' ? 'active' : ''}
              onClick={() => resetRoleState('employee')}
            >
              Employee
            </button>
          </div>

          {error && <Alert variant="danger" className="login-alert">{error}</Alert>}

          <Form onSubmit={handleLogin} className="login-form">
            {role === 'employee' && (
              <div className="login-method-tabs" role="tablist" aria-label="Select employee login method">
                <button
                  type="button"
                  className={employeeLoginMethod === 'password' ? 'active' : ''}
                  onClick={() => switchEmployeeMethod('password')}
                >
                  Password
                </button>
                <button
                  type="button"
                  className={employeeLoginMethod === 'otp' ? 'active' : ''}
                  onClick={() => switchEmployeeMethod('otp')}
                >
                  Email OTP
                </button>
              </div>
            )}

            <Form.Group className="login-field">
              <Form.Label>Email address</Form.Label>
              <div className="login-input">
                <FaEnvelope />
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(sanitizeInput(e.target.value))}
                  placeholder="name@company.com"
                  disabled={isLoading}
                />
              </div>
            </Form.Group>

            {(role === 'admin' || (role === 'employee' && employeeLoginMethod === 'password')) && (
              <Form.Group className="login-field">
                <Form.Label>Password</Form.Label>
                <div className="login-input">
                  <FaLock />
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(sanitizeInput(e.target.value))}
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                </div>
              </Form.Group>
            )}

            {role === 'employee' && employeeLoginMethod === 'otp' && showOtp && (
              <div className="login-otp">
                <Form.Label>Verification code</Form.Label>
                <div className="login-otp__inputs">
                  {otp.map((digit, index) => (
                    <Form.Control
                      key={index}
                      type="text"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      maxLength="1"
                      disabled={isLoading}
                      ref={(el) => (otpRefs.current[index] = el)}
                    />
                  ))}
                </div>
                <p>
                  {otpTimer > 0
                    ? `Resend OTP in ${formatTimer(otpTimer)}`
                    : 'Enter the 4-digit OTP sent to your email.'}
                </p>
                {canResend && (
                  <button type="button" className="login-link-button" onClick={handleResendOTP} disabled={isLoading}>
                    Resend OTP
                  </button>
                )}
              </div>
            )}

            <Button type="submit" className="login-submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner animation="border" size="sm" />
                  Processing...
                </>
              ) : (
                role === 'admin'
                  ? 'Sign in securely'
                  : employeeLoginMethod === 'password'
                    ? 'Login with Password'
                    : showOtp ? 'Verify OTP' : 'Send OTP'
              )}
            </Button>
          </Form>

          <div className="login-card__footer">
            <span><FaCheckCircle /> Secure session access</span>
            <div className="login-footer-links">
              {role === 'employee' && <Link to="/forgot-password">Reset Password</Link>}
              <button type="button" onClick={() => setShowPrivacyModal(true)}>Privacy Policy</button>
            </div>
          </div>
        </div>
      </section>

      <Modal show={showPrivacyModal} onHide={() => setShowPrivacyModal(false)} centered size="lg">
        <Modal.Header closeButton className="login-modal__header">
          <Modal.Title>Privacy Policy</Modal.Title>
        </Modal.Header>
        <Modal.Body className="login-modal__body">
          <h5>Introduction</h5>
          <p>Fintradify protects login data used for admin and employee access to the HR Portal.</p>
          <h5>Data Collection</h5>
          <p>We collect email addresses, admin passwords, and employee OTP verification data to provide secure access.</p>
          <h5>Data Usage</h5>
          <p>Your data is used for authentication, account management, notifications, and portal access.</p>
          <h5>Data Security</h5>
          <p>Role-based access, authenticated API calls, and secure workflows help protect HR operations.</p>
          <h5>Contact</h5>
          <p>For privacy support, contact {brand.email || 'support@fintradify.com'}.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-primary" onClick={() => setShowPrivacyModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </main>
  );
};

export default Login;
