import { useEffect, useState } from 'react'
import {
  ChevronDown, ChevronRight, School, Users,
  Plus, Pencil, Trash2, Check, Calendar, BookOpen, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { filiereService, groupeService } from '../../services/filiereService'
import { moduleService } from '../../services/moduleService'

// ── Formulaire Filière ──────────────────────────────────────────────────────
function FiliereForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    nom: initial?.nom || '',
    code: initial?.code || '',
    dureeMois: initial?.dureeMois || '',
    description: initial?.description || '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.nom.trim()) return toast.error('Le nom est obligatoire')
    onSubmit({
      nom: form.nom.trim(),
      code: form.code.trim() || null,
      dureeMois: form.dureeMois ? parseInt(form.dureeMois) : null,
      description: form.description.trim() || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Nom de la filière *</label>
        <input className="input-field" value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Ex: Génie Industriel" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Code</label>
          <input className="input-field" value={form.code} onChange={e => set('code', e.target.value)} placeholder="Ex: GI" />
        </div>
        <div>
          <label className="label">Durée (mois)</label>
          <input className="input-field" type="number" min="1" max="36" value={form.dureeMois} onChange={e => set('dureeMois', e.target.value)} placeholder="Ex: 24" />
        </div>
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input-field" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optionnelle..." />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Annuler</button>
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
          {loading ? <Spinner size="sm" /> : <Check size={16} />}
          {initial ? 'Modifier' : 'Créer'}
        </button>
      </div>
    </form>
  )
}

// ── Calcul automatique des dates depuis l'année de formation ───────────────
function datesFromAnnee(annee) {
  const match = annee.match(/(\d{4})/)
  if (!match) return { dateDebut: null, dateFin: null }
  const debut = parseInt(match[1])
  const fin = debut + 1
  return { dateDebut: `${debut}-09-01`, dateFin: `${fin}-06-30` }
}

// ── Formulaire Groupe ───────────────────────────────────────────────────────
function GroupeForm({ initial, filiereId, filieres, onSubmit, onCancel, loading }) {
  const currentYear = new Date().getFullYear()
  const annees = [-1, 0, 1, 2].map(offset => {
    const y = currentYear + offset
    return `${y}/${y + 1}`
  })

  const [form, setForm] = useState({
    nom:            initial?.nom            || '',
    code:           initial?.code           || '',
    anneeFormation: initial?.anneeFormation || `${currentYear}/${currentYear + 1}`,
    filiereId:      filiereId || initial?.filiereId || '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const preview = datesFromAnnee(form.anneeFormation)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.nom.trim()) return toast.error('Le nom est obligatoire')
    if (!form.filiereId)  return toast.error('La filière est obligatoire')
    const { dateDebut, dateFin } = datesFromAnnee(form.anneeFormation)
    onSubmit({
      nom:            form.nom.trim(),
      code:           form.code.trim() || null,
      anneeFormation: form.anneeFormation,
      dateDebut,
      dateFin,
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Nom du groupe *</label>
          <input className="input-field" value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Ex: GI-101" />
        </div>
        <div>
          <label className="label">Code</label>
          <input className="input-field" value={form.code} onChange={e => set('code', e.target.value)} placeholder="Ex: G01" />
        </div>
      </div>
      <div>
        <label className="label">Année de formation *</label>
        <select className="input-field" value={form.anneeFormation} onChange={e => set('anneeFormation', e.target.value)}>
          {annees.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        {preview.dateDebut && (
          <p className="text-xs text-warm-400 mt-1.5 flex items-center gap-1">
            <Calendar size={11} />
            Du <strong className="text-warm-600">01 septembre {form.anneeFormation.split('/')[0]}</strong>
            &nbsp;au&nbsp;
            <strong className="text-warm-600">30 juin {form.anneeFormation.split('/')[1]}</strong>
          </p>
        )}
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Annuler</button>
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
          {loading ? <Spinner size="sm" /> : <Check size={16} />}
          {initial ? 'Modifier' : 'Créer'}
        </button>
      </div>
    </form>
  )
}

// ── Modal modules du groupe ─────────────────────────────────────────────────
function ModulesGroupeModal({ isOpen, groupe, filiereId, onClose }) {
  const [allModules, setAllModules]           = useState([])
  const [selectedIds, setSelectedIds]         = useState(new Set())
  const [loadingModules, setLoadingModules]   = useState(false)
  const [saving, setSaving]                   = useState(false)

  useEffect(() => {
    if (!isOpen || !groupe) return
    setLoadingModules(true)
    Promise.all([
      moduleService.findByFiliere(filiereId),
      moduleService.findByGroupe(groupe.id),
    ])
      .then(([allR, assignedR]) => {
        setAllModules(allR.data.data || [])
        const assigned = assignedR.data.data || []
        setSelectedIds(new Set(assigned.map(m => m.id)))
      })
      .catch(() => toast.error('Erreur chargement modules'))
      .finally(() => setLoadingModules(false))
  }, [isOpen, groupe, filiereId])

  const toggle = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await groupeService.setModules(groupe.id, [...selectedIds])
      toast.success(`${selectedIds.size} module(s) assigné(s) au groupe ${groupe.nom}`)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la sauvegarde')
    } finally { setSaving(false) }
  }

  if (!isOpen) return null

  const byAnnee = allModules.reduce((acc, m) => {
    const key = m.anneeFormation ? `${m.anneeFormation}ère/ème année` : 'Non défini'
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-warm-100">
          <div>
            <h3 className="font-display font-semibold text-warm-900">Modules du groupe</h3>
            <p className="text-xs text-warm-500 mt-0.5">{groupe?.nom}</p>
          </div>
          <button onClick={onClose} className="text-warm-400 hover:text-warm-600 p-1 rounded-lg hover:bg-warm-100">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loadingModules ? (
            <div className="flex justify-center py-8"><Spinner size="md" /></div>
          ) : allModules.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen size={36} className="mx-auto text-warm-300 mb-3" />
              <p className="text-warm-500 text-sm">Aucun module dans cette filière.</p>
              <p className="text-warm-400 text-xs mt-1">Ajoutez d'abord des modules dans la page <strong>Modules</strong>.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-xs text-warm-500">
                {selectedIds.size} module(s) sélectionné(s) sur {allModules.length}
              </p>
              {Object.entries(byAnnee).sort().map(([anneeLabel, mods]) => (
                <div key={anneeLabel}>
                  <p className="text-[11px] font-bold text-warm-500 uppercase tracking-wider mb-2">{anneeLabel}</p>
                  <div className="space-y-1.5">
                    {mods.map(m => (
                      <label
                        key={m.id}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all
                          ${selectedIds.has(m.id)
                            ? 'bg-primary-50 border-primary-200'
                            : 'bg-warm-50 border-warm-100 hover:border-primary-200 hover:bg-primary-50/40'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(m.id)}
                          onChange={() => toggle(m.id)}
                          className="w-4 h-4 rounded accent-primary-600 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-warm-800 truncate">{m.nom}</p>
                          <p className="text-xs text-warm-400 flex items-center gap-2 mt-0.5">
                            {m.code && <span className="font-mono">{m.code}</span>}
                            {m.volumeHoraire && <span className="flex items-center gap-0.5"><Clock size={10}/>{m.volumeHoraire}h</span>}
                            {m.formateurNom && <span className="text-primary-600">· {m.formateurNom}</span>}
                          </p>
                        </div>
                        {selectedIds.has(m.id) && (
                          <Check size={14} className="text-primary-600 flex-shrink-0" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-warm-100">
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs text-warm-500 hover:text-warm-700"
          >
            Tout désélectionner
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary">Annuler</button>
            <button onClick={handleSave} disabled={saving || loadingModules} className="btn-primary flex items-center gap-2">
              {saving ? <Spinner size="sm" /> : <Check size={16} />}
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Confirmation suppression ────────────────────────────────────────────────
// ── Page principale ─────────────────────────────────────────────────────────
export default function FilieresPage() {
  const [filieres, setFilieres]   = useState([])
  const [groupes, setGroupes]     = useState({})
  const [expanded, setExpanded]   = useState({})
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)

  const [modalFiliere, setModalFiliere]   = useState({ open: false, data: null })
  const [modalGroupe, setModalGroupe]     = useState({ open: false, data: null, filiereId: null })
  const [modalModules, setModalModules]   = useState({ open: false, groupe: null, filiereId: null })
  const [confirmDelete, setConfirmDelete] = useState({ open: false, type: null, id: null, nom: '', filiereId: null })

  useEffect(() => { loadFilieres() }, [])

  const loadFilieres = () => {
    setLoading(true)
    filiereService.getAll()
      .then(r => setFilieres(r.data.data || []))
      .catch(() => toast.error('Erreur chargement filières'))
      .finally(() => setLoading(false))
  }

  const loadGroupes = async (filiereId) => {
    try {
      const r = await groupeService.findAll(filiereId)
      setGroupes(prev => ({ ...prev, [filiereId]: r.data.data || [] }))
    } catch {
      toast.error('Erreur chargement groupes')
    }
  }

  const toggleFiliere = async (id) => {
    const isOpen = expanded[id]
    setExpanded(prev => ({ ...prev, [id]: !isOpen }))
    if (!isOpen) await loadGroupes(id)
  }

  // ── CRUD Filière ──
  const handleSaveFiliere = async (data) => {
    setSaving(true)
    try {
      if (modalFiliere.data) {
        await filiereService.update(modalFiliere.data.id, data)
        toast.success('Filière modifiée')
      } else {
        await filiereService.create(data)
        toast.success('Filière créée')
      }
      setModalFiliere({ open: false, data: null })
      loadFilieres()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally { setSaving(false) }
  }

  const handleDeleteFiliere = async () => {
    setSaving(true)
    try {
      await filiereService.delete(confirmDelete.id)
      toast.success('Filière supprimée')
      setConfirmDelete({ open: false })
      loadFilieres()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur suppression')
    } finally { setSaving(false) }
  }

  // ── CRUD Groupe ──
  const handleSaveGroupe = async (data) => {
    setSaving(true)
    try {
      if (modalGroupe.data) {
        await groupeService.update(modalGroupe.data.id, data)
        toast.success('Groupe modifié')
      } else {
        await groupeService.create(data)
        toast.success('Groupe créé')
      }
      setModalGroupe({ open: false, data: null, filiereId: null })
      await loadGroupes(data.filiereId)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally { setSaving(false) }
  }

  const handleDeleteGroupe = async () => {
    setSaving(true)
    const filiereId = confirmDelete.filiereId
    try {
      await groupeService.delete(confirmDelete.id)
      toast.success('Groupe supprimé')
      setConfirmDelete({ open: false })
      await loadGroupes(filiereId)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur suppression')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Filières & Groupes</h1>
          <p className="page-subtitle">{filieres.length} filière(s)</p>
        </div>
        <button
          onClick={() => setModalFiliere({ open: true, data: null })}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> Nouvelle filière
        </button>
      </div>

      {/* Liste */}
      {loading ? (
        <Spinner className="mt-16" size="lg" />
      ) : filieres.length === 0 ? (
        <div className="card text-center py-16">
          <School size={48} className="mx-auto text-warm-300 mb-4" />
          <p className="text-warm-500 font-medium">Aucune filière</p>
          <p className="text-warm-400 text-sm mt-1">Créez votre première filière</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filieres.map(filiere => (
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
                    <p className="text-xs text-warm-400 mt-0.5">
                      {filiere.code && <span className="mr-3">Code : {filiere.code}</span>}
                      {filiere.dureeMois && <span>{filiere.dureeMois} mois</span>}
                    </p>
                  </div>
                </button>

                {/* Actions */}
                <div className="flex items-center gap-1 ml-4">
                  <button
                    onClick={() => setModalGroupe({ open: true, data: null, filiereId: filiere.id })}
                    className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
                    title="Ajouter un groupe"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    onClick={() => setModalFiliere({ open: true, data: filiere })}
                    className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Modifier"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete({ open: true, type: 'filiere', id: filiere.id, nom: filiere.nom })}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Groupes */}
              {expanded[filiere.id] && (
                <div className="border-t border-warm-100">
                  {!groupes[filiere.id] ? (
                    <div className="py-6 flex justify-center"><Spinner size="sm" /></div>
                  ) : groupes[filiere.id].length === 0 ? (
                    <div className="py-5 text-center text-warm-400 text-sm">
                      Aucun groupe —{' '}
                      <button
                        onClick={() => setModalGroupe({ open: true, data: null, filiereId: filiere.id })}
                        className="text-primary-600 hover:underline"
                      >
                        Créer un groupe
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-warm-50/80 text-left">
                            <th className="px-5 py-2 text-xs font-bold text-warm-500 uppercase tracking-wider">Groupe</th>
                            <th className="px-5 py-2 text-xs font-bold text-warm-500 uppercase tracking-wider">Code</th>
                            <th className="px-5 py-2 text-xs font-bold text-warm-500 uppercase tracking-wider">Année</th>
                            <th className="px-5 py-2 text-xs font-bold text-warm-500 uppercase tracking-wider">Période</th>
                            <th className="px-5 py-2 text-xs font-bold text-warm-500 uppercase tracking-wider text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-warm-50">
                          {groupes[filiere.id].map(groupe => (
                            <tr key={groupe.id} className="hover:bg-primary-50/30 transition-colors">
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  <Users size={14} className="text-warm-400" />
                                  <span className="font-medium text-warm-800">{groupe.nom}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3 font-mono text-xs text-warm-500">{groupe.code || '—'}</td>
                              <td className="px-5 py-3">
                                {groupe.anneeFormation
                                  ? <span className="badge-info">{groupe.anneeFormation}</span>
                                  : <span className="text-warm-300">—</span>}
                              </td>
                              <td className="px-5 py-3 text-warm-500 text-xs">
                                {groupe.dateDebut || groupe.dateFin ? (
                                  <span className="flex items-center gap-1">
                                    <Calendar size={12} />
                                    {groupe.dateDebut || '?'} → {groupe.dateFin || '?'}
                                  </span>
                                ) : '—'}
                              </td>
                              <td className="px-5 py-3 text-center">
                                <div className="flex justify-center gap-2">
                                  <button
                                    onClick={() => setModalModules({ open: true, groupe, filiereId: filiere.id })}
                                    className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 flex items-center gap-1 text-xs font-medium border border-primary-200"
                                    title="Gérer les modules"
                                  >
                                    <BookOpen size={13} />
                                    Modules
                                  </button>
                                  <button
                                    onClick={() => setModalGroupe({ open: true, data: { ...groupe, filiereId: filiere.id }, filiereId: filiere.id })}
                                    className="p-1.5 rounded text-blue-500 hover:bg-blue-50"
                                    title="Modifier"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    onClick={() => setConfirmDelete({ open: true, type: 'groupe', id: groupe.id, nom: groupe.nom, filiereId: filiere.id })}
                                    className="p-1.5 rounded text-red-400 hover:bg-red-50"
                                    title="Supprimer"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Filière */}
      <Modal
        isOpen={modalFiliere.open}
        onClose={() => setModalFiliere({ open: false, data: null })}
        title={modalFiliere.data ? 'Modifier la filière' : 'Nouvelle filière'}
      >
        <FiliereForm
          initial={modalFiliere.data}
          onSubmit={handleSaveFiliere}
          onCancel={() => setModalFiliere({ open: false, data: null })}
          loading={saving}
        />
      </Modal>

      {/* Modal Groupe */}
      <Modal
        isOpen={modalGroupe.open}
        onClose={() => setModalGroupe({ open: false, data: null, filiereId: null })}
        title={modalGroupe.data ? 'Modifier le groupe' : 'Nouveau groupe'}
      >
        <GroupeForm
          initial={modalGroupe.data}
          filiereId={modalGroupe.filiereId}
          filieres={filieres}
          onSubmit={handleSaveGroupe}
          onCancel={() => setModalGroupe({ open: false, data: null, filiereId: null })}
          loading={saving}
        />
      </Modal>

      {/* Modal Modules du groupe */}
      <ModulesGroupeModal
        isOpen={modalModules.open}
        groupe={modalModules.groupe}
        filiereId={modalModules.filiereId}
        onClose={() => setModalModules({ open: false, groupe: null, filiereId: null })}
      />

      {/* Confirmation suppression */}
      <ConfirmDialog
        isOpen={confirmDelete.open}
        message={`Supprimer "${confirmDelete.nom}" ? Cette action est irréversible.`}
        onConfirm={confirmDelete.type === 'filiere' ? handleDeleteFiliere : handleDeleteGroupe}
        onCancel={() => setConfirmDelete({ open: false })}
        loading={saving}
      />
    </div>
  )
}
