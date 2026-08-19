import api from './api'

export const moduleService = {
  create:          (data)                  => api.post('/modules', data),
  update:          (id, data)              => api.put(`/modules/${id}`, data),
  delete:          (id)                    => api.delete(`/modules/${id}`),
  findByFiliere:   (filiereId)             => api.get(`/modules/filiere/${filiereId}`),
  findByGroupe:    (groupeId)              => api.get(`/modules/groupe/${groupeId}`),
  getAll:          ()                      => api.get('/modules'),
  assignFormateur:  (moduleId, formateurId) => api.put(`/modules/${moduleId}/formateur/${formateurId}`),
  removeFormateur:  (moduleId)              => api.delete(`/modules/${moduleId}/formateur`),
  findByFormateur:  (formateurId)           => api.get(`/modules/formateur/${formateurId}`),
}
