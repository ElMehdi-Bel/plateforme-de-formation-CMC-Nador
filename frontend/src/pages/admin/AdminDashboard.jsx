import { useEffect, useState } from 'react'
import { Users, GraduationCap, School, BookOpen, ClipboardList, TrendingUp, Activity } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import Spinner from '../../components/ui/Spinner'
import { statsService } from '../../services/filiereService'
import { useAuth } from '../../context/AuthContext'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

const chartData = [
  { mois: 'Jan', stagiaires: 45 },
  { mois: 'Fév', stagiaires: 52 },
  { mois: 'Mar', stagiaires: 48 },
  { mois: 'Avr', stagiaires: 61 },
  { mois: 'Mai', stagiaires: 58 },
  { mois: 'Jun', stagiaires: 67 },
]

const recentActivity = [
  { text: 'Nouveau stagiaire inscrit',        time: 'Il y a 5 min',  dot: 'bg-primary-500' },
  { text: "Demande d'attestation soumise",    time: 'Il y a 20 min', dot: 'bg-accent-500'  },
  { text: 'Notes mises à jour — Dev Web',     time: 'Il y a 1h',     dot: 'bg-blue-500'    },
  { text: 'Emploi du temps modifié',          time: 'Il y a 2h',     dot: 'bg-purple-500'  },
  { text: 'Nouveau cours uploadé',            time: 'Il y a 3h',     dot: 'bg-orange-500'  },
]

function greet() {
  const h = new Date().getHours()
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

function HeroPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="hp" x="0" y="0" width="44" height="44" patternUnits="userSpaceOnUse">
          <polygon points="22,0 44,22 22,44 0,22" fill="none" stroke="white" strokeWidth="0.8"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hp)"/>
    </svg>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-warm-100 rounded-xl shadow-card-hover px-4 py-2.5 text-sm">
      <p className="font-semibold text-warm-900">{payload[0].value} stagiaires</p>
      <p className="text-warm-400 text-xs">{label}</p>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    statsService.dashboard()
      .then(r => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner className="mt-20" size="lg"/>

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Hero banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl px-8 py-7"
        style={{ background: 'linear-gradient(140deg, #071e28 0%, #0c3040 40%, #104e60 80%, #0b748a 100%)' }}
      >
        <HeroPattern/>
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary-400/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none"/>
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
        <StatCard
          title="Stagiaires actifs"
          value={stats?.totalStagiaires ?? 0}
          icon={Users}
          color="green"
          trend="up"
          trendValue="+3 ce mois"
        />
        <StatCard
          title="Formateurs"
          value={stats?.totalFormateurs ?? 0}
          icon={GraduationCap}
          color="blue"
        />
        <StatCard
          title="Filières"
          value={stats?.totalFilieres ?? 0}
          icon={School}
          color="purple"
        />
        <StatCard
          title="Groupes"
          value={stats?.totalGroupes ?? 0}
          icon={BookOpen}
          color="teal"
        />
        <StatCard
          title="Demandes en attente"
          value={stats?.demandesEnAttente ?? 0}
          icon={ClipboardList}
          color="orange"
          trendValue="À traiter"
        />
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Area chart — 2 cols */}
        <div className="card lg:col-span-2">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="font-display font-semibold text-warm-900 flex items-center gap-2">
                <TrendingUp size={16} className="text-primary-600"/>
                Évolution des inscriptions
              </h3>
              <p className="text-xs text-warm-400 mt-0.5">6 derniers mois</p>
            </div>
            <span className="text-xs font-bold text-primary-700 bg-primary-50 border border-primary-100 px-3 py-1 rounded-full">
              +18 % ↑
            </span>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#0baac6" stopOpacity={0.18}/>
                  <stop offset="100%" stopColor="#0baac6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false}/>
              <XAxis
                dataKey="mois"
                tick={{ fontSize: 11, fill: '#a8a29e' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#a8a29e' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip/>} cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}/>
              <Area
                dataKey="stagiaires"
                stroke="#0990ab"
                strokeWidth={2.5}
                fill="url(#areaFill)"
                dot={false}
                activeDot={{ r: 4, fill: '#059669', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Activity feed — 1 col */}
        <div className="card">
          <h3 className="font-display font-semibold text-warm-900 flex items-center gap-2 mb-5">
            <Activity size={16} className="text-accent-600"/>
            Activité récente
          </h3>
          <div className="space-y-4">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3 group">
                <div className={`w-2 h-2 rounded-full mt-[5px] flex-shrink-0 ${item.dot}`}/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-warm-700 leading-snug group-hover:text-warm-900 transition-colors">
                    {item.text}
                  </p>
                  <p className="text-xs text-warm-400 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
