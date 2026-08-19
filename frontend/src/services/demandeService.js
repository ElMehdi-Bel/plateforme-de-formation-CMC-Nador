import api from './api'

export const demandeService = {
  create: (data) => api.post('/demandes', data),
  findAll: (params) => api.get('/demandes', { params }),
  mesDemandes: (params) => api.get('/demandes/mes-demandes', { params }),
  traiter: (id, statut, commentaire) =>
    api.patch(`/demandes/${id}/traiter`, null, { params: { statut, commentaire } }),
  uploadDocument: (id, formData) =>
    api.post(`/demandes/${id}/document`, formData),
  downloadDocument: (id) =>
    api.get(`/demandes/${id}/document`, { responseType: 'blob' }),
}
