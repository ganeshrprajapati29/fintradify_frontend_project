import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Spinner } from 'react-bootstrap';
import moment from 'moment';
import api from '../utils/axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css';

const getRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.attendances)) return payload.attendances;
  if (Array.isArray(payload?.data?.records)) return payload.data.records;
  return [];
};

const getHoursWorked = (attendance) => {
  if (!attendance?.punchIn || !attendance?.punchOut) return 0;
  const total = new Date(attendance.punchOut) - new Date(attendance.punchIn) - (attendance.totalPausedDuration || 0);
  return Math.max(total / 36e5, 0);
};

const getStatusLabel = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'approved') return 'Approved';
  if (normalized === 'rejected') return 'Rejected';
  if (normalized === 'pending') return 'Pending';
  return 'Recorded';
};

const AttendanceCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [leaveRows, setLeaveRows] = useState([]);
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [settings, setSettings] = useState({ workStartTime: '09:00', workEndTime: '18:00' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const monthStart = useMemo(() => moment(currentDate).startOf('month'), [currentDate]);
  const monthEnd = useMemo(() => moment(currentDate).endOf('month'), [currentDate]);

  useEffect(() => {
    const fetchCalendarData = async () => {
      setLoading(true);
      setError('');
      try {
        const [attendanceRes, leaveRes, publicRes] = await Promise.allSettled([
          api.get('/attendance/my-attendance', {
            params: {
              startDate: monthStart.format('YYYY-MM-DD'),
              endDate: monthEnd.format('YYYY-MM-DD'),
              page: 1,
              limit: 62,
            },
          }),
          api.get('/leaves/my-leaves'),
          api.get('/public/site'),
        ]);

        if (attendanceRes.status === 'fulfilled') {
          setAttendanceRows(getRows(attendanceRes.value.data));
        } else {
          throw attendanceRes.reason;
        }

        if (leaveRes.status === 'fulfilled') {
          setLeaveRows(getRows(leaveRes.value.data));
        }

        if (publicRes.status === 'fulfilled') {
          const siteSettings = publicRes.value.data?.settings || {};
          setSettings({
            workStartTime: siteSettings.workStartTime || '09:00',
            workEndTime: siteSettings.workEndTime || '18:00',
          });
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load attendance calendar');
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarData();
  }, [monthStart, monthEnd]);

  const attendanceByDate = useMemo(() => {
    return attendanceRows.reduce((map, row) => {
      if (!row?.date) return map;
      map[moment(row.date).format('YYYY-MM-DD')] = row;
      return map;
    }, {});
  }, [attendanceRows]);

  const leavesByDate = useMemo(() => {
    const map = {};
    leaveRows.forEach((leave) => {
      if (!leave?.startDate || !leave?.endDate) return;
      const cursor = moment(leave.startDate).startOf('day');
      const end = moment(leave.endDate).startOf('day');
      while (cursor.isSameOrBefore(end)) {
        map[cursor.format('YYYY-MM-DD')] = leave;
        cursor.add(1, 'day');
      }
    });
    return map;
  }, [leaveRows]);

  const calendarDays = useMemo(() => {
    const days = [];
    const firstWeekday = monthStart.day();
    for (let index = 0; index < firstWeekday; index += 1) {
      days.push({ key: `blank-${index}`, empty: true });
    }

    for (let day = 1; day <= monthEnd.date(); day += 1) {
      const date = monthStart.clone().date(day);
      const key = date.format('YYYY-MM-DD');
      const attendance = attendanceByDate[key];
      const leave = leavesByDate[key];
      const isSunday = date.day() === 0;
      const isSaturday = date.day() === 6;
      const isToday = key === moment().format('YYYY-MM-DD');

      let type = 'working';
      if (isSunday) type = 'off';
      if (isSaturday) type = 'half';
      if (leave) type = `leave-${String(leave.status || 'pending').toLowerCase()}`;
      if (attendance) type = String(attendance.status || 'pending').toLowerCase();

      days.push({
        key,
        date,
        day,
        attendance,
        leave,
        type,
        isToday,
        isWeekend: isSunday || isSaturday,
      });
    }

    return days;
  }, [attendanceByDate, leavesByDate, monthStart, monthEnd]);

  const stats = useMemo(() => {
    const monthLeaves = Object.values(leavesByDate).filter(Boolean);
    return {
      present: attendanceRows.length,
      approved: attendanceRows.filter((row) => String(row.status).toLowerCase() === 'approved').length,
      pending: attendanceRows.filter((row) => String(row.status).toLowerCase() === 'pending').length,
      rejected: attendanceRows.filter((row) => String(row.status).toLowerCase() === 'rejected').length,
      hours: attendanceRows.reduce((sum, row) => sum + getHoursWorked(row), 0),
      leaveDays: monthLeaves.length,
    };
  }, [attendanceRows, leavesByDate]);

  const selectedAttendance = attendanceByDate[selectedDate];
  const selectedLeave = leavesByDate[selectedDate];

  const changeMonth = (amount) => {
    const nextDate = moment(currentDate).add(amount, 'month').toDate();
    setCurrentDate(nextDate);
    setSelectedDate(moment(nextDate).startOf('month').format('YYYY-MM-DD'));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(moment(today).format('YYYY-MM-DD'));
  };

  return (
    <div className="attendance-calendar-page animate__animated animate__fadeIn">
      <style>
        {`
          .attendance-calendar-page {
            font-family: 'Poppins', sans-serif;
            color: #0f172a;
          }
          .calendar-shell {
            display: grid;
            gap: 1rem;
          }
          .calendar-hero {
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
          .calendar-eyebrow {
            margin: 0;
            color: #64748b;
            font-size: 0.78rem;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .calendar-title {
            margin: 0.2rem 0;
            color: #0f172a;
            font-size: clamp(1.45rem, 3vw, 2.15rem);
            font-weight: 800;
            line-height: 1.15;
          }
          .calendar-subtitle {
            margin: 0;
            color: #64748b;
            font-weight: 600;
          }
          .calendar-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            justify-content: flex-end;
          }
          .calendar-action-btn {
            border: 1px solid #bfdbfe;
            background: #ffffff;
            color: #1d4ed8;
            border-radius: 0.65rem;
            padding: 0.62rem 0.85rem;
            font-weight: 800;
            box-shadow: 0 8px 18px rgba(30, 64, 175, 0.08);
          }
          .calendar-action-btn:hover {
            background: #eff6ff;
            color: #1d4ed8;
            border-color: #93c5fd;
          }
          .calendar-stats {
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 0.8rem;
          }
          .calendar-stat-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 0.8rem;
            padding: 0.9rem;
            box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
          }
          .calendar-stat-card span {
            display: block;
            color: #64748b;
            font-size: 0.76rem;
            font-weight: 800;
            text-transform: uppercase;
          }
          .calendar-stat-card strong {
            display: block;
            margin-top: 0.25rem;
            color: #0f172a;
            font-size: 1.55rem;
            line-height: 1.1;
          }
          .calendar-layout {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 330px;
            gap: 1rem;
            align-items: start;
          }
          .calendar-panel,
          .day-detail-panel {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 0.9rem;
            box-shadow: 0 14px 34px rgba(15, 23, 42, 0.07);
            padding: 1rem;
          }
          .calendar-weekdays,
          .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, minmax(0, 1fr));
            gap: 0.55rem;
          }
          .calendar-weekday {
            color: #64748b;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 0.6rem;
            padding: 0.55rem 0.4rem;
            text-align: center;
            font-size: 0.8rem;
            font-weight: 800;
          }
          .calendar-grid {
            margin-top: 0.65rem;
          }
          .calendar-day {
            min-height: 108px;
            border: 1px solid #e2e8f0;
            border-radius: 0.75rem;
            background: #ffffff;
            padding: 0.65rem;
            text-align: left;
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
            color: #0f172a;
            transition: all 0.2s ease;
          }
          .calendar-day:hover,
          .calendar-day.selected {
            transform: translateY(-2px);
            border-color: #93c5fd;
            box-shadow: 0 12px 22px rgba(37, 99, 235, 0.11);
          }
          .calendar-day.empty {
            background: #f8fafc;
            border-style: dashed;
            pointer-events: none;
          }
          .calendar-day-number {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.4rem;
            font-weight: 800;
          }
          .today-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #2563eb;
          }
          .calendar-day-label {
            display: inline-flex;
            width: max-content;
            max-width: 100%;
            border-radius: 999px;
            padding: 0.25rem 0.48rem;
            color: #475569;
            background: #f1f5f9;
            font-size: 0.68rem;
            font-weight: 800;
            text-transform: uppercase;
          }
          .calendar-day.approved .calendar-day-label { color: #047857; background: #d1fae5; }
          .calendar-day.pending .calendar-day-label { color: #92400e; background: #fef3c7; }
          .calendar-day.rejected .calendar-day-label { color: #b91c1c; background: #fee2e2; }
          .calendar-day.half .calendar-day-label { color: #9a3412; background: #ffedd5; }
          .calendar-day.off .calendar-day-label { color: #64748b; background: #e2e8f0; }
          .calendar-day.leave-approved .calendar-day-label,
          .calendar-day.leave-pending .calendar-day-label { color: #6d28d9; background: #ede9fe; }
          .calendar-day-meta {
            color: #64748b;
            font-size: 0.78rem;
            font-weight: 700;
            line-height: 1.35;
          }
          .legend-row {
            display: flex;
            flex-wrap: wrap;
            gap: 0.55rem;
            margin-top: 1rem;
          }
          .legend-chip {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            border: 1px solid #e2e8f0;
            border-radius: 999px;
            padding: 0.4rem 0.65rem;
            color: #475569;
            background: #ffffff;
            font-size: 0.8rem;
            font-weight: 800;
          }
          .legend-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
          }
          .day-detail-title {
            margin: 0;
            font-size: 1.1rem;
            font-weight: 800;
          }
          .detail-list {
            display: grid;
            gap: 0.65rem;
            margin-top: 1rem;
          }
          .detail-item {
            display: flex;
            justify-content: space-between;
            gap: 1rem;
            padding: 0.75rem;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 0.7rem;
            color: #475569;
            font-weight: 700;
          }
          .detail-item strong {
            color: #0f172a;
            text-align: right;
          }
          .calendar-loading {
            min-height: 360px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #1d4ed8;
          }
          @media (max-width: 1100px) {
            .calendar-layout {
              grid-template-columns: 1fr;
            }
            .calendar-stats {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }
          }
          @media (max-width: 768px) {
            .calendar-hero {
              grid-template-columns: 1fr;
            }
            .calendar-actions {
              justify-content: flex-start;
            }
            .calendar-stats {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .calendar-weekdays,
            .calendar-grid {
              gap: 0.35rem;
            }
            .calendar-day {
              min-height: 92px;
              padding: 0.5rem;
            }
            .calendar-day-meta {
              display: none;
            }
          }
          @media (max-width: 560px) {
            .calendar-stats {
              grid-template-columns: 1fr;
            }
            .calendar-panel,
            .day-detail-panel,
            .calendar-hero {
              padding: 0.85rem;
            }
            .calendar-weekday {
              font-size: 0.68rem;
              padding: 0.45rem 0.2rem;
            }
            .calendar-day {
              min-height: 68px;
              border-radius: 0.55rem;
              padding: 0.4rem;
            }
            .calendar-day-label {
              font-size: 0.58rem;
              padding: 0.2rem 0.35rem;
            }
          }
        `}
      </style>

      <div className="calendar-shell">
        <section className="calendar-hero">
          <div>
            <p className="calendar-eyebrow">Attendance calendar</p>
            <h2 className="calendar-title">{monthStart.format('MMMM YYYY')}</h2>
            <p className="calendar-subtitle">
              Office timing {settings.workStartTime} - {settings.workEndTime}. Attendance, leave, and approval status are loaded from live records.
            </p>
          </div>
          <div className="calendar-actions">
            <Button className="calendar-action-btn" onClick={() => changeMonth(-1)}>Previous</Button>
            <Button className="calendar-action-btn" onClick={goToToday}>Today</Button>
            <Button className="calendar-action-btn" onClick={() => changeMonth(1)}>Next</Button>
          </div>
        </section>

        {error && <Alert variant="danger">{error}</Alert>}

        <section className="calendar-stats">
          <div className="calendar-stat-card"><span>Records</span><strong>{stats.present}</strong></div>
          <div className="calendar-stat-card"><span>Approved</span><strong>{stats.approved}</strong></div>
          <div className="calendar-stat-card"><span>Pending</span><strong>{stats.pending}</strong></div>
          <div className="calendar-stat-card"><span>Rejected</span><strong>{stats.rejected}</strong></div>
          <div className="calendar-stat-card"><span>Total Hours</span><strong>{stats.hours.toFixed(1)}</strong></div>
        </section>

        <section className="calendar-layout">
          <div className="calendar-panel">
            {loading ? (
              <div className="calendar-loading">
                <Spinner animation="border" size="sm" className="me-2" />
                Loading calendar records...
              </div>
            ) : (
              <>
                <div className="calendar-weekdays">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div className="calendar-weekday" key={day}>{day}</div>
                  ))}
                </div>
                <div className="calendar-grid">
                  {calendarDays.map((item) => {
                    if (item.empty) return <div className="calendar-day empty" key={item.key} />;

                    const hours = getHoursWorked(item.attendance);
                    const label = item.attendance
                      ? getStatusLabel(item.attendance.status)
                      : item.leave
                        ? `Leave ${getStatusLabel(item.leave.status)}`
                        : item.type === 'off'
                          ? 'Off'
                          : item.type === 'half'
                            ? 'Half day'
                            : 'Working';

                    return (
                      <button
                        type="button"
                        key={item.key}
                        className={`calendar-day ${item.type} ${selectedDate === item.key ? 'selected' : ''}`}
                        onClick={() => setSelectedDate(item.key)}
                      >
                        <div className="calendar-day-number">
                          <span>{item.day}</span>
                          {item.isToday && <span className="today-dot" />}
                        </div>
                        <span className="calendar-day-label">{label}</span>
                        <span className="calendar-day-meta">
                          {item.attendance ? `${hours.toFixed(1)} hrs` : item.leave ? 'Leave request' : item.isWeekend ? 'Scheduled off' : 'No punch'}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="legend-row">
                  <span className="legend-chip"><span className="legend-dot" style={{ background: '#16a34a' }} /> Approved</span>
                  <span className="legend-chip"><span className="legend-dot" style={{ background: '#f59e0b' }} /> Pending</span>
                  <span className="legend-chip"><span className="legend-dot" style={{ background: '#ef4444' }} /> Rejected</span>
                  <span className="legend-chip"><span className="legend-dot" style={{ background: '#8b5cf6' }} /> Leave</span>
                  <span className="legend-chip"><span className="legend-dot" style={{ background: '#94a3b8' }} /> Weekend</span>
                </div>
              </>
            )}
          </div>

          <aside className="day-detail-panel">
            <p className="calendar-eyebrow">Selected date</p>
            <h3 className="day-detail-title">{moment(selectedDate).format('dddd, DD MMM YYYY')}</h3>
            <div className="detail-list">
              <div className="detail-item">
                <span>Status</span>
                <strong>{selectedAttendance ? getStatusLabel(selectedAttendance.status) : selectedLeave ? `Leave ${getStatusLabel(selectedLeave.status)}` : 'No attendance'}</strong>
              </div>
              <div className="detail-item">
                <span>Punch in</span>
                <strong>{selectedAttendance?.punchIn ? moment(selectedAttendance.punchIn).format('hh:mm A') : '-'}</strong>
              </div>
              <div className="detail-item">
                <span>Punch out</span>
                <strong>{selectedAttendance?.punchOut ? moment(selectedAttendance.punchOut).format('hh:mm A') : '-'}</strong>
              </div>
              <div className="detail-item">
                <span>Worked hours</span>
                <strong>{selectedAttendance ? `${getHoursWorked(selectedAttendance).toFixed(2)} hrs` : '-'}</strong>
              </div>
              <div className="detail-item">
                <span>Leave reason</span>
                <strong>{selectedLeave?.reason || '-'}</strong>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
