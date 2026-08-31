import { useEffect, useState, useCallback, useRef } from 'react'
import { Upload, RefreshCw, LayoutGrid, Users, User, ChevronDown, Plus, Pencil, Trash2, Check } from 'lucide-react'
import { emploiService } from '../../services/emploiService'
import { groupeService } from '../../services/groupeService'
import { moduleService } from '../../services/moduleService'
import { userService } from '../../services/userService'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import { ANNEE_SCOLAIRE_DEFAULT, ANNEES_SCOLAIRES } from '../../config/constants'

// ─── Constantes ───────────────────────────────────────────────────────────────
const JOURS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI']
const JOURS_FR = { LUNDI: 'Lundi', MARDI: 'Mardi', MERCREDI: 'Mercredi', JEUDI: 'Jeudi', VENDREDI: 'Vendredi', SAMEDI: 'Samedi' }

const CRENEAUX = [
  { key: '08H30', debut: '08h30', fin: '11h00' },
  { key: '11H00', debut: '11h00', fin: '13h30' },
  { key: '13H30', debut: '13h30', fin: '16h00' },
  { key: '16H00', debut: '16h00', fin: '18h30' },
]

const SLOT_COLORS = {
  '08H30': { row: 'bg-blue-50/40',   time: 'bg-blue-100 text-blue-800 border-blue-200',     card: 'bg-white border-blue-200',   badge: 'bg-blue-100 text-blue-700' },
  '11H00': { row: 'bg-emerald-50/40',time: 'bg-emerald-100 text-emerald-800 border-emerald-200', card: 'bg-white border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
  '13H30': { row: 'bg-amber-50/40',  time: 'bg-amber-100 text-amber-800 border-amber-200',   card: 'bg-white border-amber-200',   badge: 'bg-amber-100 text-amber-700' },
  '16H00': { row: 'bg-purple-50/40', time: 'bg-purple-100 text-purple-800 border-purple-200',card: 'bg-white border-purple-200',  badge: 'bg-purple-100 text-purple-700' },
}

function getCreneauKey(creneau = '') {
  const c = creneau.toUpperCase().trim()
  if (c.startsWith('8H30') || c.startsWith('08H30') || c.includes('08H30')) return '08H30'
  if (c.startsWith('11H') || c.includes('11H00')) return '11H00'
  if (c.startsWith('13H') || c.includes('13H30')) return '13H30'
  if (c.startsWith('16H') || c.includes('16H00')) return '16H00'
  return null
}

// ─── Modal Ajouter / Modifier séance ─────────────────────────────────────────
function SeanceFormModal({ isOpen, onClose, seance, anneeScolaire, onSaved }) {
  const isEdit = !!seance
  const [groupes, setGroupes] = useState([])
  const [modules, setModules] = useState([])
  const [formateurs, setFormateurs] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    groupeId: '',
    moduleId: '',
    formateurId: '',
    jourSemaine: 'LUNDI',
    creneauKey: '08H30',
    salle: '',
    anneeScolaire,
  })

  // Charger les listes une seule fois à l'ouverture
  useEffect(() => {
    if (!isOpen) return
    setLoadingOptions(true)
    Promise.all([
      groupeService.getAll(),
      moduleService.getAll(),
      userService.findAll({ role: 'FORMATEUR', page: 0, size: 200 }),
    ])
      .then(([g, m, f]) => {
        setGroupes(g.data.data?.content || g.data.data || [])
        setModules(m.data.data || [])
        setFormateurs(f.data.data?.content || [])
      })
      .catch(() => toast.error('Erreur chargement des options'))
      .finally(() => setLoadingOptions(false))
  }, [isOpen])

  // Pré-remplir si modification
  useEffect(() => {
    if (!isOpen) return
    if (seance) {
      setForm({
        groupeId:    String(seance.groupeId ?? seance.groupe?.id ?? ''),
        moduleId:    String(seance.moduleId ?? seance.module?.id ?? ''),
        formateurId: String(seance.formateurId ?? seance.formateur?.id ?? ''),
        jourSemaine: seance.jourSemaine || 'LUNDI',
        creneauKey:  getCreneauKey(seance.creneau) || '08H30',
        salle:       seance.salle || '',
        anneeScolaire: seance.anneeScolaire || anneeScolaire,
      })
    } else {
      setForm({ groupeId: '', moduleId: '', formateurId: '', jourSemaine: 'LUNDI', creneauKey: '08H30', salle: '', anneeScolaire })
    }
  }, [isOpen, seance, anneeScolaire])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.groupeId || !form.moduleId || !form.formateurId) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    setSaving(true)
    const payload = {
      groupeId:    Number(form.groupeId),
      moduleId:    Number(form.moduleId),
      formateurId: Number(form.formateurId),
      jourSemaine: form.jourSemaine,
      creneauKey:  form.creneauKey,
      salle:       form.salle || null,
      anneeScolaire: form.anneeScolaire,
    }
    try {
      if (isEdit) {
        await emploiService.updateSeance(seance.id, payload)
        toast.success('Séance modifiée avec succès')
      } else {
        await emploiService.createSeance(payload)
        toast.success('Séance ajoutée avec succès')
      }
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Modifier la séance' : 'Ajouter une séance'} size="md">
      {loadingOptions ? (
        <div className="py-12 flex justify-center"><Spinner size="lg" /></div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Groupe */}
            <div className="col-span-2">
              <label className="label">Groupe <span className="text-red-500">*</span></label>
              <select className="input-field" value={form.groupeId} onChange={e => set('groupeId', e.target.value)} required>
                <option value="">-- Choisir un groupe --</option>
                {groupes.map(g => (
                  <option key={g.id} value={g.id}>{g.nom}{g.code ? ` (${g.code})` : ''}</option>
                ))}
              </select>
            </div>

            {/* Module */}
            <div className="col-span-2">
              <label className="label">Module <span className="text-red-500">*</span></label>
              <select className="input-field" value={form.moduleId} onChange={e => set('moduleId', e.target.value)} required>
                <option value="">-- Choisir un module --</option>
                {modules.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
              </select>
            </div>

            {/* Formateur */}
            <div className="col-span-2">
              <label className="label">Formateur <span className="text-red-500">*</span></label>
              <select className="input-field" value={form.formateurId} onChange={e => set('formateurId', e.target.value)} required>
                <option value="">-- Choisir un formateur --</option>
                {formateurs.map(f => (
                  <option key={f.id} value={f.id}>{f.prenom} {f.nom}</option>
                ))}
              </select>
            </div>

            {/* Jour */}
            <div>
              <label className="label">Jour <span className="text-red-500">*</span></label>
              <select className="input-field" value={form.jourSemaine} onChange={e => set('jourSemaine', e.target.value)}>
                {JOURS.map(j => <option key={j} value={j}>{JOURS_FR[j]}</option>)}
              </select>
            </div>

            {/* Créneau */}
            <div>
              <label className="label">Créneau <span className="text-red-500">*</span></label>
              <select className="input-field" value={form.creneauKey} onChange={e => set('creneauKey', e.target.value)}>
                {CRENEAUX.map(cr => (
                  <option key={cr.key} value={cr.key}>{cr.debut} – {cr.fin}</option>
                ))}
              </select>
            </div>

            {/* Salle */}
            <div>
              <label className="label">Salle</label>
              <input
                type="text"
                className="input-field"
                placeholder="ex: A12"
                value={form.salle}
                onChange={e => set('salle', e.target.value)}
              />
            </div>

            {/* Année scolaire */}
            <div>
              <label className="label">Année scolaire</label>
              <select className="input-field" value={form.anneeScolaire} onChange={e => set('anneeScolaire', e.target.value)}>
                {ANNEES_SCOLAIRES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <Spinner size="sm" />}
              {isEdit ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}

// ─── Carte séance dans la grille ──────────────────────────────────────────────
function SeanceCell({ seance, creneauKey, compact, onEdit, onDelete, onValider, canValidate, canWrite }) {
  const c = SLOT_COLORS[creneauKey] || SLOT_COLORS['08H30']
  const [showActions, setShowActions] = useState(false)
  const isValide = seance.statut === 'VALIDE'
  const hasActions = canWrite || (canValidate && !isValide)

  return (
    <div
      className={`relative border rounded-xl ${compact ? 'p-1.5' : 'p-3'} ${c.card} group transition-shadow hover:shadow-md ${isValide ? 'ring-1 ring-emerald-300' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Actions hover */}
      {showActions && hasActions && (
        <div className="absolute top-1 right-1 flex gap-1 z-10">
          {canValidate && !isValide && (
            <button
              onClick={(e) => { e.stopPropagation(); onValider(seance) }}
              title="Valider la séance"
              className="p-1 rounded bg-white shadow border border-gray-200 text-emerald-600 hover:bg-emerald-50 transition-colors"
            >
              <Check size={11} />
            </button>
          )}
          {canWrite && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(seance) }}
                title="Modifier"
                className="p-1 rounded bg-white shadow border border-gray-200 text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Pencil size={11} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(seance) }}
                title="Supprimer"
                className="p-1 rounded bg-white shadow border border-gray-200 text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={11} />
              </button>
            </>
          )}
        </div>
      )}

      {isValide && (
        <span className="absolute bottom-1 right-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded px-1 py-0.5">
          Validé
        </span>
      )}

      {compact ? (
        <>
          <p className={`font-bold px-1 py-0.5 rounded text-[10px] mb-1 inline-block ${c.badge}`}>
            {seance.groupeCode || '—'}
          </p>
          {seance.formateurNom && <p className="text-[11px] text-gray-600 truncate leading-tight">{seance.formateurNom}</p>}
          {seance.salle && <p className="font-mono text-gray-400 text-[9px] mt-0.5">{seance.salle}</p>}
        </>
      ) : (
        <>
          {seance.groupeCode && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.badge} mb-2 inline-block`}>
              {seance.groupeCode}
            </span>
          )}
          {seance.formateurNom && <p className="text-sm font-semibold text-gray-800 mt-1 leading-tight">{seance.formateurNom}</p>}
          {seance.moduleNom && <p className="text-xs text-gray-500 mt-1 leading-tight truncate">{seance.moduleNom}</p>}
          {seance.salle && (
            <p className="font-mono text-xs text-gray-400 mt-2 border-t border-gray-100 pt-1.5">🏫 {seance.salle}</p>
          )}
        </>
      )}
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function EmploisPage() {
  const { isChefPole } = useAuth()
  const canWrite = isChefPole          // seul le Chef de pôle crée/modifie/supprime/importe
  const canValidate = isChefPole       // et valide

  const [grille, setGrille] = useState(null)
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [anneeScolaire, setAnneeScolaire] = useState(ANNEE_SCOLAIRE_DEFAULT)

  const [viewMode, setViewMode] = useState('all')
  const [selectedGroupe, setSelectedGroupe] = useState('')
  const [selectedFormateur, setSelectedFormateur] = useState('')

  const [modal, setModal] = useState({ open: false, seance: null }) // null = create, seance = edit
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [validatingLot, setValidatingLot] = useState(false)
  const [conflits, setConflits] = useState([])
  const [showConflits, setShowConflits] = useState(false)

  const fileRef = useRef(null)

  const loadGrille = useCallback(() => {
    setLoading(true)
    emploiService.getGrille(anneeScolaire)
      .then(r => setGrille(r.data.data))
      .catch(() => toast.error("Impossible de charger l'emploi du temps"))
      .finally(() => setLoading(false))
    if (canValidate) {
      emploiService.getConflits(anneeScolaire)
        .then(r => setConflits(r.data.data || []))
        .catch(() => {})
    }
  }, [anneeScolaire, canValidate])

  useEffect(() => { loadGrille() }, [loadGrille])

  const brouillonCount = grille
    ? Object.values(grille).flat().filter(s => s.statut && s.statut !== 'VALIDE').length
    : 0

  const handleValiderLot = async () => {
    setValidatingLot(true)
    try {
      const r = await emploiService.validerLot(anneeScolaire)
      toast.success(r.data.message || 'Grille validée')
      loadGrille()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la validation')
    } finally {
      setValidatingLot(false)
    }
  }

  // ─── Import Excel ────────────────────────────────────────────────────────
  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const r = await emploiService.importExcel(file, anneeScolaire, true)
      const result = r.data.data
      toast.success(`${result.imported} séances importées !`)
      if (result.skipped > 0) toast(`${result.skipped} lignes ignorées`, { icon: '⚠️' })
      loadGrille()
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l'import")
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  // ─── Validation (Chef de pôle / Admin) ──────────────────────────────────
  const handleValider = async (seance) => {
    try {
      await emploiService.valider(seance.id)
      toast.success('Séance validée')
      loadGrille()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la validation')
    }
  }

  // ─── Suppression ─────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await emploiService.delete(deleteTarget.id)
      toast.success('Séance supprimée')
      setDeleteTarget(null)
      loadGrille()
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleting(false)
    }
  }

  // ─── Listes filtre ───────────────────────────────────────────────────────
  const allSeances = grille ? Object.values(grille).flat() : []
  const allGroupes = [...new Set(allSeances.map(s => s.groupeCode).filter(Boolean))].sort()
  const allFormateurs = [...new Set(allSeances.map(s => s.formateurNom).filter(Boolean))].sort()

  const filterSeance = (s) => {
    if (viewMode === 'groupe' && selectedGroupe) return s.groupeCode?.toUpperCase() === selectedGroupe.toUpperCase()
    if (viewMode === 'formateur' && selectedFormateur) return s.formateurNom?.toUpperCase().includes(selectedFormateur.toUpperCase())
    return true
  }

  const getCellSeances = (jour, creneauKey) =>
    (grille?.[jour] || []).filter(s => getCreneauKey(s.creneau) === creneauKey && filterSeance(s))

  const filterActive = (viewMode === 'groupe' && selectedGroupe) || (viewMode === 'formateur' && selectedFormateur)
  const compact = viewMode === 'all'
  const totalFiltre = filterActive ? allSeances.filter(filterSeance).length : allSeances.length
  const isEmpty = !grille || allSeances.length === 0

  return (
    <div className="space-y-5">

      {/* ── En-tête ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emplois du Temps</h1>
          <p className="text-gray-500 text-sm mt-1">
            Grille hebdomadaire — Année {anneeScolaire}
            {filterActive && (
              <span className="ml-2 text-primary-600 font-medium">· {totalFiltre} séance{totalFiltre > 1 ? 's' : ''}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="input-field py-2 text-sm w-36"
            value={anneeScolaire}
            onChange={e => setAnneeScolaire(e.target.value)}
          >
            {ANNEES_SCOLAIRES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          {!canWrite && (
            <span className="text-xs text-gray-400 italic px-2">Consultation seule</span>
          )}

          {canValidate && brouillonCount > 0 && (
            <button
              onClick={handleValiderLot}
              disabled={validatingLot}
              className="btn-secondary flex items-center gap-2 text-sm border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              {validatingLot ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
              Valider la grille ({brouillonCount})
            </button>
          )}

          {canWrite && (
            <>
              <input type="file" accept=".xlsx,.xls" ref={fileRef} onChange={handleImport} className="hidden" />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={importing}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                {importing ? <><RefreshCw size={16} className="animate-spin" />Import...</> : <><Upload size={16} />Importer Excel</>}
              </button>

              <button
                onClick={() => setModal({ open: true, seance: null })}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Plus size={16} />
                Ajouter une séance
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Conflits ── */}
      {canValidate && conflits.length > 0 && (
        <div className="card !py-3 !px-4 border-l-4 border-l-red-400">
          <button
            onClick={() => setShowConflits(v => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-red-700"
          >
            ⚠️ {conflits.length} conflit(s) détecté(s) dans la grille
            <ChevronDown size={15} className={showConflits ? 'rotate-180 transition-transform' : 'transition-transform'} />
          </button>
          {showConflits && (
            <ul className="mt-2 space-y-1 text-xs text-gray-600">
              {conflits.map((c, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-mono bg-red-50 text-red-700 px-1.5 rounded">{c.type}</span>
                  <span><strong>{c.cible}</strong> — {c.jour} {c.creneau} · {c.detail}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Barre de filtres ── */}
      <div className="card !py-3 !px-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            {[
              { id: 'all', label: 'Tous', icon: LayoutGrid },
              { id: 'groupe', label: 'Par groupe', icon: Users },
              { id: 'formateur', label: 'Par formateur', icon: User },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setViewMode(id); setSelectedGroupe(''); setSelectedFormateur('') }}
                className={`flex items-center gap-1.5 px-3 py-2 transition-colors ${
                  viewMode === id ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={14} />{label}
              </button>
            ))}
          </div>

          {viewMode === 'groupe' && (
            <div className="relative">
              <select
                className="input-field py-2 text-sm pr-8 min-w-[180px] appearance-none"
                value={selectedGroupe}
                onChange={e => setSelectedGroupe(e.target.value)}
              >
                <option value="">-- Choisir un groupe --</option>
                {allGroupes.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-3 text-gray-400 pointer-events-none" />
            </div>
          )}

          {viewMode === 'formateur' && (
            <div className="relative">
              <select
                className="input-field py-2 text-sm pr-8 min-w-[220px] appearance-none"
                value={selectedFormateur}
                onChange={e => setSelectedFormateur(e.target.value)}
              >
                <option value="">-- Choisir un formateur --</option>
                {allFormateurs.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-3 text-gray-400 pointer-events-none" />
            </div>
          )}

          {filterActive && (
            <button onClick={() => { setSelectedGroupe(''); setSelectedFormateur('') }} className="text-sm text-gray-500 hover:text-gray-700 underline">
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* ── Contenu ── */}
      {loading ? (
        <Spinner className="mt-20" size="lg" />
      ) : isEmpty ? (
        <div className="card text-center py-20">
          <div className="text-5xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Aucun emploi du temps chargé</h3>
          {canWrite ? (
            <>
              <p className="text-gray-400 text-sm mb-6">Importez votre fichier Excel ou ajoutez des séances manuellement.</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => fileRef.current?.click()} className="btn-secondary inline-flex items-center gap-2">
                  <Upload size={16} /> Importer Excel
                </button>
                <button onClick={() => setModal({ open: true, seance: null })} className="btn-primary inline-flex items-center gap-2">
                  <Plus size={16} /> Ajouter une séance
                </button>
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-sm">Aucune séance planifiée pour {anneeScolaire}.</p>
          )}
        </div>
      ) : (
        <>
          {viewMode !== 'all' && !filterActive && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 text-sm text-blue-700 flex items-center gap-2">
              <span className="text-lg">👆</span>
              Sélectionnez {viewMode === 'groupe' ? 'un groupe' : 'un formateur'} pour afficher son emploi du temps.
            </div>
          )}

          {/* ── Grille ── */}
          <div className="card !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ minWidth: '900px' }}>
                <thead>
                  <tr>
                    <th className="w-28 bg-gray-50 border-b border-r border-gray-200 px-3 py-3 text-left">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Horaire</span>
                    </th>
                    {JOURS.map(jour => {
                      const count = (grille[jour] || []).filter(filterSeance).length
                      return (
                        <th key={jour} className="bg-gray-50 border-b border-r border-gray-200 px-3 py-3 text-center last:border-r-0">
                          <p className="text-sm font-bold text-gray-800">{JOURS_FR[jour]}</p>
                          {filterActive && <p className="text-xs text-gray-400 mt-0.5 font-normal">{count} séance{count > 1 ? 's' : ''}</p>}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {CRENEAUX.map(creneau => {
                    const c = SLOT_COLORS[creneau.key]
                    return (
                      <tr key={creneau.key} className={`${c.row} border-b border-gray-100 last:border-b-0`}>
                        <td className="border-r border-gray-200 px-2 py-3 align-top">
                          <div className={`rounded-lg border px-2 py-2 text-center ${c.time}`}>
                            <p className="text-xs font-bold">{creneau.debut}</p>
                            <div className="my-1 border-t border-current opacity-30" />
                            <p className="text-xs font-bold">{creneau.fin}</p>
                          </div>
                        </td>
                        {JOURS.map(jour => {
                          const seances = getCellSeances(jour, creneau.key)
                          return (
                            <td key={jour} className="border-r border-gray-100 last:border-r-0 px-2 py-2 align-top" style={{ minHeight: '80px' }}>
                              {seances.length === 0 ? (
                                canWrite ? (
                                  <div
                                    className="h-full min-h-[70px] flex items-center justify-center cursor-pointer group"
                                    onClick={() => setModal({ open: true, seance: null })}
                                    title="Ajouter une séance"
                                  >
                                    <Plus size={16} className="text-gray-200 group-hover:text-primary-400 transition-colors" />
                                  </div>
                                ) : (
                                  <div className="min-h-[70px] flex items-center justify-center">
                                    <span className="text-gray-200 text-lg select-none">—</span>
                                  </div>
                                )
                              ) : (
                                <div className="space-y-1.5">
                                  {seances.map((s, i) => (
                                    <SeanceCell
                                      key={s.id || i}
                                      seance={s}
                                      creneauKey={creneau.key}
                                      compact={compact}
                                      canWrite={canWrite}
                                      canValidate={canValidate}
                                      onValider={handleValider}
                                      onEdit={s => setModal({ open: true, seance: s })}
                                      onDelete={s => setDeleteTarget(s)}
                                    />
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
              <span className="text-xs text-gray-400 ml-auto italic">Survolez une séance pour la modifier</span>
            </div>
          </div>

          {/* Résumé filtre */}
          {filterActive && (
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              {JOURS.map(jour => {
                const count = (grille[jour] || []).filter(filterSeance).length
                return (
                  <div key={jour} className={`card !py-3 text-center ${count > 0 ? '' : 'opacity-40'}`}>
                    <p className="text-xs font-semibold text-gray-500 mb-1">{JOURS_FR[jour]}</p>
                    <p className={`text-2xl font-bold ${count > 0 ? 'text-primary-600' : 'text-gray-300'}`}>{count}</p>
                    <p className="text-[10px] text-gray-400">séance{count > 1 ? 's' : ''}</p>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── Modal Ajouter / Modifier ── */}
      <SeanceFormModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, seance: null })}
        seance={modal.seance}
        anneeScolaire={anneeScolaire}
        onSaved={loadGrille}
      />

      {/* ── Modal Confirmation suppression ── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer la séance"
        size="sm"
      >
        <p className="text-gray-600 mb-1">
          Voulez-vous vraiment supprimer cette séance ?
        </p>
        {deleteTarget && (
          <p className="text-sm text-gray-500 mb-5">
            <span className="font-medium">{deleteTarget.groupeCode}</span>
            {deleteTarget.formateurNom && <> — {deleteTarget.formateurNom}</>}
            {deleteTarget.jourSemaine && <> · {JOURS_FR[deleteTarget.jourSemaine] || deleteTarget.jourSemaine}</>}
            {deleteTarget.creneau && <> · {deleteTarget.creneau}</>}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteTarget(null)} className="btn-secondary" disabled={deleting}>Annuler</button>
          <button onClick={handleDeleteConfirm} disabled={deleting} className="btn-danger flex items-center gap-2">
            {deleting && <Spinner size="sm" />}
            Supprimer
          </button>
        </div>
      </Modal>
    </div>
  )
}
