import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap';
import api from '../utils/axios';

const DEFAULTS = {
  officeLatitude: 28.595339,
  officeLongitude: 77.318415,
  officeRadiusMeters: 100,
};

const AdminAttendanceRadius = () => {
  const [form, setForm] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      const data = res.data?.data || res.data || {};
      setForm({
        officeLatitude: data.officeLatitude ?? DEFAULTS.officeLatitude,
        officeLongitude: data.officeLongitude ?? DEFAULTS.officeLongitude,
        officeRadiusMeters: data.officeRadiusMeters ?? DEFAULTS.officeRadiusMeters,
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch attendance radius settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm({ ...form, [name]: value === '' ? '' : Number(value) });
    setSuccess('');
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm({
          ...form,
          officeLatitude: Number(position.coords.latitude.toFixed(6)),
          officeLongitude: Number(position.coords.longitude.toFixed(6)),
        });
        setLocating(false);
      },
      (geoError) => {
        setError(geoError.message || 'Unable to fetch current location');
        setLocating(false);
      }
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (
      form.officeLatitude === '' || form.officeLongitude === '' || form.officeRadiusMeters === '' ||
      Number.isNaN(form.officeLatitude) || Number.isNaN(form.officeLongitude) || Number.isNaN(form.officeRadiusMeters) ||
      Number(form.officeRadiusMeters) <= 0
    ) {
      setError('Please provide a valid latitude, longitude, and a positive radius in meters.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.put('/settings/attendance', form);
      setSuccess('Attendance radius updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update attendance radius');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="radius-page">
      <style>
        {`
          .radius-page {
            color: #0f172a;
            display: grid;
            gap: 1rem;
          }
          .radius-hero {
            padding: 1.15rem;
            background: linear-gradient(135deg, #ffffff, #f8fbff);
            border: 1px solid #dbeafe;
            border-radius: 0.9rem;
            box-shadow: 0 16px 36px rgba(15, 23, 42, 0.07);
          }
          .radius-eyebrow {
            margin: 0;
            color: #64748b;
            font-size: 0.78rem;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .radius-title {
            margin: 0.25rem 0;
            color: #0f172a;
            font-size: clamp(1.3rem, 3vw, 1.8rem);
            font-weight: 900;
          }
          .radius-subtitle {
            margin: 0;
            color: #64748b;
            font-weight: 600;
          }
          .radius-panel {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 0.85rem;
            box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
            padding: 1.25rem;
          }
          .radius-form .form-label {
            color: #334155;
            font-weight: 800;
            font-size: 0.78rem;
            text-transform: uppercase;
          }
          .radius-form .form-control {
            border-radius: 0.65rem;
            border: 1px solid #dbe3ef;
            color: #0f172a;
            font-weight: 600;
          }
          .radius-action-btn {
            border-radius: 0.65rem;
            font-weight: 800;
            min-height: 42px;
          }
        `}
      </style>

      <section className="radius-hero">
        <p className="radius-eyebrow">Office geofence</p>
        <h2 className="radius-title">Attendance Radius</h2>
        <p className="radius-subtitle">
          Set the office location and the maximum distance (in meters) an employee must be within to punch in/out in Work From Office mode.
          Approved Work From Home requests bypass this check entirely.
        </p>
      </section>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card className="radius-panel">
        {loading ? (
          <p>Loading current settings...</p>
        ) : (
          <Form className="radius-form" onSubmit={handleSubmit}>
            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Office Latitude</Form.Label>
                  <Form.Control
                    type="number"
                    step="any"
                    name="officeLatitude"
                    value={form.officeLatitude}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Office Longitude</Form.Label>
                  <Form.Control
                    type="number"
                    step="any"
                    name="officeLongitude"
                    value={form.officeLongitude}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Radius (meters)</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    step="1"
                    name="officeRadiusMeters"
                    value={form.officeRadiusMeters}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col xs={12} className="d-flex gap-2 flex-wrap">
                <Button type="button" variant="outline-primary" className="radius-action-btn" onClick={handleUseCurrentLocation} disabled={locating}>
                  {locating ? 'Locating...' : 'Use my current location'}
                </Button>
                <Button type="submit" variant="primary" className="radius-action-btn" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Attendance Radius'}
                </Button>
              </Col>
            </Row>
          </Form>
        )}
      </Card>
    </div>
  );
};

export default AdminAttendanceRadius;
