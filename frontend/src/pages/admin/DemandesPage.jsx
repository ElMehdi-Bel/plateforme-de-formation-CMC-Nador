import { useEffect, useRef, useState } from 'react'
import { CheckCircle, XCircle, Upload, FileText, RefreshCw, Loader2 } from 'lucide-react'
import { demandeService } from '../../services/demandeService'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'

const statutBadge = {
  EN_ATTENTE:    { variant: 'warning', label: 'En attente' },
  APPROUVEE:     { variant: 'success', label: 'Approuvée' },
  REJETEE:       { variant: 'danger',  label: 'Rejetée' },
  DOCUMENT_PRET: { variant: 'info',    label: 'Document prêt' },
}

const typeDemande = {
  ATTESTATION_INSCRIPTION:         "Attestation d'inscription",
  ATTESTATION_STAGE:               'Attestation de stage',
  ATTESTATION_POURSUITE_FORMATION: 'Attestation de poursuite de formation',
  RELEVE_NOTES:                    'Relevé de notes',
  CERTIFICAT_PRESENCE:             'Certificat de présence',
  AUTRE:                           'Autre',
}

export default function DemandesPage() {
  const [demandes, setDemandes]         = useState([])
  const [page, setPage]                 = useState(0)
  const [totalPages, setTotalPages]     = useState(0)
  const [loading, setLoading]           = useState(true)
  const [filterStatut, setFilterStatut] = useState('')

  // traiter modal
  const [selected, setSelected]     = useState(null)
  const [commentaire, setCommentaire] = useState('')
  const [processing, setProcessing] = useState(false)

  // upload modal
  const [uploadTarget, setUploadTarget] = useState(null)
  const [uploadFile, setUploadFile]     = useState(null)
  const [uploading, setUploading]       = useState(false)
  const fileInputRef = useRef(null)

  const load = () => {
    setLoading(true)
    demandeService.findAll({ page, size: 15, statut: filterStatut || undefined })
      .then(r => {
        const payload = r.data?.data
        setDemandes(payload?.content ?? [])
        setTotalPages(payload?.totalPages ?? 0)
      })
      .catch((err) => {
        const msg = err.response?.data?.message || 'Erreur lors du chargement des demandes'
        toast.error(msg)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, filterStatut])

  const traiter = async (statut) => {
    setProcessing(true)
    try {
      await demandeService.traiter(selected.id, statut, commentaire)
      toast.success('Demande traitée avec succès')
      setSelected(null)
      load()
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors du traitement'
      toast.error(msg)
    } finally {
      setProcessing(false)
    }
  }

  const openUpload = (d) => {
    setUploadTarget(d)
    setUploadFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUpload = async () => {
    if (!uploadFile) { toast.error('Veuillez sélectionner un fichier'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', uploadFile)
      await demandeService.uploadDocument(uploadTarget.id, fd)
      toast.success('Document envoyé au stagiaire !')
      setUploadTarget(null)
      load()
    } catch (err) {
      const msg = err.response?.data?.message || "Erreur lors de l'upload du document"
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  const FILTERS = [
    { value: '',              label: 'Toutes' },
    { value: 'EN_ATTENTE',   label: 'En attente' },
    { value: 'APPROUVEE',    label: 'Approuvées' },
    { value: 'REJETEE',      label: 'Rejetées' },
    { value: 'DOCUMENT_PRET', label: 'Documents prêts' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Demandes administratives</h1>
        <p className="text-gray-500 text-sm mt-1">Traitement des demandes des stagiaires</p>
      </div>

      <div className="card space-y-4">
        <div className="flex gap-3 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => { setFilterStatut(f.value); setPage(0) }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatut === f.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Stagiaire</th>
                <th>Type</th>
                <th>Motif</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Document</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10">
                    <Loader2 size={22} className="animate-spin mx-auto text-primary-500" />
                  </td>
                </tr>
              ) : null}
              {!loading && demandes.map(d => (
                <tr key={d.id}>
                  <td className="font-medium">{d.stagiaire?.prenom} {d.stagiaire?.nom}</td>
                  <td>{typeDemande[d.typeDemande] || d.typeDemande}</td>
                  <td className="max-w-xs truncate text-gray-500">{d.motif || '—'}</td>
                  <td className="text-gray-500 text-xs">{new Date(d.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <Badge variant={statutBadge[d.statut]?.variant}>
                      {statutBadge[d.statut]?.label}
                    </Badge>
                  </td>
                  <td>
                    {d.documentNom
                      ? <span className="flex items-center gap-1 text-xs text-green-700"><FileText size={13}/>{d.documentNom}</span>
                      : <span className="text-xs text-gray-400">—</span>
                    }
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {d.statut === 'EN_ATTENTE' && (
                        <button
                          onClick={() => { setSelected(d); setCommentaire('') }}
                          className="text-xs text-primary-600 hover:underline font-medium"
                        >
                          Traiter
                        </button>
                      )}
                      {(d.statut === 'APPROUVEE' || d.statut === 'DOCUMENT_PRET') && (
                        <button
                          onClick={() => openUpload(d)}
                          className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1"
                        >
                          {d.statut === 'DOCUMENT_PRET'
                            ? <><RefreshCw size={12}/> Remplacer</>
                            : <><Upload size={12}/> Uploader doc</>
                          }
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && demandes.length === 0 && (
                <tr><td colSpan={7} className="text-center text-gray-400 py-8">Aucune demande</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* Modal traiter */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Traiter la demande">
        {selected && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
              <p><span className="font-medium">Stagiaire:</span> {selected.stagiaire?.prenom} {selected.stagiaire?.nom}</p>
              <p><span className="font-medium">Type:</span> {typeDemande[selected.typeDemande]}</p>
              {selected.motif && <p><span className="font-medium">Motif:</span> {selected.motif}</p>}
            </div>
            <div>
              <label className="label">Commentaire (optionnel)</label>
              <textarea
                className="input-field"
                rows={3}
                value={commentaire}
                onChange={e => setCommentaire(e.target.value)}
                placeholder="Ajouter un commentaire..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => traiter('REJETEE')} disabled={processing} className="btn-danger flex items-center gap-2">
                <XCircle size={16} /> Rejeter
              </button>
              <button
                onClick={() => traiter('APPROUVEE')}
                disabled={processing}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <CheckCircle size={16} /> Approuver
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal upload document */}
      <Modal
        isOpen={!!uploadTarget}
        onClose={() => setUploadTarget(null)}
        title="Uploader le document signé"
      >
        {uploadTarget && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4 text-sm space-y-1">
              <p><span className="font-medium">Stagiaire:</span> {uploadTarget.stagiaire?.prenom} {uploadTarget.stagiaire?.nom}</p>
              <p><span className="font-medium">Document:</span> {typeDemande[uploadTarget.typeDemande]}</p>
              {uploadTarget.documentNom && (
                <p className="text-gray-500">Document actuel: {uploadTarget.documentNom}</p>
              )}
            </div>

            <div>
              <label className="label">Fichier (PDF, Word…)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="input-field text-sm"
                onChange={e => setUploadFile(e.target.files[0] || null)}
              />
              {uploadFile && (
                <p className="text-xs text-gray-500 mt-1">
                  Sélectionné: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(0)} Ko)
                </p>
              )}
            </div>

            <p className="text-xs text-gray-400">
              Le stagiaire recevra une notification et pourra télécharger le document depuis son espace.
            </p>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setUploadTarget(null)} className="btn-secondary">Annuler</button>
              <button
                onClick={handleUpload}
                disabled={uploading || !uploadFile}
                className="btn-primary flex items-center gap-2"
              >
                <Upload size={16} />
                {uploading ? 'Envoi en cours…' : 'Envoyer au stagiaire'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
