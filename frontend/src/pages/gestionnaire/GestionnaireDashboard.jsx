import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, UserCheck, ClipboardList, FileText, BookOpen } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import Spinner from '../../components/ui/Spinner'
import { statsService } from '../../services/filiereService'
import { userService } from '../../services/userService'
import { useAuth } from '../../context/AuthContext'

function greet() {
  const h = new Date().getHours()
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

const quickLinks = [
  { to: '/gestionnaire/stagiaires', icon: Users,        label: 'Stagiaires',  desc: 'Gérer et affecter aux groupes' },
  { to: '/gestionnaire/absences',   icon: UserCheck,    label: 'Absences',    desc: 'Suivre et justifier' },
  { to: '/gestionnaire/demandes',   icon: ClipboardList, label: 'Demandes',   desc: 'Dossiers administratifs' },
  { to: '/gestionnaire/documents',  icon: FileText,     label: 'Documents',   desc: 'Attestations et listes' },
]

export default function GestionnaireDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [userStats, setUserStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      statsService.dashboard().then(r => setStats(r.data.data)).catch(() => {}),
      userService.stats().then(r => setUserStats(r.data.data)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner className="mt-20" size="lg" />

  return (
    <div className="space-y-6 animate-fade-in">
      <div
        className="relative overflow-hidden rounded-2xl px-8 py-7"
        style={{ background: 'linear-gradient(140deg, #071e28 0%, #0c3040 40%, #104e60 80%, #0b748a 100%)' }}
      >
        <div className="relative z-10">
          <p className="text-primary-400 text-sm font-medium mb-1">{greet()},</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight">
            {user?.fullName ?? 'Gestionnaire'}
          </h1>
          <p className="text-primary-300/70 text-sm mt-2">
            Gestion des stagiaires — groupes, absences, dossiers et attestations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Stagiaires actifs" value={userStats?.stagiaires ?? stats?.totalStagiaires ?? 0} icon={Users} color="green" />
        <StatCard title="Groupes" value={stats?.totalGroupes ?? 0} icon={BookOpen} color="teal" />
        <StatCard title="Demandes en attente" value={stats?.demandesEnAttente ?? 0} icon={ClipboardList} color="orange" trendValue="À traiter" />
        <StatCard title="Filières" value={stats?.totalFilieres ?? 0} icon={BookOpen} color="purple" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map(({ to, icon: Icon, label, desc }) => (
          <Link key={to} to={to} className="card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-primary-50 border border-primary-100 flex-shrink-0">
              <Icon size={20} className="text-primary-600" />
            </div>
            <div>
              <p className="font-semibold text-warm-900">{label}</p>
              <p className="text-xs text-warm-400 mt-0.5">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
