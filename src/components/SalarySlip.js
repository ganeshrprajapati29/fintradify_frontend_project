import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Col, Form, Row, Spinner, Table } from 'react-bootstrap';
import moment from 'moment';
import api from '../utils/axios';
import PaginationControls from './PaginationControls';
import 'bootstrap/dist/css/bootstrap.min.css';

const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const getRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const getStatusMeta = (status) => {
  const normalized = String(status || 'generated').toLowerCase();
  if (normalized === 'sent') return { label: 'Sent', variant: 'success' };
  return { label: 'Generated', variant: 'primary' };
};

const getObjectIdTimestamp = (id) => {
  const value = String(id || '');
  if (!/^[0-9a-fA-F]{24}$/.test(value)) return 0;
  return parseInt(value.substring(0, 8), 16) * 1000;
};

const getSlipTimestamp = (slip) => {
  const primary = new Date(slip.payDate || slip.date || slip.createdAt || 0).getTime();
  return Number.isNaN(primary) ? getObjectIdTimestamp(slip._id) : primary || getObjectIdTimestamp(slip._id);
};

const getMonthLabel = (month) => {
  if (!month) return 'N/A';
  return moment(month, ['YYYY-MM', moment.ISO_8601]).isValid()
    ? moment(month, ['YYYY-MM', moment.ISO_8601]).format('MMM YYYY')
    : month;
};

