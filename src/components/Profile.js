import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Card } from 'react-bootstrap';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css';

const Profile = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', position: '', password: '', profilePhoto: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const abortController = new AbortController();

    const fetchProfile = async () => {
      try {
        console.log('Fetching profile for editing...');
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/employees/profile`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          signal: abortController.signal,
        });
        setFormData({
          name: res.data.name || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          address: res.data.address || '',
          position: res.data.position || '',
          password: '',
          profilePhoto: res.data.profilePhoto || '',
        });
        setError('');
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Fetch profile error:', err.response?.status, err.response?.data);
          setError(err.response?.data?.message || 'Error fetching profile');
        }
      }
    };

    fetchProfile();

    return () => abortController.abort();
  }, []);



  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreview('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let photoUrl = formData.profilePhoto || '';
      if (selectedFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('photo', selectedFile);
        const uploadRes = await axios.post(
          `${process.env.REACT_APP_API_URL}/employees/upload-photo`,
          formDataUpload,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        photoUrl = uploadRes.data.photoUrl;
      }
      const updateData = { ...formData, profilePhoto: photoUrl };
      console.log('Updating profile:', updateData);
      await axios.put(
        `${process.env.REACT_APP_API_URL}/employees/profile`,
        updateData,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setMessage('Profile updated successfully');
      setError('');
      setSelectedFile(null);
      setPreview('');
    } catch (err) {
      console.error('Update profile error:', err.response?.status, err.response?.data);
      setError(err.response?.data?.message || 'Error updating profile');
      setMessage('');
    }
  };

  return (
    <div className="profile-container">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

          .profile-container {
            font-family: 'Poppins', sans-serif;
            color: #1e40af;
            background: #ffffff;
            padding: 1.5rem;
            border-radius: 1rem;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            margin: 1rem auto;
            max-width: 600px;
          }
          .profile-title {
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
          .form-group {
            margin-bottom: 1.5rem;
          }
          .form-label {
            font-size: 1rem;
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .form-label svg {
            width: 24px;
            height: 24px;
          }
          .form-control {
            background: #f8fafc;
            border: 2px solid #bfdbfe;
            color: #1e40af;
            border-radius: 0.6rem;
            padding: 0.8rem;
            font-size: 1rem;
            transition: all 0.3s ease;
          }
          .form-control:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
            background: #f8fafc;
          }
          .form-control:hover {
            border-color: #3b82f6;
          }
          .form-control:disabled {
            background: #e5e7eb;
            border-color: #d1d5db;
            color: #6b7280;
            opacity: 0.6;
          }
          .form-control::placeholder {
            color: #6b7280;
          }
          .btn-primary {
            border-radius: 0.6rem;
            padding: 0.8rem 2rem;
            font-weight: 600;
            font-size: 1.1rem;
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
          .btn-primary svg {
            width: 24px;
            height: 24px;
            margin-right: 0.75rem;
            vertical-align: middle;
          }
          @media (max-width: 576px) {
            .profile-container {
              padding: 1rem;
              margin: 0.5rem;
            }
            .profile-title {
              font-size: 1.6rem;
              margin-bottom: 1.5rem;
            }
            .alert-danger, .alert-success {
              font-size: 0.9rem;
              padding: 0.8rem;
            }
            .card {
              margin: 0 0.5rem;
            }
            .form-control {
              font-size: 0.9rem;
              padding: 0.7rem;
            }
            .form-label {
              font-size: 0.9rem;
            }
            .form-label svg {
              width: 20px;
              height: 20px;
            }
            .btn-primary {
              padding: 0.6rem 1.5rem;
              font-size: 0.95rem;
            }
            .btn-primary svg {
              width: 20px;
              height: 20px;
            }
            .card-body {
              padding: 1rem;
            }
          }
          @media (max-width: 400px) {
            .profile-title {
              font-size: 1.4rem;
            }
            .form-control {
              font-size: 0.8rem;
              padding: 0.6rem;
            }
            .form-label {
              font-size: 0.85rem;
            }
            .form-label svg {
              width: 18px;
              height: 18px;
            }
            .btn-primary {
              padding: 0.5rem 1.2rem;
              font-size: 0.9rem;
            }
            .btn-primary svg {
              width: 18px;
              height: 18px;
            }
          }
        `}
      </style>
      <div className="profile-container animate__animated animate__fadeIn">
        <h3 className="profile-title animate__animated animate__zoomIn">Edit Profile</h3>
        {error && (
          <Alert variant="danger" className="animate__animated animate__fadeIn">
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
            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="name" className="mb-3 animate__animated animate__fadeIn" style={{ animationDelay: '0.2s' }}>
                <Form.Label>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Name
                </Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              <Form.Group controlId="email" className="mb-3 animate__animated animate__fadeIn" style={{ animationDelay: '0.3s' }}>
                <Form.Label>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              <Form.Group controlId="phone" className="mb-3 animate__animated animate__fadeIn" style={{ animationDelay: '0.4s' }}>
                <Form.Label>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Phone
                </Form.Label>
                <Form.Control
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group controlId="address" className="mb-3 animate__animated animate__fadeIn" style={{ animationDelay: '0.45s' }}>
                <Form.Label>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Address
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your full address"
                />
              </Form.Group>
              <Form.Group controlId="position" className="mb-3 animate__animated animate__fadeIn" style={{ animationDelay: '0.5s' }}>
                <Form.Label>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Position
                </Form.Label>
                <Form.Control
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group controlId="password" className="mb-3 animate__animated animate__fadeIn" style={{ animationDelay: '0.6s' }}>
                <Form.Label>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 1.104-.896 2-2 2s-2-.896-2-2 2-4 2-4 2 .896 2 2zm0 0c0 1.104-.896 2-2 2s-2-.896-2-2m0 0V7m0 0V5a2 2 0 012-2h2a2 2 0 012 2v2m-4 4v4m0 0v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2h7" />
                  </svg>
                  New Password (optional)
                </Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter new password or leave blank"
                />
              </Form.Group>
              <Form.Group controlId="photo" className="mb-3 animate__animated animate__fadeIn" style={{ animationDelay: '0.7s' }}>
                <Form.Label>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Profile Photo
                </Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {preview && (
                  <div style={{ marginTop: '1rem' }}>
                    <img
                      src={preview}
                      alt="Preview"
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #1e40af'
                      }}
                    />
                  </div>
                )}
              </Form.Group>
              <Button
                variant="primary"
                type="submit"
                className="animate__animated animate__fadeIn"
                style={{ animationDelay: '0.7s' }}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Update Profile
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default Profile;