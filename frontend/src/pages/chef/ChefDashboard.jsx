import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  GraduationCap, BookOpen, Calendar, BarChart3, FileBarChart,
  CheckCircle2, AlertTriangle, MapPinOff,
} from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import Spinner from '../../components/ui/Spinner'
import { statsService } from '../../services/filiereService'
import { emploiService } from '../../services/emploiService'
import { moduleService } from '../../services/moduleService'
import { useAuth } from '../../context/AuthContext'

function greet() {
  const h = new Date().getHours()
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

const quickLinks = [
  { to: '/chef/emplois',      icon: Calendar,     label: 'Emplois du temps', desc: 'Créer, modifier et valider' },
  { to: '/chef/modules',      icon: BookOpen,     label: 'Modules',          desc: 'Affecter les formateurs' },
  { to: '/chef/formateurs',   icon: GraduationCap, label: 'Formateurs',      desc: 'Gérer les formateurs' },
  { to: '/chef/statistiques', icon: BarChart3,    label: 'Statistiques',     desc: 'Indicateurs pédagogiques' },
  { to: '/chef/bilans',       icon: FileBarChart, label: 'Bilans',           desc: 'Générer le bilan PDF' },
]

export default function ChefDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [aValider, setAValider] = useState(0)
  const [sansSalle, setSansSalle] = useState(0)
  const [conflits, setConflits] = useState(0)
  const [nonAffectes, setNonAffectes] = useState([])
  const [charge, setCharge] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      statsService.dashboard().then(r => setStats(r.data.data)).catch(() => {}),
      emploiService.getGrille().then(r => {
        const all = Object.values(r.data.data || {}).flat()
        setAValider(all.filter(s => s.statut && s.statut !== 'VALIDE').length)
        setSansSalle(all.filter(s => !s.salle).length)
      }).catch(() => {}),
      emploiService.getConflits().then(r => setConflits((r.data.data || []).length)).catch(() => {}),
      moduleService.nonAffectes().then(r => setNonAffectes(r.data.data || [])).catch(() => {}),
      moduleService.chargeFormateurs().then(r => setCharge(r.data.data || [])).catch(() => {}),
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
            {user?.fullName ?? 'Chef de pôle'}
          </h1>
          <p className="text-primary-300/70 text-sm mt-2">
            Pilotage pédagogique — emplois du temps, formateurs et statistiques
          </p>
        </div>
      </div>

      {/* À traiter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/chef/emplois" className="block">
          <StatCard title="Séances à valider" value={aValider} icon={CheckCircle2} color={aValider > 0 ? 'orange' : 'green'} trendValue={aValider > 0 ? 'À valider' : 'À jour'} />
        </Link>
        <Link to="/chef/emplois" className="block">
          <StatCard title="Conflits de grille" value={conflits} icon={AlertTriangle} color={conflits > 0 ? 'red' : 'green'} />
        </Link>
        <Link to="/chef/emplois" className="block">
          <StatCard title="Séances sans salle" value={sansSalle} icon={MapPinOff} color={sansSalle > 0 ? 'amber' : 'green'} />
        </Link>
        <Link to="/chef/modules" className="block">
          <StatCard title="Modules non affectés" value={nonAffectes.length} icon={BookOpen} color={nonAffectes.length > 0 ? 'orange' : 'green'} />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Modules non affectés */}
        <div className="card">
          <h3 className="font-display font-semibold text-warm-900 mb-3">Modules sans formateur</h3>
          {nonAffectes.length === 0 ? (
            <p className="text-sm text-warm-400">Tous les modules sont affectés 🎉</p>
          ) : (
            <ul className="space-y-1.5 max-h-56 overflow-y-auto text-sm">
              {nonAffectes.map(m => (
                <li key={m.id} className="flex justify-between gap-3 py-1 border-b border-warm-50 last:border-0">
                  <span className="text-warm-700 truncate">{m.nom}</span>
                  <span className="text-warm-400 text-xs whitespace-nowrap">{m.volumeHoraire ? `${m.volumeHoraire} h` : '—'}</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/chef/modules" className="text-xs text-primary-600 hover:underline mt-3 inline-block">Affecter les formateurs →</Link>
        </div>

        {/* Charge par formateur */}
        <div className="card">
          <h3 className="font-display font-semibold text-warm-900 mb-3">Charge horaire par formateur</h3>
          {charge.length === 0 ? (
            <p className="text-sm text-warm-400">Aucune affectation.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-warm-400">
                  <th className="pb-2">Formateur</th>
                  <th className="pb-2 text-center">Modules</th>
                  <th className="pb-2 text-right">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-50">
                {charge.map(c => (
                  <tr key={c.formateurId}>
                    <td className="py-1.5 text-warm-700">{c.formateurNom}</td>
                    <td className="py-1.5 text-center text-warm-600">{c.nbModules}</td>
                    <td className="py-1.5 text-right font-medium text-primary-700">{c.volumeHoraire} h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Formateurs" value={stats?.totalFormateurs ?? 0} icon={GraduationCap} color="blue" />
        <StatCard title="Groupes" value={stats?.totalGroupes ?? 0} icon={BookOpen} color="teal" />
        <StatCard title="Filières" value={stats?.totalFilieres ?? 0} icon={BookOpen} color="purple" />
        <StatCard title="Stagiaires actifs" value={stats?.totalStagiaires ?? 0} icon={GraduationCap} color="green" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
