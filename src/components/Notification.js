import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Container, Card, Badge, Button, Alert, Row, Col, Spinner } from 'react-bootstrap';

const Notification = ({ userId, role }) => {
  const [notifications, setNotifications] = useState([]);
  const [attendanceDetails, setAttendanceDetails] = useState({});

  useEffect(() => {
    if (!userId) return;
    const fetchNotifications = async () => {
      try {
        const response = await axios.get(`/notifications/${userId}`);
        setNotifications(response.data);

        // Fetch attendance details for attendance_pending notifications
        const pendingNotifications = response.data.filter(notif => notif.type === 'attendance_pending');
        const details = {};
        for (const notif of pendingNotifications) {
          try {
            const attResponse = await axios.get(`/attendance/${notif.relatedId}`);
            details[notif.relatedId] = attResponse.data;
          } catch (error) {
            console.error('Error fetching attendance details:', error);
            // Backend now returns a default object instead of 404, so this shouldn't happen
            // But keeping as fallback
            details[notif.relatedId] = { error: true, message: 'Attendance details not available' };
          }
        }
        setAttendanceDetails(details);
      } catch (error) {
        toast.error('Error fetching notifications');
      }
    };
    fetchNotifications();
  }, [userId]);

  const markAsRead = async (id) => {
    try {
      await axios.put(`/notifications/${id}/read`);
      setNotifications(notifications.map((notif) =>
        notif._id === id ? { ...notif, status: 'read' } : notif
      ));
      toast.success('Notification marked as read');
    } catch (error) {
      toast.error('Error marking notification as read');
    }
  };

  const handleAttendanceApproval = async (attendanceId, action) => {
    try {
      const endpoint = action === 'approve' ? 'approve' : 'reject';
      const response = await axios.put(`/attendance/admin/${endpoint}/${attendanceId}`);
      toast.success(`Attendance ${action}d successfully`);
      // Remove the notification from the list
      setNotifications(notifications.filter(notif => notif.relatedId !== attendanceId));
    } catch (error) {
      toast.error(`Error ${action}ing attendance`);
    }
  };

  const getNotificationMessage = (notif) => {
    if (notif.type === 'attendance_pending' && attendanceDetails[notif.relatedId] && !attendanceDetails[notif.relatedId].error) {
      const att = attendanceDetails[notif.relatedId];
      const employeeName = att.employee?.name || 'Unknown Employee';
      const employeeId = att.employee?.employeeId || 'N/A';
      const date = new Date(att.date).toLocaleDateString('en-IN');
      return `${employeeName} (${employeeId}) has punched out for ${date}. Please review and approve/reject.`;
    }
    return notif.message;
  };

  return (
    <Container className="py-4">
      <Card className="shadow">
        <Card.Header className="bg-primary text-white">
          <h2 className="h4 mb-0">Notifications</h2>
        </Card.Header>
        <Card.Body>
          {notifications.length === 0 ? (
            <Alert variant="info" className="text-center">
              <h5>No notifications available</h5>
              <p>You don't have any notifications at the moment.</p>
            </Alert>
          ) : (
            <div className="notification-list">
              {notifications.map((notif) => (
                <Card
                  key={notif._id}
                  className={`mb-3 border-left-${
                    notif.status === 'unread' ? 'primary' : 'secondary'
                  }`}
                  style={{
                    borderLeft: `4px solid ${
                      notif.status === 'unread' ? '#007bff' : '#6c757d'
                    }`,
                  }}
                >
                  <Card.Body>
                    <Row className="align-items-start">
                      <Col>
                        <div className="d-flex align-items-center mb-2">
                          <Badge
                            variant={
                              notif.type === 'attendance_pending'
                                ? 'warning'
                                : notif.type === 'leave_request'
                                ? 'success'
                                : 'secondary'
                            }
                            className="mr-2"
                          >
                            {notif.type.replace('_', ' ').toUpperCase()}
                          </Badge>
                          {notif.status === 'unread' && (
                            <Badge variant="primary" pill className="ml-2">
                              New
                            </Badge>
                          )}
                        </div>
                        <Card.Text className="mb-2">
                          {getNotificationMessage(notif)}
                        </Card.Text>
                        <small className="text-muted">
                          {new Date(notif.createdAt).toLocaleString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </small>
                      </Col>
                      {notif.status === 'unread' && (
                        <Col xs="auto" className="d-flex gap-2">
                          {notif.type === 'attendance_pending' && role === 'admin' ? (
                            <>
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleAttendanceApproval(notif.relatedId, 'approve')}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleAttendanceApproval(notif.relatedId, 'reject')}
                              >
                                Reject
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => markAsRead(notif._id)}
                            >
                              Mark as Read
                            </Button>
                          )}
                        </Col>
                      )}
                    </Row>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Notification;
