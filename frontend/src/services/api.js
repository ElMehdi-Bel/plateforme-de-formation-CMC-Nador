import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`

  // Pour FormData, supprimer Content-Type afin que le navigateur ajoute
  // automatiquement le bon boundary (multipart/form-data; boundary=...)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  return config
})

// Endpoints d'auth publics : un 401 dessus est une réponse normale
// (mauvais identifiants / refresh token invalide), pas une session expirée —
// ne doit jamais déclencher le flux de rafraîchissement ou une redirection forcée.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/refresh-token']

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const isAuthEndpoint = AUTH_ENDPOINTS.some(p => original?.url?.includes(p))

    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true
      const refreshToken = localStorage.getItem('refreshToken')

      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/v1/auth/refresh-token', { refreshToken })
          const newToken = data.data.accessToken
          localStorage.setItem('accessToken', newToken)
          original.headers.Authorization = `Bearer ${newToken}`
          return api(original)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      } else {
        localStorage.clear()
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api
