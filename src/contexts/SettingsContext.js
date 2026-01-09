import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    companyName: 'FinTradify',
    theme: 'light',
    language: 'en',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    workStartTime: '09:00',
    workEndTime: '18:00',
    breakStartTime: '13:00',
    breakEndTime: '14:00',
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    allowLateCheckIn: true,
    lateCheckInGracePeriod: 15,
    allowEarlyCheckOut: true,
    earlyCheckOutGracePeriod: 15,
    annualLeaveDays: 12,
    sickLeaveDays: 6,
    casualLeaveDays: 6,
    maternityLeaveDays: 84,
    paternityLeaveDays: 5,
    allowLeaveCarryForward: true,
    maxCarryForwardDays: 5,
    emailNotifications: true,
    pushNotifications: true,
    notifyOnLeaveRequest: true,
    notifyOnAttendance: false,
    notifyOnSalarySlip: true,
    autoApproveLeaves: false,
    requireReasonForRejection: true,
    allowBulkActions: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSettings(prev => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const applyTheme = (theme) => {
    document.body.className = theme === 'dark' ? 'dark-theme' : '';
  };

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};
