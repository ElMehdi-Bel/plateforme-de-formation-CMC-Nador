import api from './api'
import { ANNEE_SCOLAIRE_DEFAULT } from '../config/constants'

export const emploiService = {
  // Récupère la grille complète organisée par jour
  getGrille: (anneeScolaire = ANNEE_SCOLAIRE_DEFAULT) =>
    api.get('/emplois/grille', { params: { anneeScolaire } }),

  // Import depuis un fichier Excel
  importExcel: (file, anneeScolaire = ANNEE_SCOLAIRE_DEFAULT, replace = true) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/emplois/import', formData, {
      params: { anneeScolaire, replace },
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // Emploi du temps personnel du stagiaire connecté
  getMonEmploi: (anneeScolaire = ANNEE_SCOLAIRE_DEFAULT) =>
    api.get('/emplois/mon-emploi', { params: { anneeScolaire } }),

  // Séances d'un groupe (par code)
  findByGroupeCode: (groupeCode) =>
    api.get(`/emplois/groupe/code/${groupeCode}`),

  // Séances d'un formateur (par nom)
  findByFormateurNom: (nom, anneeScolaire = ANNEE_SCOLAIRE_DEFAULT) =>
    api.get(`/emplois/formateur/nom/${encodeURIComponent(nom)}`, { params: { anneeScolaire } }),

  // CRUD
  create: (data) => api.post('/emplois', data),
  createSeance: (data) => api.post('/emplois/seance', data),
  updateSeance: (id, data) => api.put(`/emplois/${id}`, data),
  findByGroupe: (groupeId, params) => api.get(`/emplois/groupe/${groupeId}`, { params }),
  findByFormateur: (formateurId) => api.get(`/emplois/formateur/${formateurId}`),
  valider: (id) => api.patch(`/emplois/${id}/valider`),
  validerLot: (anneeScolaire = ANNEE_SCOLAIRE_DEFAULT, groupeCode) =>
    api.patch('/emplois/valider-lot', null, { params: { anneeScolaire, ...(groupeCode ? { groupeCode } : {}) } }),
  getConflits: (anneeScolaire = ANNEE_SCOLAIRE_DEFAULT) =>
    api.get('/emplois/conflits', { params: { anneeScolaire } }),
  delete: (id) => api.delete(`/emplois/${id}`),
}
