import React, { useState } from 'react';
import { Alert, Button, Form, Spinner } from 'react-bootstrap';
import api from '../utils/axios';

const EmployeePasswordSettings = () => {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setMessage('');
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!form.currentPassword) {
      setError('Current password is required');
      return;
    }

    if (form.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }

    try {
      setLoading(true);
      const res = await api.put('/employees/profile/password', form);
      setMessage(res.data?.message || 'Password changed successfully');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="employee-password-panel">
      <div className="employee-password-summary">
        <span>Password login</span>
        <strong>Keep your employee portal password updated for direct login access.</strong>
      </div>

      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit} className="employee-password-form">
        <Form.Group>
          <Form.Label>Current Password</Form.Label>
          <Form.Control
            type={showPasswords ? 'text' : 'password'}
            name="currentPassword"
            value={form.currentPassword}
            onChange={handleChange}
            placeholder="Enter current password"
            autoComplete="current-password"
            required
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>New Password</Form.Label>
          <Form.Control
            type={showPasswords ? 'text' : 'password'}
            name="newPassword"
            value={form.newPassword}
            onChange={handleChange}
            placeholder="Minimum 6 characters"
            autoComplete="new-password"
            required
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Confirm New Password</Form.Label>
          <Form.Control
            type={showPasswords ? 'text' : 'password'}
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Repeat new password"
            autoComplete="new-password"
            required
          />
        </Form.Group>

        <div className="employee-password-actions">
          <Form.Check
            type="switch"
            id="employee-show-passwords"
            label="Show passwords"
            checked={showPasswords}
            onChange={(event) => setShowPasswords(event.target.checked)}
          />
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Updating...
              </>
            ) : (
              'Change Password'
            )}
          </Button>
        </div>
      </Form>

      <style>{`
        .employee-password-panel {
          max-width: 760px;
        }

        .employee-password-summary {
          border: 1px solid #dbe3ef;
          border-radius: 8px;
          background: #f8fafc;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .employee-password-summary span {
          display: block;
          color: #0f766e;
          font-size: 0.8rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0;
          margin-bottom: 0.3rem;
        }

        .employee-password-summary strong {
          color: #0f172a;
          font-weight: 800;
        }

        .employee-password-form {
          display: grid;
          gap: 1rem;
        }

        .employee-password-form label {
          font-weight: 800;
          color: #0f172a;
        }

        .employee-password-form .form-control {
          min-height: 46px;
          border-radius: 8px;
          border-color: #dbe3ef;
        }

        .employee-password-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }

        @media (max-width: 767px) {
          .employee-password-actions {
            align-items: stretch;
          }

          .employee-password-actions .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default EmployeePasswordSettings;
