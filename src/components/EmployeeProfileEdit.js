import React, { useEffect, useState } from 'react';
import { Alert, Button, Col, Form, Row, Spinner } from 'react-bootstrap';
import moment from 'moment';
import api from '../utils/axios';

const initialProfile = {
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
  profilePhoto: '',
};

const EmployeeProfileEdit = () => {
  const [formData, setFormData] = useState(initialProfile);
  const [selectedFile, setSelectedFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/employees/profile');
      const profile = res.data?.data || {};
      const next = {
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        position: profile.position || '',
        department: profile.department || '',
        bankAccount: profile.bankAccount || '',
        bankName: profile.bankName || '',
        salary: profile.salary && profile.salary !== 'N/A' ? profile.salary : '',
        joiningDate: profile.joiningDate ? moment(profile.joiningDate).format('YYYY-MM-DD') : '',
        profilePhoto: profile.profilePhoto || '',
      };
      setFormData(next);
      setPhotoPreview(next.profilePhoto);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setSelectedFile(file || null);
    if (!file) {
      setPhotoPreview(formData.profilePhoto || '');
      return;
    }
    const reader = new FileReader();
    reader.onload = (readerEvent) => setPhotoPreview(readerEvent.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      let profilePhoto = formData.profilePhoto;

      if (selectedFile) {
        const uploadData = new FormData();
        uploadData.append('photo', selectedFile);
        const uploadRes = await api.post('/employees/upload-photo', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        profilePhoto = uploadRes.data?.photoUrl || profilePhoto;
      }

      const payload = {
        ...formData,
        profilePhoto,
        salary: formData.salary === '' ? undefined : Number(formData.salary),
      };

      const res = await api.put('/employees/profile', payload);
      const updated = res.data?.data || {};
      setFormData((current) => ({
        ...current,
        ...updated,
        salary: updated.salary && updated.salary !== 'N/A' ? updated.salary : current.salary,
        joiningDate: updated.joiningDate ? moment(updated.joiningDate).format('YYYY-MM-DD') : current.joiningDate,
        profilePhoto: updated.profilePhoto || profilePhoto,
      }));
      setPhotoPreview(updated.profilePhoto || profilePhoto);
      setSelectedFile(null);
      setSuccess(res.data?.message || 'Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-edit-page">
        <div className="profile-empty">
          <Spinner animation="border" size="sm" className="me-2" /> Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="profile-edit-page">
      <style>
        {`
          .profile-edit-page {
            color: #0f172a;
            display: grid;
            gap: 1rem;
          }
          .profile-hero,
          .profile-panel {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 0.9rem;
            box-shadow: 0 14px 34px rgba(15, 23, 42, 0.07);
          }
          .profile-hero {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            gap: 1rem;
            align-items: center;
            padding: 1.15rem;
            background: linear-gradient(135deg, #ffffff, #f8fbff);
          }
          .profile-avatar {
            width: 86px;
            height: 86px;
            border-radius: 24px;
            background: linear-gradient(135deg, #2563eb, #14b8a6);
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            font-weight: 900;
            overflow: hidden;
            box-shadow: 0 14px 28px rgba(37, 99, 235, 0.18);
          }
          .profile-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .profile-eyebrow {
            margin: 0;
            color: #64748b;
            font-size: 0.78rem;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .profile-title {
            margin: 0.25rem 0;
            color: #0f172a;
            font-size: clamp(1.45rem, 3vw, 2.1rem);
            font-weight: 900;
            line-height: 1.15;
          }
          .profile-subtitle {
            margin: 0;
            color: #64748b;
            font-weight: 600;
          }
          .profile-panel {
            padding: 1rem;
          }
          .profile-panel-title {
            margin: 0 0 1rem;
            color: #0f172a;
            font-size: 1.05rem;
            font-weight: 900;
          }
          .profile-edit-page .form-label {
            color: #334155;
            font-weight: 800;
            font-size: 0.78rem;
            text-transform: uppercase;
          }
          .profile-edit-page .form-control {
            border-radius: 0.65rem;
            border: 1px solid #dbe3ef;
            color: #0f172a;
            font-weight: 600;
            min-height: 42px;
          }
          .profile-edit-page .form-control:focus {
            border-color: #93c5fd;
            box-shadow: 0 0 0 0.2rem rgba(37, 99, 235, 0.1);
          }
          .profile-action-row {
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
            margin-top: 1rem;
          }
          .profile-action-btn {
            border-radius: 0.65rem;
            font-weight: 800;
            min-height: 42px;
          }
          .profile-empty {
            min-height: 220px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #64748b;
            border: 1px dashed #cbd5e1;
            border-radius: 0.8rem;
            background: #f8fafc;
            font-weight: 700;
            text-align: center;
            padding: 1rem;
          }
          @media (max-width: 640px) {
            .profile-hero {
              grid-template-columns: 1fr;
            }
            .profile-action-row {
              flex-direction: column;
            }
            .profile-action-btn {
              width: 100%;
            }
          }
        `}
      </style>

      <section className="profile-hero">
        <div className="profile-avatar">
          {photoPreview ? <img src={photoPreview} alt={formData.name || 'Employee'} /> : (formData.name || 'E')[0].toUpperCase()}
        </div>
        <div>
          <p className="profile-eyebrow">Edit profile</p>
          <h2 className="profile-title">{formData.name || 'Employee Profile'}</h2>
          <p className="profile-subtitle">{formData.position || 'Team Member'} {formData.department ? `- ${formData.department}` : ''}</p>
        </div>
      </section>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <section className="profile-panel">
        <h3 className="profile-panel-title">Personal and payroll details</h3>
        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Name</Form.Label>
                <Form.Control name="name" value={formData.name} onChange={handleChange} required />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Phone</Form.Label>
                <Form.Control name="phone" value={formData.phone} onChange={handleChange} required />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Position</Form.Label>
                <Form.Control name="position" value={formData.position} onChange={handleChange} required />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Department</Form.Label>
                <Form.Control name="department" value={formData.department} onChange={handleChange} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Joining Date</Form.Label>
                <Form.Control type="date" name="joiningDate" value={formData.joiningDate} disabled />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Bank Name</Form.Label>
                <Form.Control name="bankName" value={formData.bankName} onChange={handleChange} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Bank Account</Form.Label>
                <Form.Control name="bankAccount" value={formData.bankAccount} onChange={handleChange} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Monthly Salary</Form.Label>
                <Form.Control type="number" name="salary" value={formData.salary} onChange={handleChange} min="0" step="0.01" />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Profile Photo</Form.Label>
                <Form.Control type="file" accept="image/*" onChange={handleFileChange} />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group>
                <Form.Label>Address</Form.Label>
                <Form.Control as="textarea" rows={3} name="address" value={formData.address} onChange={handleChange} />
              </Form.Group>
            </Col>
          </Row>
          <div className="profile-action-row">
            <Button className="profile-action-btn" type="button" variant="outline-secondary" onClick={loadProfile} disabled={saving}>
              Reset
            </Button>
            <Button className="profile-action-btn" type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </Form>
      </section>
    </div>
  );
};

export default EmployeeProfileEdit;
