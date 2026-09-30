import React, { useEffect, useState } from 'react';
import { Alert, Button, Col, Form, Modal, Row, Table } from 'react-bootstrap';
import api from '../utils/axios';

const formatId = (prefix, padding, number) => `${String(prefix || '').toUpperCase()}${String(number || 1).padStart(Number(padding) || 1, '0')}`;

/**
 * Admin: configure the employee ID series (prefix + digits + next number).
 * New employees get the next ID automatically, e.g. AWE001, AWE002 ...
 */
const EmployeeIdSeries = ({ onChange }) => {
  const [form, setForm] = useState({ prefix: 'AWE', padding: 3, nextNumber: 1 });
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [confirmApply, setConfirmApply] = useState(false);
  const [mapping, setMapping] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/employees/id-series');
      const data = res.data?.data || {};
      setForm({ prefix: data.prefix || 'AWE', padding: data.padding || 3, nextNumber: data.nextNumber || 1 });
      setPreview(data.preview || '');
      if (onChange) onChange(data.preview || '');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load employee ID series');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.put('/employees/id-series', {
        prefix: form.prefix,
        padding: Number(form.padding),
        nextNumber: Number(form.nextNumber),
      });
      const data = res.data?.data || {};
      setPreview(data.preview || '');
      if (onChange) onChange(data.preview || '');
      setSuccess(res.data?.message || 'Employee ID series saved');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save employee ID series');
    } finally {
      setSaving(false);
    }
  };

  const applyToExisting = async () => {
    setApplying(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/employees/id-series/apply');
      const data = res.data?.data || {};
      setMapping(Array.isArray(data.mapping) ? data.mapping : []);
      setForm({ prefix: data.prefix, padding: data.padding, nextNumber: data.nextNumber });
      setPreview(data.preview || '');
      if (onChange) onChange(data.preview || '', true);
      setSuccess(res.data?.message || 'Employee IDs updated');
      setConfirmApply(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to apply the series to existing employees');
    } finally {
      setApplying(false);
    }
  };

  const livePreview = formatId(form.prefix, form.padding, form.nextNumber);

  return (
    <section className="admin-form-panel mb-3">
      <p className="admin-section-eyebrow">Employee ID series</p>
      <h4 className="admin-section-title">Automatic employee IDs</h4>
      <p className="text-muted small mb-3">
        New employees get the next ID from this series automatically. Current next ID:{' '}
        <strong>{loading ? '…' : preview || livePreview}</strong>
      </p>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      <Form onSubmit={save}>
        <Row className="g-3 align-items-end">
          <Col md={3}>
            <Form.Label>Prefix</Form.Label>
            <Form.Control
              value={form.prefix}
              maxLength={10}
              onChange={(e) => setForm({ ...form, prefix: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '') })}
              required
            />
          </Col>
          <Col md={2}>
            <Form.Label>Digits</Form.Label>
            <Form.Control
              type="number"
              min="1"
              max="8"
              value={form.padding}
              onChange={(e) => setForm({ ...form, padding: e.target.value })}
              required
            />
          </Col>
          <Col md={3}>
            <Form.Label>Next number</Form.Label>
            <Form.Control
              type="number"
              min="1"
              value={form.nextNumber}
              onChange={(e) => setForm({ ...form, nextNumber: e.target.value })}
              required
            />
          </Col>
          <Col md={4}>
            <div className="small text-muted mb-1">Preview</div>
            <div className="fw-bold" style={{ fontSize: '1.15rem', color: '#0a1f8f' }}>{livePreview}</div>
          </Col>
          <Col xs={12} className="d-flex flex-wrap gap-2">
            <Button type="submit" disabled={saving || loading}>{saving ? 'Saving...' : 'Save series'}</Button>
            <Button type="button" variant="outline-danger" disabled={applying || loading} onClick={() => setConfirmApply(true)}>
              Apply series to existing employees
            </Button>
          </Col>
        </Row>
      </Form>

      {mapping.length > 0 && (
        <div className="table-responsive mt-3">
          <Table size="sm" className="mb-0">
            <thead>
              <tr><th>Employee</th><th>Old ID</th><th>New ID</th></tr>
            </thead>
            <tbody>
              {mapping.map((row) => (
                <tr key={row._id}>
                  <td>{row.name}</td>
                  <td className="text-muted">{row.oldId}</td>
                  <td className="fw-semibold">{row.newId}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <Modal show={confirmApply} onHide={() => !applying && setConfirmApply(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1.05rem' }}>Re-number all employees?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Every employee (except admins) will get a new ID from this series in joining-date order, starting at{' '}
          <strong>{formatId(form.prefix, form.padding, 1)}</strong>. Old IDs will no longer be used. Save the series first
          if you changed the prefix or digits.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setConfirmApply(false)} disabled={applying}>Cancel</Button>
          <Button variant="danger" onClick={applyToExisting} disabled={applying}>
            {applying ? 'Updating...' : 'Yes, re-number'}
          </Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
};

export default EmployeeIdSeries;
