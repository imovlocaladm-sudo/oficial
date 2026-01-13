import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
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

// Auth API
export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Atualizar perfil do usuário
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  // Upload de foto de perfil
  uploadProfilePhoto: async (photoFile) => {
    const formData = new FormData();
    formData.append('photo', photoFile);
    
    const response = await api.post('/auth/profile/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Remover foto de perfil
  deleteProfilePhoto: async () => {
    const response = await api.delete('/auth/profile/photo');
    return response.data;
  },

  // Trocar senha
  changePassword: async (passwordData) => {
    const response = await api.post('/auth/change-password', passwordData);
    return response.data;
  },
};

// Properties API
export const propertiesAPI = {
  list: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.purpose) params.append('purpose', filters.purpose);
    if (filters.property_type) params.append('property_type', filters.property_type);
    if (filters.city) params.append('city', filters.city);
    if (filters.state) params.append('state', filters.state);
    if (filters.neighborhood) params.append('neighborhood', filters.neighborhood);
    if (filters.min_price) params.append('min_price', filters.min_price);
    if (filters.max_price) params.append('max_price', filters.max_price);
    if (filters.is_launch !== undefined) params.append('is_launch', filters.is_launch);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.skip) params.append('skip', filters.skip);
    
    const response = await api.get(`/properties/?${params.toString()}`);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/properties/${id}`);
    return response.data;
  },

  getCities: async (state = null) => {
    const params = state ? `?state=${state}` : '';
    const response = await api.get(`/properties/locations/cities${params}`);
    return response.data;
  },

  getNeighborhoods: async (city = null, state = null) => {
    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (state) params.append('state', state);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/properties/locations/neighborhoods${queryString}`);
    return response.data;
  },
  
  create: async (propertyData) => {
    const response = await api.post('/properties/', propertyData);
    return response.data;
  },

  createWithImages: async (propertyData, imageFiles) => {
    const formData = new FormData();
    
    // Add all property fields
    formData.append('title', propertyData.title);
    formData.append('description', propertyData.description);
    formData.append('property_type', propertyData.property_type);
    formData.append('purpose', propertyData.purpose);
    formData.append('price', propertyData.price);
    formData.append('neighborhood', propertyData.neighborhood);
    formData.append('city', propertyData.city);
    formData.append('state', propertyData.state);
    
    if (propertyData.bedrooms) formData.append('bedrooms', propertyData.bedrooms);
    if (propertyData.bathrooms) formData.append('bathrooms', propertyData.bathrooms);
    if (propertyData.area) formData.append('area', propertyData.area);
    if (propertyData.garage) formData.append('garage', propertyData.garage);
    if (propertyData.year_built) formData.append('year_built', propertyData.year_built);
    if (propertyData.condominio) formData.append('condominio', propertyData.condominio);
    if (propertyData.iptu) formData.append('iptu', propertyData.iptu);
    if (propertyData.features) formData.append('features', propertyData.features);
    formData.append('is_launch', propertyData.is_launch || false);
    
    // Add image files
    if (imageFiles && imageFiles.length > 0) {
      imageFiles.forEach(file => {
        formData.append('images', file);
      });
    }
    
    const response = await api.post('/properties/with-images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  update: async (id, propertyData) => {
    const response = await api.put(`/properties/${id}`, propertyData);
    return response.data;
  },

  updateWithImages: async (id, propertyData, existingImages, newImageFiles) => {
    const formData = new FormData();
    
    // Add all property fields
    formData.append('title', propertyData.title);
    formData.append('description', propertyData.description);
    formData.append('property_type', propertyData.property_type);
    formData.append('purpose', propertyData.purpose);
    formData.append('price', propertyData.price);
    formData.append('neighborhood', propertyData.neighborhood);
    formData.append('city', propertyData.city);
    formData.append('state', propertyData.state);
    
    if (propertyData.bedrooms) formData.append('bedrooms', propertyData.bedrooms);
    if (propertyData.bathrooms) formData.append('bathrooms', propertyData.bathrooms);
    if (propertyData.area) formData.append('area', propertyData.area);
    if (propertyData.garage) formData.append('garage', propertyData.garage);
    if (propertyData.year_built) formData.append('year_built', propertyData.year_built);
    if (propertyData.condominio) formData.append('condominio', propertyData.condominio);
    if (propertyData.iptu) formData.append('iptu', propertyData.iptu);
    if (propertyData.features) formData.append('features', propertyData.features);
    formData.append('is_launch', propertyData.is_launch || false);
    
    // Add existing images as JSON
    if (existingImages && existingImages.length > 0) {
      formData.append('existing_images', JSON.stringify(existingImages));
    }
    
    // Add new image files
    if (newImageFiles && newImageFiles.length > 0) {
      newImageFiles.forEach(file => {
        formData.append('new_images', file);
      });
    }
    
    const response = await api.put(`/properties/${id}/with-images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/properties/${id}`);
    return response.data;
  },
  
  getMyProperties: async () => {
    const response = await api.get('/properties/user/my-properties');
    return response.data;
  },
  
  toggleFeatured: async (id) => {
    const response = await api.patch(`/properties/${id}/toggle-featured`);
    return response.data;
  },
  
  toggleExclusiveLaunch: async (id) => {
    const response = await api.patch(`/properties/${id}/toggle-exclusive-launch`);
    return response.data;
  },
};

