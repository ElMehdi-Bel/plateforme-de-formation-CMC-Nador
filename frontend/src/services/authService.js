import api from './api'

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  refreshToken: (token) => api.post('/auth/refresh-token', { refreshToken: token }),
  me: () => api.get('/auth/me'),
}
