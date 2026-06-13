import React, { useEffect, useState } from 'react';
import { Alert, Button, Col, Form, Row, Spinner } from 'react-bootstrap';
import api from '../utils/axios';

const emptyForm = {
  email: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const AdminCredentials = () => {
  const [form, setForm] = useState(emptyForm);
  const [initialEmail, setInitialEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const res = await api.get('/employees/profile');
        const profile = res.data?.data || res.data || {};
        if (!mounted) return;
        setInitialEmail(profile.email || '');
        setForm((prev) => ({ ...prev, email: profile.email || '' }));
      } catch (err) {
        if (!mounted) return;
        setError(err.response?.data?.message || 'Unable to load admin profile');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

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

    if (!form.email.trim()) {
      setError('Email is required');
      return;
    }

    if (!form.currentPassword) {
      setError('Current password is required to save changes');
      return;
    }

    if (form.newPassword || form.confirmPassword) {
      if (form.newPassword.length < 6) {
        setError('New password must be at least 6 characters');
        return;
      }

      if (form.newPassword !== form.confirmPassword) {
        setError('New password and confirm password do not match');
        return;
      }
    }

    try {
      setSaving(true);
      const res = await api.put('/employees/admin/credentials', {
        email: form.email.trim(),
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });

      const updatedEmail = res.data?.data?.email || form.email.trim();
      setInitialEmail(updatedEmail);
      setForm({
        email: updatedEmail,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setMessage(res.data?.message || 'Admin login credentials updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update admin login credentials');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center gap-2 text-muted py-4">
        <Spinner animation="border" size="sm" />
        <span>Loading admin login details...</span>
      </div>
    );
  }

  return (
    <div className="admin-credentials-panel">
      <div className="credentials-summary mb-4">
        <div>
          <span>Current login email</span>
          <strong>{initialEmail || 'Not available'}</strong>
        </div>
        <div>
          <span>Account type</span>
          <strong>Admin access</strong>
        </div>
      </div>

      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Row className="g-4">
          <Col md={6}>
            <Form.Group controlId="adminLoginEmail">
              <Form.Label>Login Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@fintradify.com"
                autoComplete="username"
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="adminCurrentPassword">
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
          </Col>
          <Col md={6}>
            <Form.Group controlId="adminNewPassword">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type={showPasswords ? 'text' : 'password'}
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                placeholder="Leave blank to keep current password"
                autoComplete="new-password"
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="adminConfirmPassword">
              <Form.Label>Confirm New Password</Form.Label>
              <Form.Control
                type={showPasswords ? 'text' : 'password'}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat new password"
                autoComplete="new-password"
              />
            </Form.Group>
          </Col>
        </Row>

        <div className="credentials-actions mt-4">
          <Form.Check
            type="switch"
            id="show-admin-passwords"
            label="Show passwords"
            checked={showPasswords}
            onChange={(event) => setShowPasswords(event.target.checked)}
          />
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Updating...
              </>
            ) : (
              'Update Login Credentials'
            )}
          </Button>
        </div>
      </Form>

      <style>{`
        .admin-credentials-panel {
          max-width: 920px;
        }

        .credentials-summary {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
        }

        .credentials-summary > div {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1rem;
          background: #f8fafc;
        }

        .credentials-summary span {
          display: block;
          color: #64748b;
          font-size: 0.82rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0;
          margin-bottom: 0.35rem;
        }

        .credentials-summary strong {
          color: #0f172a;
          font-size: 1rem;
          overflow-wrap: anywhere;
        }

        .credentials-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }

        @media (max-width: 767px) {
          .credentials-summary {
            grid-template-columns: 1fr;
          }

          .credentials-actions {
            align-items: stretch;
          }

          .credentials-actions .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminCredentials;
