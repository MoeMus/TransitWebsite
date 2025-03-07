import axios from 'axios';

// Create an Axios instance
const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/', // Adjust base URL as needed
  withCredentials: true
});

// Set default headers if needed
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