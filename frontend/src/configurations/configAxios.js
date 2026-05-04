import axios from 'axios';

// Create an Axios instance
const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api', // Change to /api for NGINX
});

apiClient.defaults.headers.common['Content-Type'] = 'application/json';

// Request interceptor to include token
apiClient.interceptors.request.use(config => {
  const token = sessionStorage.getItem('access_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Response interceptor to handle token refresh or errors
apiClient.interceptors.response.use(response => {
  return response;
}, error => {
  if (error.response.status === 401) {
    // Handle unauthorized error, possibly refresh token
  }
  return Promise.reject(error);
});

export default apiClient;