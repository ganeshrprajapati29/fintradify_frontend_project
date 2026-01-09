import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RelievingLetter.css';

const RelievingLetter = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [relievingDate, setRelievingDate] = useState('');
  const [reason, setReason] = useState('Resignation');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [generatedLetters, setGeneratedLetters] = useState([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('Relieving Letter - Fintradify');
  const [emailContent, setEmailContent] = useState('');
  const [selectedLetterForEmail, setSelectedLetterForEmail] = useState(null);

  useEffect(() => {
    fetchEmployees();
    fetchGeneratedLetters();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://crm.fintradify.com/api/employees', {
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
      const response = await axios.get('https://crm.fintradify.com/api/relieving', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGeneratedLetters(response.data.data || []);
    } catch (error) {
      console.error('Error fetching relieving letters:', error);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedEmployee || !relievingDate) {
      setMessage('Please select an employee and enter relieving date');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('https://crm.fintradify.com/api/relieving/generate', {
        employeeId: selectedEmployee,
        relievingDate,
        reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage('Relieving letter generated and emailed successfully!');
      fetchGeneratedLetters(); // Refresh the list
    } catch (error) {
      console.error('Error generating relieving letter:', error);
      setMessage(error.response?.data?.message || 'Error generating relieving letter');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (letterId) => {
    if (!window.confirm('Are you sure you want to delete this relieving letter?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`https://crm.fintradify.com/api/relieving/${letterId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage('Relieving letter deleted successfully!');
      fetchGeneratedLetters(); // Refresh the list
    } catch (error) {
      console.error('Error deleting relieving letter:', error);
      setMessage(error.response?.data?.message || 'Error deleting relieving letter');
    }
  };

  const handleEmailEdit = (letter) => {
    setSelectedLetterForEmail(letter);
    setEmailSubject('Relieving Letter - Fintradify');
    setEmailContent(`Dear ${letter.employee?.name},

We are pleased to inform you that your relieving letter has been successfully generated and is now available for download.

This document serves as an official record of your employment tenure with Fintradify and can be used for future employment opportunities or official purposes.

Please find your relieving letter attached/download link below.

We wish you all the very best in your future endeavors and continued success in your career.

Best Regards,
Fintradify HR Team
HR Department
Email: hr@fintradify.com | Phone: +91 78360 09907`);
    setShowEmailModal(true);
  };

  const handleSendCustomEmail = async () => {
    if (!selectedLetterForEmail || !emailContent.trim()) {
      alert('Please enter email content');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('https://crm.fintradify.com/api/relieving/send-email', {
        letterId: selectedLetterForEmail._id,
        subject: emailSubject,
        content: emailContent
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Custom email sent successfully!');
      setShowEmailModal(false);
      setSelectedLetterForEmail(null);
    } catch (error) {
      console.error('Error sending custom email:', error);
      alert(error.response?.data?.message || 'Error sending custom email');
    }
  };

  return (
    <div className="relieving-letter-container">
      <h2>Generate Relieving Letter</h2>

      <form onSubmit={handleGenerate} className="relieving-form">
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
          <label htmlFor="relievingDate">Relieving Date:</label>
          <input
            type="date"
            id="relievingDate"
            value={relievingDate}
            onChange={(e) => setRelievingDate(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="reason">Reason:</label>
          <select
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <option value="Resignation">Resignation</option>
            <option value="Termination">Termination</option>
            <option value="Retirement">Retirement</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <button type="submit" disabled={loading} className="generate-btn">
          {loading ? 'Generating...' : 'Generate Relieving Letter'}
        </button>
      </form>

      {message && <p className="message">{message}</p>}

      <div className="generated-letters">
        <h3>Generated Relieving Letters</h3>
        <table className="letters-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Relieving Date</th>
              <th>Reason</th>
              <th>Generated At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {generatedLetters.map(letter => (
              <tr key={letter._id}>
                <td>{letter.employee?.employeeId}</td>
                <td>{letter.employee?.name}</td>
                <td>{letter.employee?.email}</td>
                <td>{new Date(letter.relievingDate).toLocaleDateString()}</td>
                <td>{letter.reason}</td>
                <td>{new Date(letter.generatedAt).toLocaleDateString()}</td>
                <td className="actions-cell">
                  <a href={letter.letterUrl} target="_blank" rel="noopener noreferrer" className="download-link">
                    Download
                  </a>
                  <button
                    onClick={() => handleEmailEdit(letter)}
                    className="email-btn"
                    title="Edit Email"
                  >
                    ✉️ Email
                  </button>
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

      {/* Email Modal */}
      {showEmailModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Customize Email</h3>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="emailSubject">Subject:</label>
                <input
                  type="text"
                  id="emailSubject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="email-subject-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="emailContent">Email Content:</label>
                <textarea
                  id="emailContent"
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  rows="15"
                  className="email-content-textarea"
                  placeholder="Enter your custom email content here..."
                />
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={handleSendCustomEmail} className="send-email-btn">
                Send Custom Email
              </button>
              <button onClick={() => setShowEmailModal(false)} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RelievingLetter;
