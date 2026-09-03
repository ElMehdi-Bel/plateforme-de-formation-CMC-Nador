import { useEffect, useRef, useState } from 'react'
import { BookOpen, Download, Upload, FileSpreadsheet, CheckCircle, AlertCircle, FileDown } from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../../components/ui/Spinner'
import { useAuth } from '../../context/AuthContext'
import { groupeService } from '../../services/groupeService'
import { moduleService } from '../../services/moduleService'
import { noteService } from '../../services/noteService'
import { documentService } from '../../services/documentService'

function moyenneColor(m) {
  if (m === null || m === undefined) return 'text-gray-400'
  if (m >= 12) return 'text-green-600 font-bold'
  if (m >= 10) return 'text-orange-500 font-bold'
  return 'text-red-600 font-bold'
}

export default function NotesFormateurPage() {
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  const [groupes, setGroupes] = useState([])
  const [modules, setModules] = useState([])
  const [selectedGroupe, setSelectedGroupe] = useState('')
  const [selectedModule, setSelectedModule] = useState('')
  const [grille, setGrille] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)

  const [loadingInit, setLoadingInit] = useState(true)
  const [loadingGrille, setLoadingGrille] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!user?.userId) return
    Promise.all([
      groupeService.findByFormateur(user.userId),
      moduleService.getAll(),
    ])
      .then(([g, m]) => {
        setGroupes(g.data.data || [])
        setModules(m.data.data || [])
      })
      .catch(() => toast.error('Erreur chargement des données'))
      .finally(() => setLoadingInit(false))
  }, [user])

  const canAction = selectedGroupe && selectedModule

  const handleAfficher = async () => {
    if (!canAction) return
    setLoadingGrille(true)
    setGrille([])
    try {
      const r = await noteService.getGrille(selectedGroupe, selectedModule)
      setGrille(r.data.data || [])
    } catch {
      toast.error('Erreur lors du chargement de la grille')
    } finally {
      setLoadingGrille(false)
    }
  }

  const handleExport = async () => {
    if (!canAction) { toast.error('Veuillez choisir un groupe et un module'); return }
    setExporting(true)
    try {
      await documentService.exportNotes(selectedGroupe, selectedModule)
    } catch {
      toast.error("Erreur lors de l'export")
    } finally {
      setExporting(false)
    }
  }

  const handleDownloadTemplate = async () => {
    if (!canAction) { toast.error('Veuillez choisir un groupe et un module'); return }
    try {
      await noteService.downloadTemplate(selectedGroupe, selectedModule)
      toast.success('Modèle téléchargé')
    } catch {
      toast.error('Erreur lors du téléchargement du modèle')
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    if (!isExcel) { toast.error('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)'); return }
    setSelectedFile(file)
    setImportResult(null)
  }

  const handleImport = async () => {
    if (!canAction) { toast.error('Veuillez choisir un groupe et un module'); return }
    if (!selectedFile) { toast.error('Veuillez sélectionner un fichier Excel'); return }
    setImporting(true)
    setImportResult(null)
    try {
      const r = await noteService.importNotes(selectedFile, selectedGroupe, selectedModule)
      const data = r.data.data
      setImportResult(data)
      toast.success(`${data.imported} note(s) importée(s) avec succès`)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      // Rafraîchir la grille après import
      const grillRes = await noteService.getGrille(selectedGroupe, selectedModule)
      setGrille(grillRes.data.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'import')
    } finally {
      setImporting(false)
    }
  }

  const selectedModuleNom = modules.find(m => String(m.id) === String(selectedModule))?.nom || ''

  if (loadingInit) return <Spinner className="mt-16" size="lg" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notes</h1>
        <p className="text-gray-500 text-sm mt-1">Importez les notes via un fichier Excel</p>
      </div>

      {/* Sélection groupe + module */}
      <div className="card">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-48">
            <label className="label">Groupe</label>
            <select
              className="input-field"
              value={selectedGroupe}
              onChange={e => { setSelectedGroupe(e.target.value); setGrille([]); setImportResult(null) }}
            >
              <option value="">-- Choisir un groupe --</option>
              {groupes.map(g => (
                <option key={g.id} value={g.id}>{g.nom}{g.code ? ` (${g.code})` : ''}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-48">
            <label className="label">Module</label>
            <select
              className="input-field"
              value={selectedModule}
              onChange={e => { setSelectedModule(e.target.value); setGrille([]); setImportResult(null) }}
            >
              <option value="">-- Choisir un module --</option>
              {modules.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
            </select>
          </div>
          <button
            onClick={handleAfficher}
            disabled={!canAction || loadingGrille}
            className="btn-secondary flex items-center gap-2"
          >
            {loadingGrille ? <Spinner size="sm" /> : <BookOpen size={16} />}
            Afficher les notes
          </button>
          <button
            onClick={handleExport}
            disabled={!canAction || exporting}
            className="btn-secondary flex items-center gap-2"
          >
            {exporting ? <Spinner size="sm" /> : <FileDown size={16} />}
            Exporter Excel
          </button>
        </div>
      </div>

      {/* Import Excel */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <FileSpreadsheet size={20} className="text-primary-600" />
          <h2 className="font-semibold text-gray-800">Importer les notes (Excel)</h2>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5 text-sm text-blue-700">
          <p className="font-medium mb-1">Format du fichier Excel attendu :</p>
          <p>Colonnes : <span className="font-mono font-semibold">Matricule | Nom | Prénom | CC (/20) | EFM (/40)</span></p>
          <p className="mt-1 text-blue-600">
            Utilisez le bouton <strong>Télécharger le modèle</strong> pour obtenir un fichier pré-rempli avec les stagiaires du groupe sélectionné.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <button
            onClick={handleDownloadTemplate}
            disabled={!canAction}
            className="btn-secondary flex items-center gap-2"
          >
            <Download size={16} />
            Télécharger le modèle
          </button>

          <div className="flex items-center gap-3 flex-1 min-w-64">
            <label className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="input-field cursor-pointer flex items-center gap-2 text-gray-500 hover:text-gray-700"
              >
                <Upload size={16} className="shrink-0" />
                <span className="truncate">
                  {selectedFile ? selectedFile.name : 'Choisir un fichier Excel…'}
                </span>
              </div>
            </label>
            <button
              onClick={handleImport}
              disabled={!selectedFile || !canAction || importing}
              className="btn-primary flex items-center gap-2 whitespace-nowrap"
            >
              {importing ? <Spinner size="sm" /> : <Upload size={16} />}
              {importing ? 'Import en cours…' : 'Importer'}
            </button>
          </div>
        </div>

        {/* Résultat import */}
        {importResult && (
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
              <CheckCircle size={18} />
              <span className="font-medium">{importResult.imported} note(s) importée(s)</span>
            </div>
            {importResult.errors > 0 && (
              <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                <AlertCircle size={18} />
                <span className="font-medium">{importResult.errors} ligne(s) en erreur</span>
              </div>
            )}
            {importResult.skipped > 0 && (
              <div className="flex items-center gap-2 text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
                <span className="font-medium">{importResult.skipped} ligne(s) ignorée(s)</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grille notes (lecture seule) */}
      {loadingGrille ? (
        <Spinner className="mt-8" size="lg" />
      ) : grille.length > 0 ? (
        <div className="card overflow-hidden p-0">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">
              Grille — {selectedModuleNom}
              <span className="text-gray-400 font-normal text-sm ml-2">
                ({grille.length} stagiaire{grille.length > 1 ? 's' : ''})
              </span>
            </h2>
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
                      {entry.cc !== null && entry.cc !== undefined
                        ? <span className="font-semibold text-gray-800">{entry.cc}<span className="text-gray-400 text-xs">/20</span></span>
                        : <span className="text-gray-300 text-sm">—</span>}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {entry.efm !== null && entry.efm !== undefined
                        ? <span className="font-semibold text-gray-800">{entry.efm}<span className="text-gray-400 text-xs">/40</span></span>
                        : <span className="text-gray-300 text-sm">—</span>}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {entry.moyenne !== null && entry.moyenne !== undefined
                        ? <span className={moyenneColor(entry.moyenne)}>{Number(entry.moyenne).toFixed(2)}/20</span>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : selectedGroupe && selectedModule && !loadingGrille ? (
        <div className="card text-center py-12">
          <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Aucun stagiaire trouvé pour ce groupe/module</p>
        </div>
      ) : null}
    </div>
  )
}
