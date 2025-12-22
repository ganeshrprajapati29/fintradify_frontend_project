import React, { useState, useEffect } from 'react';
import { Card, Button, Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css';

const AttendanceCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const getDayType = (day, month, year) => {
    if (!day) return null;
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    if (dayOfWeek === 0) return 'off'; // Sunday off
    if (dayOfWeek === 6) return 'half'; // Saturday half day
    return 'full'; // Monday to Friday full day
  };

  const getDayColor = (type) => {
    switch (type) {
      case 'full':
        return '#10b981'; // Green for full day
      case 'half':
        return '#f59e0b'; // Amber for half day
      case 'off':
        return '#ef4444'; // Red for off day
      default:
        return '#e5e7eb'; // Gray for empty
    }
  };

  const getDayText = (type) => {
    switch (type) {
      case 'full':
        return 'Full Day (9 AM - 6 PM)';
      case 'half':
        return 'Half Day (10 AM - 3:30 PM)';
      case 'off':
        return 'Off Day';
      default:
        return '';
    }
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className="attendance-calendar-container">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

          .attendance-calendar-container {
            font-family: 'Poppins', sans-serif;
            color: #1e40af;
            background: #ffffff;
            padding: 1.5rem;
            border-radius: 1rem;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            margin: 1rem;
          }
          .calendar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
          }
          .calendar-title {
            font-size: 2.5rem;
            font-weight: 700;
            color: #1e40af;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            text-align: center;
            flex-grow: 1;
          }
          .nav-button {
            background: linear-gradient(90deg, #f0f9ff, #bfdbfe);
            border: 2px solid #3b82f6;
            color: #1e40af;
            border-radius: 0.6rem;
            padding: 0.8rem 1.5rem;
            font-weight: 600;
            font-size: 1.1rem;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          .nav-button::before {
            content: '';
            position: absolute;
            left: -100%;
            top: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.4), transparent);
            transition: left 0.4s ease;
          }
          .nav-button:hover::before {
            left: 100%;
          }
          .nav-button:hover {
            background: linear-gradient(90deg, #1e40af, #3b82f6) !important;
            border-color: #3b82f6 !important;
            color: #fff !important;
            transform: scale(1.05);
            box-shadow: 0 6px 16px rgba(59, 130, 246, 0.5);
          }
          .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 0.5rem;
            margin-bottom: 2rem;
          }
          .day-name {
            font-weight: 600;
            color: #1e40af;
            text-align: center;
            padding: 1rem;
            background: linear-gradient(90deg, #f0f9ff, #bfdbfe);
            border-radius: 0.6rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .day-cell {
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 0.8rem;
            font-weight: 600;
            font-size: 1.2rem;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .day-cell:hover {
            transform: scale(1.1);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
          }
          .day-cell::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
            border-radius: inherit;
          }
          .day-cell.full {
            background: linear-gradient(135deg, #10b981, #059669);
            color: #fff;
          }
          .day-cell.half {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: #fff;
          }
          .day-cell.off {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: #fff;
          }
          .day-cell.empty {
            background: #e5e7eb;
            color: #9ca3af;
          }
          .legend {
            display: flex;
            justify-content: center;
            gap: 2rem;
            flex-wrap: wrap;
          }
          .legend-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 500;
            color: #1e40af;
          }
          .legend-color {
            width: 20px;
            height: 20px;
            border-radius: 0.4rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          }
          .office-hours {
            text-align: center;
            margin-top: 2rem;
            padding: 1.5rem;
            background: linear-gradient(135deg, #f0f9ff, #bfdbfe);
            border-radius: 1rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .office-hours h4 {
            color: #1e40af;
            font-weight: 600;
            margin-bottom: 1rem;
          }
          .office-hours p {
            color: #374151;
            font-size: 1.1rem;
            margin: 0.5rem 0;
          }
          @media (max-width: 768px) {
            .calendar-header {
              flex-direction: column;
              gap: 1rem;
            }
            .calendar-title {
              font-size: 2rem;
            }
            .calendar-grid {
              gap: 0.3rem;
            }
            .day-cell {
              font-size: 1rem;
            }
            .legend {
              gap: 1rem;
            }
          }
          @media (max-width: 576px) {
            .attendance-calendar-container {
              padding: 1rem;
              margin: 0.5rem;
            }
            .calendar-title {
              font-size: 1.8rem;
            }
            .day-name {
              padding: 0.8rem;
              font-size: 0.9rem;
            }
            .day-cell {
              font-size: 0.9rem;
            }
            .nav-button {
              padding: 0.6rem 1rem;
              font-size: 0.95rem;
            }
            .office-hours {
              padding: 1rem;
            }
            .office-hours p {
              font-size: 1rem;
            }
          }
        `}
      </style>
      <div className="attendance-calendar-container animate__animated animate__fadeIn">
        <div className="calendar-header">
          <Button className="nav-button animate__animated animate__fadeInLeft" onClick={prevMonth}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </Button>
          <h2 className="calendar-title animate__animated animate__zoomIn">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <Button className="nav-button animate__animated animate__fadeInRight" onClick={nextMonth}>
            Next
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>

        <div className="calendar-grid">
          {dayNames.map((day, index) => (
            <div key={index} className="day-name animate__animated animate__fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
              {day}
            </div>
          ))}
          {days.map((day, index) => {
            const dayType = getDayType(day, currentDate.getMonth(), currentDate.getFullYear());
            return (
              <div
                key={index}
                className={`day-cell ${dayType || 'empty'} animate__animated animate__fadeIn`}
                style={{
                  animationDelay: `${(index + 7) * 0.05}s`,
                  background: day ? getDayColor(dayType) : undefined
                }}
                title={day ? getDayText(dayType) : ''}
              >
                {day}
              </div>
            );
          })}
        </div>

        <div className="legend animate__animated animate__fadeInUp">
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#10b981' }}></div>
            <span>Monday - Friday: Full Day (9 AM - 6 PM)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#f59e0b' }}></div>
            <span>Saturday: Half Day (10 AM - 3:30 PM)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#ef4444' }}></div>
            <span>Sunday: Off Day</span>
          </div>
        </div>

        <div className="office-hours animate__animated animate__fadeInUp" style={{ animationDelay: '0.5s' }}>
          <h4>Office Hours</h4>
          <p><strong>Monday to Friday:</strong> 9:00 AM - 6:00 PM</p>
          <p><strong>Saturday:</strong> 10:00 AM - 3:30 PM</p>
          <p><strong>Sunday:</strong> Closed</p>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
