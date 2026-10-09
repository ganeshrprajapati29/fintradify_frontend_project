import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Modal, Row, Table } from 'react-bootstrap';
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../utils/axios';

const asList = (body) => (Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : []);
const isNum = (value) => value !== '' && value !== null && value !== undefined && Number.isFinite(Number(value));
const COLORS = ['#0369A1', '#0A1F8F', '#0F766E', '#7C3AED', '#D97706', '#D0142A', '#16A34A', '#475569'];

const ClickToPlace = ({ onPick }) => {
  useMapEvents({ click: (event) => onPick(event.latlng.lat, event.latlng.lng) });
  return null;
};
const Recenter = ({ center }) => {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, Math.max(map.getZoom(), 14)); }, [center, map]);
  return null;
};

const emptyForm = (office) => ({
  name: '', code: '', address: '',
  latitude: office?.officeLatitude ?? '', longitude: office?.officeLongitude ?? '',
  radiusMeters: 300, color: COLORS[0], isActive: true,
});

/**
 * Admin: work locations (sites). Create a place once (head office, branch, warehouse,
 * client site) and give it to any number of employees. They can punch inside it.
 */
const WorkLocationManager = ({ office, onChanged }) => {
  const [locations, setLocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(null); // {} = new
  const [form, setForm] = useState(emptyForm(office));
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [assignFor, setAssignFor] = useState(null);
  const [picked, setPicked] = useState([]);
  const [query, setQuery] = useState('');
  const [locating, setLocating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [locRes, empRes] = await Promise.all([api.get('/work-locations'), api.get('/employees')]);
      setLocations(asList(locRes.data));
      setEmployees(asList(empRes.data).filter((e) => e.role !== 'admin' && e.status !== 'terminated').sort((a, b) => String(a.name).localeCompare(String(b.name))));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load work locations');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const openEditor = (loc) => {
    setEditing(loc || {});
    setForm(loc ? {
      name: loc.name, code: loc.code || '', address: loc.address || '', latitude: loc.latitude, longitude: loc.longitude,
      radiusMeters: loc.radiusMeters, color: loc.color || COLORS[0], isActive: loc.isActive !== false,
    } : emptyForm(office));
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

  const save = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) { setFormError('Location name is required.'); return; }
    if (!isNum(form.latitude) || !isNum(form.longitude)) { setFormError('Pick the place on the map or enter latitude and longitude.'); return; }
    const radius = Number(form.radiusMeters);
    if (!Number.isFinite(radius) || radius < 10 || radius > 50000) { setFormError('Radius must be between 10 and 50000 meters.'); return; }
    setSaving(true);
    setFormError('');
    try {
      const payload = { ...form, latitude: Number(form.latitude), longitude: Number(form.longitude), radiusMeters: radius };
      const res = editing?._id ? await api.put(`/work-locations/${editing._id}`, payload) : await api.post('/work-locations', payload);
      setSuccess(res.data?.message || 'Location saved');
      setEditing(null);
      await load();
      if (onChanged) onChanged();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not save the location');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (loc) => {
    if (!window.confirm(`Delete "${loc.name}"? ${loc.employeeCount ? `${loc.employeeCount} employee(s) will no longer be able to punch there.` : ''}`)) return;
    try {
      const res = await api.delete(`/work-locations/${loc._id}`);
      setSuccess(res.data?.message || 'Location deleted');
      await load();
      if (onChanged) onChanged();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete the location');
    }
  };

  const openAssign = (loc) => {
    setAssignFor(loc);
    setPicked(employees.filter((e) => (e.workLocations || []).map(String).includes(String(loc._id))).map((e) => e._id));
    setQuery('');
  };

  const saveAssign = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/work-locations/${assignFor._id}/employees`, { employeeIds: picked });
      setSuccess(res.data?.message || 'Employees updated');
      setAssignFor(null);
      await load();
      if (onChanged) onChanged();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update employees');
      setAssignFor(null);
    } finally {
      setSaving(false);
    }
  };

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees.filter((e) => !q || [e.name, e.employeeId, e.department, e.position].some((v) => String(v || '').toLowerCase().includes(q)));
  }, [employees, query]);

  const center = isNum(form.latitude) && isNum(form.longitude)
    ? [Number(form.latitude), Number(form.longitude)]
    : [Number(office?.officeLatitude) || 28.5512, Number(office?.officeLongitude) || 77.132];

  return (
    <Card className="border-0 shadow-sm mt-4" style={{ borderRadius: 16 }}>
      <Card.Body className="p-3 p-md-4">
        <div className="d-flex flex-wrap justify-content-between gap-2 align-items-start">
          <div>
            <p className="radius-eyebrow">Step 2 · Work locations (sites)</p>
            <h4 className="radius-title" style={{ fontSize: '1.2rem' }}>Where does your team work?</h4>
            <p className="text-muted small mb-0">
              Add each place once (branch office, warehouse, client site) and choose who works there. Those employees can punch
              inside it, as well as in the office area. Saving a location never changes any other area.
            </p>
          </div>
          <Button onClick={() => openEditor(null)}>+ Add location</Button>
        </div>

        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
        {success && <Alert variant="success" className="mt-3" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

        {loading ? (
          <p className="text-muted mt-3 mb-0">Loading work locations...</p>
        ) : locations.length === 0 ? (
          <p className="text-muted mt-3 mb-0">No work locations yet. Click "Add location" to add your first branch or site.</p>
        ) : (
          <div className="table-responsive mt-3">
            <Table hover className="align-middle mb-0">
              <thead><tr><th>Location</th><th>Radius</th><th>Employees</th><th>Coordinates</th><th className="text-end">Actions</th></tr></thead>
              <tbody>
                {locations.map((loc) => (
                  <tr key={loc._id} style={{ opacity: loc.isActive === false ? 0.55 : 1 }}>
                    <td>
                      <div className="fw-semibold" style={{ color: loc.color }}>{loc.name}{loc.code ? ` (${loc.code})` : ''}</div>
                      {loc.address && <div className="small text-muted">{loc.address}</div>}
                      {loc.isActive === false && <Badge bg="secondary">Inactive</Badge>}
                    </td>
                    <td>{loc.radiusMeters} m</td>
                    <td>{loc.employeeCount}</td>
                    <td className="small text-muted">{Number(loc.latitude).toFixed(5)}, {Number(loc.longitude).toFixed(5)}</td>
                    <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                      <Button size="sm" variant="primary" className="me-1" onClick={() => openAssign(loc)}>Employees</Button>
                      <Button size="sm" variant="outline-primary" className="me-1" onClick={() => openEditor(loc)}>Edit</Button>
                      <Button size="sm" variant="outline-danger" onClick={() => remove(loc)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>

      <Modal show={Boolean(editing)} onHide={() => !saving && setEditing(null)} size="lg" centered>
        <Form onSubmit={save}>
          <Modal.Header closeButton>
            <Modal.Title style={{ fontSize: '1.1rem' }}>{editing?._id ? `Edit ${editing.name}` : 'New work location'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {formError && <Alert variant="danger">{formError}</Alert>}
            <p className="small text-muted mb-2">Click on the map to place the location. Employees of this location can punch inside the circle.</p>
            <div style={{ height: 300, borderRadius: 12, overflow: 'hidden', border: '1px solid #e6e9f2' }}>
              {editing && (
                <MapContainer center={center} zoom={14} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                  <ClickToPlace onPick={setPoint} />
                  <Recenter center={center} />
                  {isNum(form.latitude) && isNum(form.longitude) && (
                    <>
                      <Marker position={[Number(form.latitude), Number(form.longitude)]} />
                      <Circle center={[Number(form.latitude), Number(form.longitude)]} radius={Number(form.radiusMeters) || 0} pathOptions={{ color: form.color, fillColor: form.color, fillOpacity: 0.12 }} />
                    </>
                  )}
                </MapContainer>
              )}
            </div>
            <Row className="g-3 mt-1">
              <Col md={8}><Form.Label>Name</Form.Label><Form.Control value={form.name} maxLength={80} placeholder="e.g. Ghaziabad Office" onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Col>
              <Col md={4}><Form.Label>Short code</Form.Label><Form.Control value={form.code} maxLength={12} placeholder="GZB" onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></Col>
              <Col xs={12}><Form.Label>Address (optional)</Form.Label><Form.Control value={form.address} maxLength={240} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Col>
              <Col md={4}><Form.Label>Latitude</Form.Label><Form.Control type="number" step="0.000001" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} /></Col>
              <Col md={4}><Form.Label>Longitude</Form.Label><Form.Control type="number" step="0.000001" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} /></Col>
              <Col md={4}><Form.Label>Radius (meters)</Form.Label><Form.Control type="number" min="10" max="50000" value={form.radiusMeters} onChange={(e) => setForm({ ...form, radiusMeters: e.target.value })} /></Col>
              <Col xs={12}>
                <Form.Label>Colour</Form.Label>
                <div className="d-flex gap-2">
                  {COLORS.map((color) => (
                    <button key={color} type="button" aria-label={`Colour ${color}`} onClick={() => setForm({ ...form, color })} style={{ width: 28, height: 28, borderRadius: '50%', background: color, border: form.color === color ? '3px solid #0f172a' : '2px solid #fff', boxShadow: '0 0 0 1px #cbd5e1' }} />
                  ))}
                </div>
              </Col>
              {editing?._id && (
                <Col xs={12}><Form.Check type="switch" id="wl-active" label="Location is active" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /></Col>
              )}
            </Row>
            <div className="d-flex flex-wrap gap-2 mt-3">
              <Button size="sm" variant="outline-secondary" onClick={useMyLocation} disabled={locating}>{locating ? 'Locating...' : 'Use my current location'}</Button>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save location'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={Boolean(assignFor)} onHide={() => !saving && setAssignFor(null)} centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1.05rem' }}>Employees at {assignFor?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control className="mb-2" placeholder="Search employee" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="d-flex gap-2 mb-2">
            <Button size="sm" variant="outline-primary" onClick={() => setPicked([...new Set([...picked, ...shown.map((e) => e._id)])])}>Select shown</Button>
            <Button size="sm" variant="outline-secondary" onClick={() => setPicked([])}>Clear</Button>
            <span className="small text-muted ms-auto align-self-center">{picked.length} selected</span>
          </div>
          {shown.map((e) => (
            <Form.Check
              key={e._id}
              type="checkbox"
              id={`wl-emp-${e._id}`}
              className="py-1"
              checked={picked.includes(e._id)}
              onChange={(ev) => setPicked(ev.target.checked ? [...picked, e._id] : picked.filter((id) => id !== e._id))}
              label={<span><span className="fw-semibold">{e.name}</span> <span className="small text-muted">{e.employeeId} · {e.department || e.position}</span></span>}
            />
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setAssignFor(null)} disabled={saving}>Cancel</Button>
          <Button onClick={saveAssign} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default WorkLocationManager;
