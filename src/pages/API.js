import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const API = () => {
  const { settings } = useSettings();
  const [darkMode, setDarkMode] = useState(settings.theme === 'dark');

  const apiEndpoints = [
    {
      method: 'GET',
      endpoint: '/api/employees',
      description: 'Retrieve list of employees',
      parameters: ['limit', 'offset', 'department'],
      example: 'GET /api/employees?limit=10&department=IT'
    },
    {
      method: 'POST',
      endpoint: '/api/employees',
      description: 'Create new employee',
      parameters: ['name', 'email', 'department', 'position'],
      example: 'POST /api/employees\n{\n  "name": "John Doe",\n  "email": "john@company.com",\n  "department": "IT",\n  "position": "Developer"\n}'
    },
    {
      method: 'GET',
      endpoint: '/api/attendance/{employeeId}',
      description: 'Get attendance records for employee',
      parameters: ['startDate', 'endDate'],
      example: 'GET /api/attendance/123?startDate=2024-01-01&endDate=2024-01-31'
    },
    {
      method: 'POST',
      endpoint: '/api/attendance',
      description: 'Record attendance',
      parameters: ['employeeId', 'date', 'checkIn', 'checkOut'],
      example: 'POST /api/attendance\n{\n  "employeeId": 123,\n  "date": "2024-01-15",\n  "checkIn": "09:00",\n  "checkOut": "18:00"\n}'
    },
    {
      method: 'GET',
      endpoint: '/api/leaves',
      description: 'Get leave requests',
      parameters: ['status', 'employeeId', 'startDate', 'endDate'],
      example: 'GET /api/leaves?status=pending&employeeId=123'
    },
    {
      method: 'POST',
      endpoint: '/api/leaves',
      description: 'Submit leave request',
      parameters: ['employeeId', 'startDate', 'endDate', 'type', 'reason'],
      example: 'POST /api/leaves\n{\n  "employeeId": 123,\n  "startDate": "2024-02-01",\n  "endDate": "2024-02-05",\n  "type": "annual",\n  "reason": "Family vacation"\n}'
    }
  ];

  const getMethodColor = (method) => {
    switch (method) {
      case 'GET': return '#28a745';
      case 'POST': return '#007bff';
      case 'PUT': return '#ffc107';
      case 'DELETE': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div>
      <Navbar darkMode={darkMode} onThemeToggle={() => setDarkMode(!darkMode)} />
      <div className="container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>Fintradify API Documentation</h1>
        <p style={{ textAlign: 'center', marginBottom: '30px', color: '#666' }}>
          Integrate Fintradify's HR management features into your applications
        </p>

        {/* API Key Section */}
        <div style={{ backgroundColor: '#f8f9ff', padding: '20px', borderRadius: '10px', marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '10px' }}>Getting Started</h3>
          <p style={{ marginBottom: '15px' }}>
            To use the Fintradify API, you need an API key. You can generate one from your account settings.
          </p>
          <div style={{ backgroundColor: '#e8f0fe', padding: '10px', borderRadius: '5px', fontFamily: 'monospace' }}>
            Authorization: Bearer YOUR_API_KEY_HERE
          </div>
        </div>

        {/* Base URL */}
        <div style={{ marginBottom: '30px' }}>
          <h3>Base URL</h3>
          <div style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '5px', fontFamily: 'monospace' }}>
            https://api.fintradify.com/v1
          </div>
        </div>

        {/* API Endpoints */}
        <h3 style={{ marginBottom: '20px' }}>API Endpoints</h3>
        <div style={{ display: 'grid', gap: '20px' }}>
          {apiEndpoints.map((endpoint, index) => (
            <div key={index} style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <span
                  style={{
                    backgroundColor: getMethodColor(endpoint.method),
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    marginRight: '10px'
                  }}
                >
                  {endpoint.method}
                </span>
                <code style={{ fontSize: '16px', fontWeight: 'bold' }}>{endpoint.endpoint}</code>
              </div>

              <p style={{ marginBottom: '15px', color: '#666' }}>{endpoint.description}</p>

              <div style={{ marginBottom: '15px' }}>
                <strong>Parameters:</strong>
                <div style={{ marginTop: '5px' }}>
                  {endpoint.parameters.map((param, idx) => (
                    <span key={idx} style={{
                      display: 'inline-block',
                      backgroundColor: '#e9ecef',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      margin: '2px',
                      fontSize: '12px'
                    }}>
                      {param}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <strong>Example:</strong>
                <pre style={{
                  backgroundColor: '#f8f9fa',
                  padding: '10px',
                  borderRadius: '5px',
                  marginTop: '5px',
                  fontSize: '14px',
                  overflow: 'auto'
                }}>
                  {endpoint.example}
                </pre>
              </div>
            </div>
          ))}
        </div>

        {/* Rate Limits */}
        <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#fff3cd', borderRadius: '10px' }}>
          <h3 style={{ marginBottom: '10px', color: '#856404' }}>Rate Limits</h3>
          <ul style={{ color: '#856404' }}>
            <li>1000 requests per hour for read operations</li>
            <li>100 requests per hour for write operations</li>
            <li>Rate limit headers are included in all responses</li>
          </ul>
        </div>

        {/* Support */}
        <div style={{ textAlign: 'center', marginTop: '40px', padding: '30px', backgroundColor: '#f8f9ff', borderRadius: '10px' }}>
          <h3 style={{ marginBottom: '10px' }}>Need Help?</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Check our documentation or contact our developer support team.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
            <button
              style={{
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '25px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              View Full Documentation
            </button>
            <button
              style={{
                backgroundColor: '#f0f0f0',
                color: '#333',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '25px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
      <Footer darkMode={darkMode} />
    </div>
  );
};

export default API;
