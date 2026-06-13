import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../utils/axios';

const PublicDataContext = createContext(null);

const fallbackData = {
  brand: {
    name: 'Fintradify HR Portal',
    shortName: 'Fintradify',
    tagline: 'Modern workforce operations for attendance, leave, payroll documents, tasks, and employee self-service.',
    phone: '+91 78360 09907',
    email: 'support@fintradify.com',
    legalEmail: 'legal@fintradify.com',
    address: 'C6, C Block, Sector 7, Noida, Uttar Pradesh 201301',
    appUrl: 'https://play.google.com/store/apps/details?id=com.fintradify.hrportal',
  },
  settings: {
    theme: 'light',
    currency: 'INR',
    workStartTime: '09:00',
    workEndTime: '18:00',
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  },
  metrics: {
    employees: 0,
    admins: 0,
    attendanceToday: 0,
    leaveRequests: 0,
    tasks: 0,
    uptime: '99.9%',
  },
  features: [],
  pricingPlans: [],
  topPerformers: [],
  performance: {
    month: '',
    monthLabel: '',
    availableMonths: [],
    employees: [],
    topEmployees: [],
  },
  pages: {},
};

export const PublicDataProvider = ({ children }) => {
  const [siteData, setSiteData] = useState(fallbackData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    api.get('/public/site')
      .then((response) => {
        if (!mounted) return;
        const payload = response.data?.data || response.data || {};
        setSiteData({
          ...fallbackData,
          ...payload,
          brand: { ...fallbackData.brand, ...(payload.brand || {}) },
          settings: { ...fallbackData.settings, ...(payload.settings || {}) },
          metrics: { ...fallbackData.metrics, ...(payload.metrics || {}) },
          pages: { ...fallbackData.pages, ...(payload.pages || {}) },
        });
        setError('');
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.response?.data?.message || 'Public site data is temporarily unavailable.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(() => ({
    siteData,
    loading,
    error,
  }), [siteData, loading, error]);

  return (
    <PublicDataContext.Provider value={value}>
      {children}
    </PublicDataContext.Provider>
  );
};

export const usePublicData = () => {
  const context = useContext(PublicDataContext);
  if (!context) {
    throw new Error('usePublicData must be used inside PublicDataProvider');
  }
  return context;
};
