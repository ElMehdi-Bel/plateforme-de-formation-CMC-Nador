import { useEffect, useState } from 'react'
import { FileText, Download, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../../components/ui/Spinner'
import { groupeService } from '../../services/filiereService'
import { userService } from '../../services/userService'
import { documentService } from '../../services/documentService'

export default function DocumentsPage() {
  const [groupes, setGroupes] = useState([])
  const [groupeId, setGroupeId] = useState('')
  const [stagiaires, setStagiaires] = useState([])
  const [stagiaireId, setStagiaireId] = useState('')
  const [loadingList, setLoadingList] = useState(false)
  const [loadingAtt, setLoadingAtt] = useState(false)

  useEffect(() => {
    groupeService.findAll()
      .then(r => setGroupes(r.data.data || []))
      .catch(() => toast.error('Erreur chargement groupes'))
  }, [])

  useEffect(() => {
    setStagiaireId('')
    setStagiaires([])
    if (!groupeId) return
    userService.findByGroupe(groupeId)
      .then(r => setStagiaires(r.data.data || []))
      .catch(() => toast.error('Erreur chargement stagiaires'))
  }, [groupeId])

  const handleListe = async () => {
    if (!groupeId) return toast.error('Choisissez un groupe')
    setLoadingList(true)
    try {
      await documentService.listeStagiaires(groupeId)
      toast.success('Liste générée')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la génération')
    } finally { setLoadingList(false) }
  }

  const handleAttestation = async () => {
    if (!stagiaireId) return toast.error('Choisissez un stagiaire')
    setLoadingAtt(true)
    try {
      await documentService.attestation(stagiaireId)
      toast.success('Attestation générée')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la génération')
    } finally { setLoadingAtt(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Documents</h1>
        <p className="page-subtitle">Imprimer les listes et générer les attestations</p>
      </div>

      <div className="card">
        <label className="label">Groupe</label>
        <select className="input-field max-w-md" value={groupeId} onChange={e => setGroupeId(e.target.value)}>
          <option value="">-- Choisir un groupe --</option>
          {groupes.map(g => (
            <option key={g.id} value={g.id}>
              {g.nom}{g.code ? ` (${g.code})` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Liste stagiaires */}
        <div className="card">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary-50 border border-primary-100 flex-shrink-0">
              <Users size={22} className="text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-warm-900">Liste des stagiaires (Excel)</h3>
              <p className="text-sm text-warm-500 mt-1">
                Fiche complète du groupe sélectionné{groupeId ? ` — ${stagiaires.length} stagiaire(s)` : ''}.
              </p>
              <button onClick={handleListe} disabled={loadingList || !groupeId} className="btn-primary flex items-center gap-2 mt-4">
                {loadingList ? <Spinner size="sm" /> : <Download size={16} />}
                Télécharger la liste
              </button>
            </div>
          </div>
        </div>

        {/* Attestation */}
        <div className="card">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary-50 border border-primary-100 flex-shrink-0">
              <FileText size={22} className="text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-warm-900">Attestation de poursuite (PDF)</h3>
              <p className="text-sm text-warm-500 mt-1 mb-3">Sélectionnez un stagiaire du groupe.</p>
              <select
                className="input-field"
                value={stagiaireId}
                onChange={e => setStagiaireId(e.target.value)}
                disabled={!groupeId}
              >
                <option value="">-- Choisir un stagiaire --</option>
                {stagiaires.map(s => (
                  <option key={s.id} value={s.id}>{s.fullName || `${s.prenom} ${s.nom}`}</option>
                ))}
              </select>
              <button onClick={handleAttestation} disabled={loadingAtt || !stagiaireId} className="btn-primary flex items-center gap-2 mt-4">
                {loadingAtt ? <Spinner size="sm" /> : <Download size={16} />}
                Générer l'attestation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
