import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Modal, Row, Table } from 'react-bootstrap';
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../utils/axios';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const asList = (body) => (Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : []);
const isNum = (value) => value !== '' && value !== null && value !== undefined && Number.isFinite(Number(value));

// Clicking the map moves the punch point.
const ClickToPlace = ({ onPick }) => {
  useMapEvents({
    click: (event) => onPick(event.latlng.lat, event.latlng.lng),
  });
  return null;
};

const Recenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, Math.max(map.getZoom(), 15));
  }, [center, map]);
  return null;
};

const emptyForm = { enabled: true, label: '', latitude: '', longitude: '', radiusMeters: 150 };

/**
 * Admin: assign an employee-specific punch area (lat/lng + radius).
 * Everyone can punch inside the office radius; an enabled area is an extra allowed place.
 */
const EmployeeLocationManager = ({ office }) => {
  const [employees, setEmployees] = useState([]);
  const [lastSeen, setLastSeen] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [shifts, setShifts] = useState([]);
  const [sites, setSites] = useState([]);
  const [sitesFor, setSitesFor] = useState(null); // employee whose sites are being edited
  const [pickedSites, setPickedSites] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [employeesRes, trackingRes, shiftsRes, sitesRes] = await Promise.allSettled([api.get('/employees'), api.get('/tracking'), api.get('/shifts'), api.get('/work-locations')]);
      if (employeesRes.status !== 'fulfilled') throw employeesRes.reason;
      if (shiftsRes.status === 'fulfilled') setShifts(asList(shiftsRes.value.data));
      if (sitesRes.status === 'fulfilled') setSites(asList(sitesRes.value.data));
      setEmployees(asList(employeesRes.value.data).filter((emp) => emp.role !== 'admin' && emp.status !== 'terminated'));
      if (trackingRes.status === 'fulfilled') {
        const seen = {};
        asList(trackingRes.value.data).forEach((row) => {
          if (row.currentLocation && isNum(row.currentLocation.latitude)) seen[row._id] = row.currentLocation;
        });
        setLastSeen(seen);
      }
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees.filter((emp) => !q || [emp.name, emp.employeeId, emp.position, emp.department]
      .some((value) => String(value || '').toLowerCase().includes(q)));
  }, [employees, query]);

  const assignedCount = employees.filter((emp) => emp.attendanceLocation?.enabled).length;

  const sitesOf = (emp) => (emp.workLocations || []).map((id) => sites.find((s) => s._id === String(id))).filter((s) => s && s.isActive !== false);

  // Work locations and field mode of one employee.
  const saveSitesAndMode = async (emp, body) => {
    try {
      const res = await api.put(`/work-locations/employee/${emp._id}`, body);
      const data = res.data?.data || {};
      setEmployees((prev) => prev.map((e) => (e._id === emp._id ? { ...e, workLocations: data.workLocations ?? e.workLocations, fieldAllowed: data.fieldAllowed ?? e.fieldAllowed } : e)));
      setSuccess(res.data?.message || 'Saved');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save');
    }
  };

  // Shift areas that also apply to an employee (their shifts, or the default shift).
  const shiftAreasOf = (emp) => {
    const ids = Array.isArray(emp.shifts) && emp.shifts.length ? emp.shifts.map(String) : emp.shift ? [String(emp.shift)] : [];
    const own = ids.map((id) => shifts.find((s) => s._id === id)).filter(Boolean);
    const list = own.length ? own : shifts.filter((s) => s.isDefault);
    return list.filter((s) => s.location);
  };

  const openEditor = (emp) => {
    const own = emp.attendanceLocation || {};
    const hasOwn = isNum(own.latitude) && isNum(own.longitude);
    const seen = lastSeen[emp._id];
    setEditing(emp);
    setForm({
      enabled: own.enabled ?? true,
      label: own.label || '',
      latitude: hasOwn ? own.latitude : seen?.latitude ?? office?.officeLatitude ?? '',
      longitude: hasOwn ? own.longitude : seen?.longitude ?? office?.officeLongitude ?? '',
      radiusMeters: own.radiusMeters || 150,
    });
    setFormError('');
    setSuccess('');
  };

  const setPoint = (lat, lng) => setForm((prev) => ({
    ...prev,
    latitude: Number(Number(lat).toFixed(6)),
    longitude: Number(Number(lng).toFixed(6)),
  }));

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setFormError('Geolocation is not supported by this browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPoint(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      (geoError) => {
        setFormError(geoError.message || 'Unable to fetch your location');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 20000 }
    );
  };

  const save = async (override) => {
    const payload = { ...form, ...override };
    if (payload.enabled) {
      if (!isNum(payload.latitude) || !isNum(payload.longitude)) {
        setFormError('Pick a point on the map or enter latitude and longitude.');
        return;
      }
      const radius = Number(payload.radiusMeters);
      if (!Number.isFinite(radius) || radius < 10 || radius > 50000) {
        setFormError('Radius must be between 10 and 50000 meters.');
        return;
      }
    }
    setSaving(true);
    setFormError('');
    try {
      const res = await api.put(`/employees/${editing._id}/attendance-location`, {
        enabled: Boolean(payload.enabled),
        label: payload.label,
        latitude: Number(payload.latitude),
        longitude: Number(payload.longitude),
        radiusMeters: Number(payload.radiusMeters),
      });
      const updated = res.data?.data?.attendanceLocation;
      setEmployees((prev) => prev.map((emp) => (emp._id === editing._id ? { ...emp, attendanceLocation: updated } : emp)));
      setSuccess(res.data?.message || 'Attendance location saved');
      setEditing(null);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save attendance location');
    } finally {
      setSaving(false);
    }
  };

  const center = isNum(form.latitude) && isNum(form.longitude)
    ? [Number(form.latitude), Number(form.longitude)]
    : [Number(office?.officeLatitude) || 28.6139, Number(office?.officeLongitude) || 77.209];
  const seen = editing ? lastSeen[editing._id] : null;

  return (
    <Card className="radius-card mt-3">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
        <div>
          <p className="radius-eyebrow">Step 4 · Employees: sites, field mode and own area</p>
          <h4 className="radius-title" style={{ fontSize: '1.2rem' }}>Where can each employee punch?</h4>
          <p className="text-muted small mb-0">
            Everyone can punch inside the office area above. Give an employee their own location and radius (site, warehouse,
            client office) and they can punch there as well as at the office. {assignedCount} of {employees.length} employees have their own area.
          </p>
        </div>
        <Form.Control
          style={{ maxWidth: 260 }}
          placeholder="Search employee"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      {loading ? (
        <p className="text-muted mb-0">Loading employees...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted mb-0">No employees found.</p>
      ) : (
        <div className="table-responsive">
          <Table hover className="align-middle mb-0">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Can punch at</th>
                <th>Field mode</th>
                <th>Own area radius</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => {
                const own = emp.attendanceLocation;
                const active = own?.enabled && isNum(own.latitude);
                return (
                  <tr key={emp._id}>
                    <td>
                      <div className="fw-semibold">{emp.name}</div>
                      <div className="small text-muted">{emp.employeeId} · {emp.position || emp.department || 'Employee'}</div>
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {emp.fieldAllowed && <Badge bg="" style={{ background: '#dcfce7', color: '#15803d' }}>Anywhere in field mode</Badge>}
                        <Badge bg="" style={{ background: '#eef1fc', color: '#0a1f8f' }}>Office · {office?.officeRadiusMeters ?? 100} m</Badge>
                        {sitesOf(emp).map((s) => (
                          <Badge key={s._id} bg="" style={{ background: `${s.color || '#0369a1'}1a`, color: s.color || '#0369a1' }}>{s.name} · {s.radiusMeters} m</Badge>
                        ))}
                        {shiftAreasOf(emp).map((s) => (
                          <Badge key={s._id} bg="" style={{ background: '#e0f2fe', color: '#0369a1' }}>{s.location.label || `${s.name} area`} · {Math.round(s.location.radiusMeters)} m</Badge>
                        ))}
                        {active && <Badge bg="" style={{ background: '#ede9fe', color: '#6d28d9' }}>{own.label || 'Own area'} · {Math.round(own.radiusMeters)} m</Badge>}
                      </div>
                    </td>
                    <td>
                      <Form.Check
                        type="switch"
                        id={`field-${emp._id}`}
                        checked={Boolean(emp.fieldAllowed)}
                        label={emp.fieldAllowed ? 'Allowed' : 'Off'}
                        onChange={(event) => saveSitesAndMode(emp, { fieldAllowed: event.target.checked })}
                      />
                    </td>
                    <td>{active ? `${Math.round(own.radiusMeters)} m` : <span className="text-muted small">Not set</span>}</td>
                    <td className="text-end">
                      <Button size="sm" variant="outline-secondary" className="me-1" onClick={() => { setSitesFor(emp); setPickedSites((emp.workLocations || []).map(String)); }} disabled={!sites.length}>
                        Sites
                      </Button>
                      <Button size="sm" variant="outline-primary" onClick={() => openEditor(emp)}>
                        {active ? 'Edit own area' : 'Own area'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      )}

      <Modal show={Boolean(sitesFor)} onHide={() => setSitesFor(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1.05rem' }}>Work locations · {sitesFor?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="small text-muted">Tick every place this employee works at. They can punch inside any of them, and always in the office area.</p>
          {sites.filter((s) => s.isActive !== false).map((s) => (
            <Form.Check
              key={s._id}
              type="checkbox"
              id={`site-${s._id}`}
              className="py-1"
              checked={pickedSites.includes(s._id)}
              onChange={(ev) => setPickedSites(ev.target.checked ? [...pickedSites, s._id] : pickedSites.filter((id) => id !== s._id))}
              label={<span><span className="fw-semibold" style={{ color: s.color }}>{s.name}</span> <span className="small text-muted">{s.radiusMeters} m{s.address ? ` · ${s.address}` : ''}</span></span>}
            />
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setSitesFor(null)}>Cancel</Button>
          <Button onClick={async () => { const emp = sitesFor; setSitesFor(null); await saveSitesAndMode(emp, { locationIds: pickedSites }); }}>Save</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={Boolean(editing)} onHide={() => !saving && setEditing(null)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1.1rem' }}>Punch area · {editing?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger">{formError}</Alert>}
          <Form.Check
            type="switch"
            id="employee-area-enabled"
            className="mb-3"
            label="Also allow punching at this place (the office area always works)"
            checked={form.enabled}
            onChange={(event) => setForm({ ...form, enabled: event.target.checked })}
          />
          <p className="small text-muted mb-2">Click on the map to place the punch point. The circle shows where punch in/out is allowed.</p>
          <div style={{ height: 320, borderRadius: 12, overflow: 'hidden', border: '1px solid #e6e9f2' }}>
            {editing && (
              <MapContainer center={center} zoom={15} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <ClickToPlace onPick={setPoint} />
                <Recenter center={center} />
                {isNum(form.latitude) && isNum(form.longitude) && (
                  <>
                    <Marker position={[Number(form.latitude), Number(form.longitude)]} />
                    <Circle
                      center={[Number(form.latitude), Number(form.longitude)]}
                      radius={Number(form.radiusMeters) || 0}
                      pathOptions={{ color: '#7c3aed', fillColor: '#7c3aed', fillOpacity: 0.12 }}
                    />
                  </>
                )}
              </MapContainer>
            )}
          </div>
          <Row className="g-3 mt-1">
            <Col md={6}>
              <Form.Label>Area name</Form.Label>
              <Form.Control
                placeholder="e.g. Mahipalpur Warehouse"
                value={form.label}
                maxLength={80}
                onChange={(event) => setForm({ ...form, label: event.target.value })}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Radius (meters)</Form.Label>
              <Form.Control
                type="number"
                min="10"
                max="50000"
                value={form.radiusMeters}
                onChange={(event) => setForm({ ...form, radiusMeters: event.target.value })}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Latitude</Form.Label>
              <Form.Control
                type="number"
                step="0.000001"
                value={form.latitude}
                onChange={(event) => setForm({ ...form, latitude: event.target.value })}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Longitude</Form.Label>
              <Form.Control
                type="number"
                step="0.000001"
                value={form.longitude}
                onChange={(event) => setForm({ ...form, longitude: event.target.value })}
              />
            </Col>
          </Row>
          <div className="d-flex flex-wrap gap-2 mt-3">
            <Button size="sm" variant="outline-secondary" onClick={useMyLocation} disabled={locating}>
              {locating ? 'Locating...' : 'Use my current location'}
            </Button>
            {seen && (
              <Button size="sm" variant="outline-secondary" onClick={() => setPoint(seen.latitude, seen.longitude)}>
                Use employee's last known location
              </Button>
            )}
            {isNum(office?.officeLatitude) && (
              <Button size="sm" variant="outline-secondary" onClick={() => setPoint(office.officeLatitude, office.officeLongitude)}>
                Use office location
              </Button>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          {editing?.attendanceLocation?.enabled && (
            <Button variant="outline-danger" className="me-auto" disabled={saving} onClick={() => save({ enabled: false })}>
              Remove custom area
            </Button>
          )}
          <Button variant="light" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={() => save()} disabled={saving}>
            {saving ? 'Saving...' : 'Save punch area'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default EmployeeLocationManager;
