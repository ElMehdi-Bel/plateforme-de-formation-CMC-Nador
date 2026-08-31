import { useEffect, useState } from 'react'
import { Users, GraduationCap, School, BookOpen, ClipboardList, TrendingUp, Activity } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import Spinner from '../../components/ui/Spinner'
import { statsService, statistiquesService, auditService } from '../../services/filiereService'
import { useAuth } from '../../context/AuthContext'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

const MOIS_COURTS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

function greet() {
  const h = new Date().getHours()
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return "à l'instant"
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  return `il y a ${Math.floor(diff / 86400)} j`
}

const DOT_BY_ACTION = [
  [/CREATE|CREER/i, 'bg-primary-500'],
  [/UPDATE|MODIF/i, 'bg-blue-500'],
  [/DELETE|SUPPR/i, 'bg-red-500'],
  [/LOGIN|LOGOUT/i, 'bg-warm-400'],
  [/VALID/i, 'bg-emerald-500'],
]
function dotFor(action = '') {
  return (DOT_BY_ACTION.find(([re]) => re.test(action)) || [null, 'bg-accent-500'])[1]
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-warm-100 rounded-xl shadow-card-hover px-4 py-2.5 text-sm">
      <p className="font-semibold text-warm-900">{payload[0].value} absence(s)</p>
      <p className="text-warm-400 text-xs">{label}</p>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [chartData, setChartData] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    Promise.all([
      statsService.dashboard().then(r => setStats(r.data.data)).catch(() => {}),
      statistiquesService.avancees()
        .then(r => {
          const parMois = r.data.data?.absencesParMois || []
          setChartData(parMois.map(m => ({
            mois: `${MOIS_COURTS[(m.mois || 1) - 1]} ${String(m.annee).slice(2)}`,
            absences: m.count,
          })))
        })
        .catch(() => {}),
      auditService.findAll({ page: 0, size: 6 })
        .then(r => {
          const logs = r.data.data?.content || []
          setActivity(logs.map(l => ({
            id: l.id,
            text: l.details || `${l.action}${l.entityType ? ' — ' + l.entityType : ''}`,
            who: l.user?.fullName || (l.user ? `${l.user.prenom} ${l.user.nom}` : null),
            time: timeAgo(l.createdAt),
            dot: dotFor(l.action),
          })))
        })
        .catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner className="mt-20" size="lg" />

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Hero banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl px-8 py-7"
        style={{ background: 'linear-gradient(140deg, #071e28 0%, #0c3040 40%, #104e60 80%, #0b748a 100%)' }}
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary-400/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="relative z-10">
          <p className="text-primary-400 text-sm font-medium mb-1">{greet()},</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight">
            {user?.fullName ?? 'Administrateur'}
          </h1>
          <p className="text-primary-300/70 text-sm mt-2">
            Vue d'ensemble de la plateforme CMC Nador
          </p>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard title="Stagiaires actifs" value={stats?.totalStagiaires ?? 0} icon={Users} color="green" />
        <StatCard title="Formateurs" value={stats?.totalFormateurs ?? 0} icon={GraduationCap} color="blue" />
        <StatCard title="Filières" value={stats?.totalFilieres ?? 0} icon={School} color="purple" />
        <StatCard title="Groupes" value={stats?.totalGroupes ?? 0} icon={BookOpen} color="teal" />
        <StatCard title="Demandes en attente" value={stats?.demandesEnAttente ?? 0} icon={ClipboardList} color="orange" trendValue="À traiter" />
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Bar chart — 2 cols */}
        <div className="card lg:col-span-2">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="font-display font-semibold text-warm-900 flex items-center gap-2">
                <TrendingUp size={16} className="text-primary-600" />
                Absences par mois
              </h3>
              <p className="text-xs text-warm-400 mt-0.5">6 derniers mois</p>
            </div>
          </div>

          {chartData.length === 0 ? (
            <p className="text-sm text-warm-400 py-16 text-center">Aucune donnée d'absence sur la période</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
                <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f5f5f4' }} />
                <Bar dataKey="absences" fill="#0990ab" radius={[4, 4, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Activity feed — 1 col */}
        <div className="card">
          <h3 className="font-display font-semibold text-warm-900 flex items-center gap-2 mb-5">
            <Activity size={16} className="text-accent-600" />
            Activité récente
          </h3>
          {activity.length === 0 ? (
            <p className="text-sm text-warm-400">Aucune activité récente</p>
          ) : (
            <div className="space-y-4">
              {activity.map(item => (
                <div key={item.id} className="flex items-start gap-3 group">
                  <div className={`w-2 h-2 rounded-full mt-[5px] flex-shrink-0 ${item.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-warm-700 leading-snug group-hover:text-warm-900 transition-colors">
                      {item.text}
                    </p>
                    <p className="text-xs text-warm-400 mt-0.5">
                      {item.who ? `${item.who} · ` : ''}{item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
