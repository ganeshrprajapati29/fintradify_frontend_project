import React, { useState, useEffect } from 'react';
import { Form, Button, Table, Alert } from 'react-bootstrap';
import axios from 'axios';

const TaskForm = () => {
  const [formData, setFormData] = useState({ title: '', description: '', employeeId: '' });
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const abortController = new AbortController();

    const fetchData = async () => {
      try {
        console.log('Fetching employees for task assignment...');
        const empRes = await axios.get(`${process.env.REACT_APP_API_URL}/employees`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          signal: abortController.signal,
        });
        if (isMounted) {
          console.log('Employees fetched:', empRes.data);
          setEmployees(empRes.data || []);
          setError('');
        }

        console.log('Fetching tasks...');
        const taskRes = await axios.get(`${process.env.REACT_APP_API_URL}/tasks/my-tasks`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          signal: abortController.signal,
        });
        if (isMounted) {
          console.log('Tasks fetched:', taskRes.data);
          setTasks(taskRes.data || []);
          setError('');
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        if (isMounted) {
          console.error('Fetch data error:', err.response?.status, err.response?.data);
          setError(err.response?.data?.message || 'Error fetching data');
        }
      }
    };

    fetchData();

    return () => {
      setIsMounted(false);
      abortController.abort();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Creating task:', formData);
      await axios.post(
        `${process.env.REACT_APP_API_URL}/tasks`,
        formData,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (isMounted) {
        setFormData({ title: '', description: '', employeeId: '' });
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/tasks/my-tasks`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        console.log('Updated tasks:', res.data);
        setTasks(res.data || []);
        setError('');
      }
    } catch (err) {
      if (isMounted) {
        console.error('Create task error:', err.response?.status, err.response?.data);
        setError(err.response?.data?.message || 'Server error creating task');
      }
    }
  };

  return (
    <div className="mt-4">
      <h3>Assign Task</h3>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit} className="mb-4">
        <Form.Group controlId="title" className="mb-3">
          <Form.Label>Title</Form.Label>
          <Form.Control
            type="text"
            name="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </Form.Group>
        <Form.Group controlId="description" className="mb-3">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            name="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </Form.Group>
        <Form.Group controlId="employeeId" className="mb-3">
          <Form.Label>Employee</Form.Label>
          <Form.Control
            as="select"
            name="employeeId"
            value={formData.employeeId}
            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
            required
          >
            <option value="">Select Employee</option>
            {employees.length > 0 ? (
              employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.employeeId})
                </option>
              ))
            ) : (
              <option disabled>No employees available</option>
            )}
          </Form.Control>
        </Form.Group>
        <Button variant="primary" type="submit">
          Assign Task
        </Button>
      </Form>

      <h3>Tasks</h3>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Employee</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <tr key={task._id}>
                <td>{task.title || 'N/A'}</td>
                <td>{task.description || 'N/A'}</td>
                <td>{task.employee?.name || 'N/A'} ({task.employee?.employeeId || 'N/A'})</td>
                <td>{task.status || 'N/A'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">No tasks available</td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default TaskForm;