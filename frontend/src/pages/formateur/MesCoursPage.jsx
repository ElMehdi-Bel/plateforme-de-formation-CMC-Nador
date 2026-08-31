import { useEffect, useState } from 'react'
import { BookOpen, Upload, FileText, Trash2, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../../components/ui/Spinner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { moduleService } from '../../services/moduleService'
import { coursService } from '../../services/coursService'
import { useAuth } from '../../context/AuthContext'

function humanSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

export default function MesCoursPage() {
  const { user } = useAuth()
  const [modules, setModules] = useState([])
  const [moduleId, setModuleId] = useState('')
  const [cours, setCours] = useState([])
  const [loading, setLoading] = useState(false)
  const [titre, setTitre] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null })

  useEffect(() => {
    if (!user?.userId) return
    moduleService.findByFormateur(user.userId)
      .then(r => setModules(r.data.data || []))
      .catch(() => toast.error('Erreur chargement modules'))
  }, [user])

  const loadCours = (id) => {
    if (!id) { setCours([]); return }
    setLoading(true)
    coursService.findByModule(id, { page: 0, size: 100 })
      .then(r => setCours(r.data.data?.content || []))
      .catch(() => toast.error('Erreur chargement des supports'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadCours(moduleId) }, [moduleId])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!moduleId) return toast.error('Choisissez un module')
    if (!titre.trim()) return toast.error('Le titre est obligatoire')
    if (!file) return toast.error('Sélectionnez un fichier')
    setUploading(true)
    try {
      await coursService.upload(moduleId, titre.trim(), null, file)
      toast.success('Support déposé')
      setTitre(''); setFile(null)
      e.target.reset?.()
      loadCours(moduleId)
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors du dépôt")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    setUploading(true)
    try {
      await coursService.delete(confirmDelete.id)
      toast.success('Support supprimé')
      setConfirmDelete({ open: false, id: null })
      loadCours(moduleId)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur suppression')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Mes Cours</h1>
        <p className="page-subtitle">Déposer et gérer les supports de cours par module</p>
      </div>

      <div className="card">
        <label className="label">Module</label>
        <select className="input-field max-w-md" value={moduleId} onChange={e => setModuleId(e.target.value)}>
          <option value="">-- Choisir un module --</option>
          {modules.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
        </select>
      </div>

      {moduleId && (
        <>
          <form onSubmit={handleUpload} className="card space-y-4">
            <h3 className="font-semibold text-warm-900 flex items-center gap-2">
              <Upload size={16} className="text-primary-600" /> Nouveau support
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Titre *</label>
                <input className="input-field" value={titre} onChange={e => setTitre(e.target.value)} placeholder="Ex: Chapitre 1 — Introduction" />
              </div>
              <div>
                <label className="label">Fichier * (PDF, vidéo, …)</label>
                <input type="file" className="input-field text-sm" onChange={e => setFile(e.target.files[0] || null)} />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={uploading} className="btn-primary flex items-center gap-2">
                {uploading ? <Spinner size="sm" /> : <Upload size={16} />} Déposer
              </button>
            </div>
          </form>

          <div className="card p-0 overflow-hidden">
            {loading ? (
              <div className="py-10 flex justify-center"><Spinner size="md" /></div>
            ) : cours.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen size={40} className="mx-auto text-warm-300 mb-3" />
                <p className="text-warm-500 text-sm">Aucun support pour ce module</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-warm-50/80 text-left">
                    <th className="px-5 py-2.5 text-xs font-bold text-warm-500 uppercase tracking-wider">Titre</th>
                    <th className="px-5 py-2.5 text-xs font-bold text-warm-500 uppercase tracking-wider">Fichier</th>
                    <th className="px-5 py-2.5 text-xs font-bold text-warm-500 uppercase tracking-wider text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-50">
                  {cours.map(c => (
                    <tr key={c.id} className="hover:bg-primary-50/30">
                      <td className="px-5 py-3 font-medium text-warm-800">{c.titre}</td>
                      <td className="px-5 py-3 text-warm-500 text-xs">
                        <span className="flex items-center gap-1.5"><FileText size={13} />{c.fichierNom} · {humanSize(c.fichierTaille)}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <a href={c.fichierUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded text-primary-600 hover:bg-primary-50" title="Télécharger">
                            <Download size={14} />
                          </a>
                          <button onClick={() => setConfirmDelete({ open: true, id: c.id })} className="p-1.5 rounded text-red-400 hover:bg-red-50" title="Supprimer">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={confirmDelete.open}
        message="Supprimer ce support de cours ?"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
        loading={uploading}
      />
    </div>
  )
}
