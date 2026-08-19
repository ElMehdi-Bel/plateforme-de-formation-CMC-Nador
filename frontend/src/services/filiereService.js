import api from './api'

export const filiereService = {
  create: (data) => api.post('/filieres', data),
  update: (id, data) => api.put(`/filieres/${id}`, data),
  getAll: () => api.get('/filieres'),
  findAll: () => api.get('/filieres'),
  findById: (id) => api.get(`/filieres/${id}`),
  delete: (id) => api.delete(`/filieres/${id}`),
}

export const groupeService = {
  create:          (data)              => api.post('/groupes', data),
  update:          (id, data)         => api.put(`/groupes/${id}`, data),
  findAll:         (filiereId)        => api.get('/groupes', { params: filiereId ? { filiereId } : {} }),
  findById:        (id)               => api.get(`/groupes/${id}`),
  findByFormateur: (formateurId)      => api.get(`/groupes/formateur/${formateurId}`),
  setModules:      (id, moduleIds)    => api.put(`/groupes/${id}/modules`, moduleIds),
  delete:          (id)               => api.delete(`/groupes/${id}`),
}

export const emploiService = {
  create: (data) => api.post('/emplois', data),
  findByGroupe: (groupeId, params) => api.get(`/emplois/groupe/${groupeId}`, { params }),
  findByFormateur: (formateurId) => api.get(`/emplois/formateur/${formateurId}`),
  delete: (id) => api.delete(`/emplois/${id}`),
}

export const notificationService = {
  send: (data) => api.post('/notifications', data),
  findAll: (params) => api.get('/notifications/mes-notifications', { params }),
  countNonLues: () => api.get('/notifications/non-lues/count'),
  marquerLue: (id) => api.patch(`/notifications/${id}/lire`),
  toutLire: () => api.patch('/notifications/tout-lire'),
}

export const statsService = {
  dashboard: () => api.get('/statistiques/dashboard'),
}

export const statistiquesService = {
  avancees: () => api.get('/statistiques/avancees'),
}

export const auditService = {
  findAll:    (params)          => api.get('/auditlogs',              { params }),
  findByUser: (userId, params)  => api.get(`/auditlogs/user/${userId}`, { params }),
}
