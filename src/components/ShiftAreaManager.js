import React, { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Modal, Row, Table } from 'react-bootstrap';
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../utils/axios';

const asList = (body) => (Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : []);
const isNum = (value) => value !== '' && value !== null && value !== undefined && Number.isFinite(Number(value));
const to12h = (hhmm) => {
  const [h, m] = String(hhmm || '00:00').split(':').map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

const ClickToPlace = ({ onPick }) => {
  useMapEvents({ click: (event) => onPick(event.latlng.lat, event.latlng.lng) });
  return null;
};

const Recenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, Math.max(map.getZoom(), 15));
  }, [center, map]);
  return null;
};

/**
 * Admin: punch area per shift (e.g. Ghaziabad office shift -> Ghaziabad site).
 * Employees in a shift may punch inside its area, inside the office area and inside
 * their own area. Saving one area never changes another.
 */
const ShiftAreaManager = ({ office }) => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ enabled: true, label: '', latitude: '', longitude: '', radiusMeters: 200 });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/shifts');
      setShifts(asList(res.data));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load shifts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openEditor = (shift) => {
    const loc = shift.location || {};
    setEditing(shift);
    setForm({
      enabled: true,
      label: loc.label || `${shift.name} area`,
      latitude: isNum(loc.latitude) ? loc.latitude : office?.officeLatitude ?? '',
      longitude: isNum(loc.longitude) ? loc.longitude : office?.officeLongitude ?? '',
      radiusMeters: loc.radiusMeters || 200,
    });
    setFormError('');
    setSuccess('');
  };

  const setPoint = (lat, lng) => setForm((prev) => ({ ...prev, latitude: Number(Number(lat).toFixed(6)), longitude: Number(Number(lng).toFixed(6)) }));

  const useMyLocation = () => {
    if (!navigator.geolocation) { setFormError('Geolocation is not supported by this browser.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setPoint(pos.coords.latitude, pos.coords.longitude); setLocating(false); },
      (geoError) => { setFormError(geoError.message || 'Unable to fetch your location'); setLocating(false); },
      { enableHighAccuracy: true, timeout: 20000 }
    );
  };

  const save = async (override) => {
    const payload = { ...form, ...override };
    if (payload.enabled) {
      if (!isNum(payload.latitude) || !isNum(payload.longitude)) { setFormError('Pick a point on the map or enter latitude and longitude.'); return; }
      const radius = Number(payload.radiusMeters);
      if (!Number.isFinite(radius) || radius < 10 || radius > 50000) { setFormError('Radius must be between 10 and 50000 meters.'); return; }
    }
    setSaving(true);
    setFormError('');
    try {
      const res = await api.put(`/shifts/${editing._id}/location`, {
        enabled: Boolean(payload.enabled),
        label: payload.label,
        latitude: payload.latitude === '' ? '' : Number(payload.latitude),
        longitude: payload.longitude === '' ? '' : Number(payload.longitude),
        radiusMeters: Number(payload.radiusMeters),
      });
      setSuccess(res.data?.message || 'Shift area saved');
      setEditing(null);
      await load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not save the shift area');
    } finally {
      setSaving(false);
    }
  };

  const center = isNum(form.latitude) && isNum(form.longitude)
    ? [Number(form.latitude), Number(form.longitude)]
    : [Number(office?.officeLatitude) || 28.5512, Number(office?.officeLongitude) || 77.132];

  return (
    <Card className="border-0 shadow-sm mt-4" style={{ borderRadius: 16 }}>
      <Card.Body className="p-3 p-md-4">
        <p className="radius-eyebrow">Step 3 · Shift areas (optional)</p>
        <h4 className="radius-title" style={{ fontSize: '1.2rem' }}>Where can each shift punch?</h4>
        <p className="text-muted small">
          Give a shift its own place (for example the Ghaziabad or Ahmedabad office). Everyone in that shift can then punch
          there, as well as in the office area and in their own area. Saving a shift area does not change the office or any employee area.
        </p>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

        {loading ? (
          <p className="text-muted mb-0">Loading shifts...</p>
        ) : (
          <div className="table-responsive">
            <Table hover className="align-middle mb-0">
              <thead>
                <tr><th>Shift</th><th>Employees</th><th>Punch area</th><th>Radius</th><th>Coordinates</th><th className="text-end">Action</th></tr>
              </thead>
              <tbody>
                {shifts.filter((s) => s.isActive !== false).map((shift) => {
                  const loc = shift.location;
                  return (
                    <tr key={shift._id}>
                      <td>
                        <div className="fw-semibold" style={{ color: shift.color }}>{shift.name}{shift.isDefault ? ' (default)' : ''}</div>
                        <div className="small text-muted">{to12h(shift.startTime)} – {to12h(shift.endTime)}</div>
                      </td>
                      <td>{shift.employeeCount ?? 0}</td>
                      <td>
                        {loc
                          ? <Badge bg="" style={{ background: '#e0f2fe', color: '#0369a1' }}>{loc.label || `${shift.name} area`}</Badge>
                          : <span className="small text-muted">Not set (office and own areas only)</span>}
                      </td>
                      <td>{loc ? `${Math.round(loc.radiusMeters)} m` : '—'}</td>
                      <td className="small text-muted">{loc ? `${Number(loc.latitude).toFixed(5)}, ${Number(loc.longitude).toFixed(5)}` : '—'}</td>
                      <td className="text-end">
                        <Button size="sm" variant="outline-primary" onClick={() => openEditor(shift)}>{loc ? 'Edit area' : 'Set area'}</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>

      <Modal show={Boolean(editing)} onHide={() => !saving && setEditing(null)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1.1rem' }}>Punch area · {editing?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger">{formError}</Alert>}
          <p className="small text-muted mb-2">Click on the map to place the point. Everyone in this shift can punch inside the circle.</p>
          <div style={{ height: 320, borderRadius: 12, overflow: 'hidden', border: '1px solid #e6e9f2' }}>
            {editing && (
              <MapContainer center={center} zoom={15} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                <ClickToPlace onPick={setPoint} />
                <Recenter center={center} />
                {isNum(form.latitude) && isNum(form.longitude) && (
                  <>
                    <Marker position={[Number(form.latitude), Number(form.longitude)]} />
                    <Circle center={[Number(form.latitude), Number(form.longitude)]} radius={Number(form.radiusMeters) || 0} pathOptions={{ color: '#0369a1', fillColor: '#0369a1', fillOpacity: 0.12 }} />
                  </>
                )}
              </MapContainer>
            )}
          </div>
          <Row className="g-3 mt-1">
            <Col md={6}>
              <Form.Label>Area name</Form.Label>
              <Form.Control value={form.label} maxLength={80} placeholder="e.g. Ghaziabad office" onChange={(e) => setForm({ ...form, label: e.target.value })} />
            </Col>
            <Col md={6}>
              <Form.Label>Radius (meters)</Form.Label>
              <Form.Control type="number" min="10" max="50000" value={form.radiusMeters} onChange={(e) => setForm({ ...form, radiusMeters: e.target.value })} />
            </Col>
            <Col md={6}>
              <Form.Label>Latitude</Form.Label>
              <Form.Control type="number" step="0.000001" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
            </Col>
            <Col md={6}>
              <Form.Label>Longitude</Form.Label>
              <Form.Control type="number" step="0.000001" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
            </Col>
          </Row>
          <div className="d-flex flex-wrap gap-2 mt-3">
            <Button size="sm" variant="outline-secondary" onClick={useMyLocation} disabled={locating}>{locating ? 'Locating...' : 'Use my current location'}</Button>
            {isNum(office?.officeLatitude) && (
              <Button size="sm" variant="outline-secondary" onClick={() => setPoint(office.officeLatitude, office.officeLongitude)}>Use office location</Button>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          {editing?.location && (
            <Button variant="outline-danger" className="me-auto" disabled={saving} onClick={() => save({ enabled: false })}>Remove shift area</Button>
          )}
          <Button variant="light" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
          <Button onClick={() => save({ enabled: true })} disabled={saving}>{saving ? 'Saving...' : 'Save shift area'}</Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default ShiftAreaManager;
