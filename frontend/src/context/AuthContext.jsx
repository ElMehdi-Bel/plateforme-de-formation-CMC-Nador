import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.clear()
      }
    }
    setLoading(false)
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
  const isFormateur = user?.role === 'FORMATEUR'
  const isStagiaire = user?.role === 'STAGIAIRE'

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin, isFormateur, isStagiaire }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
