import React, { useRef, useState } from 'react';
import { Alert, Button, Form, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaEnvelope, FaKey, FaLock } from 'react-icons/fa';
import api from '../utils/axios';
import '../components/Login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState('request');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const otpRefs = useRef([]);

  const sanitizeInput = (input) => input.replace(/[<>"'&]/g, '');

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const nextOtp = [...otp];
    nextOtp[index] = value;
    setOtp(nextOtp);
    if (value && index < 3) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const requestOtp = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Employee email is required');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/employee-password/request-reset', { email: sanitizeInput(email.trim()) });
      setMessage(res.data?.message || 'Password reset OTP sent to email');
      setStep('reset');
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to send reset OTP');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (otp.join('').length !== 4) {
      setError('Please enter the 4-digit OTP');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and confirm password do not match');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/employee-password/reset', {
        email: sanitizeInput(email.trim()),
        otp: otp.join(''),
        password,
        confirmPassword,
      });
      setMessage(res.data?.message || 'Password reset successfully');
      setStep('done');
      setPassword('');
      setConfirmPassword('');
      setOtp(['', '', '', '']);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-page__story">
        <Link className="login-page__back" to="/login">
          <FaArrowLeft /> Back to login
        </Link>

        <div className="login-page__brand">
          <span>F</span>
          <div>
            <strong>Fintradify HR Portal</strong>
            <small>Employee password recovery</small>
          </div>
        </div>

        <h1>Reset your employee portal password securely.</h1>
        <p>
          Enter your registered employee email, verify the OTP sent to your inbox,
          and create a new password for future password-based login.
        </p>

        <div className="login-page__benefits">
          <span><FaEnvelope /> Registered email verification</span>
          <span><FaKey /> 5 minute OTP expiry</span>
          <span><FaLock /> New password protected by verification</span>
        </div>
      </section>

      <section className="login-page__form-wrap">
        <div className="login-card">
          <div className="login-card__header">
            <span className="login-card__icon"><FaLock /></span>
            <div>
              <h2>Reset Password</h2>
              <p>{step === 'request' ? 'Request a password reset OTP.' : step === 'done' ? 'Your password is ready.' : 'Verify OTP and create a new password.'}</p>
            </div>
          </div>

          {message && <Alert variant="success" className="login-alert">{message}</Alert>}
          {error && <Alert variant="danger" className="login-alert">{error}</Alert>}

          {step === 'request' && (
            <Form onSubmit={requestOtp} className="login-form">
              <Form.Group className="login-field">
                <Form.Label>Registered employee email</Form.Label>
                <div className="login-input">
                  <FaEnvelope />
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(sanitizeInput(event.target.value))}
                    placeholder="name@company.com"
                    disabled={loading}
                    required
                  />
                </div>
              </Form.Group>
              <Button type="submit" className="login-submit" disabled={loading}>
                {loading ? <><Spinner animation="border" size="sm" /> Sending...</> : 'Send Reset OTP'}
              </Button>
            </Form>
          )}

          {step === 'reset' && (
            <Form onSubmit={resetPassword} className="login-form">
              <div className="login-otp">
                <Form.Label>Verification code</Form.Label>
                <div className="login-otp__inputs">
                  {otp.map((digit, index) => (
                    <Form.Control
                      key={index}
                      type="text"
                      value={digit}
                      onChange={(event) => handleOtpChange(index, event.target.value)}
                      onKeyDown={(event) => handleOtpKeyDown(index, event)}
                      maxLength="1"
                      disabled={loading}
                      ref={(el) => (otpRefs.current[index] = el)}
                    />
                  ))}
                </div>
              </div>

              <Form.Group className="login-field">
                <Form.Label>New password</Form.Label>
                <div className="login-input">
                  <FaLock />
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Minimum 6 characters"
                    disabled={loading}
                    required
                  />
                </div>
              </Form.Group>

              <Form.Group className="login-field">
                <Form.Label>Confirm password</Form.Label>
                <div className="login-input">
                  <FaLock />
                  <Form.Control
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repeat new password"
                    disabled={loading}
                    required
                  />
                </div>
              </Form.Group>

              <Button type="submit" className="login-submit" disabled={loading}>
                {loading ? <><Spinner animation="border" size="sm" /> Resetting...</> : 'Reset Password'}
              </Button>
              <button type="button" className="login-link-button" onClick={requestOtp} disabled={loading}>
                Resend OTP
              </button>
            </Form>
          )}

          {step === 'done' && (
            <div className="login-form">
              <Alert variant="success" className="login-alert">
                <FaCheckCircle /> Password reset completed.
              </Alert>
              <Link className="login-submit" to="/login">Go to Login</Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default ForgotPassword;
