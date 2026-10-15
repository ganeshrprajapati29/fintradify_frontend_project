import { io } from 'socket.io-client';

/**
 * One Socket.IO connection per browser tab (path /api/socket.io on the API host).
 * role 'staff'    -> admin panel: receives live location, status, activity, presence, device events.
 * role 'employee' -> employee website: shows the employee as online and streams their location.
 */
const API = process.env.REACT_APP_API_URL || 'https://hrcrm.aerowheels.co.in/api';
const ORIGIN = (() => {
  try { return new URL(API).origin; } catch (e) { return window.location.origin; }
})();

let socket = null;
let socketKey = '';

export const getSocket = (role = 'staff') => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  const key = `${role}:${token}`;
  if (socket && socketKey === key) return socket;
  if (socket) socket.disconnect();
  socket = io(ORIGIN, {
    path: '/api/socket.io',
    transports: ['websocket', 'polling'],
    auth: { token, client: 'web', role: role === 'employee' ? 'employee' : 'staff' },
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 15000,
  });
  socketKey = key;
  return socket;
};

export const closeSocket = () => {
  if (socket) socket.disconnect();
  socket = null;
  socketKey = '';
};

/** Basic details of this browser for HR (shown as the employee's website device). */
export const browserDetails = () => {
  const ua = navigator.userAgent || '';
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
  const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Unknown';
  return {
    browser,
    os,
    platform: navigator.platform || '',
    userAgent: ua,
    screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
    locale: navigator.language || '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    network: navigator.connection?.effectiveType || '',
  };
};
