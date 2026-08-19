import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/ui/Spinner'

export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>

  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirects = { ADMIN: '/admin/dashboard', FORMATEUR: '/formateur/dashboard', STAGIAIRE: '/stagiaire/dashboard' }
    return <Navigate to={redirects[user.role] || '/login'} replace />
  }

  return <Outlet />
}
