import api from './api'

export const groupeService = {
  getAll: (params) => api.get('/groupes', { params }),
  getById: (id) => api.get(`/groupes/${id}`),
  create: (data) => api.post('/groupes', data),
  update: (id, data) => api.put(`/groupes/${id}`, data),
  delete: (id) => api.delete(`/groupes/${id}`),
  findByFormateur: (formateurId) => api.get(`/groupes/formateur/${formateurId}`),
}
