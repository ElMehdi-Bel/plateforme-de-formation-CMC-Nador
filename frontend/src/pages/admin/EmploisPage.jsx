import { useEffect, useState, useCallback, useRef } from 'react'
import { Upload, RefreshCw, Users, User, LayoutGrid, ChevronDown } from 'lucide-react'
import { emploiService } from '../../services/emploiService'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

// ─── Constantes fixes ─────────────────────────────────────────────────────────
const JOURS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI']
const JOURS_COURT = { LUNDI: 'Lun', MARDI: 'Mar', MERCREDI: 'Mer', JEUDI: 'Jeu', VENDREDI: 'Ven', SAMEDI: 'Sam' }
const JOURS_FR = { LUNDI: 'Lundi', MARDI: 'Mardi', MERCREDI: 'Mercredi', JEUDI: 'Jeudi', VENDREDI: 'Vendredi', SAMEDI: 'Samedi' }

const CRENEAUX = [
  { key: '08H30', debut: '08h30', fin: '11h00' },
  { key: '11H00', debut: '11h00', fin: '13h30' },
  { key: '13H30', debut: '13h30', fin: '16h00' },
  { key: '16H00', debut: '16h00', fin: '18h30' },
]

const SLOT_COLORS = {
  '08H30': {
    row: 'bg-blue-50/40',
    time: 'bg-blue-100 text-blue-800 border-blue-200',
    card: 'bg-white border-blue-200 hover:border-blue-400 hover:shadow-blue-100',
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-400',
  },
  '11H00': {
    row: 'bg-emerald-50/40',
    time: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    card: 'bg-white border-emerald-200 hover:border-emerald-400 hover:shadow-emerald-100',
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-400',
  },
  '13H30': {
    row: 'bg-amber-50/40',
    time: 'bg-amber-100 text-amber-800 border-amber-200',
    card: 'bg-white border-amber-200 hover:border-amber-400 hover:shadow-amber-100',
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-400',
  },
  '16H00': {
    row: 'bg-purple-50/40',
    time: 'bg-purple-100 text-purple-800 border-purple-200',
    card: 'bg-white border-purple-200 hover:border-purple-400 hover:shadow-purple-100',
    badge: 'bg-purple-100 text-purple-700',
    dot: 'bg-purple-400',
  },
}

// ─── Helper : résoudre la clé créneau depuis le label ─────────────────────────
// ATTENTION : "8H30 -- 11H00" contient "11H00" → on teste startsWith en premier
function getCreneauKey(creneau = '') {
  const c = creneau.toUpperCase().trim()
  if (c.startsWith('8H30') || c.startsWith('08H30') || c.includes('08H30')) return '08H30'
  if (c.startsWith('11H') || c.includes('11H00')) return '11H00'
  if (c.startsWith('13H') || c.includes('13H30')) return '13H30'
  if (c.startsWith('16H') || c.includes('16H00')) return '16H00'
  if (c.startsWith('19H') || c.includes('19H00')) return '19H00'
  return null
}

