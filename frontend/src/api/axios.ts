import axios from 'axios';

// Base axios instance. Vite proxy will forward /api to the backend.
const axiosInstance = axios.create({
  baseURL: '/api',
  withCredentials: true, // send HttpOnly refresh cookie
});

export default axiosInstance;
