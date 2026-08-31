import { useEffect, useState } from 'react'
import { BookOpen, FileText, Download, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../../components/ui/Spinner'
import { coursService } from '../../services/coursService'
import { moduleService } from '../../services/moduleService'
import { useAuth } from '../../context/AuthContext'

function humanSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

export default function MesCoursPage() {
  const { user } = useAuth()
  const [cours, setCours] = useState([])
  const [modulesById, setModulesById] = useState({})
  const [loading, setLoading] = useState(true)

  const groupeId = user?.groupeId

  useEffect(() => {
    if (!groupeId) { setLoading(false); return }
    Promise.all([
      coursService.findByGroupe(groupeId, { page: 0, size: 200 })
        .then(r => setCours(r.data.data?.content || [])),
      moduleService.findByGroupe(groupeId)
        .then(r => {
          const map = {}
          ;(r.data.data || []).forEach(m => { map[m.id] = m.nom })
          setModulesById(map)
        })
        .catch(() => {}),
    ])
      .catch(() => toast.error('Erreur chargement des cours'))
      .finally(() => setLoading(false))
  }, [groupeId])

  if (loading) return <Spinner className="mt-20" size="lg" />

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Mes Cours</h1>
        <p className="page-subtitle">Supports de cours déposés par vos formateurs</p>
      </div>

      {!groupeId ? (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <p className="text-sm">Aucun groupe assigné à votre compte — contactez l'administration.</p>
        </div>
      ) : cours.length === 0 ? (
        <div className="card text-center py-16">
          <BookOpen size={48} className="mx-auto text-warm-300 mb-4" />
          <p className="text-warm-500 font-medium">Aucun support disponible</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-warm-50/80 text-left">
                <th className="px-5 py-2.5 text-xs font-bold text-warm-500 uppercase tracking-wider">Titre</th>
                <th className="px-5 py-2.5 text-xs font-bold text-warm-500 uppercase tracking-wider">Module</th>
                <th className="px-5 py-2.5 text-xs font-bold text-warm-500 uppercase tracking-wider">Fichier</th>
                <th className="px-5 py-2.5 text-xs font-bold text-warm-500 uppercase tracking-wider text-center">Télécharger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-50">
              {cours.map(c => (
                <tr key={c.id} className="hover:bg-primary-50/30">
                  <td className="px-5 py-3 font-medium text-warm-800">{c.titre}</td>
                  <td className="px-5 py-3 text-warm-500">{modulesById[c.moduleId] || '—'}</td>
                  <td className="px-5 py-3 text-warm-500 text-xs">
                    <span className="flex items-center gap-1.5"><FileText size={13} />{c.fichierNom} · {humanSize(c.fichierTaille)}</span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <a href={c.fichierUrl} target="_blank" rel="noreferrer" className="inline-flex p-1.5 rounded text-primary-600 hover:bg-primary-50" title="Télécharger">
                      <Download size={15} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
