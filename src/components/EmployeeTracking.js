import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Alert, Badge, Table, Button, Tabs, Tab } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const EmployeeTracking = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filter, setFilter] = useState('all'); // all, active, inactive

  const fetchTracking = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/tracking`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setEmployees(res.data.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching tracking:', err);
      setError('Failed to fetch tracking data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();

    const handleAttendanceUpdate = () => {
      fetchTracking();
    };

    window.addEventListener('attendanceUpdated', handleAttendanceUpdate);

    return () => {
      window.removeEventListener('attendanceUpdated', handleAttendanceUpdate);
    };
  }, []);

  const sortedEmployees = [...employees].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'status') return a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1;
    if (sortBy === 'hours') return b.hoursWorked - a.hoursWorked;
    return 0;
  });

  const filteredEmployees = sortedEmployees.filter(emp => {
    if (filter === 'active') return emp.isActive;
    if (filter === 'inactive') return !emp.isActive;
    return true;
  });

  if (loading) return <div>Loading tracking data...</div>;

  // Sample locations for demonstration (replace with real data)
  const sampleLocations = {
    'EMP001': { latitude: 28.6139, longitude: 77.2090 }, // Delhi
    'EMP002': { latitude: 19.0760, longitude: 72.8777 }, // Mumbai
    'EMP003': { latitude: 13.0827, longitude: 80.2707 }, // Chennai
    'EMP004': { latitude: 22.5726, longitude: 88.3639 }, // Kolkata
    'EMP005': { latitude: 12.9716, longitude: 77.5946 }, // Bangalore
  };

  const getEmployeeLocation = (emp) => {
    if (emp.location && emp.location.latitude && emp.location.longitude) {
      return [emp.location.latitude, emp.location.longitude];
    }
    // Use sample location based on employee ID or generate random nearby
    const sample = sampleLocations[emp.employeeId] || {
      latitude: 28.6139 + (Math.random() - 0.5) * 0.1,
      longitude: 77.2090 + (Math.random() - 0.5) * 0.1
    };
    return [sample.latitude, sample.longitude];
  };

  const createCustomIcon = (isActive) => {
    const svgString = `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="${isActive ? '#10b981' : '#6b7280'}" stroke="#ffffff" stroke-width="3"/>
        <text x="20" y="25" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="bold">
          ${isActive ? '●' : '○'}
        </text>
      </svg>
    `;
    return new L.Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    });
  };

  return (
    <div>
      <h5 className="text-primary-600 mb-3">Employee Tracking Dashboard</h5>
      {error && <Alert variant="danger">{error}</Alert>}

      <div className="mb-3 d-flex gap-2">
        <Button variant={filter === 'all' ? 'primary' : 'outline-primary'} onClick={() => setFilter('all')}>
          All ({employees.length})
        </Button>
        <Button variant={filter === 'active' ? 'success' : 'outline-success'} onClick={() => setFilter('active')}>
          Active ({employees.filter(e => e.isActive).length})
        </Button>
        <Button variant={filter === 'inactive' ? 'secondary' : 'outline-secondary'} onClick={() => setFilter('inactive')}>
          Inactive ({employees.filter(e => !e.isActive).length})
        </Button>
      </div>

      <Tabs defaultActiveKey="map" id="tracking-tabs" className="mb-3">
        <Tab eventKey="map" title="Map View">
          <Card>
            <Card.Body>
              <div style={{ height: '600px', width: '100%' }}>
                <MapContainer
                  center={[20.5937, 78.9629]} // Center of India
                  zoom={5}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {filteredEmployees.map((emp) => {
                    const location = getEmployeeLocation(emp);
                    return (
                      <Marker
                        key={emp._id}
                        position={location}
                        icon={createCustomIcon(emp.isActive)}
                      >
                        <Popup>
                          <div style={{ minWidth: '200px' }}>
                            <div className="d-flex align-items-center mb-2">
                              {emp.profilePhoto ? (
                                <img
                                  src={emp.profilePhoto}
                                  alt="Profile"
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    marginRight: '10px',
                                    border: '2px solid #1e40af'
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: '#bfdbfe',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    color: '#1e40af',
                                    marginRight: '10px'
                                  }}
                                >
                                  {(emp.name || 'U')[0].toUpperCase()}
                                </div>
                              )}
                              <div>
                                <h6 className="mb-0">{emp.name}</h6>
                                <small className="text-muted">{emp.position}</small>
                              </div>
                            </div>
                            <div className="mb-2">
                              <Badge bg={emp.isActive ? 'success' : 'secondary'}>
                                {emp.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <div className="small">
                              <div><strong>Team:</strong> {emp.team || emp.department || 'N/A'}</div>
                              <div><strong>Hours Today:</strong> {emp.hoursWorked.toFixed(2)} hrs</div>
                              <div><strong>Punch In:</strong> {emp.punchIn ? new Date(emp.punchIn).toLocaleTimeString() : 'N/A'}</div>
                              <div><strong>Tasks:</strong> {emp.todaysTasks ? emp.todaysTasks.length : 0}</div>
                              <div><strong>Location:</strong> {location[0].toFixed(4)}, {location[1].toFixed(4)}</div>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="table" title="Table View">
          <div className="mb-3">
            <label className="form-label">Sort by:</label>
            <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name">Name</option>
              <option value="status">Status</option>
              <option value="hours">Hours Worked</option>
            </select>
          </div>

          <div className="table-responsive">
            <Table className="table table-bordered table-hover">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Position</th>
                  <th>Team</th>
                  <th>Status</th>
                  <th>Hours Today</th>
                  <th>Punch In</th>
                  <th>Punch Out</th>
                  <th>Tasks Today</th>
                  <th>Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp._id} className="animate__animated animate__fadeIn">
                    <td>
                      {emp.profilePhoto ? (
                        <img
                          src={emp.profilePhoto}
                          alt="Profile"
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid #1e40af'
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: '#bfdbfe',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            color: '#1e40af'
                          }}
                        >
                          {(emp.name || 'U')[0].toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td>{emp.name}</td>
                    <td>{emp.position}</td>
                    <td>{emp.team || emp.department || 'N/A'}</td>
                    <td>
                      <Badge bg={emp.isActive ? 'success' : 'secondary'}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>{emp.hoursWorked.toFixed(2)} hrs</td>
                    <td>{emp.punchIn ? new Date(emp.punchIn).toLocaleTimeString() : '-'}</td>
                    <td>{emp.punchOut ? new Date(emp.punchOut).toLocaleTimeString() : '-'}</td>
                    <td>
                      {emp.todaysTasks && emp.todaysTasks.length > 0 ? (
                        <div>
                          {emp.todaysTasks.slice(0, 2).map((task, idx) => (
                            <div key={idx} className="small">
                              • {task.title} ({task.status})
                            </div>
                          ))}
                          {emp.todaysTasks.length > 2 && <div className="small text-muted">+{emp.todaysTasks.length - 2} more</div>}
                        </div>
                      ) : (
                        'No tasks'
                      )}
                    </td>
                    <td>{new Date(emp.lastActivity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Tab>
      </Tabs>

      <Card className="mt-4">
        <Card.Body>
          <h6 className="text-primary-800">Summary</h6>
          <div className="row">
            <div className="col-md-3">
              <div className="text-center">
                <h4 className="text-primary-600">{employees.length}</h4>
                <p className="text-muted">Total Employees</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="text-center">
                <h4 className="text-success">{employees.filter(e => e.isActive).length}</h4>
                <p className="text-muted">Currently Active</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="text-center">
                <h4 className="text-warning">
                  {employees.filter(e => e.isActive).reduce((sum, e) => sum + e.hoursWorked, 0).toFixed(1)}
                </h4>
                <p className="text-muted">Total Hours Today</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="text-center">
                <h4 className="text-info">
                  {employees.reduce((sum, e) => sum + (e.todaysTasks ? e.todaysTasks.length : 0), 0)}
                </h4>
                <p className="text-muted">Tasks Assigned Today</p>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default EmployeeTracking;
