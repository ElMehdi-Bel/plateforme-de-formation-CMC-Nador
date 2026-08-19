import { useEffect, useState } from 'react'
import { BookOpen, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import { groupeService } from '../../services/groupeService'
import { moduleService } from '../../services/moduleService'
import { noteService } from '../../services/noteService'

function moyenneColor(m) {
  if (m === null || m === undefined) return 'text-gray-400'
  if (m >= 12) return 'text-green-600 font-bold'
  if (m >= 10) return 'text-orange-500 font-bold'
  return 'text-red-600 font-bold'
}

function NoteCell({ value, max, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 transition-colors group"
    >
      {value !== null && value !== undefined ? (
        <span className="font-semibold text-gray-800">{value}<span className="text-gray-400 text-xs">/{max}</span></span>
      ) : (
        <span className="text-gray-300 text-sm italic">—</span>
      )}
      <Pencil size={12} className="text-gray-300 group-hover:text-primary-500 transition-colors" />
    </button>
  )
}

function NoteModal({ isOpen, onClose, entry, type, moduleNom, onSaved }) {
  const max = type === 'CC' ? 20 : 40
  const [valeur, setValeur] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen && entry) {
      const current = type === 'CC' ? entry.cc : entry.efm
      setValeur(current !== null && current !== undefined ? String(current) : '')
    }
  }, [isOpen, entry, type])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const v = parseFloat(valeur)
    if (isNaN(v) || v < 0 || v > max) {
      toast.error(`La note doit être entre 0 et ${max}`)
      return
    }
    setSaving(true)
    try {
      await noteService.saisirNote({
        stagiaireId: entry.stagiaireId,
        moduleId: entry.moduleId,
        typeEvaluation: type,
        valeur: v,
        commentaire: '',
      })
      toast.success('Note enregistrée')
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  if (!entry) return null
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${type} de ${entry.stagiairePrenom} ${entry.stagiaireNom} — ${moduleNom}`} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Note (/{max})</label>
          <input
            type="number"
            step="0.25"
            min="0"
            max={max}
            className="input-field"
            value={valeur}
            onChange={e => setValeur(e.target.value)}
            autoFocus
            placeholder={`0 - ${max}`}
          />
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Spinner size="sm" /> : null}
            Enregistrer
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function NotesPage() {
  const [groupes, setGroupes] = useState([])
  const [modules, setModules] = useState([])
  const [selectedGroupe, setSelectedGroupe] = useState('')
  const [selectedModule, setSelectedModule] = useState('')
  const [grille, setGrille] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingInit, setLoadingInit] = useState(true)
  const [modal, setModal] = useState({ open: false, entry: null, type: null })

  useEffect(() => {
    Promise.all([groupeService.getAll(), moduleService.getAll()])
      .then(([g, m]) => {
        setGroupes(g.data.data || [])
        setModules(m.data.data || [])
      })
      .catch(() => toast.error('Erreur chargement des données'))
      .finally(() => setLoadingInit(false))
  }, [])

  const handleAfficher = async () => {
    if (!selectedGroupe || !selectedModule) {
      toast.error('Veuillez choisir un groupe et un module')
      return
    }
    setLoading(true)
    try {
      const r = await noteService.getGrille(selectedGroupe, selectedModule)
      setGrille(r.data.data || [])
    } catch {
      toast.error('Erreur lors du chargement de la grille')
    } finally {
      setLoading(false)
    }
  }

  const handleSaved = () => handleAfficher()

  const selectedModuleNom = modules.find(m => String(m.id) === String(selectedModule))?.nom || ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Notes</h1>
        <p className="text-gray-500 text-sm mt-1">Saisir et consulter les notes CC et EFM par module</p>
      </div>

      {loadingInit ? (
        <Spinner className="mt-16" size="lg" />
      ) : (
        <>
          {/* Filtres */}
          <div className="card">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-48">
                <label className="label">Groupe</label>
                <select className="input-field" value={selectedGroupe} onChange={e => { setSelectedGroupe(e.target.value); setGrille([]) }}>
                  <option value="">-- Choisir un groupe --</option>
                  {groupes.map(g => <option key={g.id} value={g.id}>{g.nom}{g.code ? ` (${g.code})` : ''}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-48">
                <label className="label">Module</label>
                <select className="input-field" value={selectedModule} onChange={e => { setSelectedModule(e.target.value); setGrille([]) }}>
                  <option value="">-- Choisir un module --</option>
                  {modules.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                </select>
              </div>
              <button onClick={handleAfficher} disabled={loading} className="btn-primary flex items-center gap-2">
                {loading ? <Spinner size="sm" /> : <BookOpen size={16} />}
                Afficher
              </button>
            </div>
          </div>

          {/* Grille */}
          {loading ? (
            <Spinner className="mt-16" size="lg" />
          ) : grille.length > 0 ? (
            <div className="card overflow-hidden p-0">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">
                  Grille — {selectedModuleNom}
                  <span className="text-gray-400 font-normal text-sm ml-2">({grille.length} stagiaire{grille.length > 1 ? 's' : ''})</span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Cliquez sur une cellule CC ou EFM pour saisir la note</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-5 py-3 text-xs font-medium text-gray-500">Stagiaire</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 text-center">CC (/20)</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 text-center">EFM (/40)</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 text-center">Moy. Module (/20)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {grille.map(entry => (
                      <tr key={entry.stagiaireId} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-800">
                          {entry.stagiairePrenom} {entry.stagiaireNom}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <NoteCell
                            value={entry.cc}
                            max={20}
                            onClick={() => setModal({ open: true, entry, type: 'CC' })}
                          />
                        </td>
                        <td className="px-5 py-3 text-center">
                          <NoteCell
                            value={entry.efm}
                            max={40}
                            onClick={() => setModal({ open: true, entry, type: 'EFM' })}
                          />
                        </td>
                        <td className="px-5 py-3 text-center">
                          {entry.moyenne !== null && entry.moyenne !== undefined ? (
                            <span className={moyenneColor(entry.moyenne)}>
                              {Number(entry.moyenne).toFixed(2)}/20
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : selectedGroupe && selectedModule && !loading ? (
            <div className="card text-center py-12">
              <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Aucun stagiaire trouvé pour ce groupe/module</p>
            </div>
          ) : null}
        </>
      )}

      <NoteModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, entry: null, type: null })}
        entry={modal.entry}
        type={modal.type}
        moduleNom={selectedModuleNom}
        onSaved={handleSaved}
      />
    </div>
  )
}
