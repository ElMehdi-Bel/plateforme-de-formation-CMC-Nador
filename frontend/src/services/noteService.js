import api from './api'

export const noteService = {
  save: (data) => api.post('/notes', data),
  getGrille: (groupeId, moduleId) =>
    api.get('/notes/grille', { params: { groupeId, moduleId } }),
  saisirNote: (data) => api.post('/notes/saisir', data),
  findByStagiaire: (stagiaireId, params) =>
    api.get(`/notes/stagiaire/${stagiaireId}`, { params }),
  getMoyenne: (stagiaireId) => api.get(`/notes/stagiaire/${stagiaireId}/moyenne`),
  getBulletin: (stagiaireId) => api.get(`/notes/stagiaire/${stagiaireId}/bulletin`),
  findByGroupe: (groupeId, moduleId) =>
    api.get(`/notes/groupe/${groupeId}/module/${moduleId}`),
  delete: (id) => api.delete(`/notes/${id}`),

  importNotes: (file, groupeId, moduleId) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/notes/import', form, { params: { groupeId, moduleId } })
  },

  downloadTemplate: async (groupeId, moduleId) => {
    const response = await api.get('/notes/template', {
      params: { groupeId, moduleId },
      responseType: 'blob',
    })
    const url = URL.createObjectURL(new Blob([response.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = 'grille_notes.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  },
}
