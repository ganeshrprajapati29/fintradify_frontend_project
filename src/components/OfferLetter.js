import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import './OfferLetter.css';

const OfferLetter = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [salary, setSalary] = useState('');
  const [reportingManager, setReportingManager] = useState('');
  const [workLocation, setWorkLocation] = useState('Noida, Uttar Pradesh');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [generatedLetters, setGeneratedLetters] = useState([]);

  useEffect(() => {
    fetchEmployees();
    fetchGeneratedLetters();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchGeneratedLetters = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/offer', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGeneratedLetters(response.data.data || []);
    } catch (error) {
      console.error('Error fetching offer letters:', error);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedEmployee || !position || !department || !joiningDate || !salary) {
      setMessage('Please fill all required fields');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/offer/generate', {
        employeeId: selectedEmployee,
        position,
        department,
        joiningDate,
        salary: parseFloat(salary),
        reportingManager,
        workLocation
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage('Offer letter generated and emailed successfully!');
      fetchGeneratedLetters(); // Refresh the list

      // Reset form
      setSelectedEmployee('');
      setPosition('');
      setDepartment('');
      setJoiningDate('');
      setSalary('');
      setReportingManager('');
      setWorkLocation('Noida, Uttar Pradesh');

    } catch (error) {
      console.error('Error generating offer letter:', error);
      setMessage(error.response?.data?.message || 'Error generating offer letter');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (letterId) => {
    if (!window.confirm('Are you sure you want to delete this offer letter?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/offer/${letterId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage('Offer letter deleted successfully!');
      fetchGeneratedLetters(); // Refresh the list
    } catch (error) {
      console.error('Error deleting offer letter:', error);
      setMessage(error.response?.data?.message || 'Error deleting offer letter');
    }
  };

  const handleStatusUpdate = async (letterId, status, rejectionReason = '') => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/offer/${letterId}/status`, {
        status,
        rejectionReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage(`Offer letter ${status} successfully!`);
      fetchGeneratedLetters(); // Refresh the list
    } catch (error) {
      console.error('Error updating offer letter status:', error);
      setMessage(error.response?.data?.message || 'Error updating offer letter status');
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      draft: 'status-draft',
      sent: 'status-sent',
      accepted: 'status-accepted',
      rejected: 'status-rejected'
    };

    return (
      <span className={`status-badge ${statusClasses[status] || 'status-draft'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="offer-letter-container">
      <h2>Generate Offer Letter</h2>

      <form onSubmit={handleGenerate} className="offer-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="employee">Select Employee:</label>
            <select
              id="employee"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              required
            >
              <option value="">Select Employee</option>
              {employees.map(employee => (
                <option key={employee._id} value={employee._id}>
                  {employee.employeeId} - {employee.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="position">Position:</label>
            <input
              type="text"
              id="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g., Software Developer"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="department">Department:</label>
            <input
              type="text"
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g., Technology"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="joiningDate">Joining Date:</label>
            <input
              type="date"
              id="joiningDate"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="salary">Monthly Salary (INR):</label>
            <input
              type="number"
              id="salary"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="e.g., 50000"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reportingManager">Reporting Manager:</label>
            <input
              type="text"
              id="reportingManager"
              value={reportingManager}
              onChange={(e) => setReportingManager(e.target.value)}
              placeholder="e.g., John Smith"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="workLocation">Work Location:</label>
            <input
              type="text"
              id="workLocation"
              value={workLocation}
              onChange={(e) => setWorkLocation(e.target.value)}
              placeholder="e.g., Noida, Uttar Pradesh"
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="generate-btn">
          {loading ? 'Generating...' : 'Generate Offer Letter'}
        </button>
      </form>

      {message && <p className="message">{message}</p>}

      <div className="generated-letters">
        <h3>Generated Offer Letters</h3>
        <table className="letters-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Position</th>
              <th>Department</th>
              <th>Salary</th>
              <th>Joining Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {generatedLetters.map(letter => (
              <tr key={letter._id}>
                <td>{letter.employee?.employeeId}</td>
                <td>{letter.employee?.name}</td>
                <td>{letter.employee?.email}</td>
                <td>{letter.position}</td>
                <td>{letter.department}</td>
                <td>₹{letter.salary?.toLocaleString('en-IN')}</td>
                <td>{new Date(letter.joiningDate).toLocaleDateString()}</td>
                <td>{getStatusBadge(letter.status)}</td>
                <td className="actions-cell">
                  <a href={letter.offerLetterUrl} target="_blank" rel="noopener noreferrer" className="download-link">
                    Download
                  </a>
                  {letter.status === 'sent' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(letter._id, 'accepted')}
                        className="accept-btn"
                        title="Mark as Accepted"
                      >
                        ✅ Accept
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Enter rejection reason:');
                          if (reason) handleStatusUpdate(letter._id, 'rejected', reason);
                        }}
                        className="reject-btn"
                        title="Mark as Rejected"
                      >
                        ❌ Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(letter._id)}
                    className="delete-btn"
                    title="Delete Letter"
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OfferLetter;
