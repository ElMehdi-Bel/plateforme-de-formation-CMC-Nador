import api from './api'

export const userService = {
  create: (data) => api.post('/users', data),
  findAll: (params) => api.get('/users', { params }),
  findById: (id) => api.get(`/users/${id}`),
  toggleActif: (id) => api.patch(`/users/${id}/toggle-actif`),
  stats: () => api.get('/users/stats'),
  findByGroupe: (groupeId) => api.get(`/users/groupe/${groupeId}/stagiaires`),
}
