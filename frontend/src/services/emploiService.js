import api from './api'

export const emploiService = {
  // Récupère la grille complète organisée par jour
  getGrille: (anneeScolaire = '2025-2026') =>
    api.get('/emplois/grille', { params: { anneeScolaire } }),

  // Import depuis un fichier Excel
  importExcel: (file, anneeScolaire = '2025-2026', replace = true) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/emplois/import', formData, {
      params: { anneeScolaire, replace },
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // Emploi du temps personnel du stagiaire connecté
  getMonEmploi: (anneeScolaire = '2025-2026') =>
    api.get('/emplois/mon-emploi', { params: { anneeScolaire } }),

  // Séances d'un groupe (par code)
  findByGroupeCode: (groupeCode) =>
    api.get(`/emplois/groupe/code/${groupeCode}`),

  // Séances d'un formateur (par nom)
  findByFormateurNom: (nom, anneeScolaire = '2025-2026') =>
    api.get(`/emplois/formateur/nom/${encodeURIComponent(nom)}`, { params: { anneeScolaire } }),

  // CRUD
  create: (data) => api.post('/emplois', data),
  findByGroupe: (groupeId, params) => api.get(`/emplois/groupe/${groupeId}`, { params }),
  findByFormateur: (formateurId) => api.get(`/emplois/formateur/${formateurId}`),
  delete: (id) => api.delete(`/emplois/${id}`),
}
