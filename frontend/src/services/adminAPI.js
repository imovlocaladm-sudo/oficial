import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

// Create axios instance with auth header
const adminAPI = axios.create({
  baseURL: `${API_URL}/admin`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
adminAPI.interceptors.request.use(
  (config) => {
    const user = localStorage.getItem('imovlocal_user');
    if (user) {
      const userData = JSON.parse(user);
      if (userData.access_token) {
        config.headers.Authorization = `Bearer ${userData.access_token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Admin API
export const adminAPIService = {
  // Dashboard
  getDashboard: async () => {
    const response = await adminAPI.get('/dashboard');
    return response.data;
  },

  // User Management
  getAllUsers: async (status = null, userType = null) => {
    const params = {};
    if (status) params.status = status;
    if (userType) params.user_type = userType;
    
    const response = await adminAPI.get('/users', { params });
    return response.data;
  },

  createUser: async (userData) => {
    const response = await adminAPI.post('/users', userData);
    return response.data;
  },

  updateUserStatus: async (userId, status) => {
    const response = await adminAPI.put(`/users/${userId}`, { status });
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await adminAPI.delete(`/users/${userId}`);
    return response.data;
  },

  getUserDetails: async (userId) => {
    const response = await adminAPI.get(`/users/${userId}/details`);
    return response.data;
  },

  fullEditUser: async (userId, userData) => {
    const response = await adminAPI.put(`/users/${userId}/full-edit`, userData);
    return response.data;
  },

  // Property Management
  getAllProperties: async () => {
    const response = await adminAPI.get('/properties');
    return response.data;
  },

  deleteProperty: async (propertyId) => {
    const response = await adminAPI.delete(`/properties/${propertyId}`);
    return response.data;
  },

  // Opportunities Board
  getOpportunitiesBoard: async () => {
    const response = await adminAPI.get('/opportunities-board');
    return response.data;
  },
};

export default adminAPIService;
