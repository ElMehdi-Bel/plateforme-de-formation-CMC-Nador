import { useEffect, useState } from 'react'
import { statistiquesService } from '../../services/filiereService'
import StatCard from '../../components/ui/StatCard'
import Spinner from '../../components/ui/Spinner'
import {
  Users, GraduationCap, UserCheck, ClipboardList,
  BarChart3, TrendingUp, CheckCircle, XCircle,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const MOIS_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

const TYPE_LABELS = {
  ATTESTATION_INSCRIPTION: 'Attestation d\'inscription',
  ATTESTATION_STAGE:       'Attestation de stage',
  RELEVE_NOTES:            'Relevé de notes',
  CERTIFICAT_PRESENCE:     'Certificat de présence',
  AUTRE:                   'Autre',
}

const STATUT_CONFIG = {
  EN_ATTENTE:    { label: 'En attente',    cls: 'badge-warning'  },
  APPROUVEE:     { label: 'Approuvée',     cls: 'badge-success'  },
  REJETEE:       { label: 'Rejetée',       cls: 'badge-danger'   },
  DOCUMENT_PRET: { label: 'Document prêt', cls: 'badge-info'     },
}

const PIE_COLORS = ['#059669','#f59e0b','#3b82f6','#8b5cf6','#ef4444']

const CustomTooltipBar = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-warm-100 rounded-xl shadow-card px-4 py-2.5 text-sm">
      <p className="font-semibold text-warm-900">{payload[0].value} absence{payload[0].value > 1 ? 's' : ''}</p>
      <p className="text-warm-400 text-xs">{label}</p>
    </div>
  )
}

export default function StatistiquesPage() {
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(false)

  useEffect(() => {
    statistiquesService.avancees()
      .then(r => setStats(r.data.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner className="mt-20" size="lg"/>
  if (error) return (
    <div className="card text-center py-16">
      <p className="text-warm-500">Impossible de charger les statistiques.</p>
    </div>
  )

  /* ── Préparer les données graphiques ── */
  const absParMoisData = stats.absencesParMois.map(d => ({
    name: `${MOIS_FR[d.mois - 1]} ${d.annee !== new Date().getFullYear() ? d.annee : ''}`.trim(),
    absences: d.count,
  }))

  const absJustData = [
    { name: 'Justifiées',     value: stats.absencesJustifiees    },
    { name: 'Non justifiées', value: stats.absencesNonJustifiees },
  ]

  const demandesTypeData = stats.demandesParType.map(d => ({
    name:  TYPE_LABELS[d.label] || d.label,
    value: d.count,
  }))

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── En-tête ── */}
      <div>
        <h1 className="page-title flex items-center gap-2">
          <BarChart3 size={22} className="text-primary-600"/>
          Statistiques avancées
        </h1>
        <p className="page-subtitle">Vue analytique de la plateforme CMC Nador</p>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Stagiaires actifs"  value={stats.totalStagiaires}  icon={Users}        color="green"  />
        <StatCard title="Formateurs"         value={stats.totalFormateurs}  icon={GraduationCap} color="blue"  />
        <StatCard title="Total absences"     value={stats.totalAbsences}    icon={UserCheck}     color="red"   />
        <StatCard
          title="Moyenne générale"
          value={stats.moyenneGlobale != null ? `${stats.moyenneGlobale}/20` : '—'}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* ── Absences ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Bar chart — absences par mois */}
        <div className="card lg:col-span-2">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="font-display font-semibold text-warm-900">Absences par mois</h3>
              <p className="text-xs text-warm-400 mt-0.5">6 derniers mois</p>
            </div>
            <span className="text-xs font-bold text-warm-500 bg-warm-100 px-3 py-1 rounded-full">
              {stats.totalAbsences} total
            </span>
          </div>
          {absParMoisData.length === 0 ? (
            <p className="text-sm text-warm-400 text-center py-12">Aucune absence enregistrée</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={absParMoisData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false}/>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip content={<CustomTooltipBar/>} cursor={{ fill: 'rgba(0,0,0,0.03)' }}/>
                <Bar dataKey="absences" fill="#ef4444" radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Donut — justifiées / non justifiées */}
        <div className="card flex flex-col">
          <h3 className="font-display font-semibold text-warm-900 mb-4">Justifiées / Non justifiées</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            {stats.totalAbsences === 0 ? (
              <p className="text-sm text-warm-400 text-center py-8">Aucune donnée</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={absJustData}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      <Cell fill="#059669"/>
                      <Cell fill="#ef4444"/>
                    </Pie>
                    <Tooltip formatter={(v) => [`${v} absence${v > 1 ? 's' : ''}`, '']}/>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 w-full mt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-warm-700">
                      <CheckCircle size={14} className="text-primary-600"/>Justifiées
                    </span>
                    <span className="font-bold text-warm-900">{stats.absencesJustifiees}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-warm-700">
                      <XCircle size={14} className="text-red-500"/>Non justifiées
                    </span>
                    <span className="font-bold text-warm-900">{stats.absencesNonJustifiees}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Demandes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pie — demandes par type */}
        <div className="card">
          <h3 className="font-display font-semibold text-warm-900 mb-5">Demandes par type</h3>
          {demandesTypeData.length === 0 ? (
            <p className="text-sm text-warm-400 text-center py-12">Aucune demande</p>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={demandesTypeData} cx="50%" cy="50%" outerRadius={70} dataKey="value" paddingAngle={2}>
                    {demandesTypeData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} demande${v > 1 ? 's' : ''}`, '']}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2.5">
                {demandesTypeData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}/>
                      <span className="text-xs text-warm-600 truncate">{d.name}</span>
                    </div>
                    <span className="text-xs font-bold text-warm-900 flex-shrink-0">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* List — demandes par statut */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-semibold text-warm-900">Demandes par statut</h3>
            <span className="text-xs text-warm-400 font-medium">
              {stats.demandesParStatut.reduce((s, d) => s + d.count, 0)} total
            </span>
          </div>
          {stats.demandesParStatut.length === 0 ? (
            <p className="text-sm text-warm-400 text-center py-12">Aucune demande</p>
          ) : (
            <div className="space-y-3">
              {stats.demandesParStatut.map((d, i) => {
                const cfg = STATUT_CONFIG[d.label] || { label: d.label, cls: 'badge-neutral' }
                const total = stats.demandesParStatut.reduce((s, x) => s + x.count, 0)
                const pct = total > 0 ? Math.round((d.count / total) * 100) : 0
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={cfg.cls}>{cfg.label}</span>
                      <span className="text-sm font-bold text-warm-900">{d.count} <span className="text-warm-400 font-normal text-xs">({pct}%)</span></span>
                    </div>
                    <div className="h-1.5 bg-warm-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
