import api from './api'

export const poleService = {
  create: (data) => api.post('/poles', data),
  update: (id, data) => api.put(`/poles/${id}`, data),
  findAll: () => api.get('/poles'),
  findById: (id) => api.get(`/poles/${id}`),
  delete: (id) => api.delete(`/poles/${id}`),
}
