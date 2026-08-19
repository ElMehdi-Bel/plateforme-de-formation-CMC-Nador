import { useEffect, useState, useCallback } from 'react'
import { Calendar, AlertCircle } from 'lucide-react'
import { emploiService } from '../../services/emploiService'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

// ─── Constantes ───────────────────────────────────────────────────────────────
const JOURS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI']
const JOURS_FR = {
  LUNDI: 'Lundi', MARDI: 'Mardi', MERCREDI: 'Mercredi',
  JEUDI: 'Jeudi', VENDREDI: 'Vendredi', SAMEDI: 'Samedi',
}

const CRENEAUX = [
  { key: '08H30', debut: '08h30', fin: '11h00' },
  { key: '11H00', debut: '11h00', fin: '13h30' },
  { key: '13H30', debut: '13h30', fin: '16h00' },
  { key: '16H00', debut: '16h00', fin: '18h30' },
]

const SLOT_COLORS = {
  '08H30': {
    row:   'bg-blue-50/30',
    time:  'bg-blue-100 text-blue-800 border-blue-200',
    card:  'bg-blue-50 border-blue-200 hover:border-blue-400',
    badge: 'bg-blue-100 text-blue-700',
    icon:  'text-blue-400',
  },
  '11H00': {
    row:   'bg-emerald-50/30',
    time:  'bg-emerald-100 text-emerald-800 border-emerald-200',
    card:  'bg-emerald-50 border-emerald-200 hover:border-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700',
    icon:  'text-emerald-400',
  },
  '13H30': {
    row:   'bg-amber-50/30',
    time:  'bg-amber-100 text-amber-800 border-amber-200',
    card:  'bg-amber-50 border-amber-200 hover:border-amber-400',
    badge: 'bg-amber-100 text-amber-700',
    icon:  'text-amber-400',
  },
  '16H00': {
    row:   'bg-purple-50/30',
    time:  'bg-purple-100 text-purple-800 border-purple-200',
    card:  'bg-purple-50 border-purple-200 hover:border-purple-400',
    badge: 'bg-purple-100 text-purple-700',
    icon:  'text-purple-400',
  },
}

