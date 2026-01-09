import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Alert, Badge } from 'react-bootstrap';

const EmployeeTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTeams = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/teams`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setTeams(res.data.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError('Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  if (loading) return <div>Loading teams...</div>;

  return (
    <div>
      <h5 className="text-primary-600 mb-3">Employee Teams</h5>
      {error && <Alert variant="danger">{error}</Alert>}
      {teams.map((team, index) => (
        <Card key={team.teamName} className="mb-4 animate__animated animate__fadeInUp" style={{ animationDelay: `${0.1 * index}s` }}>
          <Card.Body>
            <h6 className="text-primary-800 mb-3">{team.teamName}</h6>
            <div className="row">
              {team.employees.map((emp) => (
                <div key={emp._id} className="col-md-4 col-sm-6 mb-3">
                  <Card className={`text-center ${emp.isActive ? 'border-success' : 'border-secondary'}`} style={{ borderWidth: '2px' }}>
                    <Card.Body>
                      {emp.profilePhoto ? (
                        <img
                          src={emp.profilePhoto}
                          alt="Profile"
                          style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid #1e40af',
                            marginBottom: '10px'
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            background: '#bfdbfe',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#1e40af',
                            marginBottom: '10px'
                          }}
                        >
                          {(emp.name || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <h6 className="text-primary-800">{emp.name}</h6>
                      <p className="text-muted mb-1">{emp.position}</p>
                      <Badge bg={emp.isActive ? 'success' : 'secondary'} className="mb-2">
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <div className="mb-2">
                        {emp.isActive ? (
                          <>
                            <p className="text-muted mb-1">Hours Worked: {emp.hoursWorked.toFixed(2)} hrs</p>
                            <p className="text-muted mb-1">Punch In: {new Date(emp.punchIn).toLocaleTimeString()}</p>
                            {emp.punchOut && <p className="text-muted mb-1">Punch Out: {new Date(emp.punchOut).toLocaleTimeString()}</p>}
                            <p className="text-muted mb-1">Status: {emp.attendanceStatus || 'Pending'}</p>
                          </>
                        ) : (
                          <p className="text-muted mb-1">Not Punched In Today</p>
                        )}
                      </div>
                      {emp.todaysTasks && emp.todaysTasks.length > 0 && (
                        <div className="mb-2">
                          <p className="text-muted mb-1"><strong>Today's Tasks:</strong></p>
                          {emp.todaysTasks.slice(0, 3).map((task, idx) => (
                            <p key={idx} className="text-muted small mb-1">
                              • {task.title} ({task.status})
                            </p>
                          ))}
                          {emp.todaysTasks.length > 3 && <p className="text-muted small">+{emp.todaysTasks.length - 3} more</p>}
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
};

export default EmployeeTeams;
