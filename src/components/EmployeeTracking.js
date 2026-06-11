import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Alert, Button, Table } from 'react-bootstrap';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapBounds = ({ employees }) => {
  const map = useMap();

  useEffect(() => {
    const points = employees
      .map((employee) => getEmployeeLocation(employee))
      .filter(Boolean);

    if (points.length === 1) {
      map.setView(points[0], 15);
      return;
    }

    if (points.length > 1) {
      map.fitBounds(points, { padding: [36, 36], maxZoom: 15 });
    }
  }, [employees, map]);

  return null;
};

const getEmployeeLocation = (employee) => {
  const gps = employee.currentLocation;
  const saved = employee.location;
  const latitude = Number(gps?.latitude ?? saved?.latitude);
  const longitude = Number(gps?.longitude ?? saved?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return [latitude, longitude];
};

const EmployeeTracking = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated');
  const [query, setQuery] = useState('');
  const [view, setView] = useState('map');

  const fetchTracking = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/tracking`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setEmployees(Array.isArray(res.data?.data) ? res.data.data : []);
      setError('');
    } catch (err) {
      console.error('Error fetching tracking:', err);
      setError(err.response?.data?.message || 'Failed to fetch tracking data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 60000);

    const handleAttendanceUpdate = () => fetchTracking();
    window.addEventListener('attendanceUpdated', handleAttendanceUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('attendanceUpdated', handleAttendanceUpdate);
    };
  }, []);

  const formatTime = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getLocationMeta = (employee) => {
    const location = getEmployeeLocation(employee);
    const latest = employee.currentLocation || employee.location || {};
    const timestamp = employee.currentLocation?.timestamp || employee.location?.lastUpdated || employee.lastLocationUpdate;
    return {
      location,
      timestamp,
      accuracy: latest.accuracy,
      source: latest.source || (employee.currentLocation ? 'gps' : employee.location ? 'saved' : 'none'),
      address: latest.address || '',
    };
  };

  const minutesSince = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  };

  const createCustomIcon = (employee) => {
    const hasLocation = Boolean(getEmployeeLocation(employee));
    const fill = !hasLocation ? '#94a3b8' : employee.isActive ? '#10b981' : '#2563eb';
    const label = (employee.name || 'E').slice(0, 1).toUpperCase();
    const svgString = `
      <svg width="44" height="52" viewBox="0 0 44 52" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 50C22 50 40 31.5 40 18.8C40 8.9 31.9 1 22 1C12.1 1 4 8.9 4 18.8C4 31.5 22 50 22 50Z" fill="${fill}" stroke="#ffffff" stroke-width="3"/>
        <circle cx="22" cy="19" r="11" fill="rgba(255,255,255,0.22)"/>
        <text x="22" y="24" text-anchor="middle" fill="#ffffff" font-size="13" font-weight="800">${label}</text>
      </svg>
    `;

    return new L.Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`,
      iconSize: [44, 52],
      iconAnchor: [22, 52],
      popupAnchor: [0, -48],
    });
  };

  const filteredEmployees = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return employees
      .filter((employee) => {
        const hasLocation = Boolean(getEmployeeLocation(employee));
        const matchesFilter =
          filter === 'all' ||
          (filter === 'active' && employee.isActive) ||
          (filter === 'inactive' && !employee.isActive) ||
          (filter === 'located' && hasLocation) ||
          (filter === 'missing' && !hasLocation);

        const matchesQuery = !normalizedQuery || [
          employee.employeeId,
          employee.name,
          employee.position,
          employee.department,
          employee.team,
        ].some((value) => String(value || '').toLowerCase().includes(normalizedQuery));

        return matchesFilter && matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return String(a.name || '').localeCompare(String(b.name || ''));
        if (sortBy === 'status') return Number(b.isActive) - Number(a.isActive);
        if (sortBy === 'hours') return (Number(b.hoursWorked) || 0) - (Number(a.hoursWorked) || 0);
        const aUpdated = new Date(getLocationMeta(a).timestamp || 0).getTime();
        const bUpdated = new Date(getLocationMeta(b).timestamp || 0).getTime();
        return bUpdated - aUpdated;
      });
  }, [employees, filter, query, sortBy]);

  const locatedEmployees = filteredEmployees.filter((employee) => getEmployeeLocation(employee));
  const stats = {
    total: employees.length,
    active: employees.filter((employee) => employee.isActive).length,
    located: employees.filter((employee) => getEmployeeLocation(employee)).length,
    missing: employees.filter((employee) => !getEmployeeLocation(employee)).length,
    tasks: employees.reduce((sum, employee) => sum + (employee.todaysTasks?.length || 0), 0),
    hours: employees.reduce((sum, employee) => sum + (Number(employee.hoursWorked) || 0), 0),
  };

  return (
    <div className="tracking-page">
      <style>
        {`
          .tracking-page {
            color: #0f172a;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }
          .tracking-hero,
          .tracking-kpi-card,
          .tracking-panel {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 0.85rem;
            box-shadow: 0 12px 30px rgba(15, 23, 42, 0.07);
          }
          .tracking-hero {
            background:
              radial-gradient(circle at 92% 8%, rgba(14, 165, 233, 0.14), transparent 30%),
              linear-gradient(135deg, #ffffff 0%, #f8fbff 55%, #eef7ff 100%);
            border-color: #dbeafe;
            padding: 1.35rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
          }
          .tracking-eyebrow,
          .tracking-kpi-label {
            margin: 0;
            color: #64748b;
            font-size: 0.76rem;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .tracking-title {
            margin: 0.2rem 0 0;
            color: #0f172a;
            font-size: clamp(1.45rem, 3vw, 2.1rem);
            font-weight: 850;
            line-height: 1.15;
          }
          .tracking-subtitle {
            margin: 0.45rem 0 0;
            color: #64748b;
            font-size: 0.95rem;
          }
          .tracking-action,
          .tracking-filter-btn,
          .tracking-view-btn {
            border: 1px solid #bfdbfe;
            background: #ffffff;
            color: #1d4ed8;
            border-radius: 0.65rem;
            padding: 0.62rem 0.85rem;
            font-weight: 800;
            transition: all 0.2s ease;
          }
          .tracking-action:hover,
          .tracking-filter-btn:hover,
          .tracking-filter-btn.active,
          .tracking-view-btn.active {
            background: #eff6ff;
            border-color: #93c5fd;
            transform: translateY(-1px);
          }
          .tracking-kpi-grid {
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 1rem;
          }
          .tracking-kpi-card {
            padding: 1rem;
            position: relative;
            overflow: hidden;
          }
          .tracking-kpi-card::after {
            content: '';
            position: absolute;
            right: -24px;
            top: -24px;
            width: 70px;
            height: 70px;
            border-radius: 50%;
            background: var(--accent, #dbeafe);
            opacity: 0.55;
          }
          .tracking-kpi-value {
            margin: 0.35rem 0 0.15rem;
            color: #0f172a;
            font-size: 1.8rem;
            font-weight: 850;
          }
          .tracking-kpi-note {
            margin: 0;
            color: #64748b;
            font-size: 0.86rem;
          }
          .tracking-toolbar {
            display: grid;
            grid-template-columns: minmax(220px, 1fr) auto auto;
            gap: 0.75rem;
            align-items: center;
          }
          .tracking-search,
          .tracking-select {
            width: 100%;
            min-height: 44px;
            border: 1px solid #cbd5e1;
            border-radius: 0.75rem;
            background: #ffffff;
            color: #0f172a;
            padding: 0.65rem 0.85rem;
            font-weight: 700;
          }
          .tracking-search:focus,
          .tracking-select:focus {
            outline: none;
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
          }
          .tracking-filter-group,
          .tracking-view-group {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            justify-content: flex-end;
          }
          .tracking-panel {
            padding: 1.1rem;
          }
          .tracking-map {
            height: min(68vh, 640px);
            min-height: 420px;
            width: 100%;
            border: 1px solid #e2e8f0;
            border-radius: 0.85rem;
            overflow: hidden;
            background: #f8fafc;
          }
          .tracking-map .leaflet-container {
            height: 100%;
            width: 100%;
          }
          .tracking-popup {
            min-width: 230px;
            color: #0f172a;
          }
          .tracking-popup-head,
          .tracking-person {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            min-width: 0;
          }
          .tracking-avatar {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: linear-gradient(135deg, #2563eb, #14b8a6);
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            overflow: hidden;
            flex: 0 0 auto;
          }
          .tracking-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .tracking-person strong,
          .tracking-person span,
          .tracking-popup strong,
          .tracking-popup span {
            display: block;
          }
          .tracking-person strong,
          .tracking-popup-name {
            color: #0f172a;
            font-weight: 850;
          }
          .tracking-person span,
          .tracking-popup-role {
            color: #64748b;
            font-size: 0.82rem;
            margin-top: 0.1rem;
          }
          .tracking-status {
            border-radius: 999px;
            padding: 0.35rem 0.65rem;
            font-size: 0.75rem;
            font-weight: 850;
            text-transform: capitalize;
          }
          .tracking-status.active,
          .tracking-status.located {
            color: #047857;
            background: #d1fae5;
          }
          .tracking-status.inactive,
          .tracking-status.missing {
            color: #92400e;
            background: #fef3c7;
          }
          .tracking-status.stale {
            color: #b91c1c;
            background: #fee2e2;
          }
          .tracking-table {
            margin: 0;
            border: 1px solid #e2e8f0;
            border-radius: 0.75rem;
            overflow: hidden;
            background: #ffffff;
          }
          .tracking-table thead {
            background: #f8fafc;
            color: #475569;
          }
          .tracking-table thead th {
            border-bottom: 1px solid #e2e8f0;
            font-size: 0.76rem;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            white-space: nowrap;
          }
          .tracking-table th,
          .tracking-table td {
            padding: 0.95rem;
            border-color: #e2e8f0;
            color: #334155;
            vertical-align: middle;
          }
          .tracking-table tbody tr:hover {
            background: #f8fafc;
            transform: none;
          }
          .tracking-location-text {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 0.82rem;
            color: #334155;
            white-space: nowrap;
          }
          .tracking-empty {
            min-height: 180px;
            border: 1px dashed #cbd5e1;
            border-radius: 0.85rem;
            background: #f8fafc;
            color: #64748b;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 1rem;
            font-weight: 700;
          }
          @media (max-width: 1200px) {
            .tracking-kpi-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .tracking-toolbar {
              grid-template-columns: 1fr;
            }
            .tracking-filter-group,
            .tracking-view-group {
              justify-content: flex-start;
            }
          }
          @media (max-width: 768px) {
            .tracking-hero {
              flex-direction: column;
              align-items: flex-start;
            }
            .tracking-kpi-grid {
              grid-template-columns: 1fr;
            }
            .tracking-map {
              min-height: 360px;
            }
          }
        `}
      </style>

      <section className="tracking-hero">
        <div>
          <p className="tracking-eyebrow">Live employee tracking</p>
          <h3 className="tracking-title">Location Monitor</h3>
          <p className="tracking-subtitle">Track every active employee's latest GPS location, attendance status, tasks, and last update.</p>
        </div>
        <Button type="button" className="tracking-action" onClick={fetchTracking} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh locations'}
        </Button>
      </section>

      {error && <Alert variant="danger">{error}</Alert>}

      <section className="tracking-kpi-grid">
        <div className="tracking-kpi-card" style={{ '--accent': '#bfdbfe' }}>
          <p className="tracking-kpi-label">Employees</p>
          <h4 className="tracking-kpi-value">{stats.total}</h4>
          <p className="tracking-kpi-note">Active employee accounts</p>
        </div>
        <div className="tracking-kpi-card" style={{ '--accent': '#bbf7d0' }}>
          <p className="tracking-kpi-label">Punched In</p>
          <h4 className="tracking-kpi-value">{stats.active}</h4>
          <p className="tracking-kpi-note">Attendance active now</p>
        </div>
        <div className="tracking-kpi-card" style={{ '--accent': '#bae6fd' }}>
          <p className="tracking-kpi-label">Located</p>
          <h4 className="tracking-kpi-value">{stats.located}</h4>
          <p className="tracking-kpi-note">{stats.missing} missing GPS</p>
        </div>
        <div className="tracking-kpi-card" style={{ '--accent': '#fed7aa' }}>
          <p className="tracking-kpi-label">Hours</p>
          <h4 className="tracking-kpi-value">{stats.hours.toFixed(1)}</h4>
          <p className="tracking-kpi-note">Tracked today</p>
        </div>
        <div className="tracking-kpi-card" style={{ '--accent': '#fecdd3' }}>
          <p className="tracking-kpi-label">Tasks</p>
          <h4 className="tracking-kpi-value">{stats.tasks}</h4>
          <p className="tracking-kpi-note">Assigned today</p>
        </div>
      </section>

      <section className="tracking-toolbar">
        <input
          className="tracking-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search employee, ID, team, department, or position"
        />
        <div className="tracking-filter-group">
          {[
            ['all', 'All'],
            ['active', 'Punched In'],
            ['inactive', 'Not Punched'],
            ['located', 'Located'],
            ['missing', 'No GPS'],
          ].map(([key, label]) => (
            <button key={key} type="button" className={`tracking-filter-btn ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}>
              {label}
            </button>
          ))}
        </div>
        <div className="tracking-view-group">
          {['map', 'table'].map((key) => (
            <button key={key} type="button" className={`tracking-view-btn ${view === key ? 'active' : ''}`} onClick={() => setView(key)}>
              {key === 'map' ? 'Map' : 'Table'}
            </button>
          ))}
        </div>
      </section>

      {view === 'map' ? (
        <section className="tracking-panel">
          {loading ? (
            <div className="tracking-empty">Loading live locations...</div>
          ) : locatedEmployees.length ? (
            <div className="tracking-map">
              <MapContainer center={[20.5937, 78.9629]} zoom={5} scrollWheelZoom>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapBounds employees={locatedEmployees} />
                {locatedEmployees.map((employee) => {
                  const location = getEmployeeLocation(employee);
                  const meta = getLocationMeta(employee);
                  const age = minutesSince(meta.timestamp);

                  return (
                    <Marker key={employee._id} position={location} icon={createCustomIcon(employee)}>
                      <Popup>
                        <div className="tracking-popup">
                          <div className="tracking-popup-head">
                            <div className="tracking-avatar">
                              {employee.profilePhoto ? <img src={employee.profilePhoto} alt={employee.name || 'Employee'} /> : (employee.name || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <strong className="tracking-popup-name">{employee.name || 'N/A'}</strong>
                              <span className="tracking-popup-role">{employee.position || employee.department || 'Team member'}</span>
                            </div>
                          </div>
                          <div className="mt-2 d-flex gap-2 flex-wrap">
                            <span className={`tracking-status ${employee.isActive ? 'active' : 'inactive'}`}>{employee.isActive ? 'Punched in' : 'Not punched'}</span>
                            <span className={`tracking-status ${age !== null && age > 30 ? 'stale' : 'located'}`}>{age === null ? 'Saved GPS' : `${age} min ago`}</span>
                          </div>
                          <div className="mt-2 small">
                            <div><strong>ID:</strong> {employee.employeeId || 'N/A'}</div>
                            <div><strong>Team:</strong> {employee.team || employee.department || 'N/A'}</div>
                            <div><strong>Hours:</strong> {(Number(employee.hoursWorked) || 0).toFixed(2)} hrs</div>
                            <div><strong>Accuracy:</strong> {meta.accuracy ? `${Math.round(meta.accuracy)} m` : 'N/A'}</div>
                            <div><strong>Coordinates:</strong> {location[0].toFixed(5)}, {location[1].toFixed(5)}</div>
                            <div><strong>Updated:</strong> {formatTime(meta.timestamp)}</div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          ) : (
            <div className="tracking-empty">No real GPS locations available yet. Employees need to allow location permission from their portal.</div>
          )}
        </section>
      ) : (
        <section className="tracking-panel">
          <div className="mb-3" style={{ maxWidth: 260 }}>
            <select className="tracking-select" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="updated">Sort by latest location</option>
              <option value="name">Sort by name</option>
              <option value="status">Sort by attendance status</option>
              <option value="hours">Sort by hours worked</option>
            </select>
          </div>

          {loading ? (
            <div className="tracking-empty">Loading employee table...</div>
          ) : filteredEmployees.length ? (
            <div className="table-responsive">
              <Table className="tracking-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Team</th>
                    <th>Attendance</th>
                    <th>GPS</th>
                    <th>Coordinates</th>
                    <th>Accuracy</th>
                    <th>Punch In</th>
                    <th>Punch Out</th>
                    <th>Hours</th>
                    <th>Tasks</th>
                    <th>Last Location</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => {
                    const location = getEmployeeLocation(employee);
                    const meta = getLocationMeta(employee);
                    const age = minutesSince(meta.timestamp);

                    return (
                      <tr key={employee._id}>
                        <td>
                          <div className="tracking-person">
                            <div className="tracking-avatar">
                              {employee.profilePhoto ? <img src={employee.profilePhoto} alt={employee.name || 'Employee'} /> : (employee.name || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <strong>{employee.name || 'N/A'}</strong>
                              <span>{employee.employeeId || 'N/A'} | {employee.position || 'N/A'}</span>
                            </div>
                          </div>
                        </td>
                        <td>{employee.team || employee.department || 'N/A'}</td>
                        <td><span className={`tracking-status ${employee.isActive ? 'active' : 'inactive'}`}>{employee.isActive ? 'Punched in' : 'Not punched'}</span></td>
                        <td><span className={`tracking-status ${location ? 'located' : 'missing'}`}>{location ? meta.source : 'No GPS'}</span></td>
                        <td className="tracking-location-text">{location ? `${location[0].toFixed(5)}, ${location[1].toFixed(5)}` : 'N/A'}</td>
                        <td>{meta.accuracy ? `${Math.round(meta.accuracy)} m` : 'N/A'}</td>
                        <td>{formatTime(employee.punchIn)}</td>
                        <td>{formatTime(employee.punchOut)}</td>
                        <td>{(Number(employee.hoursWorked) || 0).toFixed(2)} hrs</td>
                        <td>{employee.todaysTasks?.length || 0}</td>
                        <td>{age === null ? formatTime(meta.timestamp) : `${age} min ago`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="tracking-empty">No employees match this filter.</div>
          )}
        </section>
      )}
    </div>
  );
};

export default EmployeeTracking;
