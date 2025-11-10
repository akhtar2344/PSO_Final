import axios from 'axios';

// Setup axios instance dengan base URL ke backend
const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  withCredentials: true, // Penting! Untuk kirim session cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// AUTH API
// ============================================

// Login user
export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Login failed';
  }
};

// Logout user
export const logout = async () => {
  try {
    const response = await api.post('/auth/logout');
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Logout failed';
  }
};

// Check session (cek apakah user masih login)
export const checkAuth = async () => {
  try {
    const response = await api.get('/auth/check');
    return response.data;
  } catch (error) {
    return null;
  }
};

// ============================================
// MATERIAL API
// ============================================

// Get all materials dengan filter dan pagination
export const getMaterials = async (params = {}) => {
  try {
    const response = await api.get('/materials', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch materials';
  }
};

// Get single material by ID
export const getMaterial = async (id) => {
  try {
    const response = await api.get(`/materials/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch material';
  }
};

// Create new material
export const createMaterial = async (data) => {
  try {
    const response = await api.post('/materials', data);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to create material';
  }
};

// Update material
export const updateMaterial = async (id, data) => {
  try {
    const response = await api.put(`/materials/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to update material';
  }
};

// Delete material
export const deleteMaterial = async (id) => {
  try {
    const response = await api.delete(`/materials/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to delete material';
  }
};

// Toggle material status (active/inactive)
export const toggleMaterialStatus = async (id) => {
  try {
    const response = await api.patch(`/materials/${id}/toggle-status`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to toggle status';
  }
};

// Upload images untuk material
export const uploadMaterialImages = async (id, formData) => {
  try {
    const response = await api.post(`/materials/${id}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to upload images';
  }
};

// Delete image dari material
export const deleteMaterialImage = async (materialId, imageId) => {
  try {
    const response = await api.delete(`/materials/${materialId}/images/${imageId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to delete image';
  }
};

// ============================================
// DROPDOWN API
// ============================================

// Get dropdowns by type (division atau placement)
export const getDropdowns = async (type) => {
  try {
    const response = await api.get(`/dropdowns/${type}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch dropdowns';
  }
};

// Create new dropdown option
export const createDropdown = async (data) => {
  try {
    const response = await api.post('/dropdowns', data);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to create dropdown';
  }
};

// Update dropdown option
export const updateDropdown = async (id, data) => {
  try {
    const response = await api.put(`/dropdowns/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to update dropdown';
  }
};

// Delete dropdown option
export const deleteDropdown = async (id) => {
  try {
    const response = await api.delete(`/dropdowns/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to delete dropdown';
  }
};

// ============================================
// DASHBOARD API
// ============================================

// Get dashboard statistics
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/dashboard/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch stats';
  }
};

export default api;
