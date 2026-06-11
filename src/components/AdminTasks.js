import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Col, Form, Modal, Row, Spinner, Table } from 'react-bootstrap';
import moment from 'moment';
import api from '../utils/axios';
import PaginationControls from './PaginationControls';
import 'bootstrap/dist/css/bootstrap.min.css';

const getArrayPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const getTaskTimestamp = (task) => new Date(task.updatedAt || task.createdAt || 0).getTime();

const getStatusMeta = (status) => {
  const normalized = String(status || 'pending').toLowerCase();
  if (normalized === 'completed') return { label: 'Completed', variant: 'success' };
  if (normalized === 'in-progress') return { label: 'In Progress', variant: 'warning' };
  return { label: 'Pending', variant: 'secondary' };
};

const getPriorityMeta = (priority) => {
  const normalized = String(priority || 'medium').toLowerCase();
  if (normalized === 'urgent') return { label: 'Urgent', variant: 'danger' };
  if (normalized === 'high') return { label: 'High', variant: 'warning' };
  if (normalized === 'low') return { label: 'Low', variant: 'info' };
  return { label: 'Medium', variant: 'primary' };
};

const emptyTask = {
  title: '',
  description: '',
  employeeId: '',
  priority: 'medium',
  dueDate: '',
};

const AdminTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState('');
  const [newTask, setNewTask] = useState(emptyTask);

  const fetchTasks = async () => {
    const res = await api.get('/tasks');
    const nextTasks = getArrayPayload(res.data)
      .sort((a, b) => getTaskTimestamp(b) - getTaskTimestamp(a));
    setTasks(nextTasks);
  };

  const fetchEmployees = async () => {
    const res = await api.get('/employees');
    setEmployees(getArrayPayload(res.data).filter((employee) => String(employee.role || 'employee') !== 'admin'));
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchTasks(), fetchEmployees()]);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch task data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const summary = useMemo(() => {
    return tasks.reduce((acc, task) => {
      const status = String(task.status || 'pending').toLowerCase();
      const priority = String(task.priority || 'medium').toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      if (['high', 'urgent'].includes(priority)) acc.highPriority += 1;
      if (task.dueDate && moment(task.dueDate).isBefore(moment(), 'day') && status !== 'completed') acc.overdue += 1;
      return acc;
    }, { pending: 0, 'in-progress': 0, completed: 0, highPriority: 0, overdue: 0 });
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const status = String(task.status || 'pending').toLowerCase();
      const priority = String(task.priority || 'medium').toLowerCase();
      const text = `${task.title || ''} ${task.description || ''} ${task.employee?.name || ''} ${task.employee?.employeeId || ''}`.toLowerCase();
      return (
        (statusFilter === 'all' || status === statusFilter) &&
        (priorityFilter === 'all' || priority === priorityFilter) &&
        (!query || text.includes(query))
      );
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  const paginatedTasks = filteredTasks.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, priorityFilter, limit]);

  const handleCreateTask = async (event) => {
    event.preventDefault();
    if (!newTask.title.trim() || !newTask.employeeId) {
      setError('Task title and employee are required');
      return;
    }

    setSaving(true);
    try {
      await api.post('/tasks', {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        employeeId: newTask.employeeId,
        priority: newTask.priority,
        dueDate: newTask.dueDate || undefined,
      });
      setMessage('Task assigned successfully');
      setError('');
      setNewTask(emptyTask);
      setShowModal(false);
      await fetchTasks();
    } catch (err) {
      setMessage('');
      setError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (taskId, status) => {
    setUpdatingTaskId(taskId);
    try {
      const res = await api.put(`/tasks/${taskId}`, { status });
      const updatedTask = res.data?.data;
      setMessage('Task status updated successfully');
      setError('');
      setTasks((currentTasks) => currentTasks
        .map((task) => (task._id === taskId ? { ...task, ...(updatedTask || {}), status } : task))
        .sort((a, b) => getTaskTimestamp(b) - getTaskTimestamp(a)));
    } catch (err) {
      setMessage('');
      setError(err.response?.data?.message || 'Failed to update task status');
    } finally {
      setUpdatingTaskId('');
    }
  };

  const openCreateModal = () => {
    setError('');
    setMessage('');
    setShowModal(true);
  };

  return (
    <div className="tasks-page">
      <style>
        {`
          .tasks-page {
            color: #0f172a;
            display: grid;
            gap: 1rem;
          }
          .tasks-hero,
          .tasks-stat,
          .tasks-panel {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 0.85rem;
            box-shadow: 0 14px 34px rgba(15, 23, 42, 0.07);
          }
          .tasks-hero {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            align-items: center;
            gap: 1rem;
            padding: 1.15rem;
            background: linear-gradient(135deg, #ffffff, #f8fbff);
            border-color: #dbeafe;
          }
          .tasks-eyebrow {
            margin: 0;
            color: #64748b;
            font-size: 0.76rem;
            font-weight: 900;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .tasks-title {
            margin: 0.25rem 0;
            color: #0f172a;
            font-size: clamp(1.45rem, 3vw, 2.1rem);
            font-weight: 900;
            line-height: 1.15;
          }
          .tasks-subtitle,
          .tasks-muted {
            margin: 0;
            color: #64748b;
            font-weight: 600;
          }
          .tasks-action {
            border-radius: 0.65rem;
            font-weight: 800;
            min-height: 42px;
          }
          .tasks-stat-grid {
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 0.85rem;
          }
          .tasks-stat {
            padding: 0.95rem;
          }
          .tasks-stat span {
            display: block;
            color: #64748b;
            font-size: 0.75rem;
            font-weight: 900;
            text-transform: uppercase;
          }
          .tasks-stat strong {
            display: block;
            margin-top: 0.28rem;
            color: #0f172a;
            font-size: 1.5rem;
          }
          .tasks-panel {
            padding: 1rem;
          }
          .tasks-panel-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            margin-bottom: 1rem;
          }
          .tasks-panel-title {
            margin: 0;
            color: #0f172a;
            font-size: 1.05rem;
            font-weight: 900;
          }
          .tasks-controls {
            display: grid;
            grid-template-columns: minmax(220px, 1fr) 155px 155px;
            gap: 0.75rem;
            margin-bottom: 1rem;
          }
          .tasks-page .form-control,
          .tasks-page .form-select,
          .tasks-modal .form-control,
          .tasks-modal .form-select {
            border: 1px solid #dbe3ef;
            border-radius: 0.65rem;
            color: #0f172a;
            font-weight: 600;
          }
          .tasks-page .form-control:focus,
          .tasks-page .form-select:focus,
          .tasks-modal .form-control:focus,
          .tasks-modal .form-select:focus {
            border-color: #93c5fd;
            box-shadow: 0 0 0 0.2rem rgba(37, 99, 235, 0.1);
          }
          .tasks-modal .form-label {
            color: #334155;
            font-size: 0.76rem;
            font-weight: 900;
            text-transform: uppercase;
          }
          .tasks-table-wrap {
            border: 1px solid #e2e8f0;
            border-radius: 0.8rem;
            overflow: hidden;
          }
          .tasks-table-wrap table {
            margin: 0;
          }
          .tasks-table-wrap thead th {
            background: #f8fafc;
            color: #475569;
            border-bottom: 1px solid #e2e8f0;
            font-size: 0.74rem;
            font-weight: 900;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            white-space: nowrap;
            padding: 0.85rem;
          }
          .tasks-table-wrap td {
            color: #334155;
            vertical-align: middle;
            padding: 0.9rem 0.85rem;
          }
          .tasks-person {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            min-width: 190px;
          }
          .tasks-avatar {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            display: grid;
            place-items: center;
            flex: 0 0 auto;
            color: #1d4ed8;
            background: #dbeafe;
            font-weight: 900;
          }
          .tasks-person strong {
            display: block;
            color: #0f172a;
          }
          .tasks-description {
            max-width: 320px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .tasks-empty {
            min-height: 240px;
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
          @media (max-width: 1050px) {
            .tasks-hero,
            .tasks-controls {
              grid-template-columns: 1fr;
            }
            .tasks-stat-grid {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }
          }
          @media (max-width: 700px) {
            .tasks-stat-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .tasks-panel-head {
              align-items: flex-start;
              flex-direction: column;
            }
          }
          @media (max-width: 520px) {
            .tasks-stat-grid {
              grid-template-columns: 1fr;
            }
            .tasks-hero,
            .tasks-panel {
              padding: 0.85rem;
            }
            .tasks-action {
              width: 100%;
            }
          }
        `}
      </style>

      <section className="tasks-hero">
        <div>
          <p className="tasks-eyebrow">Work allocation</p>
          <h2 className="tasks-title">Tasks</h2>
          <p className="tasks-subtitle">Assign, track, and complete employee tasks using live backend records.</p>
        </div>
        <Button className="tasks-action" onClick={openCreateModal}>Assign New Task</Button>
      </section>

      {error && <Alert variant="danger">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <section className="tasks-stat-grid">
        <div className="tasks-stat"><span>Total Tasks</span><strong>{tasks.length}</strong></div>
        <div className="tasks-stat"><span>Pending</span><strong>{summary.pending || 0}</strong></div>
        <div className="tasks-stat"><span>In Progress</span><strong>{summary['in-progress'] || 0}</strong></div>
        <div className="tasks-stat"><span>Completed</span><strong>{summary.completed || 0}</strong></div>
        <div className="tasks-stat"><span>Overdue</span><strong>{summary.overdue || 0}</strong></div>
      </section>

      <section className="tasks-panel">
        <div className="tasks-panel-head">
          <div>
            <h3 className="tasks-panel-title">Task register</h3>
            <p className="tasks-muted">{filteredTasks.length} matching tasks</p>
          </div>
          <Button variant="outline-primary" size="sm" onClick={refreshData} disabled={loading}>Refresh</Button>
        </div>

        <div className="tasks-controls">
          <Form.Control value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, employee, or description" />
          <Form.Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </Form.Select>
          <Form.Select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
            <option value="all">All priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Form.Select>
        </div>

        {loading ? (
          <div className="tasks-empty"><Spinner animation="border" size="sm" className="me-2" /> Loading tasks...</div>
        ) : (
          <>
            <div className="tasks-table-wrap table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Task</th>
                    <th>Priority</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTasks.length ? paginatedTasks.map((task) => {
                    const statusMeta = getStatusMeta(task.status);
                    const priorityMeta = getPriorityMeta(task.priority);
                    const isUpdating = updatingTaskId === task._id;
                    const employeeName = task.employee?.name || 'N/A';
                    return (
                      <tr key={task._id}>
                        <td>
                          <div className="tasks-person">
                            <div className="tasks-avatar">{String(employeeName).charAt(0).toUpperCase()}</div>
                            <div>
                              <strong>{employeeName}</strong>
                              <span className="tasks-muted">{task.employee?.employeeId || 'N/A'}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <strong>{task.title || 'N/A'}</strong>
                          <div className="tasks-description" title={task.description}>{task.description || 'No description'}</div>
                        </td>
                        <td><Badge bg={priorityMeta.variant}>{priorityMeta.label}</Badge></td>
                        <td>{task.dueDate ? moment(task.dueDate).format('DD MMM YYYY') : 'Not set'}</td>
                        <td><Badge bg={statusMeta.variant}>{statusMeta.label}</Badge></td>
                        <td>{task.createdAt ? moment(task.createdAt).format('DD MMM YYYY') : 'N/A'}</td>
                        <td>
                          {task.status === 'pending' && (
                            <Button variant="primary" size="sm" onClick={() => handleStatusUpdate(task._id, 'in-progress')} disabled={isUpdating}>
                              {isUpdating ? 'Updating...' : 'Start'}
                            </Button>
                          )}
                          {task.status === 'in-progress' && (
                            <Button variant="success" size="sm" onClick={() => handleStatusUpdate(task._id, 'completed')} disabled={isUpdating}>
                              {isUpdating ? 'Updating...' : 'Complete'}
                            </Button>
                          )}
                          {task.status === 'completed' && <span className="tasks-muted">Done</span>}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan="7" className="text-center text-muted py-4">No tasks found</td></tr>
                  )}
                </tbody>
              </Table>
            </div>

            {filteredTasks.length > limit && (
              <PaginationControls
                page={page}
                limit={limit}
                total={filteredTasks.length}
                label="tasks"
                onPageChange={setPage}
                onLimitChange={(nextLimit) => {
                  setLimit(nextLimit);
                  setPage(1);
                }}
              />
            )}
          </>
        )}
      </section>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered className="tasks-modal">
        <Form onSubmit={handleCreateTask}>
          <Modal.Header closeButton>
            <Modal.Title>Assign New Task</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row className="g-3">
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Task Title</Form.Label>
                  <Form.Control value={newTask.title} onChange={(event) => setNewTask({ ...newTask, title: event.target.value })} placeholder="Enter task title" required />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Description</Form.Label>
                  <Form.Control as="textarea" rows={3} value={newTask.description} onChange={(event) => setNewTask({ ...newTask, description: event.target.value })} placeholder="Add clear task details" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Assign To</Form.Label>
                  <Form.Select value={newTask.employeeId} onChange={(event) => setNewTask({ ...newTask, employeeId: event.target.value })} required>
                    <option value="">Select employee</option>
                    {employees.map((employee) => (
                      <option key={employee._id} value={employee._id}>
                        {employee.name} ({employee.employeeId || 'N/A'})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Priority</Form.Label>
                  <Form.Select value={newTask.priority} onChange={(event) => setNewTask({ ...newTask, priority: event.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Due Date</Form.Label>
                  <Form.Control type="date" value={newTask.dueDate} min={moment().format('YYYY-MM-DD')} onChange={(event) => setNewTask({ ...newTask, dueDate: event.target.value })} />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Assigning...' : 'Assign Task'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminTasks;
