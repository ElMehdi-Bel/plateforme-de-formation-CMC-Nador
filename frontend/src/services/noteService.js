import api from './api'

export const noteService = {
  save: (data) => api.post('/notes', data),
  getGrille: (groupeId, moduleId) =>
    api.get('/notes/grille', { params: { groupeId, moduleId } }),
  saisirNote: (data) => api.post('/notes/saisir', data),
  findByStagiaire: (stagiaireId, params) =>
    api.get(`/notes/stagiaire/${stagiaireId}`, { params }),
  getMoyenne: (stagiaireId) => api.get(`/notes/stagiaire/${stagiaireId}/moyenne`),
  findByGroupe: (groupeId, moduleId) =>
    api.get(`/notes/groupe/${groupeId}/module/${moduleId}`),
  delete: (id) => api.delete(`/notes/${id}`),
}
