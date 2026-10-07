import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Modal, Row, Table } from 'react-bootstrap';
import api from '../utils/axios';

const DAYS = [
  [1, 'Mon'], [2, 'Tue'], [3, 'Wed'], [4, 'Thu'], [5, 'Fri'], [6, 'Sat'], [0, 'Sun'],
];
const COLORS = ['#0A1F8F', '#0F766E', '#D97706', '#7C3AED', '#D0142A', '#2563EB', '#16A34A', '#475569'];
const asList = (body) => (Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : []);

const to12h = (hhmm) => {
  const [h, m] = String(hhmm || '00:00').split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${suffix}`;
};

const durationText = (start, end) => {
  const [sh, sm] = String(start).split(':').map(Number);
  const [eh, em] = String(end).split(':').map(Number);
  let minutes = (eh * 60 + em) - (sh * 60 + sm);
  if (minutes <= 0) minutes += 24 * 60;
  return `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}`;
};

// Shift ids of an employee, primary first (older records only have `shift`).
const idsOf = (emp) => (Array.isArray(emp.shifts) && emp.shifts.length
  ? emp.shifts.map((id) => String(id))
  : emp.shift ? [String(emp.shift)] : []);

const todayKey = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
const monthStartKey = () => `${todayKey().slice(0, 8)}01`;

const emptyShift = {
  name: '', code: '', startTime: '09:00', endTime: '18:00', graceMinutes: 15, earlyOutGraceMinutes: 15,
  breakMinutes: 60, workingDays: [1, 2, 3, 4, 5, 6], color: COLORS[0], description: '', isActive: true,
};

/**
 * Admin: create day / evening / night shifts and assign employees to them.
 * Attendance, lateness and alerts follow each employee's shift.
 */
const ShiftManager = () => {
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(null); // shift being created/edited
  const [form, setForm] = useState(emptyShift);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [assignFor, setAssignFor] = useState(null); // shift receiving employees
  const [selected, setSelected] = useState([]);
  const [query, setQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [keepOthers, setKeepOthers] = useState(false); // assign: add to the employee's other shifts
  const [recalcFrom, setRecalcFrom] = useState('today'); // shift edit: update late marks from
  const [shiftsFor, setShiftsFor] = useState(null); // employee whose shift list is being edited
  const [chosen, setChosen] = useState([]);
  const [recalcOpen, setRecalcOpen] = useState(false);
  const [recalcDate, setRecalcDate] = useState(monthStartKey());

  const load = async () => {
    setLoading(true);
    try {
      const [shiftRes, employeeRes] = await Promise.all([api.get('/shifts'), api.get('/employees')]);
      setShifts(asList(shiftRes.data));
      setEmployees(asList(employeeRes.data).filter((emp) => emp.role !== 'admin' && emp.status !== 'terminated'));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load shifts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const defaultShift = shifts.find((shift) => shift.isDefault);
  // All shifts of an employee; the default shift when none is assigned.
  const shiftsOf = (emp) => {
    const own = idsOf(emp).map((id) => shifts.find((shift) => shift._id === id)).filter(Boolean);
    return own.length ? own : (defaultShift ? [defaultShift] : []);
  };

  const openEditor = (shift) => {
    setEditing(shift || {});
    setForm(shift ? {
      name: shift.name, code: shift.code || '', startTime: shift.startTime, endTime: shift.endTime,
      graceMinutes: shift.graceMinutes, earlyOutGraceMinutes: shift.earlyOutGraceMinutes, breakMinutes: shift.breakMinutes,
      workingDays: shift.workingDays || [], color: shift.color || COLORS[0], description: shift.description || '',
      isActive: shift.isActive !== false,
    } : emptyShift);
    setFormError('');
    setRecalcFrom('today');
  };

  const saveShift = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) { setFormError('Shift name is required.'); return; }
    if (form.startTime === form.endTime) { setFormError('Start and end time cannot be the same.'); return; }
    if (!form.workingDays.length) { setFormError('Select at least one working day.'); return; }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        ...form,
        graceMinutes: Number(form.graceMinutes),
        earlyOutGraceMinutes: Number(form.earlyOutGraceMinutes),
        breakMinutes: Number(form.breakMinutes),
      };
      if (editing?._id) {
        payload.recalculateFrom = recalcFrom === 'today' ? todayKey() : recalcFrom === 'month' ? monthStartKey() : 'none';
      }
      const res = editing?._id ? await api.put(`/shifts/${editing._id}`, payload) : await api.post('/shifts', payload);
      setSuccess(res.data?.message || 'Shift saved');
      setEditing(null);
      await load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save shift');
    } finally {
      setSaving(false);
    }
  };

  const run = async (action, fallback) => {
    setError('');
    setSuccess('');
    try {
      const res = await action();
      setSuccess(res.data?.message || fallback);
      await load();
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
      return false;
    }
  };

  const openAssign = (shift) => {
    setAssignFor(shift);
    setSelected(employees.filter((emp) => idsOf(emp).includes(shift._id)).map((emp) => emp._id));
    setQuery('');
    setKeepOthers(false);
  };

  const saveAssignment = async () => {
    const current = employees.filter((emp) => idsOf(emp).includes(assignFor._id)).map((emp) => emp._id);
    const toAdd = selected.filter((id) => !current.includes(id));
    const toRemove = current.filter((id) => !selected.includes(id));
    setSaving(true);
    try {
      if (toAdd.length) await api.post(`/shifts/${assignFor._id}/assign`, { employeeIds: toAdd, mode: keepOthers ? 'add' : 'replace' });
      if (toRemove.length) await api.post(`/shifts/${assignFor._id}/remove`, { employeeIds: toRemove });
      setSuccess(`${assignFor.name}: ${toAdd.length} added, ${toRemove.length} removed`);
      setAssignFor(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update shift employees');
      setAssignFor(null);
    } finally {
      setSaving(false);
    }
  };

  const openShiftsFor = (emp) => {
    setShiftsFor(emp);
    setChosen(idsOf(emp));
  };

  // Keeps the order of ticking: the first shift is the primary one.
  const toggleChosen = (id) => setChosen((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const saveEmployeeShifts = async () => {
    const emp = shiftsFor;
    setShiftsFor(null);
    await run(() => api.put(`/shifts/employee/${emp._id}`, { shiftIds: chosen }), 'Shifts updated');
  };

  const runRecalculate = async () => {
    setRecalcOpen(false);
    await run(() => api.post('/shifts/recalculate', { from: recalcDate }), 'Late marks updated');
  };

  const filteredEmployees = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees.filter((emp) => !q || [emp.name, emp.employeeId, emp.position, emp.department]
      .some((value) => String(value || '').toLowerCase().includes(q)));
  }, [employees, query]);

  const toggleDay = (day) => setForm((prev) => ({
    ...prev,
    workingDays: prev.workingDays.includes(day) ? prev.workingDays.filter((d) => d !== day) : [...prev.workingDays, day],
  }));

  const overnight = form.endTime <= form.startTime;

  return (
    <div className="d-grid gap-3">
      <Card className="p-3 p-md-4 border-0 shadow-sm" style={{ borderRadius: 16 }}>
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
          <div>
            <p className="text-uppercase text-muted fw-bold small mb-1" style={{ letterSpacing: '0.08em' }}>Shift management</p>
            <h3 className="fw-bold mb-1" style={{ fontSize: '1.35rem' }}>Work shifts</h3>
            <p className="text-muted small mb-0">
              Create day, evening and night shifts and assign employees. Late marks, punch-out reminders and
              auto-close follow each employee's shift. Night shifts that end the next morning are handled as one attendance.
              An employee can have more than one shift: the shift nearest to the punch time is used, with one attendance per shift.
            </p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Button variant="outline-primary" onClick={() => setRecalcOpen(true)}>Update late marks</Button>
            <Button onClick={() => openEditor(null)}>+ New shift</Button>
          </div>
        </div>
      </Card>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      {loading ? (
        <Card className="p-4 border-0 shadow-sm text-muted">Loading shifts...</Card>
      ) : (
        <Row className="g-3">
          {shifts.length === 0 && (
            <Col xs={12}><Card className="p-4 border-0 shadow-sm text-muted">No shifts yet. Create your first shift.</Card></Col>
          )}
          {shifts.map((shift) => (
            <Col md={6} xl={4} key={shift._id}>
              <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: 16, borderTop: `4px solid ${shift.color}`, opacity: shift.isActive ? 1 : 0.6 }}>
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div>
                      <h5 className="fw-bold mb-1">{shift.name}</h5>
                      <div className="d-flex flex-wrap gap-1">
                        {shift.isDefault && <Badge bg="primary">Default</Badge>}
                        {shift.isOvernight && <Badge bg="" style={{ background: '#ede9fe', color: '#6d28d9' }}>Night / overnight</Badge>}
                        {!shift.isActive && <Badge bg="secondary">Inactive</Badge>}
                        {shift.code && <Badge bg="light" text="dark">{shift.code}</Badge>}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold" style={{ fontSize: '1.4rem', lineHeight: 1 }}>{shift.employeeCount}</div>
                      <div className="small text-muted">employees</div>
                    </div>
                  </div>
                  <div className="my-3">
                    <div className="fw-semibold" style={{ fontSize: '1.05rem' }}>
                      {to12h(shift.startTime)} – {to12h(shift.endTime)}{shift.isOvernight ? ' (next day)' : ''}
                    </div>
                    <div className="small text-muted">
                      {durationText(shift.startTime, shift.endTime)} · late after {shift.graceMinutes} min · break {shift.breakMinutes} min
                    </div>
                    <div className="d-flex gap-1 mt-2">
                      {DAYS.map(([day, label]) => (
                        <span
                          key={day}
                          className="small fw-semibold"
                          style={{
                            width: 34, textAlign: 'center', padding: '3px 0', borderRadius: 8,
                            background: shift.workingDays.includes(day) ? shift.color : '#f1f5f9',
                            color: shift.workingDays.includes(day) ? '#fff' : '#94a3b8',
                          }}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                    {shift.description && <p className="small text-muted mt-2 mb-0">{shift.description}</p>}
                  </div>
                  <div className="d-flex flex-wrap gap-2 mt-auto">
                    <Button size="sm" variant="primary" onClick={() => openAssign(shift)} disabled={!shift.isActive}>Assign employees</Button>
                    <Button size="sm" variant="outline-primary" onClick={() => openEditor(shift)}>Edit</Button>
                    {!shift.isDefault && shift.isActive && (
                      <Button size="sm" variant="outline-secondary" onClick={() => run(() => api.put(`/shifts/${shift._id}/default`), 'Default shift updated')}>
                        Make default
                      </Button>
                    )}
                    {!shift.isDefault && (
                      <Button size="sm" variant="outline-danger" onClick={() => setConfirmDelete(shift)}>Delete</Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {!loading && employees.length > 0 && (
        <Card className="p-3 p-md-4 border-0 shadow-sm" style={{ borderRadius: 16 }}>
          <h5 className="fw-bold mb-3">Employee shift roster</h5>
          <div className="table-responsive">
            <Table hover className="align-middle mb-0">
              <thead>
                <tr><th>Employee</th><th>Shifts</th><th>Timing</th><th style={{ width: 150 }} /></tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const list = shiftsOf(emp);
                  const own = idsOf(emp).length > 0;
                  return (
                    <tr key={emp._id}>
                      <td>
                        <div className="fw-semibold">{emp.name}</div>
                        <div className="small text-muted">{emp.employeeId} · {emp.position || emp.department || 'Employee'}</div>
                      </td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          {list.map((shift, index) => (
                            <Badge key={shift._id} bg="" style={{ background: `${shift.color}1a`, color: shift.color }}>
                              {shift.name}{!own ? ' (default)' : list.length > 1 && index === 0 ? ' · primary' : ''}
                            </Badge>
                          ))}
                          {list.length === 0 && '—'}
                        </div>
                      </td>
                      <td className="small">
                        {list.map((shift) => <div key={shift._id}>{to12h(shift.startTime)} – {to12h(shift.endTime)}</div>)}
                      </td>
                      <td className="text-end">
                        <Button size="sm" variant="outline-primary" onClick={() => openShiftsFor(emp)}>
                          {list.length > 1 ? `Edit shifts (${list.length})` : 'Change shifts'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Card>
      )}

      {/* Shifts of one employee */}
      <Modal show={Boolean(shiftsFor)} onHide={() => setShiftsFor(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1.05rem' }}>Shifts of {shiftsFor?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="small text-muted">
            Tick every shift this employee works. With more than one, the shift nearest to the punch time is used and each shift
            gets its own attendance, so the same person can work two shifts in a day. Leave all unticked to follow the default shift.
          </p>
          {shifts.filter((shift) => shift.isActive).map((shift) => {
            const position = chosen.indexOf(shift._id);
            return (
              <Form.Check
                key={shift._id}
                type="checkbox"
                id={`emp-shift-${shift._id}`}
                className="py-1"
                checked={position >= 0}
                onChange={() => toggleChosen(shift._id)}
                label={(
                  <span>
                    <span className="fw-semibold" style={{ color: shift.color }}>{shift.name}</span>{' '}
                    <span className="small text-muted">{to12h(shift.startTime)} – {to12h(shift.endTime)}{shift.isOvernight ? ' (next day)' : ''}</span>
                    {position === 0 && chosen.length > 1 && <Badge bg="primary" className="ms-2">Primary</Badge>}
                  </span>
                )}
              />
            );
          })}
        </Modal.Body>
        <Modal.Footer>
          <span className="small text-muted me-auto">{chosen.length ? `${chosen.length} shift(s) selected` : `Default shift${defaultShift ? ` (${defaultShift.name})` : ''}`}</span>
          <Button variant="light" onClick={() => setShiftsFor(null)}>Cancel</Button>
          <Button onClick={saveEmployeeShifts}>Save</Button>
        </Modal.Footer>
      </Modal>

      {/* Update late marks */}
      <Modal show={recalcOpen} onHide={() => setRecalcOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1.05rem' }}>Update late marks</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="small text-muted">
            Checks saved attendance again using the shift timings as they are now. Late, early-out and overtime are corrected
            from the date you choose. Use this after changing a shift time or moving employees to another shift.
          </p>
          <Form.Label>Update attendance from</Form.Label>
          <Form.Control type="date" value={recalcDate} max={todayKey()} onChange={(e) => setRecalcDate(e.target.value)} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setRecalcOpen(false)}>Cancel</Button>
          <Button onClick={runRecalculate} disabled={!recalcDate}>Update</Button>
        </Modal.Footer>
      </Modal>

      {/* Create / edit shift */}
      <Modal show={Boolean(editing)} onHide={() => !saving && setEditing(null)} centered size="lg">
        <Form onSubmit={saveShift}>
          <Modal.Header closeButton>
            <Modal.Title style={{ fontSize: '1.1rem' }}>{editing?._id ? `Edit ${editing.name}` : 'New shift'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {formError && <Alert variant="danger">{formError}</Alert>}
            <Row className="g-3">
              <Col md={8}>
                <Form.Label>Shift name</Form.Label>
                <Form.Control value={form.name} maxLength={60} placeholder="e.g. Night Shift" onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </Col>
              <Col md={4}>
                <Form.Label>Short code</Form.Label>
                <Form.Control value={form.code} maxLength={12} placeholder="NGT" onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
              </Col>
              <Col md={6}>
                <Form.Label>Start time</Form.Label>
                <Form.Control type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
              </Col>
              <Col md={6}>
                <Form.Label>End time</Form.Label>
                <Form.Control type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
              </Col>
              <Col xs={12}>
                <div className="small" style={{ color: overnight ? '#6d28d9' : '#64748b' }}>
                  {to12h(form.startTime)} – {to12h(form.endTime)} · {durationText(form.startTime, form.endTime)}
                  {overnight ? ' · Overnight shift: ends the next day. Punch-out after midnight stays on the same attendance.' : ''}
                </div>
              </Col>
              <Col md={4}>
                <Form.Label>Late after (minutes)</Form.Label>
                <Form.Control type="number" min="0" max="240" value={form.graceMinutes} onChange={(e) => setForm({ ...form, graceMinutes: e.target.value })} />
              </Col>
              <Col md={4}>
                <Form.Label>Early-out grace (minutes)</Form.Label>
                <Form.Control type="number" min="0" max="240" value={form.earlyOutGraceMinutes} onChange={(e) => setForm({ ...form, earlyOutGraceMinutes: e.target.value })} />
              </Col>
              <Col md={4}>
                <Form.Label>Break (minutes)</Form.Label>
                <Form.Control type="number" min="0" max="480" value={form.breakMinutes} onChange={(e) => setForm({ ...form, breakMinutes: e.target.value })} />
              </Col>
              <Col xs={12}>
                <Form.Label>Working days (day the shift starts)</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {DAYS.map(([day, label]) => (
                    <Button key={day} size="sm" type="button" variant={form.workingDays.includes(day) ? 'primary' : 'outline-secondary'} onClick={() => toggleDay(day)}>
                      {label}
                    </Button>
                  ))}
                </div>
              </Col>
              <Col xs={12}>
                <Form.Label>Colour</Form.Label>
                <div className="d-flex gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Colour ${color}`}
                      onClick={() => setForm({ ...form, color })}
                      style={{ width: 30, height: 30, borderRadius: '50%', background: color, border: form.color === color ? '3px solid #0f172a' : '2px solid #fff', boxShadow: '0 0 0 1px #cbd5e1' }}
                    />
                  ))}
                </div>
              </Col>
              <Col xs={12}>
                <Form.Label>Description (optional)</Form.Label>
                <Form.Control value={form.description} maxLength={240} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </Col>
              {editing?._id && (
                <Col xs={12}>
                  <Form.Label>If the timing changes, update late marks</Form.Label>
                  <Form.Select value={recalcFrom} onChange={(e) => setRecalcFrom(e.target.value)}>
                    <option value="today">From today (recommended)</option>
                    <option value="month">From the 1st of this month</option>
                    <option value="none">Do not change saved attendance</option>
                  </Form.Select>
                  <div className="small text-muted mt-1">Late, early-out and overtime are worked out again with the new time, so the dashboard and reports match it.</div>
                </Col>
              )}
              {editing?._id && !editing.isDefault && (
                <Col xs={12}>
                  <Form.Check type="switch" id="shift-active" label="Shift is active" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                </Col>
              )}
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save shift'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Assign employees */}
      <Modal show={Boolean(assignFor)} onHide={() => !saving && setAssignFor(null)} centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1.05rem' }}>Employees in {assignFor?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control className="mb-2" placeholder="Search employee" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="d-flex gap-2 mb-2">
            <Button size="sm" variant="outline-primary" onClick={() => setSelected([...new Set([...selected, ...filteredEmployees.map((e) => e._id)])])}>Select all</Button>
            <Button size="sm" variant="outline-secondary" onClick={() => setSelected([])}>Clear</Button>
            <span className="small text-muted ms-auto align-self-center">{selected.length} selected</span>
          </div>
          <Form.Check
            type="switch"
            id="shift-keep-others"
            className="mb-2"
            label="Keep their other shifts too (multiple shifts)"
            checked={keepOthers}
            onChange={(e) => setKeepOthers(e.target.checked)}
          />
          {filteredEmployees.map((emp) => {
            const current = shiftsOf(emp).map((shift) => shift.name).join(' + ');
            return (
              <Form.Check
                key={emp._id}
                type="checkbox"
                id={`shift-emp-${emp._id}`}
                className="py-1"
                checked={selected.includes(emp._id)}
                onChange={(e) => setSelected(e.target.checked ? [...selected, emp._id] : selected.filter((id) => id !== emp._id))}
                label={(
                  <span>
                    <span className="fw-semibold">{emp.name}</span>{' '}
                    <span className="small text-muted">{emp.employeeId} · now: {current || 'Default'}</span>
                  </span>
                )}
              />
            );
          })}
          {filteredEmployees.length === 0 && <p className="text-muted small mb-0">No employees found.</p>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setAssignFor(null)} disabled={saving}>Cancel</Button>
          <Button onClick={saveAssignment} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </Modal.Footer>
      </Modal>

      {/* Delete confirmation */}
      <Modal show={Boolean(confirmDelete)} onHide={() => setConfirmDelete(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1.05rem' }}>Delete {confirmDelete?.name}?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {confirmDelete?.assignedCount
            ? `${confirmDelete.assignedCount} employee(s) will lose this shift. Anyone left with no shift follows the default shift.`
            : 'No employees are assigned to this shift.'}{' '}
          Past attendance keeps its shift details.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button
            variant="danger"
            onClick={async () => {
              const shift = confirmDelete;
              setConfirmDelete(null);
              await run(() => api.delete(`/shifts/${shift._id}`), 'Shift deleted');
            }}
          >
            Delete shift
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ShiftManager;
