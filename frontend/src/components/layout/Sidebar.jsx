import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Users, BookOpen, FileText, Calendar,
  UserCheck, Bell, BarChart3, ClipboardList, LogOut,
  GraduationCap, School, ShieldCheck,
} from 'lucide-react'
import cmcLogo from '../../Cmc.jpg'

const adminNav = [
  { to: '/admin/dashboard',     icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/admin/stagiaires',    icon: Users,           label: 'Stagiaires' },
  { to: '/admin/formateurs',    icon: GraduationCap,   label: 'Formateurs' },
  { to: '/admin/filieres',      icon: School,          label: 'Filières & Groupes' },
  { to: '/admin/modules',       icon: BookOpen,        label: 'Modules' },
  { to: '/admin/emplois',       icon: Calendar,        label: 'Emplois du temps' },
  { to: '/admin/notes',         icon: FileText,        label: 'Notes' },
  { to: '/admin/absences',      icon: UserCheck,       label: 'Absences' },
  { to: '/admin/demandes',      icon: ClipboardList,   label: 'Demandes' },
  { to: '/admin/notifications', icon: Bell,            label: 'Notifications' },
  { to: '/admin/statistiques',  icon: BarChart3,       label: 'Statistiques' },
  { to: '/admin/auditlogs',     icon: ShieldCheck,     label: 'Audit Logs' },
]

const stagiaireNav = [
  { to: '/stagiaire/dashboard',     icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/stagiaire/notes',         icon: FileText,        label: 'Mes Notes' },
  { to: '/stagiaire/absences',      icon: UserCheck,       label: 'Mes Absences' },
  { to: '/stagiaire/cours',         icon: BookOpen,        label: 'Mes Cours' },
  { to: '/stagiaire/emploi',        icon: Calendar,        label: 'Emploi du temps' },
  { to: '/stagiaire/demandes',      icon: ClipboardList,   label: 'Mes Demandes' },
  { to: '/stagiaire/notifications', icon: Bell,            label: 'Notifications' },
]

const formateurNav = [
  { to: '/formateur/dashboard',     icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/formateur/groupes',       icon: Users,           label: 'Mes Groupes' },
  { to: '/formateur/notes',         icon: FileText,        label: 'Gestion Notes' },
  { to: '/formateur/absences',      icon: UserCheck,       label: 'Gestion Absences' },
  { to: '/formateur/cours',         icon: BookOpen,        label: 'Mes Cours' },
  { to: '/formateur/emploi',        icon: Calendar,        label: 'Mon Emploi' },
  { to: '/formateur/notifications', icon: Bell,            label: 'Notifications' },
]

function GeometricPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern id="sp" x="0" y="0" width="44" height="44" patternUnits="userSpaceOnUse">
          <polygon points="22,0 44,22 22,44 0,22"   fill="none" stroke="white" strokeWidth="0.7" opacity="0.07"/>
          <polygon points="22,9 35,22 22,35 9,22"   fill="none" stroke="white" strokeWidth="0.4" opacity="0.05"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#sp)"/>
    </svg>
  )
}

export default function Sidebar({ collapsed }) {
  const { user, logout, isAdmin, isFormateur } = useAuth()

  const nav = isAdmin ? adminNav : isFormateur ? formateurNav : stagiaireNav
  const roleLabel = isAdmin ? 'Administrateur' : isFormateur ? 'Formateur' : 'Stagiaire'

  return (
    <aside
      className={`fixed left-0 top-0 h-full flex flex-col z-40 overflow-hidden
                  transition-all duration-300 ${collapsed ? 'w-[70px]' : 'w-[260px]'}`}
      style={{
        background: 'linear-gradient(185deg, #071e28 0%, #0c3040 35%, #104e60 70%, #071e28 100%)',
        boxShadow: '4px 0 28px rgba(0,0,0,0.25)',
      }}
    >
      <GeometricPattern />

      {/* ── Logo ── */}
      <div
        className={`relative flex items-center justify-center border-b border-white/5
                    transition-all duration-300 ${collapsed ? 'p-3' : 'px-4 py-3'}`}
      >
        {collapsed ? (
          /* Icône seule : recadrage sur la partie gauche (bâtiment) du logo */
          <div className="w-10 h-10 rounded-xl bg-white overflow-hidden flex-shrink-0 shadow-sm">
            <img
              src={cmcLogo}
              alt="CMC"
              className="w-full h-full object-cover object-left"
            />
          </div>
        ) : (
          /* Logo complet */
          <div className="bg-white rounded-xl px-3 py-2 w-full shadow-sm">
            <img
              src={cmcLogo}
              alt="CMC Nador"
              className="h-10 w-full object-contain object-left"
            />
          </div>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="relative flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `relative flex items-center rounded-xl transition-all duration-200 overflow-hidden
               ${collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'}
               ${isActive
                 ? 'bg-primary-700/50 text-white shadow-glow-teal'
                 : 'text-primary-300 hover:bg-white/5 hover:text-white'
               }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Accent bar */}
                {isActive && !collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px] bg-accent-400 rounded-r-full"/>
                )}
                <Icon size={17} className="flex-shrink-0"/>
                {!collapsed && (
                  <span className="text-sm font-medium">{label}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── User / Logout ── */}
      <div className="relative border-t border-white/5 p-2.5 space-y-1">
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-400 to-accent-600
                            flex items-center justify-center flex-shrink-0 shadow-glow-accent">
              <span className="text-white text-sm font-bold">
                {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate leading-tight">
                {user?.fullName}
              </p>
              <p className="text-primary-400 text-[11px] font-medium">{roleLabel}</p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          title={collapsed ? 'Déconnexion' : undefined}
          className={`w-full flex items-center rounded-xl text-primary-400 hover:text-red-400
                      hover:bg-red-950/30 transition-all duration-200
                      ${collapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-2.5 py-2.5'}`}
        >
          <LogOut size={16} className="flex-shrink-0"/>
          {!collapsed && <span className="text-sm font-medium">Déconnexion</span>}
        </button>
      </div>
    </aside>
  )
}
