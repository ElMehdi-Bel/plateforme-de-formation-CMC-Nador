import api from './api'

export const roleService = {
  list: () => api.get('/roles'),
}
