import api from './api'

export const salleService = {
  create: (data) => api.post('/salles', data),
  update: (id, data) => api.put(`/salles/${id}`, data),
  findAll: () => api.get('/salles'),
  findById: (id) => api.get(`/salles/${id}`),
  delete: (id) => api.delete(`/salles/${id}`),
}
