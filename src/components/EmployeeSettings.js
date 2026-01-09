import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { FaSave, FaUser, FaBell } from 'react-icons/fa';

const EmployeeSettings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [personalSettings, setPersonalSettings] = useState({});
  const [notificationSettings, setNotificationSettings] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/settings/employee`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setSettings(res.data);
      initializeFormStates(res.data);
      setError('');
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const initializeFormStates = (data) => {
    setPersonalSettings({
      theme: data.theme || 'light',
      language: data.language || 'en',
      dateFormat: data.dateFormat || 'DD/MM/YYYY',
      timeFormat: data.timeFormat || '12h',
      currency: data.currency || 'INR',
    });

    setNotificationSettings({
      emailNotifications: data.emailNotifications ?? true,
      pushNotifications: data.pushNotifications ?? true,
    });
  };

  const handleSave = async (section) => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      let updateData = {};

      if (section === 'personal') {
        updateData = personalSettings;
      } else if (section === 'notifications') {
        updateData = notificationSettings;
      }

      // For employee settings, we'll update via a general settings endpoint
      // Since employees can't modify system-wide settings, we'll store their preferences locally
      localStorage.setItem('employeeSettings', JSON.stringify(updateData));

      setSuccess(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading settings...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-center mb-4">
        <h2 className="text-primary-800">
          <FaUser className="me-2" />
          My Settings
        </h2>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Row>
        <Col lg={6} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">
                <FaUser className="me-2" />
                Personal Preferences
              </h5>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Theme</Form.Label>
                <Form.Select
                  value={personalSettings.theme}
                  onChange={(e) => setPersonalSettings({...personalSettings, theme: e.target.value})}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Language</Form.Label>
                <Form.Select
                  value={personalSettings.language}
                  onChange={(e) => setPersonalSettings({...personalSettings, language: e.target.value})}
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="es">Spanish</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Date Format</Form.Label>
                <Form.Select
                  value={personalSettings.dateFormat}
                  onChange={(e) => setPersonalSettings({...personalSettings, dateFormat: e.target.value})}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Time Format</Form.Label>
                <Form.Select
                  value={personalSettings.timeFormat}
                  onChange={(e) => setPersonalSettings({...personalSettings, timeFormat: e.target.value})}
                >
                  <option value="12h">12 Hour</option>
                  <option value="24h">24 Hour</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Currency</Form.Label>
                <Form.Select
                  value={personalSettings.currency}
                  onChange={(e) => setPersonalSettings({...personalSettings, currency: e.target.value})}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </Form.Select>
              </Form.Group>

              <div className="text-end">
                <Button variant="primary" onClick={() => handleSave('personal')} disabled={saving}>
                  <FaSave className="me-2" />
                  {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">
                <FaBell className="me-2" />
                Notification Preferences
              </h5>
            </Card.Header>
            <Card.Body>
              <Form.Check
                type="switch"
                id="email-notifications"
                label="Email Notifications"
                checked={notificationSettings.emailNotifications}
                onChange={(e) => setNotificationSettings({...notificationSettings, emailNotifications: e.target.checked})}
                className="mb-3"
              />

              <Form.Check
                type="switch"
                id="push-notifications"
                label="Push Notifications"
                checked={notificationSettings.pushNotifications}
                onChange={(e) => setNotificationSettings({...notificationSettings, pushNotifications: e.target.checked})}
                className="mb-3"
              />

              <div className="mt-4 p-3 bg-light rounded">
                <h6 className="text-muted mb-2">System Information</h6>
                <p className="mb-1 small">
                  <strong>Timezone:</strong> {settings.timezone || 'Asia/Kolkata'}
                </p>
                <p className="mb-1 small">
                  <strong>Work Hours:</strong> {settings.workStartTime || '09:00'} - {settings.workEndTime || '18:00'}
                </p>
                <p className="mb-0 small">
                  <strong>Working Days:</strong> {settings.workingDays ? settings.workingDays.join(', ') : 'Monday - Friday'}
                </p>
              </div>

              <div className="text-end mt-3">
                <Button variant="info" onClick={() => handleSave('notifications')} disabled={saving}>
                  <FaSave className="me-2" />
                  {saving ? 'Saving...' : 'Save Notifications'}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm">
        <Card.Header className="bg-secondary text-white">
          <h5 className="mb-0">Company Policies & Information</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <h6 className="text-primary-800">Leave Information</h6>
              <p className="mb-1 small">
                <strong>Annual Leave:</strong> {settings.annualLeaveDays || 12} days
              </p>
              <p className="mb-1 small">
                <strong>Sick Leave:</strong> {settings.sickLeaveDays || 6} days
              </p>
              <p className="mb-1 small">
                <strong>Casual Leave:</strong> {settings.casualLeaveDays || 6} days
              </p>
              <p className="mb-0 small">
                <strong>Leave Carry Forward:</strong> {settings.allowLeaveCarryForward ? 'Allowed' : 'Not Allowed'}
              </p>
            </Col>
            <Col md={6}>
              <h6 className="text-primary-800">Attendance Rules</h6>
              <p className="mb-1 small">
                <strong>Late Check-in Grace:</strong> {settings.lateCheckInGracePeriod || 15} minutes
              </p>
              <p className="mb-1 small">
                <strong>Early Check-out Grace:</strong> {settings.earlyCheckOutGracePeriod || 15} minutes
              </p>
              <p className="mb-0 small">
                <strong>Break Time:</strong> {settings.breakStartTime || '13:00'} - {settings.breakEndTime || '14:00'}
              </p>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default EmployeeSettings;