// Visits API - Agendamento de Visitas
export const visitsAPI = {
  // Agendar uma visita
  schedule: async (visitData) => {
    const response = await api.post('/visits/schedule', visitData);
    return response.data;
  },

  // Listar visitas (para o proprietário)
  getMyVisits: async (statusFilter = null) => {
    const params = statusFilter ? `?status_filter=${statusFilter}` : '';
    const response = await api.get(`/visits/my-visits${params}`);
    return response.data;
  },

  // Atualizar status de uma visita
  updateStatus: async (visitId, newStatus) => {
    const response = await api.put(`/visits/${visitId}/status?new_status=${newStatus}`);
    return response.data;
  },
};

// Notifications API - Sistema de Notificações
export const notificationsAPI = {
  // Listar notificações
  list: async (unreadOnly = false, limit = 50) => {
    const params = new URLSearchParams();
    if (unreadOnly) params.append('unread_only', 'true');
    if (limit) params.append('limit', limit);
    const response = await api.get(`/notifications/?${params.toString()}`);
    return response.data;
  },

  // Contar não lidas
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  // Marcar como lida
  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Marcar todas como lidas
  markAllAsRead: async () => {
    const response = await api.put('/notifications/mark-all-read');
    return response.data;
  },

  // Excluir notificação
  delete: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },
};

// Banners API - Sistema de Banners Publicitários
export const bannersAPI = {
  // Obter banners ativos para exibição (público)
  getActiveBanners: async (position = null) => {
    const params = position ? `?position=${position}` : '';
    const response = await api.get(`/banners/active${params}`);
    return response.data;
  },

  // Registrar visualização de banner
  registerView: async (bannerId) => {
    try {
      await api.post(`/banners/${bannerId}/view`);
    } catch (error) {
      console.error('Error registering banner view:', error);
    }
  },

  // Registrar clique em banner
  registerClick: async (bannerId) => {
    try {
      await api.post(`/banners/${bannerId}/click`);
    } catch (error) {
      console.error('Error registering banner click:', error);
    }
  },

  // Admin: Listar todos os banners
  getAllBanners: async (position = null) => {
    const params = position ? `?position=${position}` : '';
    const response = await api.get(`/banners/admin/all${params}`);
    return response.data;
  },

  // Admin: Criar banner
  createBanner: async (bannerData, imageFile) => {
    const formData = new FormData();
    formData.append('title', bannerData.title);
    formData.append('link_url', bannerData.link_url);
    formData.append('position', bannerData.position);
    formData.append('order', bannerData.order || 0);
    formData.append('status', bannerData.status || 'active');
    formData.append('image', imageFile);

    const response = await api.post('/banners/admin/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Admin: Atualizar banner
  updateBanner: async (bannerId, bannerData, imageFile = null) => {
    const formData = new FormData();
    
    if (bannerData.title) formData.append('title', bannerData.title);
    if (bannerData.link_url) formData.append('link_url', bannerData.link_url);
    if (bannerData.position) formData.append('position', bannerData.position);
    if (bannerData.order !== undefined) formData.append('order', bannerData.order);
    if (bannerData.status) formData.append('status', bannerData.status);
    if (imageFile) formData.append('image', imageFile);

    const response = await api.put(`/banners/admin/${bannerId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Admin: Deletar banner
  deleteBanner: async (bannerId) => {
    const response = await api.delete(`/banners/admin/${bannerId}`);
    return response.data;
  },

  // Admin: Obter estatísticas de banner
  getBannerStats: async (bannerId) => {
    const response = await api.get(`/banners/admin/${bannerId}/stats`);
    return response.data;
  },
};

// Demands API - Mural de Oportunidades (Parcerias)
export const demandsAPI = {
  // Criar nova demanda
  createDemand: async (demandData) => {
    const response = await api.post('/demands/', demandData);
    return response.data;
  },

  // Listar demandas com filtros
  listDemands: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.tipo_imovel) params.append('tipo_imovel', filters.tipo_imovel);
    if (filters.bairro) params.append('bairro', filters.bairro);
    if (filters.valor_min) params.append('valor_min', filters.valor_min);
    if (filters.valor_max) params.append('valor_max', filters.valor_max);
    if (filters.status) params.append('status', filters.status);
    if (filters.skip) params.append('skip', filters.skip);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await api.get(`/demands/?${params.toString()}`);
    return response.data;
  },

  // Minhas demandas
  getMyDemands: async () => {
    const response = await api.get('/demands/my-demands');
    return response.data;
  },

  // Detalhes de uma demanda
  getDemand: async (demandId) => {
    const response = await api.get(`/demands/${demandId}`);
    return response.data;
  },

  // Atualizar demanda
  updateDemand: async (demandId, demandData) => {
    const response = await api.put(`/demands/${demandId}`, demandData);
    return response.data;
  },

  // Deletar demanda
  deleteDemand: async (demandId) => {
    const response = await api.delete(`/demands/${demandId}`);
    return response.data;
  },

  // Criar proposta
  createProposal: async (demandId, proposalData) => {
    const response = await api.post(`/demands/${demandId}/proposals`, proposalData);
    return response.data;
  },

  // Listar propostas de uma demanda
  getProposals: async (demandId) => {
    const response = await api.get(`/demands/${demandId}/proposals`);
    return response.data;
  },

  // Aceitar proposta
  acceptProposal: async (proposalId) => {
    const response = await api.put(`/demands/proposals/${proposalId}/accept`);
    return response.data;
  },

  // Rejeitar proposta
  rejectProposal: async (proposalId) => {
    const response = await api.put(`/demands/proposals/${proposalId}/reject`);
    return response.data;
  },

  // Estatísticas
  getStats: async () => {
    const response = await api.get('/demands/stats/summary');
    return response.data;
  },
};

export default api;
