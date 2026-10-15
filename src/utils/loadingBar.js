import axios from 'axios';
import api from './axios';

/**
 * Counts API requests in flight (both the shared `api` instance and plain axios)
 * so the admin panel can show one loading bar for everything.
 */
let active = 0;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn(active));

const track = (instance) => {
  instance.interceptors.request.use((config) => {
    // Background refreshes can opt out: { headers: { 'x-silent': '1' } } is not sent to the server.
    if (config.headers?.['x-silent']) {
      delete config.headers['x-silent'];
      return config;
    }
    config.__tracked = true;
    active += 1;
    notify();
    return config;
  });
  const done = (value, failed) => {
    const config = failed ? value?.config : value?.config;
    if (config?.__tracked) {
      config.__tracked = false;
      active = Math.max(0, active - 1);
      notify();
    }
    return failed ? Promise.reject(value) : value;
  };
  instance.interceptors.response.use((response) => done(response, false), (error) => done(error, true));
};

let installed = false;
export const installLoadingBar = () => {
  if (installed) return;
  installed = true;
  track(axios);
  track(api);
};

export const subscribeLoading = (fn) => {
  listeners.add(fn);
  fn(active);
  return () => listeners.delete(fn);
};