const SalarySlip = ({ isAdmin }) => {
  const [formData, setFormData] = useState({ employeeId: '', month: moment().format('YYYY-MM'), fixedAmount: '' });
  const [slips, setSlips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [downloadingId, setDownloadingId] = useState('');
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const selectedEmployee = employees.find((employee) => employee._id === formData.employeeId);
  const fixedAmount = Number(formData.fixedAmount || 0);

  const fetchSlips = async () => {
    const url = isAdmin ? '/salary' : '/salary/my-slips';
    const res = await api.get(url);
    const rows = getRows(res.data)
      .sort((a, b) => getSlipTimestamp(b) - getSlipTimestamp(a));
    setSlips(rows);
    setPage(1);
  };

  const fetchEmployees = async () => {
    if (!isAdmin) return;
    const res = await api.get('/employees');
    setEmployees(Array.isArray(res.data) ? res.data : getRows(res.data));
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchSlips(), fetchEmployees()]);
        setError('');
        setSuccess('');
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching salary data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAdmin]);

  const summary = useMemo(() => {
    return slips.reduce((acc, slip) => {
      acc.earnings += Number(slip.totalEarnings || 0);
      acc.deductions += Number(slip.totalDeductions || 0);
      acc.net += Number(slip.netSalary || 0);
      if (String(slip.status || '').toLowerCase() === 'sent') acc.sent += 1;
      return acc;
    }, { earnings: 0, deductions: 0, net: 0, sent: 0 });
  }, [slips]);

  const monthOptions = useMemo(() => {
    return [...new Set(slips.map((slip) => slip.month).filter(Boolean))]
      .sort((a, b) => moment(b, 'YYYY-MM').valueOf() - moment(a, 'YYYY-MM').valueOf());
  }, [slips]);

  const filteredSlips = useMemo(() => {
    const query = search.trim().toLowerCase();
    return slips.filter((slip) => {
      const status = String(slip.status || 'generated').toLowerCase();
      const text = `${slip.employee?.name || ''} ${slip.employee?.employeeId || ''} ${slip.month || ''} ${slip.payrollNumber || ''}`.toLowerCase();
      return (
        (statusFilter === 'all' || status === statusFilter) &&
        (monthFilter === 'all' || slip.month === monthFilter) &&
        (!query || text.includes(query))
      );
    });
  }, [slips, search, statusFilter, monthFilter]);

  const paginatedSlips = filteredSlips.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    setPage(1);
  }, [search, monthFilter, statusFilter, limit]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isAdmin) {
      setError('Only admins can generate salary slips');
      return;
    }
    if (!formData.employeeId || !formData.month || fixedAmount <= 0) {
      setError('Please select employee, month, and a valid salary amount.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/salary', {
        ...formData,
        fixedAmount,
      });
      setFormData({ employeeId: '', month: moment().format('YYYY-MM'), fixedAmount: '' });
      await fetchSlips();
      setSuccess(response.data?.message || 'Salary slip generated successfully');
      setError('');
    } catch (err) {
      setSuccess('');
      setError(err.response?.data?.message || 'Error generating salary slip');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (id, month) => {
    setDownloadingId(id);
    try {
      const res = await api.get(`/salary/download/${id}`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `salary-slip-${month || 'download'}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSuccess('Salary slip downloaded successfully');
      setError('');
    } catch (err) {
      setSuccess('');
      setError(err.response?.data?.message || 'Error downloading salary slip');
    } finally {
      setDownloadingId('');
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'employeeId') {
      const employee = employees.find((item) => item._id === value);
      setFormData({
        ...formData,
        employeeId: value,
        fixedAmount: employee?.salary ? String(employee.salary) : formData.fixedAmount,
      });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const renderSlipStatus = (status) => {
    const meta = getStatusMeta(status);
    return <Badge bg={meta.variant}>{meta.label}</Badge>;
  };

  return (
    <div className="salary-page">
      <style>
        {`
          .salary-page {
            color: #0f172a;
            display: grid;
            gap: 1rem;
          }
          .salary-hero {
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
          .salary-eyebrow {
            margin: 0;
            color: #64748b;
            font-size: 0.78rem;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .salary-title {
            margin: 0.25rem 0;
            color: #0f172a;
            font-size: clamp(1.45rem, 3vw, 2.1rem);
            font-weight: 900;
            line-height: 1.15;
          }
          .salary-subtitle {
            margin: 0;
            color: #64748b;
            font-weight: 600;
          }
          .salary-highlight {
            min-width: 250px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 0.85rem;
            padding: 0.9rem;
            box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
          }
          .salary-highlight strong {
            display: block;
            color: #0f172a;
            font-size: 1.55rem;
            line-height: 1.15;
          }
          .salary-summary-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 0.85rem;
          }
          .salary-summary-card,
          .salary-panel {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 0.85rem;
            box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
          }
          .salary-summary-card {
            padding: 0.95rem;
          }
          .salary-summary-card span {
            display: block;
            color: #64748b;
            font-size: 0.76rem;
            font-weight: 800;
            text-transform: uppercase;
          }
          .salary-summary-card strong {
            display: block;
            margin-top: 0.28rem;
            color: #0f172a;
            font-size: 1.35rem;
            line-height: 1.15;
          }
          .salary-content-grid {
            display: grid;
            grid-template-columns: minmax(330px, 0.78fr) minmax(0, 1.22fr);
            gap: 1rem;
            align-items: start;
          }
          .salary-panel-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            margin-bottom: 1rem;
          }
          .salary-panel {
            padding: 1rem;
          }
          .salary-panel-title {
            margin: 0 0 1rem;
            color: #0f172a;
            font-size: 1.05rem;
            font-weight: 900;
          }
          .salary-panel-head .salary-panel-title {
            margin: 0;
          }
          .salary-controls {
            display: grid;
            grid-template-columns: minmax(180px, 1fr) 160px 150px;
            gap: 0.75rem;
            margin-bottom: 1rem;
          }
          .salary-form .form-label {
            color: #334155;
            font-weight: 800;
            font-size: 0.78rem;
            text-transform: uppercase;
          }
          .salary-form .form-control,
          .salary-form .form-select,
          .salary-controls .form-control,
          .salary-controls .form-select {
            border-radius: 0.65rem;
            border: 1px solid #dbe3ef;
            color: #0f172a;
            font-weight: 600;
            min-height: 42px;
          }
          .salary-form .form-control:focus,
          .salary-form .form-select:focus,
          .salary-controls .form-control:focus,
          .salary-controls .form-select:focus {
            border-color: #93c5fd;
            box-shadow: 0 0 0 0.2rem rgba(37, 99, 235, 0.1);
          }
          .salary-preview {
            display: grid;
            gap: 0.55rem;
            margin: 1rem 0;
            padding: 0.85rem;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 0.8rem;
          }
          .salary-preview-row {
            display: flex;
            justify-content: space-between;
            gap: 1rem;
            color: #64748b;
            font-weight: 700;
          }
          .salary-preview-row strong {
            color: #0f172a;
            text-align: right;
          }
          .salary-action-btn {
            border-radius: 0.65rem;
            font-weight: 800;
            min-height: 42px;
          }
          .salary-table-wrap {
            border: 1px solid #e2e8f0;
            border-radius: 0.8rem;
            overflow: hidden;
          }
          .salary-table-wrap table {
            margin: 0;
          }
          .salary-table-wrap thead th {
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
          .salary-table-wrap td {
            color: #334155;
            vertical-align: middle;
            white-space: nowrap;
            padding: 0.9rem 0.85rem;
          }
          .salary-record-person {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            min-width: 210px;
          }
          .salary-record-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: grid;
            place-items: center;
            flex: 0 0 auto;
            background: #dbeafe;
            color: #1d4ed8;
            font-weight: 900;
          }
          .salary-record-person strong,
          .salary-period strong {
            display: block;
            color: #0f172a;
          }
          .salary-record-person span,
          .salary-period span {
            display: block;
            color: #64748b;
            font-size: 0.82rem;
            font-weight: 600;
          }
          .salary-period {
            min-width: 140px;
          }
          .salary-latest-badge {
            display: inline-flex;
            align-items: center;
            margin-top: 0.35rem;
            padding: 0.18rem 0.45rem;
            border-radius: 999px;
            background: #dcfce7;
            color: #166534;
            font-size: 0.68rem;
            font-weight: 900;
            text-transform: uppercase;
          }
          .salary-amount {
            color: #0f172a;
            font-weight: 900;
          }
          .salary-net {
            color: #047857;
            font-weight: 900;
          }
          .salary-mobile-list {
            display: none;
            gap: 0.75rem;
          }
          .salary-mobile-card {
            border: 1px solid #e2e8f0;
            border-radius: 0.85rem;
            background: #ffffff;
            padding: 0.95rem;
            box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06);
          }
          .salary-mobile-head {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 1rem;
            margin-bottom: 0.75rem;
          }
          .salary-mobile-title {
            color: #0f172a;
            font-weight: 900;
          }
          .salary-mobile-meta {
            color: #64748b;
            font-size: 0.86rem;
            font-weight: 600;
          }
          .salary-breakdown {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.6rem;
            margin: 0.85rem 0;
          }
          .salary-breakdown-item {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 0.65rem;
            padding: 0.65rem;
          }
          .salary-breakdown-item span {
            display: block;
            color: #64748b;
            font-size: 0.72rem;
            font-weight: 800;
            text-transform: uppercase;
          }
          .salary-breakdown-item strong {
            display: block;
            color: #0f172a;
            margin-top: 0.2rem;
          }
          .salary-empty {
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
          @media (max-width: 1150px) {
            .salary-content-grid,
            .salary-hero {
              grid-template-columns: 1fr;
            }
            .salary-highlight {
              min-width: 0;
            }
            .salary-summary-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }
          @media (max-width: 760px) {
            .salary-controls {
              grid-template-columns: 1fr;
            }
            .salary-panel-head {
              align-items: flex-start;
              flex-direction: column;
            }
            .salary-table-wrap {
              display: none;
            }
            .salary-mobile-list {
              display: grid;
            }
          }
          @media (max-width: 560px) {
            .salary-summary-grid,
            .salary-breakdown {
              grid-template-columns: 1fr;
            }
            .salary-panel,
            .salary-hero {
              padding: 0.85rem;
            }
            .salary-action-btn {
              width: 100%;
            }
          }
        `}
      </style>

      <section className="salary-hero">
        <div>
          <p className="salary-eyebrow">{isAdmin ? 'Payroll management' : 'Employee payroll'}</p>
          <h2 className="salary-title">{isAdmin ? 'Salary Slips' : 'My Salary Slips'}</h2>
          <p className="salary-subtitle">
            {isAdmin ? 'Generate and download employee salary slips with clear payroll details.' : 'View and download your official salary slips.'}
          </p>
        </div>
        <div className="salary-highlight">
          <p className="salary-eyebrow">{isAdmin ? 'Total net payroll' : 'Latest net salary'}</p>
          <strong>{money(isAdmin ? summary.net : slips[0]?.netSalary)}</strong>
          <p className="salary-subtitle">{slips.length} salary slip{slips.length === 1 ? '' : 's'} available</p>
        </div>
      </section>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <section className="salary-summary-grid">
        <div className="salary-summary-card"><span>Total Slips</span><strong>{slips.length}</strong></div>
        <div className="salary-summary-card"><span>Sent</span><strong>{summary.sent}</strong></div>
        <div className="salary-summary-card"><span>Total Earnings</span><strong>{money(summary.earnings)}</strong></div>
        <div className="salary-summary-card"><span>Total Deductions</span><strong>{money(summary.deductions)}</strong></div>
      </section>

      <section className={isAdmin ? 'salary-content-grid' : ''}>
        {isAdmin && (
          <div className="salary-panel">
            <h3 className="salary-panel-title">Generate salary slip</h3>
            <Form className="salary-form" onSubmit={handleSubmit}>
              <Row className="g-3">
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label>Employee</Form.Label>
                    <Form.Select name="employeeId" value={formData.employeeId} onChange={handleChange} required>
                      <option value="">Select employee</option>
                      {employees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name} ({emp.employeeId})
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Salary Month</Form.Label>
                    <Form.Control
                      type="month"
                      name="month"
                      value={formData.month}
                      onChange={handleChange}
                      required
                      max={moment().format('YYYY-MM')}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Fixed Amount</Form.Label>
                    <Form.Control
                      type="number"
                      name="fixedAmount"
                      value={formData.fixedAmount}
                      onChange={handleChange}
                      required
                      min="1"
                      step="0.01"
                      placeholder="Enter amount"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <div className="salary-preview">
                <div className="salary-preview-row"><span>Employee</span><strong>{selectedEmployee ? `${selectedEmployee.name} (${selectedEmployee.employeeId})` : 'Not selected'}</strong></div>
                <div className="salary-preview-row"><span>Period</span><strong>{getMonthLabel(formData.month)}</strong></div>
                <div className="salary-preview-row"><span>Gross earnings</span><strong>{money(fixedAmount)}</strong></div>
                <div className="salary-preview-row"><span>Net salary</span><strong>{money(fixedAmount)}</strong></div>
              </div>

              <Button className="salary-action-btn" variant="primary" type="submit" disabled={submitting || loading}>
                {submitting ? 'Generating...' : 'Generate Salary Slip'}
              </Button>
            </Form>
          </div>
        )}

        <div className="salary-panel">
          <div className="salary-panel-head">
            <div>
              <h3 className="salary-panel-title">Salary slip records</h3>
              <p className="salary-subtitle">{filteredSlips.length} matching slips, latest generated first</p>
            </div>
            <Button className="salary-action-btn" variant="outline-primary" size="sm" onClick={async () => {
              setLoading(true);
              try {
                await Promise.all([fetchSlips(), fetchEmployees()]);
                setError('');
              } catch (err) {
                setError(err.response?.data?.message || 'Error refreshing salary slips');
              } finally {
                setLoading(false);
              }
            }} disabled={loading}>
              Refresh
            </Button>
          </div>
          <div className="salary-controls">
            <Form.Control
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee, month, payroll no."
            />
            <Form.Select value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)}>
              <option value="all">All months</option>
              {monthOptions.map((month) => (
                <option key={month} value={month}>{getMonthLabel(month)}</option>
              ))}
            </Form.Select>
            <Form.Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All status</option>
              <option value="generated">Generated</option>
              <option value="sent">Sent</option>
            </Form.Select>
          </div>
          {loading ? (
            <div className="salary-empty">
              <Spinner animation="border" size="sm" className="me-2" /> Loading salary slips...
            </div>
          ) : (
            <>
              <div className="salary-table-wrap table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      {isAdmin && <th>Employee</th>}
                      <th>Period</th>
                      <th>Earnings</th>
                      <th>Deductions</th>
                      <th>Net Salary</th>
                      <th>Generated</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSlips.length > 0 ? (
                      paginatedSlips.map((slip, index) => (
                        <tr key={slip._id}>
                          {isAdmin && (
                            <td>
                              <div className="salary-record-person">
                                <div className="salary-record-avatar">{String(slip.employee?.name || 'E').charAt(0).toUpperCase()}</div>
                                <div>
                                  <strong>{slip.employee?.name || 'N/A'}</strong>
                                  <span>{slip.employee?.employeeId || 'N/A'}{slip.employee?.department ? ` - ${slip.employee.department}` : ''}</span>
                                </div>
                              </div>
                            </td>
                          )}
                          <td>
                            <div className="salary-period">
                              <strong>{getMonthLabel(slip.month)}</strong>
                              <span>{slip.payrollNumber || 'Payroll no. N/A'}</span>
                              {page === 1 && index === 0 && <span className="salary-latest-badge">Latest</span>}
                            </div>
                          </td>
                          <td className="salary-amount">{money(slip.totalEarnings)}</td>
                          <td>{money(slip.totalDeductions)}</td>
                          <td className="salary-net">{money(slip.netSalary)}</td>
                          <td>{slip.payDate ? moment(slip.payDate).format('DD MMM YYYY, hh:mm A') : '-'}</td>
                          <td>{renderSlipStatus(slip.status)}</td>
                          <td>
                            <Button
                              className="salary-action-btn"
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleDownload(slip._id, slip.month)}
                              disabled={!slip.employee || downloadingId === slip._id}
                            >
                              {downloadingId === slip._id ? 'Downloading...' : 'Download PDF'}
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={isAdmin ? 8 : 7} className="text-center text-muted py-4">No salary slips available</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>

              <div className="salary-mobile-list">
                {paginatedSlips.length > 0 ? (
                  paginatedSlips.map((slip, index) => (
                    <article className="salary-mobile-card" key={slip._id}>
                      <div className="salary-mobile-head">
                        <div>
                          <div className="salary-mobile-title">{getMonthLabel(slip.month)}</div>
                          <div className="salary-mobile-meta">
                            {isAdmin ? `${slip.employee?.name || 'N/A'} (${slip.employee?.employeeId || 'N/A'})` : (slip.payDate ? `Paid ${moment(slip.payDate).format('DD MMM YYYY')}` : 'Pay date N/A')}
                          </div>
                          {page === 1 && index === 0 && <span className="salary-latest-badge">Latest</span>}
                        </div>
                        {renderSlipStatus(slip.status)}
                      </div>
                      <div className="salary-breakdown">
                        <div className="salary-breakdown-item"><span>Earnings</span><strong>{money(slip.totalEarnings)}</strong></div>
                        <div className="salary-breakdown-item"><span>Deductions</span><strong>{money(slip.totalDeductions)}</strong></div>
                        <div className="salary-breakdown-item"><span>Net Salary</span><strong>{money(slip.netSalary)}</strong></div>
                        <div className="salary-breakdown-item"><span>Basic Pay</span><strong>{money(slip.basicPay)}</strong></div>
                      </div>
                      <Button
                        className="salary-action-btn"
                        variant="outline-primary"
                        onClick={() => handleDownload(slip._id, slip.month)}
                        disabled={!slip.employee || downloadingId === slip._id}
                      >
                        {downloadingId === slip._id ? 'Downloading...' : 'Download PDF'}
                      </Button>
                    </article>
                  ))
                ) : (
                  <div className="salary-empty">No salary slips available</div>
                )}
              </div>

              {filteredSlips.length > limit && (
                <PaginationControls
                  page={page}
                  limit={limit}
                  total={filteredSlips.length}
                  label="salary slips"
                  onPageChange={setPage}
                  onLimitChange={(nextLimit) => {
                    setLimit(nextLimit);
                    setPage(1);
                  }}
                />
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default SalarySlip;
