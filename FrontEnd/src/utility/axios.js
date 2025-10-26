import axios from "axios";

// Prefer explicit API base URL from env; fallback to localhost:5000
const apiBaseUrl =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

// Create axios instance with default config
export const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true, // This is important for sending cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Add a request interceptor to include JWT token in all requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("Evangadi_Forum");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Ensure credentials are sent with every request
    config.withCredentials = true;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle different HTTP status codes
      const { status } = error.response;
      
      if (status === 401) {
        // Handle unauthorized access
        localStorage.removeItem("Evangadi_Forum");
        window.location.href = '/login';
      } else if (status === 403) {
        // Handle forbidden access
        console.error('Forbidden: You do not have permission to access this resource');
      } else if (status >= 500) {
        // Handle server errors
        console.error('Server error:', error.response.data);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);
