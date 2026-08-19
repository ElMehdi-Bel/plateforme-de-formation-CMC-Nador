import api from './api'

const multipart = (file, url) => {
  const form = new FormData()
  form.append('file', file)
  return api.post(url, form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export const importService = {
  importExcel:      (file) => multipart(file, '/import/excel'),
  importFormateurs: (file) => multipart(file, '/import/formateurs'),
}
