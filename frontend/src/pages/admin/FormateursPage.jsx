import { useEffect, useState, useRef } from 'react'
import {
  Plus, Search, UserCheck, UserX, GraduationCap, Phone, Mail,
  Upload, Download, X, CheckCircle, ChevronDown, ChevronRight,
  BookOpen, Users, Clock,
} from 'lucide-react'
import { userService } from '../../services/userService'
import { moduleService } from '../../services/moduleService'
import { importService } from '../../services/importService'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import SkeletonTable from '../../components/ui/SkeletonTable'
import Spinner from '../../components/ui/Spinner'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

// ── Ligne expandable : modules + groupes d'un formateur ────────────────────
function FormateurModules({ formateurId }) {
  const [modules, setModules]   = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    moduleService.findByFormateur(formateurId)
      .then(r => setModules(r.data.data || []))
      .catch(() => setModules([]))
      .finally(() => setLoading(false))
  }, [formateurId])

  if (loading) return (
    <div className="flex items-center gap-2 py-3 px-5 text-xs text-warm-400">
      <Spinner size="sm" /> Chargement des modules...
    </div>
  )

  if (!modules || modules.length === 0) return (
    <div className="py-4 px-5 text-xs text-warm-400 italic">
      Aucun module assigné à ce formateur.
    </div>
  )

  return (
    <div className="px-5 pb-4 pt-2 space-y-2">
      <p className="text-[11px] font-bold text-warm-500 uppercase tracking-wider mb-3">
        {modules.length} module(s) assigné(s)
      </p>
      {modules.map(m => (
        <div key={m.id} className="flex items-start gap-3 bg-warm-50 rounded-xl px-4 py-2.5 border border-warm-100">
          {/* Info module */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <BookOpen size={13} className="text-primary-500 flex-shrink-0" />
              <span className="text-sm font-semibold text-warm-800">{m.nom}</span>
              {m.code && (
                <span className="font-mono text-xs text-warm-400 bg-white border border-warm-200 px-1.5 py-0.5 rounded-md">
                  {m.code}
                </span>
              )}
              {m.anneeFormation && (
                <span className="badge-info text-[10px]">{m.anneeFormation}A</span>
              )}
              {m.volumeHoraire && (
                <span className="flex items-center gap-0.5 text-xs text-warm-400">
                  <Clock size={10} />{m.volumeHoraire}h
                </span>
              )}
            </div>

            {/* Groupes */}
            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
              <Users size={11} className="text-warm-400 flex-shrink-0" />
              {m.groupes && m.groupes.length > 0 ? (
                m.groupes.map(g => (
                  <span
                    key={g.id}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold
                               bg-primary-100 text-primary-700 border border-primary-200"
                  >
                    {g.nom}
                  </span>
                ))
              ) : (
                <span className="text-xs text-warm-400 italic">Aucun groupe assigné</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Résultat import ─────────────────────────────────────────────────────────
function ImportResultModal({ isOpen, result, onClose }) {
  if (!isOpen || !result) return null
  const rows = [
    { label: 'Formateurs créés',   value: result.formateursCreés     ?? 0, color: 'text-primary-700', bg: 'bg-primary-50' },
    { label: 'Déjà existants',     value: result.formateursExistants ?? 0, color: 'text-warm-600',    bg: 'bg-warm-50'    },
    { label: 'Modules assignés',   value: result.modulesAssignés     ?? 0, color: 'text-blue-700',    bg: 'bg-blue-50'    },
    { label: 'Groupes mis à jour', value: result.groupesAssignés     ?? 0, color: 'text-purple-700',  bg: 'bg-purple-50'  },
    { label: 'Lignes ignorées',    value: result.lignesIgnorées      ?? 0, color: 'text-warm-500',    bg: 'bg-warm-50'    },
    { label: 'Erreurs',            value: result.erreurs             ?? 0, color: 'text-red-700',     bg: 'bg-red-50'     },
  ]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} className="text-primary-600" />
            <h3 className="font-display font-semibold text-warm-900">Résultat de l'import</h3>
          </div>
          <button onClick={onClose} className="text-warm-400 hover:text-warm-600"><X size={18}/></button>
        </div>
        <div className="space-y-2">
          {rows.map(r => (
            <div key={r.label} className={`flex items-center justify-between px-4 py-2.5 rounded-xl ${r.bg}`}>
              <span className="text-sm text-warm-700">{r.label}</span>
              <span className={`text-lg font-bold tabular-nums ${r.color}`}>{r.value}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="btn-primary w-full mt-5">Fermer</button>
      </div>
    </div>
  )
}

// ── Aide format Excel ───────────────────────────────────────────────────────
function FormatHelp({ onClose }) {
  const cols = [
    { col: 'A', label: 'Nom *',       ex: 'ALAMI' },
    { col: 'B', label: 'Prénom *',    ex: 'Mohammed' },
    { col: 'C', label: 'Email *',     ex: 'm.alami@cmc-nador.ma' },
    { col: 'D', label: 'Mot de passe', ex: 'Cmc@1234  (vide = généré : Cmc@ + 4 premières lettres du nom)' },
    { col: 'E', label: 'Téléphone',   ex: '0600000000' },
    { col: 'F', label: 'Module',      ex: 'Analyse des circuits  (nom exact dans la base, optionnel)' },
    { col: 'G', label: 'Groupe(s)',   ex: 'GE-101, GE-102  (séparés par virgule pour plusieurs groupes)' },
  ]
  const example = [
    ['ALAMI',  'Mohammed', 'm.alami@cmc.ma', 'Cmc@1234', '0600000000', 'Analyse circuits',  'GE-101, GE-102'],
    ['ALAMI',  'Mohammed', 'm.alami@cmc.ma', '',          '',            'Algorithmes',       'GE-201'],
    ['BENALI', 'Fatima',   'f.benali@cmc.ma','',          '0611111111',  'Base de données',   'TS-101'],
    ['BENALI', 'Fatima',   'f.benali@cmc.ma','',          '',            'Réseaux',           'TS-101, TS-102'],
  ]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-warm-900">Format Excel attendu</h3>
          <button onClick={onClose} className="text-warm-400 hover:text-warm-600"><X size={18}/></button>
        </div>

        {/* Colonnes */}
        <p className="text-xs text-warm-500 mb-3 font-semibold uppercase tracking-wider">Colonnes</p>
        <div className="space-y-1.5 mb-5">
          {cols.map(c => (
            <div key={c.col} className="flex items-start gap-3 text-sm">
              <span className="w-6 h-6 rounded-md bg-primary-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{c.col}</span>
              <div>
                <span className="font-semibold text-warm-800">{c.label}</span>
                <span className="text-warm-400 ml-2 text-xs">{c.ex}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Règles */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800 mb-5">
          <p className="font-semibold mb-1">Règles importantes :</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Ligne 1 = en-têtes (ignorée), données à partir de la ligne 2</li>
            <li>Même email sur plusieurs lignes = même formateur avec plusieurs modules</li>
            <li>Colonne G : séparer plusieurs groupes par <strong>virgule</strong> ou <strong>point-virgule</strong></li>
            <li>Le module et les groupes doivent déjà exister dans la base</li>
            <li>Mot de passe vide → <code className="bg-amber-100 px-1 rounded">Cmc@XXXX</code> (4 premières lettres du nom)</li>
          </ul>
        </div>

        {/* Exemple */}
        <p className="text-xs text-warm-500 mb-2 font-semibold uppercase tracking-wider">Exemple</p>
        <div className="overflow-x-auto rounded-xl border border-warm-100">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-warm-50">
                {['Nom','Prénom','Email','Mot de passe','Téléphone','Module','Groupe(s)'].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-bold text-warm-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-50">
              {example.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-warm-50/50'}>
                  {row.map((cell, j) => (
                    <td key={j} className="px-3 py-1.5 text-warm-600 whitespace-nowrap">{cell || <span className="text-warm-300">—</span>}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-warm-400 mt-2">
          → ALAMI a 2 modules : "Analyse circuits" (groupes GE-101 et GE-102) + "Algorithmes" (groupe GE-201)
        </p>

        <button onClick={onClose} className="btn-secondary w-full mt-5">Fermer</button>
      </div>
    </div>
  )
}

// ── Page principale ─────────────────────────────────────────────────────────
export default function FormateursPage() {
  const [formateurs, setFormateurs]     = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [page, setPage]                 = useState(0)
  const [totalPages, setTotalPages]     = useState(0)
  const [showModal, setShowModal]       = useState(false)
  const [saving, setSaving]             = useState(false)
  const [importing, setImporting]       = useState(false)
  const [showHelp, setShowHelp]         = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [expanded, setExpanded]         = useState({})   // { formateurId: bool }
  const fileRef = useRef()

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const load = () => {
    setLoading(true)
    userService.findAll({ role: 'FORMATEUR', search, page, size: 15 })
      .then(r => {
        setFormateurs(r.data.data.content)
        setTotalPages(r.data.data.totalPages)
      })
      .catch(() => toast.error('Erreur chargement formateurs'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search, page])

  const toggleExpand = (id) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const handleCreate = async (data) => {
    setSaving(true)
    try {
      await userService.create({ ...data, role: 'FORMATEUR' })
      toast.success('Formateur créé avec succès')
      setShowModal(false)
      reset()
      load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur lors de la création')
    } finally { setSaving(false) }
  }

  const handleToggle = async (id) => {
    try {
      await userService.toggleActif(id)
      load()
    } catch { toast.error('Erreur changement statut') }
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toast.error('Fichier Excel requis (.xlsx ou .xls)')
      e.target.value = ''
      return
    }
    setImporting(true)
    try {
      const r = await importService.importFormateurs(file)
      const data = r.data.data
      setImportResult(data)
      setExpanded({})
      toast.success(`Import réussi — ${data.formateursCreés ?? 0} formateur(s) créé(s)`)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l'import")
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Formateurs</h1>
          <p className="page-subtitle">Cliquez sur un formateur pour voir ses modules et groupes</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowHelp(true)}
            className="btn-secondary flex items-center gap-2 text-xs"
          >
            <Download size={14} /> Format Excel
          </button>
          <button
            onClick={() => fileRef.current.click()}
            disabled={importing}
            className="btn-secondary flex items-center gap-2"
          >
            {importing ? <Spinner size="sm" /> : <Upload size={16} />}
            {importing ? 'Import...' : 'Importer Excel'}
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Nouveau formateur
          </button>
        </div>
      </div>

      {/* Info format */}
      <div className="bg-primary-50 border border-primary-100 rounded-xl p-3 text-xs text-primary-800 flex items-start gap-2">
        <Upload size={13} className="flex-shrink-0 mt-0.5 text-primary-600" />
        <span>
          Import Excel : <strong>Nom | Prénom | Email | Mot de passe | Téléphone | Module | Groupe(s)</strong>
          &nbsp;— plusieurs groupes par virgule, plusieurs lignes par formateur pour plusieurs modules.&nbsp;
          <button onClick={() => setShowHelp(true)} className="underline hover:text-primary-900">Voir exemple</button>
        </span>
      </div>

      {/* Tableau */}
      <div className="card p-0 overflow-hidden">
        {/* Barre de recherche */}
        <div className="p-4 border-b border-warm-100">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
            <input
              className="input-field pl-9"
              placeholder="Rechercher par nom ou email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0) }}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-4"><SkeletonTable rows={6} cols={5} /></div>
        ) : (
          <>
            <div className="divide-y divide-warm-100">
              {formateurs.length === 0 ? (
                <div className="text-center py-14">
                  <GraduationCap size={40} className="mx-auto text-warm-300 mb-3" />
                  <p className="text-warm-500 font-medium">Aucun formateur trouvé</p>
                  <p className="text-warm-400 text-sm mt-1">Importez un fichier Excel ou ajoutez manuellement</p>
                </div>
              ) : formateurs.map(f => (
                <div key={f.id}>
                  {/* Ligne principale */}
                  <div
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-warm-50/60 cursor-pointer transition-colors"
                    onClick={() => toggleExpand(f.id)}
                  >
                    {/* Chevron */}
                    <div className="flex-shrink-0">
                      {expanded[f.id]
                        ? <ChevronDown size={16} className="text-primary-600" />
                        : <ChevronRight size={16} className="text-warm-400" />}
                    </div>

                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600
                                    flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-white text-sm font-bold">
                        {f.fullName?.charAt(0)?.toUpperCase() || 'F'}
                      </span>
                    </div>

                    {/* Nom */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-warm-900 leading-tight">{f.fullName}</p>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-warm-500">
                          <Mail size={11} /> {f.email}
                        </span>
                        {f.telephone && (
                          <span className="flex items-center gap-1 text-xs text-warm-400">
                            <Phone size={11} /> {f.telephone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Statut */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge variant={f.actif ? 'success' : 'danger'}>
                        {f.actif ? 'Actif' : 'Inactif'}
                      </Badge>
                      <button
                        onClick={e => { e.stopPropagation(); handleToggle(f.id) }}
                        className="p-1.5 rounded-lg hover:bg-warm-100 transition-colors"
                        title={f.actif ? 'Désactiver' : 'Activer'}
                      >
                        {f.actif
                          ? <UserX size={15} className="text-red-500" />
                          : <UserCheck size={15} className="text-primary-600" />}
                      </button>
                    </div>
                  </div>

                  {/* Détail modules/groupes (expandable) */}
                  {expanded[f.id] && (
                    <div className="border-t border-warm-100 bg-warm-50/40">
                      <FormateurModules formateurId={f.id} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="px-4 pb-2 border-t border-warm-100">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>

      {/* Modal création manuelle */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); reset() }} title="Nouveau formateur">
        <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nom *</label>
              <input className="input-field" {...register('nom', { required: 'Obligatoire' })} placeholder="Ex: ALAMI" />
              {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom.message}</p>}
            </div>
            <div>
              <label className="label">Prénom *</label>
              <input className="input-field" {...register('prenom', { required: 'Obligatoire' })} placeholder="Ex: Mohammed" />
              {errors.prenom && <p className="text-red-500 text-xs mt-1">{errors.prenom.message}</p>}
            </div>
          </div>
          <div>
            <label className="label">Email *</label>
            <input type="email" className="input-field" {...register('email', { required: 'Obligatoire' })} placeholder="formateur@cmc-nador.ma" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="label">Mot de passe *</label>
            <input type="password" className="input-field" placeholder="Min. 8 caractères"
              {...register('password', { required: 'Obligatoire', minLength: { value: 8, message: 'Min 8 caractères' } })} />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input className="input-field" {...register('telephone')} placeholder="0600000000" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => { setShowModal(false); reset() }} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Spinner size="sm" /> : <Plus size={16} />}
              {saving ? 'Création...' : 'Créer le formateur'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal aide format Excel */}
      {showHelp && <FormatHelp onClose={() => setShowHelp(false)} />}

      {/* Modal résultat import */}
      <ImportResultModal
        isOpen={!!importResult}
        result={importResult}
        onClose={() => setImportResult(null)}
      />
    </div>
  )
}
