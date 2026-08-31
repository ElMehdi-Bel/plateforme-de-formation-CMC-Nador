import { useEffect, useState, useCallback } from 'react'
import { Calendar } from 'lucide-react'
import { emploiService } from '../../services/emploiService'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'
import { ANNEE_SCOLAIRE_DEFAULT, ANNEES_SCOLAIRES } from '../../config/constants'

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

function getCreneauKey(creneau = '') {
  const c = creneau.toUpperCase().trim()
  if (c.includes('08H30') || c.startsWith('8H30')) return '08H30'
  if (c.includes('11H00') || c.startsWith('11H')) return '11H00'
  if (c.includes('13H30') || c.startsWith('13H')) return '13H30'
  if (c.includes('16H00') || c.startsWith('16H')) return '16H00'
  return null
}

export default function MonEmploiPage() {
  const { user } = useAuth()
  const [seances, setSeances] = useState([])
  const [loading, setLoading] = useState(true)
  const [anneeScolaire, setAnneeScolaire] = useState(ANNEE_SCOLAIRE_DEFAULT)

  const load = useCallback(() => {
    if (!user?.fullName) return
    setLoading(true)
    emploiService.findByFormateurNom(user.fullName, anneeScolaire)
      .then(r => setSeances(r.data.data || []))
      .catch(() => toast.error("Impossible de charger l'emploi du temps"))
      .finally(() => setLoading(false))
  }, [user, anneeScolaire])

  useEffect(() => { load() }, [load])

  const cell = (jour, key) =>
    seances.filter(s => (s.jourSemaine || '').toUpperCase() === jour && getCreneauKey(s.creneau) === key)

  const isEmpty = seances.length === 0

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon Emploi du Temps</h1>
          <p className="text-gray-500 text-sm mt-1">{user?.fullName} · {seances.length} séance(s)</p>
        </div>
        <select className="input-field py-2 text-sm w-36" value={anneeScolaire} onChange={e => setAnneeScolaire(e.target.value)}>
          {ANNEES_SCOLAIRES.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {loading ? (
        <Spinner className="mt-20" size="lg" />
      ) : isEmpty ? (
        <div className="card text-center py-20">
          <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Aucune séance planifiée</h3>
          <p className="text-gray-400 text-sm">Aucune séance pour {anneeScolaire}.</p>
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: '820px' }}>
              <thead>
                <tr>
                  <th className="w-28 bg-gray-50 border-b border-r border-gray-200 px-3 py-3 text-left">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Horaire</span>
                  </th>
                  {JOURS.map(jour => (
                    <th key={jour} className="border-b border-r border-gray-200 px-3 py-3 text-center last:border-r-0 bg-gray-50">
                      <p className="text-sm font-bold text-gray-700">{JOURS_FR[jour]}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CRENEAUX.map(creneau => (
                  <tr key={creneau.key} className="border-b border-gray-100 last:border-b-0">
                    <td className="border-r border-gray-200 px-2 py-3 align-top">
                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-center">
                        <p className="text-xs font-bold text-gray-600">{creneau.debut}</p>
                        <div className="my-1 border-t border-gray-200" />
                        <p className="text-xs font-bold text-gray-600">{creneau.fin}</p>
                      </div>
                    </td>
                    {JOURS.map(jour => {
                      const items = cell(jour, creneau.key)
                      return (
                        <td key={jour} className="border-r border-gray-100 last:border-r-0 px-2 py-2 align-top">
                          {items.length === 0 ? (
                            <div className="min-h-[72px] flex items-center justify-center">
                              <span className="text-gray-200 text-lg select-none">—</span>
                            </div>
                          ) : (
                            <div className="space-y-2 min-h-[72px]">
                              {items.map((s, i) => (
                                <div key={i} className="border rounded-xl p-3 bg-primary-50 border-primary-200">
                                  {s.groupeCode && (
                                    <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full mb-2 bg-primary-100 text-primary-700">
                                      {s.groupeCode}
                                    </span>
                                  )}
                                  {s.moduleNom && <p className="text-xs text-gray-700 leading-tight line-clamp-2">{s.moduleNom}</p>}
                                  {s.salle && <p className="text-xs font-mono mt-2 pt-1.5 border-t border-primary-200 text-primary-500">🏫 {s.salle}</p>}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
