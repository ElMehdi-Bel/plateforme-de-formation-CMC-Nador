import { useEffect, useState } from 'react'
import { Plus, Download, Loader2 } from 'lucide-react'
import { demandeService } from '../../services/demandeService'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Pagination from '../../components/ui/Pagination'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

const statutBadge = {
  EN_ATTENTE:    { variant: 'warning', label: 'En attente' },
  APPROUVEE:     { variant: 'success', label: 'Approuvée' },
  REJETEE:       { variant: 'danger',  label: 'Rejetée' },
  DOCUMENT_PRET: { variant: 'info',    label: 'Document prêt' },
}

const typeOptions = [
  { value: 'ATTESTATION_INSCRIPTION',         label: "Attestation d'inscription" },
  { value: 'ATTESTATION_STAGE',               label: 'Attestation de stage' },
  { value: 'ATTESTATION_POURSUITE_FORMATION', label: 'Attestation de poursuite de formation' },
  { value: 'RELEVE_NOTES',                    label: 'Relevé de notes' },
  { value: 'CERTIFICAT_PRESENCE',             label: 'Certificat de présence' },
  { value: 'AUTRE',                           label: 'Autre' },
]

export default function MesDemandesPage() {
  const [demandes, setDemandes]       = useState([])
  const [page, setPage]               = useState(0)
  const [totalPages, setTotalPages]   = useState(0)
  const [loading, setLoading]         = useState(true)
  const [showModal, setShowModal]     = useState(false)
  const [saving, setSaving]           = useState(false)
  const [downloading, setDownloading] = useState(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const load = () => {
    setLoading(true)
    demandeService.mesDemandes({ page, size: 10 })
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

  useEffect(() => { load() }, [page])

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      await demandeService.create(data)
      toast.success('Demande envoyée avec succès')
      setShowModal(false)
      reset()
      load()
    } catch {
      toast.error("Erreur lors de l'envoi")
    } finally {
      setSaving(false)
    }
  }

  const telecharger = async (d) => {
    setDownloading(d.id)
    try {
      const response = await demandeService.downloadDocument(d.id)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', d.documentNom || 'document')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Erreur lors du téléchargement')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Demandes</h1>
          <p className="text-gray-500 text-sm mt-1">Suivi de vos demandes administratives</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nouvelle demande
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Motif</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Commentaire admin</th>
                <th>Document</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10">
                    <Loader2 size={22} className="animate-spin mx-auto text-primary-500" />
                  </td>
                </tr>
              ) : demandes.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-gray-400 py-8">Aucune demande pour le moment</td></tr>
              ) : demandes.map(d => (
                <tr key={d.id}>
                  <td className="font-medium">{typeOptions.find(t => t.value === d.typeDemande)?.label || d.typeDemande}</td>
                  <td className="text-gray-500 text-sm">{d.motif || '—'}</td>
                  <td className="text-xs text-gray-500">{new Date(d.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td><Badge variant={statutBadge[d.statut]?.variant}>{statutBadge[d.statut]?.label || d.statut}</Badge></td>
                  <td className="text-xs text-gray-500">{d.commentaireAdmin || '—'}</td>
                  <td>
                    {d.statut === 'DOCUMENT_PRET' && d.documentDisponible ? (
                      <button
                        onClick={() => telecharger(d)}
                        disabled={downloading === d.id}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <Download size={14} />
                        {downloading === d.id ? 'Téléchargement…' : (d.documentNom || 'Télécharger')}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); reset() }} title="Nouvelle demande">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Type de demande</label>
            <select className="input-field" {...register('typeDemande', { required: 'Obligatoire' })}>
              <option value="">-- Choisir --</option>
              {typeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            {errors.typeDemande && <p className="text-red-500 text-xs mt-1">{errors.typeDemande.message}</p>}
          </div>
          <div>
            <label className="label">Motif / Détails</label>
            <textarea className="input-field" rows={4}
              placeholder="Décrivez votre demande..."
              {...register('motif')} />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => { setShowModal(false); reset() }} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Envoi...' : 'Envoyer la demande'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
