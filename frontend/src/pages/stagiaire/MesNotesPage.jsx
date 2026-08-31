import { useEffect, useState } from 'react'
import { Download, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { noteService } from '../../services/noteService'
import { documentService } from '../../services/documentService'
import SkeletonTable from '../../components/ui/SkeletonTable'
import Spinner from '../../components/ui/Spinner'

function moyenneColor(m) {
  if (m === null || m === undefined) return 'text-gray-400'
  if (m >= 12) return 'text-green-600 font-bold'
  if (m >= 10) return 'text-orange-500 font-bold'
  return 'text-red-600 font-bold'
}

export default function MesNotesPage() {
  const { user } = useAuth()
  const [bulletin, setBulletin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!user?.userId) return
    noteService.getBulletin(user.userId)
      .then(r => setBulletin(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await documentService.releveNotes(user.userId)
    } catch {
      toast.error('Erreur lors de la génération du relevé')
    } finally {
      setDownloading(false)
    }
  }

  const modules = bulletin?.modules || []
  const moy = bulletin?.moyenneGenerale

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Notes</h1>
          <p className="text-gray-500 text-sm mt-1">Relevé par module — CC, EFM et moyenne pondérée</p>
        </div>
        <button onClick={handleDownload} disabled={downloading || loading} className="btn-primary flex items-center gap-2">
          {downloading ? <Spinner size="sm" /> : <Download size={16} />}
          Relevé de notes (PDF)
        </button>
      </div>

      {/* Moyenne générale */}
      {!loading && (
        <div className="card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary-50 border border-primary-100">
            <FileText size={20} className="text-primary-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-warm-500 uppercase tracking-wider">Moyenne générale (pondérée par coefficient)</p>
            <p className={`text-2xl font-bold mt-0.5 ${moyenneColor(moy)}`}>
              {moy !== null && moy !== undefined ? `${moy} / 20` : '—'}
            </p>
          </div>
        </div>
      )}

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="p-6"><SkeletonTable rows={6} cols={5} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">Module</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 text-center">Coef.</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 text-center">CC (/20)</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 text-center">EFM (/40)</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 text-center">Moy. Module (/20)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {modules.map(row => (
                  <tr key={row.moduleId} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800">{row.moduleNom}</td>
                    <td className="px-5 py-3 text-center text-gray-500">{row.coefficient ?? 1}</td>
                    <td className="px-5 py-3 text-center">
                      {row.cc != null ? <span className="font-semibold text-gray-700">{row.cc}/20</span> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {row.efm != null ? <span className="font-semibold text-gray-700">{row.efm}/40</span> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {row.moyenne != null
                        ? <span className={moyenneColor(row.moyenne)}>{Number(row.moyenne).toFixed(2)}/20</span>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                  </tr>
                ))}
                {modules.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-gray-400 py-10">Aucune note disponible</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
