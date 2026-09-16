import api from './client';

const unwrap = (res) => res.data;

export const authApi = {
  register: (payload) => api.post('/auth/register', payload).then(unwrap),
  login: (payload) => api.post('/auth/login', payload).then(unwrap),
  me: () => api.get('/auth/me').then(unwrap),
  updateMe: (payload) => api.patch('/auth/me', payload).then(unwrap),
};

export const ticketApi = {
  list: (params) => api.get('/tickets', { params }).then(unwrap),
  stats: () => api.get('/tickets/stats').then(unwrap),
  get: (id) => api.get(`/tickets/${id}`).then(unwrap),
  create: (payload) => api.post('/tickets', payload).then(unwrap),
  update: (id, payload) => api.patch(`/tickets/${id}`, payload).then(unwrap),
  remove: (id) => api.delete(`/tickets/${id}`).then(unwrap),
  sendMessage: (id, payload) => api.post(`/tickets/${id}/messages`, payload).then(unwrap),
  analyze: (id) => api.post(`/tickets/${id}/analyze`).then(unwrap),
  latestAnalysis: (id) => api.get(`/tickets/${id}/analysis`).then(unwrap),
  uploadAttachment: (id, file, onProgress) => {
    const form = new FormData();
    form.append('file', file);
    return api
      .post(`/tickets/${id}/attachments`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
        },
      })
      .then(unwrap);
  },
};

export const notificationApi = {
  list: (params) => api.get('/notifications', { params }).then(unwrap),
  unreadCount: () => api.get('/notifications/unread-count').then(unwrap),
  markRead: (id) => api.patch(`/notifications/${id}/read`).then(unwrap),
  markAllRead: () => api.patch('/notifications/read-all').then(unwrap),
};

export const categoryApi = {
  list: () => api.get('/categories').then(unwrap),
};

export const adminApi = {
  users: (params) => api.get('/admin/users', { params }).then(unwrap),
  createUser: (payload) => api.post('/admin/users', payload).then(unwrap),
  updateUser: (id, payload) => api.patch(`/admin/users/${id}`, payload).then(unwrap),
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then(unwrap),
  agents: () => api.get('/admin/agents').then(unwrap),
  analytics: () => api.get('/admin/analytics').then(unwrap),
  system: () => api.get('/admin/system').then(unwrap),
  auditLogs: (params) => api.get('/admin/audit-logs', { params }).then(unwrap),
  categories: (params) => api.get('/admin/categories', { params }).then(unwrap),
  createCategory: (payload) => api.post('/admin/categories', payload).then(unwrap),
  updateCategory: (id, payload) => api.patch(`/admin/categories/${id}`, payload).then(unwrap),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`).then(unwrap),
};
