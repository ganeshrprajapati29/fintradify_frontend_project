import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Form, Modal, Spinner } from 'react-bootstrap';
import moment from 'moment';
import api from '../utils/axios';
import PaginationControls from './PaginationControls';
import 'bootstrap/dist/css/bootstrap.min.css';

const getStatusMeta = (status) => {
  const normalized = String(status || 'pending').toLowerCase();
  if (normalized === 'completed') return { label: 'Completed', variant: 'success', className: 'completed' };
  if (normalized === 'in-progress') return { label: 'In Progress', variant: 'warning', className: 'in-progress' };
  return { label: 'Pending', variant: 'secondary', className: 'pending' };
};

const getPriorityMeta = (priority) => {
  const normalized = String(priority || 'medium').toLowerCase();
  if (normalized === 'urgent') return { label: 'Urgent', className: 'urgent' };
  if (normalized === 'high') return { label: 'High', className: 'high' };
  if (normalized === 'low') return { label: 'Low', className: 'low' };
  return { label: 'Medium', className: 'medium' };
};

const getTaskStatus = (status) => String(status || 'pending').toLowerCase().replace(/\s+/g, '-');

const EmployeeTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [updatingTaskId, setUpdatingTaskId] = useState('');
  const [submitTask, setSubmitTask] = useState(null);
  const [submitNote, setSubmitNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const paginatedTasks = tasks.slice((page - 1) * limit, page * limit);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tasks/my-tasks');
      setTasks(res.data.data || []);
      setPage(1);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const summary = useMemo(() => {
    return tasks.reduce((acc, task) => {
      const status = getTaskStatus(task.status);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, { pending: 0, 'in-progress': 0, completed: 0 });
  }, [tasks]);

  const completionRate = tasks.length ? Math.round(((summary.completed || 0) / tasks.length) * 100) : 0;

  const handleStatusUpdate = async (taskId, status) => {
    setUpdatingTaskId(taskId);
    try {
      const res = await api.put(`/tasks/${taskId}`, { status });
      const updatedTask = res.data?.data;
      setMessage(status === 'completed' ? 'Task marked as completed' : 'Task moved to in progress');
      setError('');
      setTasks((currentTasks) => currentTasks.map((task) => (
        task._id === taskId ? { ...task, ...(updatedTask || {}), status } : task
      )));
    } catch (err) {
      setMessage('');
      setError(err.response?.data?.message || 'Failed to update task status');
    } finally {
      setUpdatingTaskId('');
    }
  };

  const openSubmitModal = (task) => {
    setSubmitTask(task);
    setSubmitNote(task.submissionNote || '');
    setError('');
    setMessage('');
  };

  const closeSubmitModal = () => {
    if (submitting) return;
    setSubmitTask(null);
    setSubmitNote('');
  };

  const handleSubmitTask = async () => {
    if (!submitTask?._id) return;
    setSubmitting(true);
    try {
      const res = await api.put(`/tasks/${submitTask._id}`, {
        status: 'completed',
        submissionNote: submitNote,
      });
      const updatedTask = res.data?.data;
      setTasks((currentTasks) => currentTasks.map((task) => (
        task._id === submitTask._id ? { ...task, ...(updatedTask || {}), status: 'completed' } : task
      )));
      setMessage('Task submitted successfully');
      setError('');
      setSubmitTask(null);
      setSubmitNote('');
    } catch (err) {
      setMessage('');
      setError(err.response?.data?.message || 'Failed to submit task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="employee-task-page">
      <style>
        {`
          .employee-task-page {
            color: #0f172a;
            display: grid;
            gap: 1rem;
          }
          .task-hero {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 1rem;
            align-items: center;
            padding: 1.15rem;
            background: linear-gradient(135deg, #ffffff, #f8fbff);
            border: 1px solid #dbeafe;
            border-radius: 0.9rem;
            box-shadow: 0 16px 36px rgba(15, 23, 42, 0.07);
          }
          .task-eyebrow {
            margin: 0;
            color: #64748b;
            font-size: 0.78rem;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .task-title {
            margin: 0.25rem 0;
            color: #0f172a;
            font-size: clamp(1.45rem, 3vw, 2.1rem);
            font-weight: 900;
            line-height: 1.15;
          }
          .task-subtitle {
            margin: 0;
            color: #64748b;
            font-weight: 600;
          }
          .task-progress-card {
            min-width: 260px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 0.85rem;
            padding: 0.9rem;
            box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
          }
          .task-progress-card strong {
            display: block;
            color: #0f172a;
            font-size: 1.8rem;
            line-height: 1;
          }
          .task-progress-track {
            height: 8px;
            background: #e2e8f0;
            border-radius: 999px;
            overflow: hidden;
            margin-top: 0.75rem;
          }
          .task-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #2563eb, #14b8a6);
            border-radius: inherit;
          }
          .task-summary-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 0.85rem;
          }
          .task-summary-card,
          .task-card,
          .task-panel {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 0.85rem;
            box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
          }
          .task-summary-card {
            padding: 0.95rem;
          }
          .task-summary-card span {
            display: block;
            color: #64748b;
            font-size: 0.76rem;
            font-weight: 800;
            text-transform: uppercase;
          }
          .task-summary-card strong {
            display: block;
            margin-top: 0.28rem;
            color: #0f172a;
            font-size: 1.55rem;
            line-height: 1.1;
          }
          .task-panel {
            padding: 1rem;
          }
          .task-list {
            display: grid;
            gap: 0.85rem;
          }
          .task-card {
            padding: 1rem;
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 1rem;
            align-items: start;
          }
          .task-card-title {
            margin: 0;
            color: #0f172a;
            font-size: 1.05rem;
            font-weight: 900;
          }
          .task-card-desc {
            margin: 0.45rem 0 0;
            color: #64748b;
            font-weight: 600;
            line-height: 1.55;
          }
          .task-meta-row {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 0.85rem;
          }
          .task-pill {
            border-radius: 999px;
            padding: 0.38rem 0.62rem;
            background: #f1f5f9;
            color: #475569;
            border: 1px solid #e2e8f0;
            font-size: 0.76rem;
            font-weight: 800;
          }
          .task-priority.urgent { color: #b91c1c; background: #fee2e2; border-color: #fecaca; }
          .task-priority.high { color: #c2410c; background: #ffedd5; border-color: #fed7aa; }
          .task-priority.medium { color: #1d4ed8; background: #dbeafe; border-color: #bfdbfe; }
          .task-priority.low { color: #047857; background: #d1fae5; border-color: #a7f3d0; }
          .task-actions {
            display: flex;
            flex-direction: column;
            gap: 0.55rem;
            min-width: 130px;
          }
          .task-action-btn {
            border-radius: 0.65rem;
            font-weight: 800;
          }
          .task-submit-note {
            margin-top: 0.8rem;
            padding: 0.75rem;
            border: 1px solid #bbf7d0;
            border-radius: 0.75rem;
            background: #f0fdf4;
            color: #166534;
            font-weight: 700;
            line-height: 1.5;
          }
          .task-submit-note span {
            display: block;
            color: #64748b;
            font-size: 0.76rem;
            font-weight: 900;
            text-transform: uppercase;
            margin-bottom: 0.25rem;
          }
          .task-empty {
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
          @media (max-width: 900px) {
            .task-hero {
              grid-template-columns: 1fr;
            }
            .task-progress-card {
              min-width: 0;
            }
            .task-summary-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }
          @media (max-width: 620px) {
            .task-card {
              grid-template-columns: 1fr;
            }
            .task-actions {
              min-width: 0;
            }
            .task-summary-grid {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      <section className="task-hero">
        <div>
          <p className="task-eyebrow">Employee tasks</p>
          <h2 className="task-title">My Tasks</h2>
          <p className="task-subtitle">Track assigned work, priority, due dates, and progress from live task records.</p>
        </div>
        <div className="task-progress-card">
          <p className="task-eyebrow">Completion</p>
          <strong>{completionRate}%</strong>
          <div className="task-progress-track">
            <div className="task-progress-fill" style={{ width: `${completionRate}%` }} />
          </div>
        </div>
      </section>

      {error && <Alert variant="danger">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <section className="task-summary-grid">
        <div className="task-summary-card"><span>Total Tasks</span><strong>{tasks.length}</strong></div>
        <div className="task-summary-card"><span>Pending</span><strong>{summary.pending || 0}</strong></div>
        <div className="task-summary-card"><span>In Progress</span><strong>{summary['in-progress'] || 0}</strong></div>
        <div className="task-summary-card"><span>Completed</span><strong>{summary.completed || 0}</strong></div>
      </section>

      <section className="task-panel">
        {loading ? (
          <div className="task-empty">
            <Spinner animation="border" size="sm" className="me-2" /> Loading tasks...
          </div>
        ) : paginatedTasks.length > 0 ? (
          <div className="task-list">
            {paginatedTasks.map((task) => {
              const taskStatus = getTaskStatus(task.status);
              const statusMeta = getStatusMeta(taskStatus);
              const priorityMeta = getPriorityMeta(task.priority);
              const isUpdating = updatingTaskId === task._id;
              return (
                <article className="task-card" key={task._id}>
                  <div>
                    <h3 className="task-card-title">{task.title || 'Untitled task'}</h3>
                    <p className="task-card-desc">{task.description || 'No description added.'}</p>
                    <div className="task-meta-row">
                      <Badge bg={statusMeta.variant}>{statusMeta.label}</Badge>
                      <span className={`task-pill task-priority ${priorityMeta.className}`}>{priorityMeta.label} priority</span>
                      <span className="task-pill">Due {task.dueDate ? moment(task.dueDate).format('DD MMM YYYY') : 'N/A'}</span>
                      {task.submittedAt && <span className="task-pill">Submitted {moment(task.submittedAt).format('DD MMM YYYY, hh:mm A')}</span>}
                    </div>
                    {task.submissionNote && (
                      <div className="task-submit-note">
                        <span>Submission note</span>
                        {task.submissionNote}
                      </div>
                    )}
                  </div>
                  <div className="task-actions">
                    {taskStatus !== 'completed' && (
                      <Button className="task-action-btn" variant="success" onClick={() => openSubmitModal(task)}>
                        Submit Task
                      </Button>
                    )}
                    {taskStatus === 'pending' && (
                      <Button className="task-action-btn" variant="primary" disabled={isUpdating} onClick={() => handleStatusUpdate(task._id, 'in-progress')}>
                        {isUpdating ? <Spinner animation="border" size="sm" /> : 'Start Task'}
                      </Button>
                    )}
                    {taskStatus === 'completed' && (
                      <Button className="task-action-btn" variant="outline-success" disabled>
                        Done
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="task-empty">No tasks assigned yet.</div>
        )}

        {tasks.length > limit && (
          <PaginationControls
            page={page}
            limit={limit}
            total={tasks.length}
            label="tasks"
            onPageChange={setPage}
            onLimitChange={(nextLimit) => {
              setLimit(nextLimit);
              setPage(1);
            }}
          />
        )}
      </section>

      <Modal show={Boolean(submitTask)} onHide={closeSubmitModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Submit Task</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-2 fw-bold">{submitTask?.title || 'Task'}</p>
          <p className="text-muted mb-3">Add a short completion note before submitting this task.</p>
          <Form.Group>
            <Form.Label>Submission note</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={submitNote}
              onChange={(event) => setSubmitNote(event.target.value)}
              placeholder="Write what you completed, links, remarks, or handover details..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={closeSubmitModal} disabled={submitting}>Cancel</Button>
          <Button variant="success" onClick={handleSubmitTask} disabled={submitting}>
            {submitting ? <><Spinner animation="border" size="sm" className="me-2" />Submitting...</> : 'Submit Task'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EmployeeTasks;
