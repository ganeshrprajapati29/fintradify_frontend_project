import React, { useState, useEffect } from 'react';
import { Table, Button, Alert, Pagination, Form, Row, Col, Spinner } from 'react-bootstrap';
import axios from 'axios';
import moment from 'moment';

const AttendanceList = ({ status }) => {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const limit = 10;

  const fetchAttendances = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/attendance/${status}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        params,
      });
      setAttendances(response.data.attendances);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.currentPage);
      setTotal(response.data.total);
      setError('');
    } catch (err) {
      console.error(`Error fetching ${status} attendances:`, err);
      setError(err.response?.data?.message || `Error fetching ${status} attendances`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendances();
  }, [status]);

  const handlePageChange = (page) => {
    fetchAttendances(page);
  };

  const handleFilter = () => {
    fetchAttendances(1);
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    fetchAttendances(1);
  };

  const renderPagination = () => {
    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <Pagination.Item
          key={page}
          active={page === currentPage}
          onClick={() => handlePageChange(page)}
        >
          {page}
        </Pagination.Item>
      );
    }

    return (
      <Pagination className="justify-content-center mt-3">
        <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
        <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
        {startPage > 1 && <Pagination.Ellipsis />}
        {items}
        {endPage < totalPages && <Pagination.Ellipsis />}
        <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
        <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
      </Pagination>
    );
  };

  return (
    <div>
      <style>
        {`
          .attendance-list-container {
            font-family: 'Poppins', sans-serif;
            color: #1e40af;
            background: #ffffff;
            padding: 1.5rem;
            border-radius: 1rem;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            margin: 1rem;
          }
          .attendance-title {
            font-size: 2rem;
            font-weight: 700;
            color: #1e40af;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            margin-bottom: 2rem;
            text-align: center;
          }
          .alert {
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
          .btn-secondary {
            border-radius: 0.6rem;
            padding: 0.8rem 2rem;
            font-weight: 600;
            font-size: 1.1rem;
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
            border: 2px solid #6b7280;
            background: linear-gradient(90deg, #f3f4f6, #e5e7eb);
            color: #374151;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .btn-secondary:hover {
            background: linear-gradient(90deg, #374151, #6b7280) !important;
            border-color: #6b7280 !important;
            color: #fff !important;
            transform: scale(1.05);
            box-shadow: 0 6px 16px rgba(107, 114, 128, 0.5);
          }
          .form-label {
            color: #1e40af;
            font-weight: 600;
            font-size: 1rem;
            margin-bottom: 0.5rem;
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
          .table {
            border-radius: 0.6rem;
            overflow: hidden;
            background: #f8fafc;
            color: #1e40af;
            border: 2px solid rgba(30, 64, 175, 0.2);
            margin-top: 1.5rem;
            font-size: 1rem;
          }
          .table thead {
            background: linear-gradient(to right, #1e40af, #3b82f6);
            color: #fff;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.9rem;
            letter-spacing: 0.5px;
          }
          .table th, .table td {
            padding: 1.2rem;
            vertical-align: middle;
            border-color: rgba(30, 64, 175, 0.2);
          }
          .table tbody tr:nth-child(even) {
            background: rgba(191, 219, 254, 0.1);
          }
          .table tbody tr:hover {
            background: rgba(59, 130, 246, 0.15);
            transform: scale(1.01);
          }
          .table-empty {
            text-align: center;
            font-style: italic;
            color: #374151;
            padding: 1.5rem;
            font-size: 1rem;
          }
          .pagination {
            margin-top: 2rem;
          }
          .pagination .page-link {
            color: #1e40af;
            border-color: #bfdbfe;
            background: #f8fafc;
            font-weight: 600;
          }
          .pagination .page-link:hover {
            color: #fff;
            background: #3b82f6;
            border-color: #3b82f6;
          }
          .pagination .page-item.active .page-link {
            background: #1e40af;
            border-color: #1e40af;
          }
          .status-badge {
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.8rem;
          }
          .status-approved {
            background: #d1fae5;
            color: #065f46;
          }
          .status-rejected {
            background: #fee2e2;
            color: #991b1b;
          }
          @media (max-width: 576px) {
            .attendance-list-container {
              padding: 1rem;
              margin: 0.5rem;
            }
            .attendance-title {
              font-size: 1.6rem;
              margin-bottom: 1.5rem;
            }
            .alert {
              font-size: 0.9rem;
              padding: 0.8rem;
            }
            .btn-primary, .btn-secondary {
              padding: 0.6rem 1.5rem;
              font-size: 0.95rem;
            }
            .form-control {
              font-size: 0.9rem;
              padding: 0.7rem;
            }
            .form-label {
              font-size: 0.9rem;
            }
            .table th, .table td {
              padding: 0.8rem;
              font-size: 0.85rem;
            }
            .table-responsive {
              margin: 0 0.5rem;
            }
            .table-empty {
              font-size: 0.9rem;
            }
          }
        `}
      </style>
      <div className="attendance-list-container">
        <h3 className="attendance-title">{status === 'approved' ? 'Approved' : 'Rejected'} Attendances</h3>
        {error && (
          <Alert variant="danger">
            {error}
          </Alert>
        )}
        <Form className="mb-3">
          <Row>
            <Col md={4}>
              <Form.Group controlId="startDate">
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="endDate">
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex align-items-end">
              <Button variant="primary" onClick={handleFilter} className="me-2">
                Filter
              </Button>
              <Button variant="secondary" onClick={handleClearFilter}>
                Clear
              </Button>
            </Col>
          </Row>
        </Form>
        {loading ? (
          <div className="text-center">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <Table>
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Date</th>
                    <th>Punch In</th>
                    <th>Punch Out</th>
                    <th>Hours Worked</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendances.length > 0 ? (
                    attendances.map((att, index) => {
                      const hoursWorked = att.punchOut && att.punchIn
                        ? ((new Date(att.punchOut) - new Date(att.punchIn)) / 1000 / 60 / 60).toFixed(2)
                        : '0.00';
                      return (
                        <tr key={att._id}>
                          <td>{att.employee?.employeeId || 'N/A'}</td>
                          <td>{att.employee?.name || 'N/A'}</td>
                          <td>{moment(att.date).format('YYYY-MM-DD')}</td>
                          <td>{att.punchIn ? moment(att.punchIn).format('HH:mm:ss') : '-'}</td>
                          <td>{att.punchOut ? moment(att.punchOut).format('HH:mm:ss') : '-'}</td>
                          <td>{hoursWorked}</td>
                          <td>
                            <span className={`status-badge status-${att.status}`}>
                              {att.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="table-empty">
                        No {status} attendances found
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
            {totalPages > 1 && renderPagination()}
            <div className="text-center mt-3">
              <small className="text-muted">
                Showing {attendances.length} of {total} {status} attendances
              </small>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AttendanceList;
