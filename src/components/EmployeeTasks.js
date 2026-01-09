import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Alert, Badge } from 'react-bootstrap';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css';

const EmployeeTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/tasks/my-tasks`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setTasks(res.data.data || []);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch tasks');
        console.error('Error fetching tasks:', err);
      }
    };
    fetchTasks();
  }, []);

  const handleStatusUpdate = async (taskId, status) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/tasks/${taskId}`,
        { status },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setMessage('Task status updated successfully');
      setError('');
      // Update local state
      setTasks(tasks.map(task =>
        task._id === taskId ? { ...task, status } : task
      ));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task status');
      console.error('Error updating task:', err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge bg="success">Completed</Badge>;
      case 'in-progress':
        return <Badge bg="warning">In Progress</Badge>;
      case 'pending':
      default:
        return <Badge bg="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="tasks-container">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

          .tasks-container {
            font-family: 'Poppins', sans-serif;
            color: #1e40af;
            background: #ffffff;
            padding: 1.5rem;
            border-radius: 1rem;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            margin: 1rem auto;
            max-width: 100%;
          }
          .tasks-title {
            font-size: 2rem;
            font-weight: 700;
            color: #1e40af;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            margin-bottom: 2rem;
            text-align: center;
          }
          .alert-danger {
            border-radius: 0.6rem;
            border: 2px solid #f87171;
            background: #fef2f2;
            color: #b91c1c;
            margin-bottom: 1.5rem;
            padding: 1rem;
            font-size: 1rem;
            transition: transform 0.3s ease, opacity 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .alert-success {
            border-radius: 0.6rem;
            border: 2px solid #22c55e;
            background: #f0fdf4;
            color: #15803d;
            margin-bottom: 1.5rem;
            padding: 1rem;
            font-size: 1rem;
            transition: transform 0.3s ease, opacity 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .card {
            border-radius: 0.8rem;
            border: 2px solid rgba(30, 64, 175, 0.2);
            background: #f8fafc;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            width: 100%;
            color: #1e40af;
            overflow: hidden;
          }
          .card:hover {
            transform: translateY(-8px);
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
          }
          .card-body {
            padding: 1.5rem;
          }
          .table {
            background: #ffffff;
            border-radius: 0.6rem;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .table th {
            background: linear-gradient(90deg, #1e40af, #3b82f6);
            color: #fff;
            font-weight: 600;
            border: none;
            padding: 1rem;
          }
          .table td {
            padding: 1rem;
            border: none;
            vertical-align: middle;
          }
          .table tbody tr:nth-child(even) {
            background: #f8fafc;
          }
          .table tbody tr:hover {
            background: #e0f2fe;
          }
          .btn-primary {
            border-radius: 0.6rem;
            padding: 0.5rem 1rem;
            font-weight: 600;
            font-size: 0.9rem;
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
            border: 2px solid #3b82f6;
            background: linear-gradient(90deg, #f0f9ff, #bfdbfe);
            color: #1e40af;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .btn-primary::before {
            content: '';
            position: absolute;
            left: -100%;
            top: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.4), transparent);
            transition: left 0.4s ease;
          }
          .btn-primary:hover::before {
            left: 100%;
          }
          .btn-primary:hover {
            background: linear-gradient(90deg, #1e40af, #3b82f6) !important;
            border-color: #3b82f6 !important;
            color: #fff !important;
            transform: scale(1.05);
            box-shadow: 0 6px 16px rgba(59, 130, 246, 0.5);
          }
          .btn-success {
            border-radius: 0.6rem;
            padding: 0.5rem 1rem;
            font-weight: 600;
            font-size: 0.9rem;
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
            border: 2px solid #22c55e;
            background: linear-gradient(90deg, #f0fdf4, #bbf7d0);
            color: #15803d;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .btn-success::before {
            content: '';
            position: absolute;
            left: -100%;
            top: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.4), transparent);
            transition: left 0.4s ease;
          }
          .btn-success:hover::before {
            left: 100%;
          }
          .btn-success:hover {
            background: linear-gradient(90deg, #15803d, #22c55e) !important;
            border-color: #22c55e !important;
            color: #fff !important;
            transform: scale(1.05);
            box-shadow: 0 6px 16px rgba(34, 197, 94, 0.5);
          }
          @media (max-width: 768px) {
            .tasks-container {
              padding: 1rem;
              margin: 0.5rem;
            }
            .tasks-title {
              font-size: 1.6rem;
              margin-bottom: 1.5rem;
            }
            .table th, .table td {
              padding: 0.5rem;
              font-size: 0.9rem;
            }
            .btn-primary, .btn-success {
              padding: 0.4rem 0.8rem;
              font-size: 0.8rem;
            }
          }
        `}
      </style>
      <div className="tasks-container animate__animated animate__fadeIn">
        <h3 className="tasks-title animate__animated animate__zoomIn">My Tasks</h3>
        {error && (
          <Alert variant="danger" className="animate__animated animate__shakeX">
            {error}
          </Alert>
        )}
        {message && (
          <Alert variant="success" className="animate__animated animate__fadeIn">
            {message}
          </Alert>
        )}
        <Card className="animate__animated animate__fadeInUp" style={{ animationDelay: '0.1s' }}>
          <Card.Body>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <tr key={task._id}>
                      <td>{task.title || 'N/A'}</td>
                      <td>{task.description || 'N/A'}</td>
                      <td>{getStatusBadge(task.status)}</td>
                      <td>
                        {task.status !== 'completed' && (
                          <>
                            {task.status === 'pending' && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleStatusUpdate(task._id, 'in-progress')}
                                className="me-2"
                              >
                                Start
                              </Button>
                            )}
                            {task.status === 'in-progress' && (
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleStatusUpdate(task._id, 'completed')}
                              >
                                Complete
                              </Button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center">No tasks assigned</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeTasks;
