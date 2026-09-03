import api from './api'

// Déclenche le téléchargement d'un blob renvoyé par l'API
function downloadBlob(data, filename) {
  const url = window.URL.createObjectURL(new Blob([data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export const documentService = {
  attestation: async (stagiaireId) => {
    const res = await api.get(`/documents/attestation/${stagiaireId}`, { responseType: 'blob' })
    downloadBlob(res.data, `attestation_${stagiaireId}.pdf`)
  },
  listeStagiaires: async (groupeId) => {
    const res = await api.get(`/documents/liste-stagiaires/${groupeId}`, { responseType: 'blob' })
    downloadBlob(res.data, `liste_stagiaires_groupe_${groupeId}.xlsx`)
  },
  bilan: async () => {
    const res = await api.get('/documents/bilan', { responseType: 'blob' })
    downloadBlob(res.data, 'bilan_pedagogique.pdf')
  },
  releveNotes: async (stagiaireId) => {
    const res = await api.get(`/documents/releve-notes/${stagiaireId}`, { responseType: 'blob' })
    downloadBlob(res.data, `releve_notes_${stagiaireId}.pdf`)
  },
  exportNotes: async (groupeId, moduleId) => {
    const res = await api.get(`/documents/export-notes/${groupeId}/${moduleId}`, { responseType: 'blob' })
    downloadBlob(res.data, `notes_groupe_${groupeId}_module_${moduleId}.xlsx`)
  },
  exportAbsences: async (groupeId) => {
    const res = await api.get(`/documents/export-absences/${groupeId}`, { responseType: 'blob' })
    downloadBlob(res.data, `absences_groupe_${groupeId}.xlsx`)
  },
}
