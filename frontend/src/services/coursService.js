import api from './api'

export const coursService = {
  findByModule: (moduleId, params) => api.get(`/cours/module/${moduleId}`, { params }),
  findByGroupe: (groupeId, params) => api.get(`/cours/groupe/${groupeId}`, { params }),
  upload: (moduleId, titre, description, file) => {
    const fd = new FormData()
    fd.append('moduleId', moduleId)
    fd.append('titre', titre)
    if (description) fd.append('description', description)
    fd.append('file', file)
    return api.post('/cours', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  delete: (id) => api.delete(`/cours/${id}`),
}