// Jour courant
const TODAY_INDEX = new Date().getDay() // 0=Dim, 1=Lun ...
const TODAY_MAP   = ['', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI']
const todayJour   = TODAY_MAP[TODAY_INDEX] || ''

// ─── Helper ───────────────────────────────────────────────────────────────────
// ATTENTION : "8H30 -- 11H00" contient "11H00" → on teste startsWith en premier
function getCreneauKey(creneau = '') {
  const c = creneau.toUpperCase().trim()
  if (c.startsWith('8H30') || c.startsWith('08H30') || c.includes('08H30')) return '08H30'
  if (c.startsWith('11H') || c.includes('11H00')) return '11H00'
  if (c.startsWith('13H') || c.includes('13H30')) return '13H30'
  if (c.startsWith('16H') || c.includes('16H00')) return '16H00'
  if (c.startsWith('19H') || c.includes('19H00')) return '19H00'
  return null
}

// ─── Carte séance ─────────────────────────────────────────────────────────────
function SeanceCard({ seance, creneauKey }) {
  const c = SLOT_COLORS[creneauKey] || SLOT_COLORS['08H30']
  return (
    <div className={`border rounded-xl p-3 transition-shadow hover:shadow-md ${c.card}`}>
      {/* Groupe */}
      {seance.groupeCode && (
        <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full mb-2 ${c.badge}`}>
          {seance.groupeCode}
        </span>
      )}
      {/* Formateur */}
      {seance.formateurNom && (
        <p className="text-sm font-bold text-gray-800 leading-tight">
          {seance.formateurNom}
        </p>
      )}
      {/* Module */}
      {seance.moduleNom && (
        <p className="text-xs text-gray-600 mt-1 leading-tight line-clamp-2">
          {seance.moduleNom}
        </p>
      )}
      {/* Salle */}
      {seance.salle && (
        <p className={`text-xs font-mono mt-2 pt-1.5 border-t border-current/10 ${c.icon}`}>
          🏫 {seance.salle}
        </p>
      )}
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function MonEmploiPage() {
  const { user } = useAuth()
  const [grille, setGrille]           = useState(null)
  const [loading, setLoading]         = useState(true)
  const [anneeScolaire, setAnneeScolaire] = useState('2025-2026')

  const loadEmploi = useCallback(() => {
    setLoading(true)
    emploiService.getMonEmploi(anneeScolaire)
      .then(r => setGrille(r.data.data))
      .catch(() => toast.error("Impossible de charger l'emploi du temps"))
      .finally(() => setLoading(false))
  }, [anneeScolaire])

  useEffect(() => { loadEmploi() }, [loadEmploi])

  // ─── Stats ────────────────────────────────────────────────────────────────
  const allSeances  = grille ? Object.values(grille).flat() : []
  const totalSeances = allSeances.length
  const joursActifs  = grille ? Object.values(grille).filter(s => s.length > 0).length : 0
  const totalHeures  = totalSeances * 2.5

  // Séances pour une cellule [jour][créneau]
  const getCellSeances = (jour, creneauKey) =>
    (grille?.[jour] || []).filter(s => getCreneauKey(s.creneau) === creneauKey)

  const hasNoGroupe = !user?.groupeCode
  const isEmpty     = !grille || totalSeances === 0

  return (
    <div className="space-y-5">

      {/* ── En-tête ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon Emploi du Temps</h1>
          <p className="text-gray-500 text-sm mt-1">
            {user?.groupeNom
              ? <>Groupe <span className="font-semibold text-primary-600">{user.groupeNom}</span>
                  {user?.groupeCode && <span className="ml-1 text-gray-400">· {user.groupeCode}</span>}
                </>
              : 'Semaine en cours'
            }
          </p>
        </div>
        <select
          className="input-field py-2 text-sm w-36"
          value={anneeScolaire}
          onChange={e => setAnneeScolaire(e.target.value)}
        >
          <option value="2025-2026">2025-2026</option>
          <option value="2024-2025">2024-2025</option>
          <option value="2026-2027">2026-2027</option>
        </select>
      </div>

      {/* ── Alerte pas de groupe ── */}
      {hasNoGroupe && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Aucun groupe assigné</p>
            <p className="text-xs mt-0.5 text-amber-700">
              Contactez l'administration pour être affecté à un groupe.
            </p>
          </div>
        </div>
      )}

      {/* ── Contenu ── */}
      {loading ? (
        <Spinner className="mt-20" size="lg" />
      ) : isEmpty ? (
        <div className="card text-center py-20">
          <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Aucune séance planifiée</h3>
          <p className="text-gray-400 text-sm">
            {hasNoGroupe
              ? "Vous n'avez pas encore de groupe assigné."
              : `Aucune séance pour ${user?.groupeCode} · ${anneeScolaire}.`}
          </p>
        </div>
      ) : (
        <>
          {/* ── Stats ── */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Séances / semaine', value: totalSeances, color: 'text-primary-600' },
              { label: 'Jours de cours',    value: joursActifs,  color: 'text-emerald-600' },
              { label: 'Heures / semaine',  value: `${totalHeures}h`, color: 'text-amber-600' },
            ].map(s => (
              <div key={s.label} className="card !py-4 text-center">
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* ── Grille ── */}
          <div className="card !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ minWidth: '820px' }}>

                {/* En-tête jours */}
                <thead>
                  <tr>
                    <th className="w-28 bg-gray-50 border-b border-r border-gray-200 px-3 py-3 text-left">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Horaire
                      </span>
                    </th>
                    {JOURS.map(jour => {
                      const isToday  = jour === todayJour
                      const count    = (grille[jour] || []).length
                      return (
                        <th
                          key={jour}
                          className={`border-b border-r border-gray-200 px-3 py-3 text-center last:border-r-0 transition-colors ${
                            isToday ? 'bg-primary-50' : 'bg-gray-50'
                          }`}
                        >
                          <p className={`text-sm font-bold ${isToday ? 'text-primary-700' : 'text-gray-700'}`}>
                            {JOURS_FR[jour]}
                          </p>
                          {isToday && (
                            <span className="inline-block text-[10px] bg-primary-100 text-primary-600 px-1.5 py-0.5 rounded-full mt-0.5 font-medium">
                              Aujourd'hui
                            </span>
                          )}
                          {!isToday && count > 0 && (
                            <p className="text-xs text-gray-400 mt-0.5 font-normal">
                              {count} séance{count > 1 ? 's' : ''}
                            </p>
                          )}
                        </th>
                      )
                    })}
                  </tr>
                </thead>

                {/* Lignes créneaux */}
                <tbody>
                  {CRENEAUX.map(creneau => {
                    const c = SLOT_COLORS[creneau.key]
                    return (
                      <tr key={creneau.key} className={`${c.row} border-b border-gray-100 last:border-b-0`}>

                        {/* Colonne horaire */}
                        <td className="border-r border-gray-200 px-2 py-3 align-top">
                          <div className={`rounded-lg border px-2 py-2 text-center ${c.time}`}>
                            <p className="text-xs font-bold">{creneau.debut}</p>
                            <div className="my-1 border-t border-current opacity-20" />
                            <p className="text-xs font-bold">{creneau.fin}</p>
                          </div>
                        </td>

                        {/* Cellules par jour */}
                        {JOURS.map(jour => {
                          const seances = getCellSeances(jour, creneau.key)
                          const isToday = jour === todayJour
                          return (
                            <td
                              key={jour}
                              className={`border-r border-gray-100 last:border-r-0 px-2 py-2 align-top ${
                                isToday ? 'bg-primary-50/20' : ''
                              }`}
                            >
                              {seances.length === 0 ? (
                                <div className="min-h-[72px] flex items-center justify-center">
                                  <span className="text-gray-200 text-lg select-none">—</span>
                                </div>
                              ) : (
                                <div className="space-y-2 min-h-[72px]">
                                  {seances.map((s, i) => (
                                    <SeanceCard key={i} seance={s} creneauKey={creneau.key} />
                                  ))}
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Légende */}
            <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 flex flex-wrap gap-4">
              {CRENEAUX.map(cr => {
                const c = SLOT_COLORS[cr.key]
                return (
                  <div key={cr.key} className="flex items-center gap-1.5">
                    <span className={`w-3 h-3 rounded-sm border ${c.time}`} />
                    <span className="text-xs text-gray-500">{cr.debut} – {cr.fin}</span>
                  </div>
                )
              })}
              {todayJour && JOURS.includes(todayJour) && (
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="w-3 h-3 rounded-sm bg-primary-100 border border-primary-300" />
                  <span className="text-xs text-gray-500">Aujourd'hui</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
