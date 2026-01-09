import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Card, Form, Button, Alert, Row, Col, Tab, Tabs, Badge } from 'react-bootstrap';
import { FaSave, FaUndo, FaCog, FaClock, FaCalendarAlt, FaBell, FaUserCog } from 'react-icons/fa';
import { useSettings } from '../contexts/SettingsContext';

const AdminSettings = () => {
  const { settings: globalSettings, updateSettings } = useSettings();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states for different sections
  const [generalSettings, setGeneralSettings] = useState({});
  const [attendanceSettings, setAttendanceSettings] = useState({});
  const [leaveSettings, setLeaveSettings] = useState({});
  const [notificationSettings, setNotificationSettings] = useState({});
  const [adminSettings, setAdminSettings] = useState({});
  const [companySettings, setCompanySettings] = useState({});
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/settings`, {
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
    setGeneralSettings({
      companyName: data.companyName || 'FinTradify',
      theme: data.theme || 'light',
      language: data.language || 'en',
      dateFormat: data.dateFormat || 'DD/MM/YYYY',
      timeFormat: data.timeFormat || '12h',
      currency: data.currency || 'INR',
      timezone: data.timezone || 'Asia/Kolkata',
    });

    setAttendanceSettings({
      workStartTime: data.workStartTime || '09:00',
      workEndTime: data.workEndTime || '18:00',
      breakStartTime: data.breakStartTime || '13:00',
      breakEndTime: data.breakEndTime || '14:00',
      workingDays: data.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      allowLateCheckIn: data.allowLateCheckIn ?? true,
      lateCheckInGracePeriod: data.lateCheckInGracePeriod || 15,
      allowEarlyCheckOut: data.allowEarlyCheckOut ?? true,
      earlyCheckOutGracePeriod: data.earlyCheckOutGracePeriod || 15,
    });

    setLeaveSettings({
      annualLeaveDays: data.annualLeaveDays || 12,
      sickLeaveDays: data.sickLeaveDays || 6,
      casualLeaveDays: data.casualLeaveDays || 6,
      maternityLeaveDays: data.maternityLeaveDays || 84,
      paternityLeaveDays: data.paternityLeaveDays || 5,
      allowLeaveCarryForward: data.allowLeaveCarryForward ?? true,
      maxCarryForwardDays: data.maxCarryForwardDays || 5,
    });

    setNotificationSettings({
      emailNotifications: data.emailNotifications ?? true,
      pushNotifications: data.pushNotifications ?? true,
      notifyOnLeaveRequest: data.notifyOnLeaveRequest ?? true,
      notifyOnAttendance: data.notifyOnAttendance ?? false,
      notifyOnSalarySlip: data.notifyOnSalarySlip ?? true,
    });

    setAdminSettings({
      autoApproveLeaves: data.adminSettings?.autoApproveLeaves ?? false,
      requireReasonForRejection: data.adminSettings?.requireReasonForRejection ?? true,
      allowBulkActions: data.adminSettings?.allowBulkActions ?? true,
    });
  };

  const handleSave = async (section) => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      let updateData = {};
      let endpoint = '/settings';

      switch (section) {
        case 'general':
          updateData = generalSettings;
          break;
        case 'attendance':
          updateData = attendanceSettings;
          endpoint = '/settings/attendance';
          break;
        case 'leave':
          updateData = leaveSettings;
          endpoint = '/settings/leave';
          break;
        case 'notifications':
          updateData = notificationSettings;
          endpoint = '/settings/notifications';
          break;
        case 'admin':
          updateData = { adminSettings };
          break;
        default:
          updateData = {
            ...generalSettings,
            ...attendanceSettings,
            ...leaveSettings,
            ...notificationSettings,
            adminSettings,
          };
      }

      const res = await axios.put(`${process.env.REACT_APP_API_URL}${endpoint}`, updateData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      setSettings(res.data);
      updateSettings(res.data); // Update global settings
      setSuccess(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all settings to default?')) return;

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/settings/reset`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      await fetchSettings();
      setSuccess('Settings reset to default successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error resetting settings:', err);
      setError('Failed to reset settings');
    }
  };

  const handleWorkingDaysChange = (day, checked) => {
    const currentDays = Array.isArray(attendanceSettings.workingDays) ? [...attendanceSettings.workingDays] : [];
    if (checked) {
      if (!currentDays.includes(day)) {
        currentDays.push(day);
      }
    } else {
      const index = currentDays.indexOf(day);
      if (index > -1) {
        currentDays.splice(index, 1);
      }
    }
    setAttendanceSettings({ ...attendanceSettings, workingDays: currentDays });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedLogo(file);
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = async () => {
    if (!selectedLogo) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('logo', selectedLogo);

      const res = await axios.post(`${process.env.REACT_APP_API_URL}/settings/logo`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setSettings({ ...settings, companyLogo: res.data.logoUrl });
      updateSettings({ ...settings, companyLogo: res.data.logoUrl });
      setSelectedLogo(null);
      setLogoPreview('');
      setSuccess('Company logo updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error uploading logo:', err);
      setError('Failed to upload logo');
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary-800">
          <FaCog className="me-2" />
          Admin Settings
        </h2>
        <Button variant="outline-danger" onClick={handleReset} disabled={saving}>
          <FaUndo className="me-2" />
          Reset to Default
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Tabs defaultActiveKey="general" className="mb-4">
        <Tab eventKey="general" title={<><FaCog className="me-2" />General</>}>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">General Settings</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Company Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={generalSettings.companyName}
                      onChange={(e) => setGeneralSettings({...generalSettings, companyName: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Timezone</Form.Label>
                    <Form.Select
                      value={generalSettings.timezone}
                      onChange={(e) => setGeneralSettings({...generalSettings, timezone: e.target.value})}
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Theme</Form.Label>
                    <Form.Select
                      value={generalSettings.theme}
                      onChange={(e) => setGeneralSettings({...generalSettings, theme: e.target.value})}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Language</Form.Label>
                    <Form.Select
                      value={generalSettings.language}
                      onChange={(e) => setGeneralSettings({...generalSettings, language: e.target.value})}
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="es">Spanish</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Currency</Form.Label>
                    <Form.Select
                      value={generalSettings.currency}
                      onChange={(e) => setGeneralSettings({...generalSettings, currency: e.target.value})}
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Date Format</Form.Label>
                    <Form.Select
                      value={generalSettings.dateFormat}
                      onChange={(e) => setGeneralSettings({...generalSettings, dateFormat: e.target.value})}
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Time Format</Form.Label>
                    <Form.Select
                      value={generalSettings.timeFormat}
                      onChange={(e) => setGeneralSettings({...generalSettings, timeFormat: e.target.value})}
                    >
                      <option value="12h">12 Hour</option>
                      <option value="24h">24 Hour</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <div className="text-end">
                <Button variant="primary" onClick={() => handleSave('general')} disabled={saving}>
                  <FaSave className="me-2" />
                  {saving ? 'Saving...' : 'Save General Settings'}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="attendance" title={<><FaClock className="me-2" />Attendance</>}>
          <Card className="shadow-sm">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">Attendance Settings</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Work Start Time</Form.Label>
                    <Form.Control
                      type="time"
                      value={attendanceSettings.workStartTime}
                      onChange={(e) => setAttendanceSettings({...attendanceSettings, workStartTime: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Work End Time</Form.Label>
                    <Form.Control
                      type="time"
                      value={attendanceSettings.workEndTime}
                      onChange={(e) => setAttendanceSettings({...attendanceSettings, workEndTime: e.target.value})}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Break Start Time</Form.Label>
                    <Form.Control
                      type="time"
                      value={attendanceSettings.breakStartTime}
                      onChange={(e) => setAttendanceSettings({...attendanceSettings, breakStartTime: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Break End Time</Form.Label>
                    <Form.Control
                      type="time"
                      value={attendanceSettings.breakEndTime}
                      onChange={(e) => setAttendanceSettings({...attendanceSettings, breakEndTime: e.target.value})}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Working Days</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                    <Form.Check
                      key={day}
                      type="checkbox"
                      id={`working-day-${day}`}
                      label={day.charAt(0).toUpperCase() + day.slice(1)}
                      checked={Array.isArray(attendanceSettings.workingDays) && attendanceSettings.workingDays.includes(day)}
                      onChange={(e) => handleWorkingDaysChange(day, e.target.checked)}
                    />
                  ))}
                </div>
              </Form.Group>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Late Check-in Grace Period (minutes)</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      value={attendanceSettings.lateCheckInGracePeriod}
                      onChange={(e) => setAttendanceSettings({...attendanceSettings, lateCheckInGracePeriod: parseInt(e.target.value)})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Early Check-out Grace Period (minutes)</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      value={attendanceSettings.earlyCheckOutGracePeriod}
                      onChange={(e) => setAttendanceSettings({...attendanceSettings, earlyCheckOutGracePeriod: parseInt(e.target.value)})}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Check
                    type="switch"
                    id="allow-late-checkin"
                    label="Allow Late Check-in"
                    checked={attendanceSettings.allowLateCheckIn}
                    onChange={(e) => setAttendanceSettings({...attendanceSettings, allowLateCheckIn: e.target.checked})}
                  />
                </Col>
                <Col md={6}>
                  <Form.Check
                    type="switch"
                    id="allow-early-checkout"
                    label="Allow Early Check-out"
                    checked={attendanceSettings.allowEarlyCheckOut}
                    onChange={(e) => setAttendanceSettings({...attendanceSettings, allowEarlyCheckOut: e.target.checked})}
                  />
                </Col>
              </Row>
              <div className="text-end mt-3">
                <Button variant="success" onClick={() => handleSave('attendance')} disabled={saving}>
                  <FaSave className="me-2" />
                  {saving ? 'Saving...' : 'Save Attendance Settings'}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="leave" title={<><FaCalendarAlt className="me-2" />Leave</>}>
          <Card className="shadow-sm">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">Leave Settings</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Annual Leave Days</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      value={leaveSettings.annualLeaveDays}
                      onChange={(e) => setLeaveSettings({...leaveSettings, annualLeaveDays: parseInt(e.target.value)})}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Sick Leave Days</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      value={leaveSettings.sickLeaveDays}
                      onChange={(e) => setLeaveSettings({...leaveSettings, sickLeaveDays: parseInt(e.target.value)})}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Casual Leave Days</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      value={leaveSettings.casualLeaveDays}
                      onChange={(e) => setLeaveSettings({...leaveSettings, casualLeaveDays: parseInt(e.target.value)})}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Maternity Leave Days</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      value={leaveSettings.maternityLeaveDays}
                      onChange={(e) => setLeaveSettings({...leaveSettings, maternityLeaveDays: parseInt(e.target.value)})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Paternity Leave Days</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      value={leaveSettings.paternityLeaveDays}
                      onChange={(e) => setLeaveSettings({...leaveSettings, paternityLeaveDays: parseInt(e.target.value)})}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Check
                    type="switch"
                    id="allow-leave-carry-forward"
                    label="Allow Leave Carry Forward"
                    checked={leaveSettings.allowLeaveCarryForward}
                    onChange={(e) => setLeaveSettings({...leaveSettings, allowLeaveCarryForward: e.target.checked})}
                  />
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Max Carry Forward Days</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      value={leaveSettings.maxCarryForwardDays}
                      onChange={(e) => setLeaveSettings({...leaveSettings, maxCarryForwardDays: parseInt(e.target.value)})}
                      disabled={!leaveSettings.allowLeaveCarryForward}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <div className="text-end">
                <Button variant="info" onClick={() => handleSave('leave')} disabled={saving}>
                  <FaSave className="me-2" />
                  {saving ? 'Saving...' : 'Save Leave Settings'}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="notifications" title={<><FaBell className="me-2" />Notifications</>}>
          <Card className="shadow-sm">
            <Card.Header className="bg-warning text-dark">
              <h5 className="mb-0">Notification Settings</h5>
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
              <Form.Check
                type="switch"
                id="notify-leave-request"
                label="Notify on Leave Request"
                checked={notificationSettings.notifyOnLeaveRequest}
                onChange={(e) => setNotificationSettings({...notificationSettings, notifyOnLeaveRequest: e.target.checked})}
                className="mb-3"
              />
              <Form.Check
                type="switch"
                id="notify-attendance"
                label="Notify on Attendance"
                checked={notificationSettings.notifyOnAttendance}
                onChange={(e) => setNotificationSettings({...notificationSettings, notifyOnAttendance: e.target.checked})}
                className="mb-3"
              />
              <Form.Check
                type="switch"
                id="notify-salary-slip"
                label="Notify on Salary Slip"
                checked={notificationSettings.notifyOnSalarySlip}
                onChange={(e) => setNotificationSettings({...notificationSettings, notifyOnSalarySlip: e.target.checked})}
                className="mb-3"
              />
              <div className="text-end">
                <Button variant="warning" onClick={() => handleSave('notifications')} disabled={saving}>
                  <FaSave className="me-2" />
                  {saving ? 'Saving...' : 'Save Notification Settings'}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="admin" title={<><FaUserCog className="me-2" />Admin</>}>
          <Card className="shadow-sm">
            <Card.Header className="bg-secondary text-white">
              <h5 className="mb-0">Admin Settings</h5>
            </Card.Header>
            <Card.Body>
              <Form.Check
                type="switch"
                id="auto-approve-leaves"
                label="Auto Approve Leave Requests"
                checked={adminSettings.autoApproveLeaves}
                onChange={(e) => setAdminSettings({...adminSettings, autoApproveLeaves: e.target.checked})}
                className="mb-3"
              />
              <Form.Check
                type="switch"
                id="require-rejection-reason"
                label="Require Reason for Leave Rejection"
                checked={adminSettings.requireReasonForRejection}
                onChange={(e) => setAdminSettings({...adminSettings, requireReasonForRejection: e.target.checked})}
                className="mb-3"
              />
              <Form.Check
                type="switch"
                id="allow-bulk-actions"
                label="Allow Bulk Actions"
                checked={adminSettings.allowBulkActions}
                onChange={(e) => setAdminSettings({...adminSettings, allowBulkActions: e.target.checked})}
                className="mb-3"
              />
              <div className="text-end">
                <Button variant="secondary" onClick={() => handleSave('admin')} disabled={saving}>
                  <FaSave className="me-2" />
                  {saving ? 'Saving...' : 'Save Admin Settings'}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default AdminSettings;
