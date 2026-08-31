import api from './api'

export const disciplineService = {
  // Bilan de discipline (assiduité + comportement)
  me: () => api.get('/discipline/me'),
  forStagiaire: (id) => api.get(`/discipline/stagiaire/${id}`),

  // Sanctions
  sanctions: (stagiaireId) => api.get(`/discipline/stagiaire/${stagiaireId}/sanctions`),
  recentSanctions: (limit = 30) => api.get('/discipline/sanctions', { params: { limit } }),

  // Incidents de comportement
  incidents: (stagiaireId) => api.get(`/incidents/stagiaire/${stagiaireId}`),
  addIncident: (data) => api.post('/incidents', data),
  deleteIncident: (id) => api.delete(`/incidents/${id}`),
}
