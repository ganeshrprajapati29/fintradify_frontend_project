import React, { useEffect, useState } from 'react';
import { Alert, Button, Col, Form, Row, Spinner } from 'react-bootstrap';
import api from '../utils/axios';

const defaultPreferences = {
  theme: 'light',
  language: 'en',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '12h',
  currency: 'INR',
  emailNotifications: true,
  pushNotifications: true,
};

const EmployeeSettings = () => {
  const [systemSettings, setSystemSettings] = useState({});
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const [settingsRes] = await Promise.all([
          api.get('/settings/employee'),
        ]);
        const settings = settingsRes.data?.data || settingsRes.data || {};
        const saved = JSON.parse(localStorage.getItem('employeeSettings') || '{}');
        setSystemSettings(settings);
        setPreferences({
          ...defaultPreferences,
          theme: settings.theme || defaultPreferences.theme,
          language: settings.language || defaultPreferences.language,
          dateFormat: settings.dateFormat || defaultPreferences.dateFormat,
          timeFormat: settings.timeFormat || defaultPreferences.timeFormat,
          currency: settings.currency || defaultPreferences.currency,
          ...saved,
        });
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch employee settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const updatePreference = (field, value) => {
    setPreferences((current) => ({ ...current, [field]: value }));
  };

  const savePreferences = () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      localStorage.setItem('employeeSettings', JSON.stringify(preferences));
      setSuccess('Preferences saved successfully');
    } catch (err) {
      setError('Unable to save preferences on this browser');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="employee-settings-page">
        <div className="settings-empty">
          <Spinner animation="border" size="sm" className="me-2" /> Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="employee-settings-page">
      <style>
        {`
          .employee-settings-page {
            color: #0f172a;
            display: grid;
            gap: 1rem;
          }
          .settings-hero,
          .settings-panel,
          .settings-summary-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 0.9rem;
            box-shadow: 0 14px 34px rgba(15, 23, 42, 0.07);
          }
          .settings-hero {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 1rem;
            align-items: center;
            padding: 1.15rem;
            background: linear-gradient(135deg, #ffffff, #f8fbff);
          }
          .settings-eyebrow {
            margin: 0;
            color: #64748b;
            font-size: 0.78rem;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .settings-title {
            margin: 0.25rem 0;
            color: #0f172a;
            font-size: clamp(1.45rem, 3vw, 2.1rem);
            font-weight: 900;
            line-height: 1.15;
          }
          .settings-subtitle {
            margin: 0;
            color: #64748b;
            font-weight: 600;
          }
          .settings-action-btn {
            border-radius: 0.65rem;
            font-weight: 800;
            min-height: 42px;
          }
          .settings-summary-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 0.85rem;
          }
          .settings-summary-card {
            padding: 0.95rem;
          }
          .settings-summary-card span {
            display: block;
            color: #64748b;
            font-size: 0.76rem;
            font-weight: 800;
            text-transform: uppercase;
          }
          .settings-summary-card strong {
            display: block;
            margin-top: 0.28rem;
            color: #0f172a;
            font-size: 1rem;
            line-height: 1.25;
          }
          .settings-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 1rem;
          }
          .settings-panel {
            padding: 1rem;
          }
          .settings-panel-title {
            margin: 0 0 1rem;
            color: #0f172a;
            font-size: 1.05rem;
            font-weight: 900;
          }
          .employee-settings-page .form-label {
            color: #334155;
            font-weight: 800;
            font-size: 0.78rem;
            text-transform: uppercase;
          }
          .employee-settings-page .form-select,
          .employee-settings-page .form-check-input {
            border-color: #dbe3ef;
          }
          .employee-settings-page .form-select {
            border-radius: 0.65rem;
            color: #0f172a;
            min-height: 42px;
            font-weight: 600;
          }
          .settings-policy-list {
            display: grid;
            gap: 0.65rem;
          }
          .settings-policy-item {
            display: flex;
            justify-content: space-between;
            gap: 1rem;
            padding: 0.75rem;
            border: 1px solid #e2e8f0;
            border-radius: 0.7rem;
            background: #f8fafc;
            color: #64748b;
            font-weight: 700;
          }
          .settings-policy-item strong {
            color: #0f172a;
            text-align: right;
          }
          .settings-empty {
            min-height: 220px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #64748b;
            border: 1px dashed #cbd5e1;
            border-radius: 0.8rem;
            background: #f8fafc;
            font-weight: 700;
            text-align: center;
            padding: 1rem;
          }
          @media (max-width: 900px) {
            .settings-hero,
            .settings-grid {
              grid-template-columns: 1fr;
            }
            .settings-summary-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }
          @media (max-width: 560px) {
            .settings-summary-grid {
              grid-template-columns: 1fr;
            }
            .settings-action-btn {
              width: 100%;
            }
          }
        `}
      </style>

      <section className="settings-hero">
        <div>
          <p className="settings-eyebrow">Employee settings</p>
          <h2 className="settings-title">Settings</h2>
          <p className="settings-subtitle">Your preferences are saved locally. Company policies and work rules come from backend settings.</p>
        </div>
        <Button className="settings-action-btn" variant="primary" onClick={savePreferences} disabled={saving}>
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </section>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <section className="settings-summary-grid">
        <div className="settings-summary-card"><span>Timezone</span><strong>{systemSettings.timezone || 'Asia/Kolkata'}</strong></div>
        <div className="settings-summary-card"><span>Work Hours</span><strong>{systemSettings.workStartTime || '09:00'} - {systemSettings.workEndTime || '18:00'}</strong></div>
        <div className="settings-summary-card"><span>Currency</span><strong>{preferences.currency}</strong></div>
        <div className="settings-summary-card"><span>Theme</span><strong>{preferences.theme}</strong></div>
      </section>

      <section className="settings-grid">
        <div className="settings-panel">
          <h3 className="settings-panel-title">Personal preferences</h3>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Theme</Form.Label>
                <Form.Select value={preferences.theme} onChange={(event) => updatePreference('theme', event.target.value)}>
                  <option value="light">Light</option>
                  <option value="system">System</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Language</Form.Label>
                <Form.Select value={preferences.language} onChange={(event) => updatePreference('language', event.target.value)}>
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Date Format</Form.Label>
                <Form.Select value={preferences.dateFormat} onChange={(event) => updatePreference('dateFormat', event.target.value)}>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  <option value="MMM DD, YYYY">MMM DD, YYYY</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Time Format</Form.Label>
                <Form.Select value={preferences.timeFormat} onChange={(event) => updatePreference('timeFormat', event.target.value)}>
                  <option value="12h">12 Hour</option>
                  <option value="24h">24 Hour</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </div>

        <div className="settings-panel">
          <h3 className="settings-panel-title">Notification preferences</h3>
          <div className="settings-policy-list">
            <div className="settings-policy-item">
              <span>Email notifications</span>
              <Form.Check
                type="switch"
                checked={preferences.emailNotifications}
                onChange={(event) => updatePreference('emailNotifications', event.target.checked)}
              />
            </div>
            <div className="settings-policy-item">
              <span>Push notifications</span>
              <Form.Check
                type="switch"
                checked={preferences.pushNotifications}
                onChange={(event) => updatePreference('pushNotifications', event.target.checked)}
              />
            </div>
            <div className="settings-policy-item"><span>View salary slips</span><strong>{systemSettings.employeeSettings?.canViewSalary === false ? 'Disabled' : 'Allowed'}</strong></div>
            <div className="settings-policy-item"><span>Request leave</span><strong>{systemSettings.employeeSettings?.canRequestLeave === false ? 'Disabled' : 'Allowed'}</strong></div>
          </div>
        </div>
      </section>

      <section className="settings-panel">
        <h3 className="settings-panel-title">Company rules</h3>
        <div className="settings-policy-list">
          <div className="settings-policy-item"><span>Working days</span><strong>{Array.isArray(systemSettings.workingDays) ? systemSettings.workingDays.join(', ') : 'Monday - Friday'}</strong></div>
          <div className="settings-policy-item"><span>Date format</span><strong>{systemSettings.dateFormat || preferences.dateFormat}</strong></div>
          <div className="settings-policy-item"><span>Time format</span><strong>{systemSettings.timeFormat || preferences.timeFormat}</strong></div>
          <div className="settings-policy-item"><span>Manager approval</span><strong>{systemSettings.employeeSettings?.requireManagerApproval === false ? 'Not required' : 'Required'}</strong></div>
        </div>
      </section>
    </div>
  );
};

export default EmployeeSettings;
