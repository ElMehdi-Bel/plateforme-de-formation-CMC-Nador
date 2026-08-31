import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

/** Décode le payload d'un JWT sans vérifier la signature. */
function decodeJwt(token) {
  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

/** true si le token est absent ou expiré (avec 10 s de marge). */
function isTokenExpired(token) {
  const claims = decodeJwt(token)
  if (!claims?.exp) return true
  return claims.exp * 1000 <= Date.now() + 10_000
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      const token = localStorage.getItem('accessToken')
      const refreshToken = localStorage.getItem('refreshToken')
      const savedUser = localStorage.getItem('user')

      if (!token || !savedUser) {
        localStorage.clear()
        if (!cancelled) setLoading(false)
        return
      }

      // Access token encore valide → on restaure directement
      if (!isTokenExpired(token)) {
        try {
          if (!cancelled) setUser(JSON.parse(savedUser))
        } catch {
          localStorage.clear()
        }
        if (!cancelled) setLoading(false)
        return
      }

      // Access token expiré → tentative de rafraîchissement avant d'afficher l'UI
      if (refreshToken) {
        try {
          const res = await authService.refreshToken(refreshToken)
          const { accessToken: newToken, refreshToken: newRefresh } = res.data.data
          localStorage.setItem('accessToken', newToken)
          if (newRefresh) localStorage.setItem('refreshToken', newRefresh)
          if (!cancelled) setUser(JSON.parse(savedUser))
        } catch {
          localStorage.clear()
          if (!cancelled) setUser(null)
        }
      } else {
        localStorage.clear()
      }
      if (!cancelled) setLoading(false)
    }

    restoreSession()
    return () => { cancelled = true }
  }, [])

  const login = useCallback(async (email, password) => {
    const response = await authService.login({ email, password })
    const { accessToken, refreshToken, ...userData } = response.data.data
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } finally {
      localStorage.clear()
      setUser(null)
    }
  }, [])

  const isAdmin = user?.role === 'ADMIN'
  const isChefPole = user?.role === 'CHEF_DE_POLE'
  const isGestionnaire = user?.role === 'GESTIONNAIRE'
  const isFormateur = user?.role === 'FORMATEUR'
  const isStagiaire = user?.role === 'STAGIAIRE'

  return (
    <AuthContext.Provider value={{
      user, login, logout, loading,
      isAdmin, isChefPole, isGestionnaire, isFormateur, isStagiaire,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
