import { useEffect, useRef, useState } from 'react'
import { Bell, Menu, ChevronDown, UserCircle, LogOut } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { notificationService } from '../../services/filiereService'

const ROLE_LABEL = {
  ADMIN: 'Administrateur',
  CHEF_DE_POLE: 'Chef de pôle',
  GESTIONNAIRE: 'Gestionnaire des stagiaires',
  FORMATEUR: 'Formateur',
  STAGIAIRE: 'Stagiaire',
}
const ROLE_PREFIX = {
  ADMIN: 'admin',
  CHEF_DE_POLE: 'chef',
  GESTIONNAIRE: 'gestionnaire',
  FORMATEUR: 'formateur',
  STAGIAIRE: 'stagiaire',
}

export default function Header({ onToggleSidebar }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [notifCount, setNotifCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const fetchCount = () => {
      notificationService.countNonLues()
        .then(r => setNotifCount(r.data.data.count || 0))
        .catch(() => {})
    }
    fetchCount()
    const interval = setInterval(fetchCount, 20000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
    navigate('/login')
  }

  const notifPath = `/${ROLE_PREFIX[user?.role] || 'stagiaire'}/notifications`
  const roleLabel = ROLE_LABEL[user?.role] || 'Utilisateur'

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-warm-100 sticky top-0 z-30
                       flex items-center justify-between px-5 shadow-sm">
      {/* Left */}
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-xl text-warm-500 hover:text-warm-900 hover:bg-warm-100 transition-all duration-150"
        aria-label="Ouvrir/fermer le menu"
      >
        <Menu size={19}/>
      </button>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        {/* Notifications */}
        <Link
          to={notifPath}
          className="relative p-2 rounded-xl text-warm-500 hover:text-warm-900 hover:bg-warm-100 transition-all duration-150"
          aria-label="Notifications"
        >
          <Bell size={18}/>
          {notifCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] px-0.5
                             bg-gradient-to-br from-red-400 to-red-600 rounded-full
                             text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </Link>

        {/* Divider */}
        <div className="w-px h-5 bg-warm-200 mx-1.5"/>

        {/* User chip → dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center gap-2.5 rounded-xl px-1.5 py-1 hover:bg-warm-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700
                            flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-white text-sm font-bold">
                {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="hidden sm:block leading-tight text-left">
              <p className="font-semibold text-sm text-warm-900">{user?.fullName}</p>
              <p className="text-[11px] text-warm-400 font-medium">{roleLabel}</p>
            </div>
            <ChevronDown size={15} className={`text-warm-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`}/>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-card border border-warm-100
                            py-1.5 z-40 animate-fade-in">
              <div className="px-3.5 py-2 border-b border-warm-100 sm:hidden">
                <p className="font-semibold text-sm text-warm-900">{user?.fullName}</p>
                <p className="text-[11px] text-warm-400 font-medium">{roleLabel}</p>
              </div>
              <Link
                to="/mon-compte"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-warm-700 hover:bg-warm-100 transition-colors"
              >
                <UserCircle size={16} className="text-warm-400"/>
                Mon profil
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16}/>
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
