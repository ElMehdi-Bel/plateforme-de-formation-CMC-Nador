import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function NotFoundPage() {
  const { user } = useAuth()
  const home = user?.role === 'ADMIN' ? '/admin/dashboard'
    : user?.role === 'FORMATEUR' ? '/formateur/dashboard'
    : '/stagiaire/dashboard'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-200">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mt-4">Page introuvable</h2>
        <p className="text-gray-500 mt-2">Cette page n'existe pas ou a été déplacée.</p>
        <Link to={home} className="btn-primary inline-block mt-6">
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  )
}