// ─── Carte séance dans la grille ──────────────────────────────────────────────
function SeanceCell({ seance, creneauKey, compact }) {
  const c = SLOT_COLORS[creneauKey] || SLOT_COLORS['08H30']
  if (compact) {
    return (
      <div className={`border rounded-lg p-1.5 text-[11px] ${c.card} hover:shadow-sm transition-shadow cursor-default`}>
        <p className={`font-bold px-1 py-0.5 rounded text-[10px] mb-1 inline-block ${c.badge}`}>
          {seance.groupeCode || '—'}
        </p>
        {seance.formateurNom && (
          <p className="text-gray-600 truncate leading-tight">{seance.formateurNom}</p>
        )}
        {seance.salle && (
          <p className="font-mono text-gray-400 text-[9px] mt-0.5">{seance.salle}</p>
        )}
      </div>
    )
  }
  return (
    <div className={`border rounded-xl p-3 ${c.card} hover:shadow-md transition-all cursor-default`}>
      {seance.groupeCode && (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.badge} mb-2 inline-block`}>
          {seance.groupeCode}
        </span>
      )}
      {seance.formateurNom && (
        <p className="text-sm font-semibold text-gray-800 mt-1 leading-tight">{seance.formateurNom}</p>
      )}
      {seance.moduleNom && (
        <p className="text-xs text-gray-500 mt-1 leading-tight truncate">{seance.moduleNom}</p>
      )}
      {seance.salle && (
        <p className="font-mono text-xs text-gray-400 mt-2 border-t border-gray-100 pt-1.5">
          🏫 {seance.salle}
        </p>
      )}
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function EmploisPage() {
  const [grille, setGrille] = useState(null)
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [anneeScolaire, setAnneeScolaire] = useState('2025-2026')

  // Mode filtre : 'all' | 'groupe' | 'formateur'
  const [viewMode, setViewMode] = useState('all')
  const [selectedGroupe, setSelectedGroupe] = useState('')
  const [selectedFormateur, setSelectedFormateur] = useState('')

  const fileRef = useRef(null)

  const loadGrille = useCallback(() => {
    setLoading(true)
    emploiService.getGrille(anneeScolaire)
      .then(r => setGrille(r.data.data))
      .catch(() => toast.error("Impossible de charger l'emploi du temps"))
      .finally(() => setLoading(false))
  }, [anneeScolaire])

  useEffect(() => { loadGrille() }, [loadGrille])

  // ─── Import ────────────────────────────────────────────────────────────────
  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const r = await emploiService.importExcel(file, anneeScolaire, true)
      const result = r.data.data
      toast.success(`✅ ${result.imported} séances importées !`)
      if (result.skipped > 0) toast(`⚠️ ${result.skipped} lignes ignorées`, { icon: '⚠️' })
      loadGrille()
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l'import")
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  // ─── Listes dédupliquées pour les selects ─────────────────────────────────
  const allSeances = grille ? Object.values(grille).flat() : []

  const allGroupes = [...new Set(allSeances.map(s => s.groupeCode).filter(Boolean))].sort()
  const allFormateurs = [...new Set(allSeances.map(s => s.formateurNom).filter(Boolean))].sort()

  // ─── Filtre actif ─────────────────────────────────────────────────────────
  const filterSeance = (s) => {
    if (viewMode === 'groupe' && selectedGroupe)
      return s.groupeCode?.toUpperCase() === selectedGroupe.toUpperCase()
    if (viewMode === 'formateur' && selectedFormateur)
      return s.formateurNom?.toUpperCase().includes(selectedFormateur.toUpperCase())
    return true
  }

  // Séances filtrées pour une cellule [jour][créneau]
  const getCellSeances = (jour, creneauKey) => {
    const seances = grille?.[jour] || []
    return seances.filter(s => getCreneauKey(s.creneau) === creneauKey && filterSeance(s))
  }

  // Est-ce que le filtre est actif et complet ?
  const filterActive = (viewMode === 'groupe' && selectedGroupe) ||
                       (viewMode === 'formateur' && selectedFormateur)

  // Compact si on affiche tout (beaucoup de séances par cellule)
  const compact = viewMode === 'all'

  // Total filtré
  const totalFiltre = filterActive
    ? allSeances.filter(filterSeance).length
    : allSeances.length

  // ─── Render ────────────────────────────────────────────────────────────────
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
              <span className="ml-2 text-primary-600 font-medium">
                · {totalFiltre} séance{totalFiltre > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="input-field py-2 text-sm w-36"
            value={anneeScolaire}
            onChange={e => setAnneeScolaire(e.target.value)}
          >
            <option value="2025-2026">2025-2026</option>
            <option value="2024-2025">2024-2025</option>
            <option value="2026-2027">2026-2027</option>
          </select>
          <input type="file" accept=".xlsx,.xls" ref={fileRef} onChange={handleImport} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            {importing
              ? <><RefreshCw size={16} className="animate-spin" />Import...</>
              : <><Upload size={16} />Importer Excel</>}
          </button>
        </div>
      </div>

      {/* ── Barre de filtres ── */}
      <div className="card !py-3 !px-4">
        <div className="flex flex-wrap gap-3 items-center">

          {/* Boutons de mode */}
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
                  viewMode === id
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Sélecteur groupe */}
          {viewMode === 'groupe' && (
            <div className="relative">
              <select
                className="input-field py-2 text-sm pr-8 min-w-[180px] appearance-none"
                value={selectedGroupe}
                onChange={e => setSelectedGroupe(e.target.value)}
              >
                <option value="">-- Choisir un groupe --</option>
                {allGroupes.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-3 text-gray-400 pointer-events-none" />
            </div>
          )}

          {/* Sélecteur formateur */}
          {viewMode === 'formateur' && (
            <div className="relative">
              <select
                className="input-field py-2 text-sm pr-8 min-w-[220px] appearance-none"
                value={selectedFormateur}
                onChange={e => setSelectedFormateur(e.target.value)}
              >
                <option value="">-- Choisir un formateur --</option>
                {allFormateurs.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-3 text-gray-400 pointer-events-none" />
            </div>
          )}

          {/* Réinitialiser */}
          {filterActive && (
            <button
              onClick={() => { setSelectedGroupe(''); setSelectedFormateur('') }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
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
          <p className="text-gray-400 text-sm mb-6">
            Importez votre fichier Excel <strong>"Emplois INDUS 2025-2026.xlsx"</strong> pour afficher la grille.
          </p>
          <button onClick={() => fileRef.current?.click()} className="btn-primary inline-flex items-center gap-2">
            <Upload size={18} /> Importer le fichier Excel
          </button>
        </div>
      ) : (
        <>
          {/* Invite si filtre non sélectionné */}
          {viewMode !== 'all' && !filterActive && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 text-sm text-blue-700 flex items-center gap-2">
              <span className="text-lg">👆</span>
              Sélectionnez {viewMode === 'groupe' ? 'un groupe' : 'un formateur'} pour afficher son emploi du temps complet.
            </div>
          )}

          {/* ── Grille principale ── */}
          <div className="card !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ minWidth: '900px' }}>

                {/* ── En-tête des jours ── */}
                <thead>
                  <tr>
                    {/* Colonne horaire */}
                    <th className="w-28 bg-gray-50 border-b border-r border-gray-200 px-3 py-3 text-left">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Horaire</span>
                    </th>
                    {JOURS.map(jour => {
                      const count = (grille[jour] || []).filter(filterSeance).length
                      return (
                        <th
                          key={jour}
                          className="bg-gray-50 border-b border-r border-gray-200 px-3 py-3 text-center last:border-r-0"
                        >
                          <p className="text-sm font-bold text-gray-800">{JOURS_FR[jour]}</p>
                          {filterActive && (
                            <p className="text-xs text-gray-400 mt-0.5 font-normal">
                              {count} séance{count > 1 ? 's' : ''}
                            </p>
                          )}
                        </th>
                      )
                    })}
                  </tr>
                </thead>

                {/* ── Lignes créneaux ── */}
                <tbody>
                  {CRENEAUX.map((creneau, ci) => {
                    const c = SLOT_COLORS[creneau.key]
                    return (
                      <tr key={creneau.key} className={`${c.row} border-b border-gray-100 last:border-b-0`}>

                        {/* ── Colonne horaire (sticky visuellement) ── */}
                        <td className={`border-r border-gray-200 px-2 py-3 align-top`}>
                          <div className={`rounded-lg border px-2 py-2 text-center ${c.time}`}>
                            <p className="text-xs font-bold">{creneau.debut}</p>
                            <div className="my-1 border-t border-current opacity-30" />
                            <p className="text-xs font-bold">{creneau.fin}</p>
                          </div>
                        </td>

                        {/* ── Cellules par jour ── */}
                        {JOURS.map(jour => {
                          const seances = getCellSeances(jour, creneau.key)
                          return (
                            <td
                              key={jour}
                              className="border-r border-gray-100 last:border-r-0 px-2 py-2 align-top"
                              style={{ minHeight: '80px', verticalAlign: 'top' }}
                            >
                              {seances.length === 0 ? (
                                <div className="h-full min-h-[70px] flex items-center justify-center">
                                  <span className="text-gray-200 text-lg select-none">—</span>
                                </div>
                              ) : (
                                <div className="space-y-1.5">
                                  {seances.map((s, i) => (
                                    <SeanceCell key={i} seance={s} creneauKey={creneau.key} compact={compact} />
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

            {/* ── Légende ── */}
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
            </div>
          </div>

          {/* ── Résumé si vue filtrée ── */}
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
    </div>
  )
}
