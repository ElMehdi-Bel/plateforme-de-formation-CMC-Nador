import { useEffect, useState } from 'react'
import { Bell, Menu } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { notificationService } from '../../services/filiereService'

export default function Header({ onToggleSidebar }) {
  const { user, isAdmin, isFormateur } = useAuth()
  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => {
    notificationService.countNonLues()
      .then(r => setNotifCount(r.data.data.count || 0))
      .catch(() => {})
  }, [])

  const notifPath = isAdmin
    ? '/admin/notifications'
    : isFormateur
    ? '/formateur/notifications'
    : '/stagiaire/notifications'

  const roleLabel = isAdmin ? 'Administrateur' : isFormateur ? 'Formateur' : 'Stagiaire'

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

        {/* User chip */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700
                          flex items-center justify-center shadow-sm flex-shrink-0">
            <span className="text-white text-sm font-bold">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="font-semibold text-sm text-warm-900">{user?.fullName}</p>
            <p className="text-[11px] text-warm-400 font-medium">{roleLabel}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
