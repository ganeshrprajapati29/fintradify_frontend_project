import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Spinner } from 'react-bootstrap';
import moment from 'moment';
import api from '../utils/axios';
import PaginationControls from './PaginationControls';

const typeLabel = (type) => String(type || 'notification').replace(/_/g, ' ');

const getTypeMeta = (type) => {
  const normalized = String(type || '').toLowerCase();
  if (normalized.includes('attendance')) return { label: typeLabel(type), variant: 'warning', className: 'attendance' };
  if (normalized.includes('leave')) return { label: typeLabel(type), variant: 'success', className: 'leave' };
  if (normalized.includes('salary')) return { label: typeLabel(type), variant: 'primary', className: 'salary' };
  return { label: typeLabel(type), variant: 'secondary', className: 'general' };
};

const Notification = ({ userId, role }) => {
  const [profileId, setProfileId] = useState(userId || '');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    const fetchProfileId = async () => {
      if (userId) {
        setProfileId(userId);
        return;
      }

      try {
        const res = await api.get('/employees/profile');
        setProfileId(res.data?.data?._id || '');
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load employee profile for notifications');
      }
    };

    fetchProfileId();
  }, [userId]);

  const fetchNotifications = async () => {
    if (!profileId) return;
    setLoading(true);
    try {
      const response = await api.get(`/notifications/${profileId}`);
      const rows = (Array.isArray(response.data) ? response.data : [])
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setNotifications(rows);
      setPage(1);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [profileId]);

  const summary = useMemo(() => {
    return notifications.reduce((acc, item) => {
      if (String(item.status || 'unread').toLowerCase() === 'unread') acc.unread += 1;
      else acc.read += 1;
      return acc;
    }, { unread: 0, read: 0 });
  }, [notifications]);

  const typeOptions = useMemo(() => {
    return [...new Set(notifications.map((item) => item.type).filter(Boolean))].sort();
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notifications.filter((item) => {
      const status = String(item.status || 'unread').toLowerCase();
      const type = String(item.type || '').toLowerCase();
      const text = `${item.type || ''} ${item.message || ''} ${item.recipient || ''}`.toLowerCase();
      return (
        (statusFilter === 'all' || status === statusFilter) &&
        (typeFilter === 'all' || type === typeFilter) &&
        (!query || text.includes(query))
      );
    });
  }, [notifications, search, statusFilter, typeFilter]);

  const paginatedNotifications = filteredNotifications.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter, limit]);

  const markAsRead = async (id) => {
    setUpdatingId(id);
    try {
      const response = await api.put(`/notifications/${id}/read`);
      setNotifications((current) => current.map((notif) => (
        notif._id === id ? { ...notif, ...(response.data || {}), status: 'read' } : notif
      )));
      setSuccess('Notification marked as read');
      setError('');
    } catch (err) {
      setSuccess('');
      setError(err.response?.data?.message || 'Error marking notification as read');
    } finally {
      setUpdatingId('');
    }
  };

  const markAllVisibleAsRead = async () => {
    const unreadItems = paginatedNotifications.filter((notif) => String(notif.status || 'unread').toLowerCase() === 'unread');
    if (!unreadItems.length) return;

    setLoading(true);
    try {
      await Promise.all(unreadItems.map((notif) => api.put(`/notifications/${notif._id}/read`)));
      setNotifications((current) => current.map((notif) => (
        unreadItems.some((item) => item._id === notif._id) ? { ...notif, status: 'read' } : notif
      )));
      setSuccess('Visible notifications marked as read');
      setError('');
    } catch (err) {
      setSuccess('');
      setError(err.response?.data?.message || 'Error updating notifications');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notification-page">
      <style>
        {`
          .notification-page {
            color: #0f172a;
            display: grid;
            gap: 1rem;
          }
          .notification-hero,
          .notification-panel,
          .notification-summary-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 0.9rem;
            box-shadow: 0 14px 34px rgba(15, 23, 42, 0.07);
          }
          .notification-hero {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 1rem;
            align-items: center;
            padding: 1.15rem;
            background: linear-gradient(135deg, #ffffff, #f8fbff);
          }
          .notification-eyebrow {
            margin: 0;
            color: #64748b;
            font-size: 0.78rem;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .notification-title {
            margin: 0.25rem 0;
            color: #0f172a;
            font-size: clamp(1.45rem, 3vw, 2.1rem);
            font-weight: 900;
            line-height: 1.15;
          }
          .notification-subtitle {
            margin: 0;
            color: #64748b;
            font-weight: 600;
          }
          .notification-action-btn {
            border-radius: 0.65rem;
            font-weight: 800;
            min-height: 42px;
          }
          .notification-summary-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 0.85rem;
          }
          .notification-summary-card {
            padding: 0.95rem;
          }
          .notification-summary-card span {
            display: block;
            color: #64748b;
            font-size: 0.76rem;
            font-weight: 800;
            text-transform: uppercase;
          }
          .notification-summary-card strong {
            display: block;
            margin-top: 0.28rem;
            color: #0f172a;
            font-size: 1.55rem;
            line-height: 1.1;
          }
          .notification-panel {
            padding: 1rem;
          }
          .notification-panel-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            margin-bottom: 1rem;
          }
          .notification-panel-title {
            margin: 0;
            color: #0f172a;
            font-size: 1.05rem;
            font-weight: 900;
          }
          .notification-controls {
            display: grid;
            grid-template-columns: minmax(190px, 1fr) 150px 180px;
            gap: 0.75rem;
            margin-bottom: 1rem;
          }
          .notification-controls .form-control,
          .notification-controls .form-select {
            border: 1px solid #dbe3ef;
            border-radius: 0.65rem;
            color: #0f172a;
            font-weight: 600;
            min-height: 42px;
          }
          .notification-list {
            display: grid;
            gap: 0.85rem;
          }
          .notification-card {
            border: 1px solid #e2e8f0;
            border-radius: 0.85rem;
            background: #ffffff;
            padding: 0.95rem;
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 1rem;
            align-items: start;
          }
          .notification-card.unread {
            border-color: #bfdbfe;
            background: #f8fbff;
          }
          .notification-message {
            margin: 0.65rem 0 0;
            color: #334155;
            font-weight: 600;
            line-height: 1.55;
          }
          .notification-meta {
            margin-top: 0.55rem;
            color: #64748b;
            font-size: 0.85rem;
            font-weight: 700;
          }
          .notification-badge-row {
            display: flex;
            flex-wrap: wrap;
            gap: 0.45rem;
            align-items: center;
          }
          .notification-empty {
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
          @media (max-width: 760px) {
            .notification-hero,
            .notification-card {
              grid-template-columns: 1fr;
            }
            .notification-panel-head {
              align-items: flex-start;
              flex-direction: column;
            }
            .notification-controls {
              grid-template-columns: 1fr;
            }
            .notification-summary-grid {
              grid-template-columns: 1fr;
            }
            .notification-action-btn {
              width: 100%;
            }
          }
        `}
      </style>

      <section className="notification-hero">
        <div>
          <p className="notification-eyebrow">{role === 'admin' ? 'Admin alerts' : 'Employee alerts'}</p>
          <h2 className="notification-title">Notifications</h2>
          <p className="notification-subtitle">Real-time HR, attendance, leave, salary, and system updates from the backend.</p>
        </div>
        <Button className="notification-action-btn" variant="outline-primary" onClick={markAllVisibleAsRead} disabled={loading || summary.unread === 0}>
          Mark Visible Read
        </Button>
      </section>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <section className="notification-summary-grid">
        <div className="notification-summary-card"><span>Total</span><strong>{notifications.length}</strong></div>
        <div className="notification-summary-card"><span>Unread</span><strong>{summary.unread}</strong></div>
        <div className="notification-summary-card"><span>Read</span><strong>{summary.read}</strong></div>
      </section>

      <section className="notification-panel">
        <div className="notification-panel-head">
          <div>
            <h3 className="notification-panel-title">Notification register</h3>
            <p className="notification-subtitle">{filteredNotifications.length} records, latest first</p>
          </div>
          <Button className="notification-action-btn" variant="outline-primary" onClick={fetchNotifications} disabled={loading}>Refresh</Button>
        </div>
        <div className="notification-controls">
          <input className="form-control" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search message or type" />
          <select className="form-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          <select className="form-select" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="all">All types</option>
            {typeOptions.map((type) => <option key={type} value={String(type).toLowerCase()}>{typeLabel(type)}</option>)}
          </select>
        </div>
        {loading ? (
          <div className="notification-empty">
            <Spinner animation="border" size="sm" className="me-2" /> Loading notifications...
          </div>
        ) : paginatedNotifications.length ? (
          <div className="notification-list">
            {paginatedNotifications.map((notif, index) => {
              const meta = getTypeMeta(notif.type);
              const unread = String(notif.status || 'unread').toLowerCase() === 'unread';
              return (
                <article className={`notification-card ${unread ? 'unread' : ''}`} key={notif._id}>
                  <div>
                    <div className="notification-badge-row">
                      <Badge bg={meta.variant}>{meta.label.toUpperCase()}</Badge>
                      {unread && <Badge bg="primary">New</Badge>}
                      {page === 1 && index === 0 && <Badge bg="success">Latest</Badge>}
                    </div>
                    <p className="notification-message">{notif.message || 'No message available.'}</p>
                    <div className="notification-meta">
                      {notif.createdAt ? moment(notif.createdAt).format('DD MMM YYYY, hh:mm A') : 'Date unavailable'}
                    </div>
                  </div>
                  {unread ? (
                    <Button
                      className="notification-action-btn"
                      variant="primary"
                      onClick={() => markAsRead(notif._id)}
                      disabled={updatingId === notif._id}
                    >
                      {updatingId === notif._id ? 'Updating...' : 'Mark Read'}
                    </Button>
                  ) : (
                    <Badge bg="light" text="dark">Read</Badge>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="notification-empty">No notifications available right now.</div>
        )}

        {filteredNotifications.length > limit && (
          <PaginationControls
            page={page}
            limit={limit}
            total={filteredNotifications.length}
            label="notifications"
            onPageChange={setPage}
            onLimitChange={(nextLimit) => {
              setLimit(nextLimit);
              setPage(1);
            }}
          />
        )}
      </section>
    </div>
  );
};

export default Notification;
