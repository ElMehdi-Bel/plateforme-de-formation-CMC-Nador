import { useEffect, useState } from 'react'
import { UserCheck, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { absenceService } from '../../services/absenceService'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

export default function MesAbsencesPage() {
  const [absences, setAbsences]   = useState([])
  const [total, setTotal]         = useState(0)
  const [injustifiees, setInjust] = useState(0)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    // Appels séparés — une erreur sur les stats ne bloque pas la liste
    absenceService.getMesAbsences()
      .then(r => {
        setAbsences(r.data?.data || [])
      })
      .catch(err => {
        const msg = err.response?.data?.message || 'Impossible de charger les absences'
        setError(msg)
        toast.error(msg)
      })
      .finally(() => setLoading(false))

    absenceService.getMesStats()
      .then(r => {
        const data = r.data?.data || {}
        setTotal(data.total ?? 0)
        setInjust(data.injustifiees ?? 0)
      })
      .catch(() => {
        // stats non critiques, on ignore l'erreur silencieusement
      })
  }, [])

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes Absences</h1>
        <p className="text-gray-500 text-sm mt-1">Historique de vos absences</p>
      </div>

      {loading ? (
        <Spinner className="mt-20" size="lg" />
      ) : error ? (
        /* Erreur API */
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-5">
          <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700">Erreur de chargement</p>
            <p className="text-sm text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card text-center !py-5">
              <p className="text-3xl font-bold text-gray-800">{total}</p>
              <p className="text-xs text-gray-500 mt-1">Total absences</p>
            </div>
            <div className="card text-center !py-5">
              <p className="text-3xl font-bold text-red-500">{injustifiees}</p>
              <p className="text-xs text-gray-500 mt-1">Non justifiées</p>
            </div>
            <div className="card text-center !py-5">
              <p className="text-3xl font-bold text-green-600">{total - injustifiees}</p>
              <p className="text-xs text-gray-500 mt-1">Justifiées</p>
            </div>
          </div>

          {/* Liste */}
          {absences.length === 0 ? (
            <div className="card text-center py-16">
              <UserCheck size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600 font-semibold">Aucune absence enregistrée</p>
              <p className="text-gray-400 text-sm mt-1">Félicitations pour votre assiduité !</p>
            </div>
          ) : (
            <div className="card !p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">
                  Détail des absences
                  <span className="text-gray-400 font-normal text-sm ml-2">
                    ({absences.length} enregistrée{absences.length > 1 ? 's' : ''})
                  </span>
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">Date</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">Jour</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">Créneau</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500 text-center">Statut</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500">Motif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {absences.map(a => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{a.dateAbsence}</td>
                        <td className="px-4 py-3 text-gray-600">{a.jourSemaine || '—'}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{a.heureCreneau || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          {a.justifiee ? (
                            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                              <CheckCircle size={11} /> Justifiée
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-xs font-medium">
                              <XCircle size={11} /> Non justifiée
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                          {a.motif || <span className="text-gray-300">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
