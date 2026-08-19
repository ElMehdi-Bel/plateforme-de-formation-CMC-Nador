import api from './api'

export const absenceService = {
  create: (data) => api.post('/absences', data),
  faireAppel: (data) => api.post('/absences/appel', data),
  getSeance: (groupeCode, date, creneau) =>
    api.get('/absences/seance', { params: { groupeCode, date, creneau } }),

  // Endpoints admin/formateur
  findByStagiaire: (id) => api.get(`/absences/stagiaire/${id}/all`),
  findByStagiairePaged: (stagiaireId, params) =>
    api.get(`/absences/stagiaire/${stagiaireId}`, { params }),
  findByGroupe: (groupeId) => api.get(`/absences/groupe/${groupeId}`),
  stats: (stagiaireId) => api.get(`/absences/stagiaire/${stagiaireId}/stats`),

  // Endpoints dédiés au stagiaire connecté (pas besoin d'ID)
  getMesAbsences: () => api.get('/absences/mes-absences'),
  getMesStats: () => api.get('/absences/mes-absences/stats'),

  justifier: (id, motif) => api.put(`/absences/${id}/justifier`, { motif }),
  delete: (id) => api.delete(`/absences/${id}`),
}
