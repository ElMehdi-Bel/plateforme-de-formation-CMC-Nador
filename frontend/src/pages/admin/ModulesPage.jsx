import { useEffect, useState, useRef } from 'react'
import {
  ChevronDown, ChevronRight, School, BookOpen,
  Clock, Plus, Pencil, Trash2, Check, Upload, UserCheck, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { filiereService } from '../../services/filiereService'
import { moduleService } from '../../services/moduleService'
import { importService } from '../../services/importService'
import { userService } from '../../services/userService'
import { useAuth } from '../../context/AuthContext'

// ── Formulaire Module ───────────────────────────────────────────────────────
function ModuleForm({ initial, filiereId, filieres, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    nom: initial?.nom || '',
    code: initial?.code || '',
    volumeHoraire: initial?.volumeHoraire || '',
    anneeFormation: initial?.anneeFormation || '',
    coefficient: initial?.coefficient ?? 1.0,
    filiereId: filiereId || initial?.filiereId || '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.nom.trim()) return toast.error('Le nom est obligatoire')
    if (!form.filiereId) return toast.error('La filière est obligatoire')
    onSubmit({
      nom: form.nom.trim(),
      code: form.code.trim() || null,
      volumeHoraire: form.volumeHoraire ? parseInt(form.volumeHoraire) : null,
      anneeFormation: form.anneeFormation ? parseInt(form.anneeFormation) : null,
      coefficient: parseFloat(form.coefficient) || 1.0,
      filiereId: parseInt(form.filiereId),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Filière *</label>
        <select className="input-field" value={form.filiereId} onChange={e => set('filiereId', e.target.value)}>
          <option value="">-- Choisir une filière --</option>
          {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Nom du module *</label>
        <input className="input-field" value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Ex: Analyse des circuits électriques" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Code module</label>
          <input className="input-field" value={form.code} onChange={e => set('code', e.target.value)} placeholder="Ex: M104" />
        </div>
        <div>
          <label className="label">Année de formation</label>
          <select className="input-field" value={form.anneeFormation} onChange={e => set('anneeFormation', e.target.value)}>
            <option value="">-- Choisir --</option>
            <option value="1">1ère année</option>
            <option value="2">2ème année</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Masse horaire (h)</label>
          <input className="input-field" type="number" min="1" value={form.volumeHoraire} onChange={e => set('volumeHoraire', e.target.value)} placeholder="Ex: 90" />
        </div>
        <div>
          <label className="label">Coefficient</label>
          <input className="input-field" type="number" step="0.5" min="0.5" max="5" value={form.coefficient} onChange={e => set('coefficient', e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Annuler</button>
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
          {loading ? <Spinner size="sm" /> : <Check size={16} />}
          {initial ? 'Modifier' : 'Ajouter'}
        </button>
      </div>
    </form>
  )
}

// ── Modal assignation formateur ─────────────────────────────────────────────
function FormateurModal({ isOpen, moduleName, formateurs, currentFormateurId, onSave, onCancel, loading }) {
  const [selected, setSelected] = useState(currentFormateurId ?? '')

  useEffect(() => {
    setSelected(currentFormateurId ?? '')
  }, [currentFormateurId, isOpen])

  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-warm-900">Assigner un formateur</h3>
          <button onClick={onCancel} className="text-warm-400 hover:text-warm-600"><X size={18}/></button>
        </div>
        <p className="text-xs text-warm-500 truncate">{moduleName}</p>
        <div>
          <label className="label">Formateur</label>
          <select
            className="input-field"
            value={selected}
            onChange={e => setSelected(e.target.value)}
          >
            <option value="">— Aucun formateur —</option>
            {formateurs.map(f => (
              <option key={f.id} value={f.id}>{f.fullName}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <button onClick={onCancel} className="btn-secondary">Annuler</button>
          <button
            onClick={() => onSave(selected ? parseInt(selected) : null)}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? <Spinner size="sm" /> : <Check size={16} />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Confirmation suppression ────────────────────────────────────────────────
// ── Page principale ─────────────────────────────────────────────────────────
export default function ModulesPage() {
  const { isAdmin, isChefPole } = useAuth()
  const canCrud = isAdmin        // "Gérer les modules" = Administrateur
  const canAssign = isChefPole   // "Affecter les modules aux formateurs" = Chef de pôle

  const [filieres, setFilieres]   = useState([])
  const [modules, setModules]     = useState({})
  const [expanded, setExpanded]   = useState({})
  const [anneeFilter, setAnneeFilter] = useState('')
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [importing, setImporting] = useState(false)
  const [formateurs, setFormateurs] = useState([])
  const fileRef = useRef()

  const [modalModule, setModalModule]       = useState({ open: false, data: null, filiereId: null })
  const [modalFormateur, setModalFormateur] = useState({ open: false, moduleId: null, moduleName: '', currentFormateurId: null })
  const [confirmDelete, setConfirmDelete]   = useState({ open: false, id: null, nom: '', filiereId: null })

  useEffect(() => {
    loadFilieres()
    userService.findAll({ role: 'FORMATEUR', size: 1000 })
      .then(r => setFormateurs(r.data.data?.content || []))
      .catch(() => {})
  }, [])

  const loadFilieres = () => {
    setLoading(true)
    filiereService.getAll()
      .then(r => setFilieres(r.data.data || []))
      .catch(() => toast.error('Erreur chargement filières'))
      .finally(() => setLoading(false))
  }

  const loadModules = async (filiereId) => {
    try {
      const r = await moduleService.findByFiliere(filiereId)
      setModules(prev => ({ ...prev, [filiereId]: r.data.data || [] }))
    } catch {
      toast.error('Erreur chargement modules')
    }
  }

  const toggleFiliere = async (id) => {
    const isOpen = expanded[id]
    setExpanded(prev => ({ ...prev, [id]: !isOpen }))
    if (!isOpen) await loadModules(id)
  }

  // ── Import Excel ──
  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.name.match(/\.(xlsx|xls)$/)) return toast.error('Fichier Excel requis (.xlsx ou .xls)')
    setImporting(true)
    try {
      const r = await importService.importExcel(file)
      const { modules: m } = r.data.data
      toast.success(`Import réussi : ${m} module(s) ajouté(s)`)
      setModules({}); setExpanded({})
      loadFilieres()
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l'import")
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  // ── CRUD Module ──
  const handleSaveModule = async (data) => {
    setSaving(true)
    try {
      if (modalModule.data) {
        await moduleService.update(modalModule.data.id, data)
        toast.success('Module modifié')
      } else {
        await moduleService.create(data)
        toast.success('Module ajouté')
      }
      setModalModule({ open: false, data: null, filiereId: null })
      await loadModules(data.filiereId)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally { setSaving(false) }
  }

  const handleDeleteModule = async () => {
    setSaving(true)
    const filiereId = confirmDelete.filiereId
    try {
      await moduleService.delete(confirmDelete.id)
      toast.success('Module supprimé')
      setConfirmDelete({ open: false })
      await loadModules(filiereId)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur suppression')
    } finally { setSaving(false) }
  }

  // ── Assignation formateur ──
  const handleSaveFormateur = async (formateurId) => {
    setSaving(true)
    const { moduleId, currentFormateurId } = modalFormateur
    // Find which filiereId this module belongs to
    const filiereId = Object.keys(modules).find(fid =>
      modules[fid]?.some(m => m.id === moduleId)
    )
    try {
      if (formateurId) {
        await moduleService.assignFormateur(moduleId, formateurId)
        toast.success('Formateur assigné')
      } else if (currentFormateurId) {
        await moduleService.removeFormateur(moduleId)
        toast.success('Formateur retiré')
      }
      setModalFormateur({ open: false })
      if (filiereId) await loadModules(parseInt(filiereId))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally { setSaving(false) }
  }

  const filtreModules = (arr) =>
    !arr ? arr : anneeFilter ? arr.filter(m => String(m.anneeFormation) === anneeFilter) : arr

  const totalModules = Object.values(modules)
    .reduce((s, arr) => s + filtreModules(arr).length, 0)

  return (
    <div className="space-y-6 animate-fade-in">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Gestion des Modules</h1>
          <p className="page-subtitle">
            {filieres.length} filière(s)
            {totalModules > 0 && ` · ${totalModules} module(s) chargé(s)`}
          </p>
        </div>
        {canCrud && (
          <div className="flex gap-3">
            <button
              onClick={() => setModalModule({ open: true, data: null, filiereId: null })}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus size={16} /> Nouveau module
            </button>
            <button
              onClick={() => fileRef.current.click()}
              disabled={importing}
              className="btn-primary flex items-center gap-2"
            >
              {importing ? <Spinner size="sm" /> : <Upload size={16} />}
              {importing ? 'Import...' : 'Importer Excel'}
            </button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
          </div>
        )}
      </div>

      {/* Filtre par année */}
      <div className="flex rounded-lg border border-warm-200 overflow-hidden text-sm w-fit">
        {[
          { value: '',  label: 'Toutes les années' },
          { value: '1', label: '1ère année' },
          { value: '2', label: '2ème année' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setAnneeFilter(f.value)}
            className={`px-3 py-1.5 transition-colors ${
              anneeFilter === f.value ? 'bg-primary-600 text-white' : 'bg-white text-warm-600 hover:bg-warm-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Format Excel */}
      {canCrud && (
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-3 text-xs text-primary-800">
          <strong>Format Excel :</strong>&nbsp;
          Filière | Année de formation | Code module | Module | Masse horaire
          &nbsp;— ligne 1 = en-têtes, données à partir de la ligne 2.
        </div>
      )}

      {/* Astuce formateur */}
   
      {/* Liste filières avec modules */}
      {loading ? (
        <Spinner className="mt-16" size="lg" />
      ) : filieres.length === 0 ? (
        <div className="card text-center py-16">
          <BookOpen size={48} className="mx-auto text-warm-300 mb-4" />
          <p className="text-warm-500 font-medium">Aucun module</p>
          <p className="text-warm-400 text-sm mt-1">Importez un fichier Excel ou ajoutez des modules manuellement</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filieres.map(filiere => {
          const filiereModules = filtreModules(modules[filiere.id])
          return (
            <div key={filiere.id} className="card overflow-hidden p-0">

              {/* En-tête filière */}
              <div className="flex items-center justify-between px-5 py-4 hover:bg-warm-50">
                <button
                  onClick={() => toggleFiliere(filiere.id)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  {expanded[filiere.id]
                    ? <ChevronDown size={18} className="text-primary-600 flex-shrink-0" />
                    : <ChevronRight size={18} className="text-warm-400 flex-shrink-0" />}
                  <School size={20} className="text-primary-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-warm-900">{filiere.nom}</p>
                    {filiere.code && <p className="text-xs text-warm-400">Code : {filiere.code}</p>}
                  </div>
                </button>
                <div className="flex items-center gap-3 ml-4">
                  {filiereModules && (
                    <span className="text-xs text-warm-400 flex items-center gap-1">
                      <BookOpen size={13} /> {filiereModules.length} module(s)
                    </span>
                  )}
                  {canCrud && (
                    <button
                      onClick={() => setModalModule({ open: true, data: null, filiereId: filiere.id })}
                      className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
                      title="Ajouter un module"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Modules */}
              {expanded[filiere.id] && (
                <div className="border-t border-warm-100">
                  {!modules[filiere.id] ? (
                    <div className="py-6 flex justify-center"><Spinner size="sm" /></div>
                  ) : filiereModules.length === 0 ? (
                    <div className="py-5 text-center text-warm-400 text-sm">
                      {anneeFilter ? 'Aucun module pour cette année' : 'Aucun module'}{canCrud && (
                        <>
                          {' '}—{' '}
                          <button
                            onClick={() => setModalModule({ open: true, data: null, filiereId: filiere.id })}
                            className="text-primary-600 hover:underline"
                          >
                            Ajouter un module
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-warm-50/80 text-left">
                            <th className="px-5 py-2 text-xs font-bold text-warm-500 uppercase tracking-wider">Code</th>
                            <th className="px-5 py-2 text-xs font-bold text-warm-500 uppercase tracking-wider">Module</th>
                            <th className="px-5 py-2 text-xs font-bold text-warm-500 uppercase tracking-wider text-center">Année</th>
                            <th className="px-5 py-2 text-xs font-bold text-warm-500 uppercase tracking-wider text-right">Masse h.</th>
                            <th className="px-5 py-2 text-xs font-bold text-warm-500 uppercase tracking-wider text-right">Coef.</th>
                            <th className="px-5 py-2 text-xs font-bold text-warm-500 uppercase tracking-wider">Formateur</th>
                            {canCrud && <th className="px-5 py-2 text-xs font-bold text-warm-500 uppercase tracking-wider text-center">Actions</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-warm-50">
                          {filiereModules.map(mod => (
                            <tr key={mod.id} className="hover:bg-primary-50/30 transition-colors">
                              <td className="px-5 py-2.5 font-mono text-xs text-warm-500">{mod.code || '—'}</td>
                              <td className="px-5 py-2.5 text-warm-800 font-medium max-w-[260px] truncate">{mod.nom}</td>
                              <td className="px-5 py-2.5 text-center">
                                {mod.anneeFormation
                                  ? <span className="badge-info">{mod.anneeFormation}A</span>
                                  : <span className="text-warm-300">—</span>}
                              </td>
                              <td className="px-5 py-2.5 text-right">
                                {mod.volumeHoraire
                                  ? <span className="font-medium text-primary-700 flex items-center justify-end gap-1"><Clock size={12} />{mod.volumeHoraire}h</span>
                                  : <span className="text-warm-300">—</span>}
                              </td>
                              <td className="px-5 py-2.5 text-right text-warm-600">{mod.coefficient}</td>
                              <td className="px-5 py-2.5">
                                {!canAssign ? (
                                  mod.formateurNom
                                    ? <span className="flex items-center gap-1.5 text-warm-700 text-xs font-medium"><UserCheck size={13} className="text-primary-500" />{mod.formateurNom}</span>
                                    : <span className="text-warm-300 text-xs">—</span>
                                ) : mod.formateurNom ? (
                                  <button
                                    onClick={() => setModalFormateur({ open: true, moduleId: mod.id, moduleName: mod.nom, currentFormateurId: mod.formateurId })}
                                    className="flex items-center gap-1.5 text-primary-700 hover:text-primary-900 text-xs font-medium group"
                                    title="Changer de formateur"
                                  >
                                    <UserCheck size={13} className="text-primary-500" />
                                    <span className="group-hover:underline">{mod.formateurNom}</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setModalFormateur({ open: true, moduleId: mod.id, moduleName: mod.nom, currentFormateurId: null })}
                                    className="text-xs text-warm-400 hover:text-primary-600 border border-dashed border-warm-300 hover:border-primary-400 rounded-lg px-2 py-0.5 transition-colors"
                                  >
                                    + Assigner
                                  </button>
                                )}
                              </td>
                              {canCrud && (
                                <td className="px-5 py-2.5 text-center">
                                  <div className="flex justify-center gap-2">
                                    <button
                                      onClick={() => setModalModule({ open: true, data: { ...mod, filiereId: filiere.id }, filiereId: filiere.id })}
                                      className="p-1.5 rounded text-blue-500 hover:bg-blue-50"
                                      title="Modifier"
                                    >
                                      <Pencil size={14} />
                                    </button>
                                    <button
                                      onClick={() => setConfirmDelete({ open: true, id: mod.id, nom: mod.nom, filiereId: filiere.id })}
                                      className="p-1.5 rounded text-red-400 hover:bg-red-50"
                                      title="Supprimer"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )})}
        </div>
      )}

      {/* Modal Module */}
      <Modal
        isOpen={modalModule.open}
        onClose={() => setModalModule({ open: false, data: null, filiereId: null })}
        title={modalModule.data ? 'Modifier le module' : 'Nouveau module'}
      >
        <ModuleForm
          initial={modalModule.data}
          filiereId={modalModule.filiereId}
          filieres={filieres}
          onSubmit={handleSaveModule}
          onCancel={() => setModalModule({ open: false, data: null, filiereId: null })}
          loading={saving}
        />
      </Modal>

      {/* Modal Formateur */}
      <FormateurModal
        isOpen={modalFormateur.open}
        moduleName={modalFormateur.moduleName}
        formateurs={formateurs}
        currentFormateurId={modalFormateur.currentFormateurId}
        onSave={handleSaveFormateur}
        onCancel={() => setModalFormateur({ open: false })}
        loading={saving}
      />

      {/* Confirmation suppression */}
      <ConfirmDialog
        isOpen={confirmDelete.open}
        message={`Supprimer le module "${confirmDelete.nom}" ? Cette action est irréversible.`}
        onConfirm={handleDeleteModule}
        onCancel={() => setConfirmDelete({ open: false })}
        loading={saving}
      />
    </div>
  )
}
