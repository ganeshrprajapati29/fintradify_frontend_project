import React, { useState, useEffect } from 'react';
import { Card, Alert, Row, Col, Badge, Button } from 'react-bootstrap';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css';

const ProfileDisplay = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditForm, setShowEditForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    position: '',
    department: '',
    bankAccount: '',
    bankName: '',
    salary: '',
    joiningDate: '',
    password: '',
    profilePhoto: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      console.log('Fetching profile data...');
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/employees/profile`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('Profile data received:', res.data);
      setProfile(res.data.data || {});
      setFormData({
        name: res.data?.data?.name || '',
        email: res.data?.data?.email || '',
        phone: res.data?.data?.phone || '',
        address: res.data?.data?.address || '',
        position: res.data?.data?.position || '',
        department: res.data?.data?.department || '',
        bankAccount: res.data?.data?.bankAccount || '',
        bankName: res.data?.data?.bankName || '',
        salary: res.data?.data?.salary || '',
        joiningDate: res.data?.data?.joiningDate ? new Date(res.data.data.joiningDate).toISOString().split('T')[0] : '',
        password: '',
        profilePhoto: res.data?.data?.profilePhoto || '',
      });
      setError('');
    } catch (err) {
      console.error('Profile fetch error:', err.response?.status, err.response?.data);
      setError(err.response?.data?.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setShowEditForm(true);
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
    setFormData({
      name: profile?.name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      position: profile?.position || '',
      department: profile?.department || '',
      bankAccount: profile?.bankAccount || '',
      bankName: profile?.bankName || '',
      salary: profile?.salary || '',
      joiningDate: profile?.joiningDate ? new Date(profile.joiningDate).toISOString().split('T')[0] : '',
      password: '',
      profilePhoto: profile?.profilePhoto || '',
    });
    setSelectedFile(null);
    setPreview('');
  };

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
      setShowEditForm(false);
      setSelectedFile(null);
      setPreview('');
      // Refresh profile data
      await fetchProfile();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Update profile error:', err.response?.status, err.response?.data);
      setError(err.response?.data?.message || 'Error updating profile');
      setMessage('');
    }
  };

  const calculateLeaveEligibility = () => {
    if (!profile?.joiningDate) return 'Not Eligible (Joining date not available)';

    const joiningDate = new Date(profile.joiningDate);
    const currentDate = new Date();
    const monthsDiff = (currentDate.getFullYear() - joiningDate.getFullYear()) * 12 + (currentDate.getMonth() - joiningDate.getMonth());

    return monthsDiff >= 6 ? 'Eligible' : `Not Eligible (${6 - monthsDiff} months remaining)`;
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="container py-5">
        <Alert variant="danger" className="text-center">
          {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

          .profile-container {
            font-family: 'Poppins', sans-serif;
            color: #1e40af;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            min-height: 100vh;
            padding: 2rem 0;
          }

          .profile-header {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 3rem 2rem;
            border-radius: 1rem 1rem 0 0;
            margin-bottom: 0;
            text-align: center;
            position: relative;
            overflow: hidden;
          }

          .profile-header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: float 6s ease-in-out infinite;
          }

          @keyframes float {
            0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
            50% { transform: translate(-50%, -50%) rotate(180deg); }
          }

          .profile-avatar {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            border: 4px solid white;
            margin: 0 auto 1rem;
            object-fit: cover;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
            position: relative;
            z-index: 2;
          }

          .profile-name {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          }

          .profile-position {
            font-size: 1.2rem;
            opacity: 0.9;
            font-weight: 500;
          }

          .profile-card {
            background: white;
            border-radius: 0 0 1rem 1rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            border: none;
            overflow: hidden;
          }

          .info-section {
            padding: 2rem;
            border-bottom: 1px solid #e5e7eb;
          }

          .info-section:last-child {
            border-bottom: none;
          }

          .info-title {
            font-size: 1.3rem;
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
          }

          .info-item {
            background: #f8fafc;
            padding: 1.5rem;
            border-radius: 0.8rem;
            border-left: 4px solid #3b82f6;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }

          .info-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.1);
          }

          .info-label {
            font-size: 0.9rem;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 0.5rem;
          }

          .info-value {
            font-size: 1.1rem;
            font-weight: 500;
            color: #1e40af;
            word-break: break-word;
          }

          .status-badge {
            padding: 0.5rem 1rem;
            border-radius: 2rem;
            font-size: 0.85rem;
            font-weight: 600;
          }

          .leave-info {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
          }

          .edit-btn {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            border: none;
            padding: 0.8rem 2rem;
            border-radius: 0.6rem;
            font-weight: 600;
            font-size: 1rem;
            color: white;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(30, 64, 175, 0.3);
          }

          .edit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(30, 64, 175, 0.4);
          }

          .form-control {
            background: #f8fafc;
            border: 2px solid #e5e7eb;
            color: #1e40af;
            border-radius: 0.6rem;
            padding: 0.8rem;
            font-size: 1rem;
            transition: all 0.3s ease;
          }

          .form-control:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
          }

          @media (max-width: 768px) {
            .profile-header {
              padding: 2rem 1rem;
            }

            .profile-name {
              font-size: 2rem;
            }

            .profile-avatar {
              width: 100px;
              height: 100px;
            }

            .info-section {
              padding: 1.5rem 1rem;
            }

            .info-grid {
              grid-template-columns: 1fr;
              gap: 1rem;
            }
          }
        `}
      </style>

      <div className="container">
        {message && (
          <Alert variant="success" className="mb-4 animate__animated animate__fadeIn">
            {message}
          </Alert>
        )}
        {error && (
          <Alert variant="danger" className="mb-4 animate__animated animate__fadeIn">
            {error}
          </Alert>
        )}

        {/* Profile Header */}
        <Card className="profile-card animate__animated animate__fadeInUp">
          <div className="profile-header">
            {profile?.profilePhoto ? (
              <img
                src={profile.profilePhoto}
                alt="Profile"
                className="profile-avatar"
              />
            ) : (
              <div
                className="profile-avatar d-flex align-items-center justify-content-center"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                  fontSize: '3rem',
                  fontWeight: 'bold',
                  color: 'white'
                }}
              >
                {(profile?.name || 'U')[0].toUpperCase()}
              </div>
            )}
            <h1 className="profile-name">{profile?.name || 'N/A'}</h1>
            <p className="profile-position">{profile?.position || 'N/A'}</p>
            <div className="mt-3">
              <Button className="edit-btn" onClick={handleEditClick}>
                <i className="fas fa-edit me-2"></i>
                Edit Profile
              </Button>
            </div>
          </div>

          {/* Profile Information */}
          <div className="info-section">
            <h3 className="info-title">
              <i className="fas fa-user"></i>
              Personal Information
            </h3>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">Employee ID</div>
                <div className="info-value">{profile?.employeeId || 'N/A'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Email</div>
                <div className="info-value">{profile?.email || 'N/A'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Phone</div>
                <div className="info-value">{profile?.phone || 'N/A'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Department</div>
                <div className="info-value">{profile?.department || 'N/A'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Address</div>
                <div className="info-value">{profile?.address || 'N/A'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Joining Date</div>
                <div className="info-value">
                  {profile?.joiningDate ? new Date(profile.joiningDate).toLocaleDateString('en-IN') : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Leave Information */}
          <div className="info-section leave-info">
            <h3 className="info-title text-white">
              <i className="fas fa-calendar-alt"></i>
              Leave Information
            </h3>
            <div className="info-grid">
              <div className="info-item" style={{ background: 'rgba(255,255,255,0.1)', borderLeftColor: '#fff' }}>
                <div className="info-label text-white-50">Paid Leaves Remaining</div>
                <div className="info-value text-white fw-bold">{profile?.paidLeaveBalance || 0} days</div>
              </div>
              <div className="info-item" style={{ background: 'rgba(255,255,255,0.1)', borderLeftColor: '#fff' }}>
                <div className="info-label text-white-50">Unpaid Leaves Remaining</div>
                <div className="info-value text-white fw-bold">{profile?.unpaidLeaveBalance || 6} days</div>
              </div>
              <div className="info-item" style={{ background: 'rgba(255,255,255,0.1)', borderLeftColor: '#fff' }}>
                <div className="info-label text-white-50">Paid Leave Eligibility</div>
                <div className="info-value text-white fw-bold">{calculateLeaveEligibility()}</div>
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div className="info-section">
            <h3 className="info-title">
              <i className="fas fa-briefcase"></i>
              Employment Details
            </h3>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">Monthly Salary</div>
                <div className="info-value">
                  {profile?.salary && typeof profile.salary === 'number' && !isNaN(profile.salary)
                    ? `₹${profile.salary.toLocaleString('en-IN')}`
                    : 'N/A'}
                </div>
              </div>
              <div className="info-item">
                <div className="info-label">Bank Account</div>
                <div className="info-value">{profile?.bankAccount || 'N/A'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Bank Name</div>
                <div className="info-value">{profile?.bankName || 'N/A'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Status</div>
                <div className="info-value">
                  <Badge
                    className="status-badge"
                    style={{
                      backgroundColor: profile?.status === 'active' ? '#10b981' : '#ef4444',
                      color: 'white'
                    }}
                  >
                    {profile?.status || 'N/A'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Edit Form Modal */}
        {showEditForm && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Edit Profile</h5>
                  <button type="button" className="btn-close" onClick={handleCancelEdit}></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleSubmit}>
                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <label className="form-label">Name</label>
                          <input
                            type="text"
                            className="form-control"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <label className="form-label">Email</label>
                          <input
                            type="email"
                            className="form-control"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <label className="form-label">Phone</label>
                          <input
                            type="text"
                            className="form-control"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                          />
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <label className="form-label">Position</label>
                          <input
                            type="text"
                            className="form-control"
                            name="position"
                            value={formData.position}
                            onChange={handleChange}
                          />
                        </div>
                      </Col>
                    </Row>
                    <div className="mb-3">
                      <label className="form-label">Address</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Profile Photo</label>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      <div className="mt-2">
                        {(preview || formData.profilePhoto) ? (
                          <img
                            src={preview || formData.profilePhoto}
                            alt="Preview"
                            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '80px',
                              height: '80px',
                              borderRadius: '50%',
                              background: '#bfdbfe',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '2rem',
                              fontWeight: 'bold',
                              color: '#1e40af'
                            }}
                          >
                            {(formData.name || 'U')[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="modal-footer">
                      <Button variant="secondary" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button variant="primary" type="submit">
                        Update Profile
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileDisplay;
