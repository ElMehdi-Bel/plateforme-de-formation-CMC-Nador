import api from './api'

export const userService = {
  create: (data) => api.post('/users', data),
  findAll: (params) => api.get('/users', { params }),
  findById: (id) => api.get(`/users/${id}`),
  toggleActif: (id) => api.patch(`/users/${id}/toggle-actif`),
  stats: () => api.get('/users/stats'),
  findByGroupe: (groupeId) => api.get(`/users/groupe/${groupeId}/stagiaires`),
  assignGroupe: (id, groupeId) =>
    api.patch(`/users/${id}/groupe`, null, { params: groupeId ? { groupeId } : {} }),
  assignPole: (id, poleId) =>
    api.patch(`/users/${id}/pole`, null, { params: poleId ? { poleId } : {} }),

  // Espace « Mon compte »
  changeOwnPassword: (currentPassword, newPassword) =>
    api.patch('/users/me/password', { currentPassword, newPassword }),
  updateOwnProfile: (data) => api.patch('/users/me', data),
}
