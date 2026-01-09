import axios from 'axios';

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://crm.fintradify.com/api', // Fallback for development
  timeout: 10000,
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    console.log('Axios request:', config.method.toUpperCase(), config.url, {
      headers: { 'Authorization': token ? `Bearer ${token}` : 'none' },
      data: config.data,
    });
    return config;
  },
  (error) => {
    console.error('Axios request error:', error.message);
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;
    const message = data?.msg || error.message || 'Unknown error';
    console.error('Axios response error:', {
      status,
      message,
      data: JSON.stringify(data),
      url: error.config?.url,
    });
    return Promise.reject(error);
  }
);

export default instance;
