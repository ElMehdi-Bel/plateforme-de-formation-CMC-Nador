import { useEffect, useState, useRef } from 'react'
import { Plus, Search, UserCheck, UserX, Upload, Mail, FileSpreadsheet } from 'lucide-react'
import { userService } from '../../services/userService'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import SkeletonTable from '../../components/ui/SkeletonTable'
import Spinner from '../../components/ui/Spinner'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { groupeService } from '../../services/filiereService'
import api from '../../services/api'

export default function StagiairesPage() {
  const [stagiaires, setStagiaires] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [groupes, setGroupes] = useState([])
  const [saving, setSaving]       = useState(false)
  const [importing, setImporting] = useState(false)
  const [envoyerEmails, setEnvoyerEmails] = useState(false)
  const [fichierSelectionne, setFichierSelectionne] = useState(null)
  const fileRef = useRef()

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const load = () => {
    setLoading(true)
    userService.findAll({ role: 'STAGIAIRE', search, page, size: 15 })
      .then(r => {
        setStagiaires(r.data.data.content)
        setTotalPages(r.data.data.totalPages)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search, page])

  useEffect(() => {
    groupeService.findAll().then(r => setGroupes(r.data.data))
  }, [])

  const handleCreate = async (data) => {
    setSaving(true)
    try {
      await userService.create({ ...data, role: 'STAGIAIRE' })
      toast.success('Stagiaire créé avec succès')
      setShowModal(false)
      reset()
      load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (id) => {
    await userService.toggleActif(id)
    load()
  }

  const handleFichierChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toast.error('Fichier Excel requis (.xlsx ou .xls)')
      return
    }
    setFichierSelectionne(file)
    setShowImportModal(true)
    e.target.value = ''
  }

  const handleImportConfirmer = async () => {
    if (!fichierSelectionne) return
    setImporting(true)
    try {
      const form = new FormData()
      form.append('file', fichierSelectionne)
      form.append('envoyerEmails', envoyerEmails)
      const r = await api.post('/import/stagiaires', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const { crees, ignores, erreurs } = r.data.data
      toast.success(`Import réussi : ${crees} stagiaire(s) créé(s)${ignores > 0 ? `, ${ignores} ignoré(s)` : ''}${erreurs > 0 ? `, ${erreurs} erreur(s)` : ''}`)
      setShowImportModal(false)
      setFichierSelectionne(null)
      setEnvoyerEmails(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l'import")
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stagiaires</h1>
          <p className="text-gray-500 text-sm mt-1">Gestion des stagiaires inscrits</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileRef.current.click()}
            className="btn-secondary flex items-center gap-2"
          >
            <Upload size={16} /> Importer Excel
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFichierChange} />

          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Nouveau stagiaire
          </button>
        </div>
      </div>

      <div className="card">
        {/* Search */}
        <div className="relative mb-4 max-w-sm">
          <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            className="input-field pl-9"
            placeholder="Rechercher..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
          />
        </div>

        {/* Table */}
        {loading ? <SkeletonTable rows={8} cols={6} /> : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nom complet</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Groupe</th>
                    <th>Filière</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stagiaires.map(s => (
                    <tr key={s.id}>
                      <td className="font-medium text-gray-900">{s.fullName}</td>
                      <td className="text-gray-500">{s.email}</td>
                      <td className="text-gray-500">{s.telephone || '—'}</td>
                      <td>{s.groupeNom || <span className="text-gray-400">Non assigné</span>}</td>
                      <td>{s.filiereNom || '—'}</td>
                      <td>
                        <Badge variant={s.actif ? 'success' : 'danger'}>
                          {s.actif ? 'Actif' : 'Inactif'}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggle(s.id)}
                            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                            title={s.actif ? 'Désactiver' : 'Activer'}
                          >
                            {s.actif
                              ? <UserX size={16} className="text-red-500" />
                              : <UserCheck size={16} className="text-green-500" />
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {stagiaires.length === 0 && (
                    <tr><td colSpan={7} className="text-center text-gray-400 py-8">Aucun stagiaire trouvé</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Modal Import Excel */}
      <Modal
        isOpen={showImportModal}
        onClose={() => { setShowImportModal(false); setFichierSelectionne(null); setEnvoyerEmails(false) }}
        title="Importer des stagiaires"
        size="sm"
      >
        <div className="space-y-4">
          {/* Fichier sélectionné */}
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
            <FileSpreadsheet size={20} className="text-green-600 flex-shrink-0" />
            <span className="text-sm text-gray-700 truncate">{fichierSelectionne?.name}</span>
          </div>

          {/* Option email */}
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={envoyerEmails}
              onChange={e => setEnvoyerEmails(e.target.checked)}
              className="mt-0.5 rounded"
            />
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <Mail size={15} className="text-primary-600" />
                Envoyer les identifiants par email
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Chaque stagiaire recevra son email de connexion et son mot de passe automatiquement.
                Nécessite la configuration Gmail dans application.properties.
              </p>
            </div>
          </label>

          <div className="flex justify-end gap-3 pt-1">
            <button
              onClick={() => { setShowImportModal(false); setFichierSelectionne(null); setEnvoyerEmails(false) }}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button
              onClick={handleImportConfirmer}
              disabled={importing}
              className="btn-primary flex items-center gap-2"
            >
              {importing ? <Spinner size="sm" /> : <Upload size={16} />}
              {importing ? 'Import en cours...' : 'Lancer l\'import'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Création */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); reset() }} title="Nouveau stagiaire">
        <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nom</label>
              <input className="input-field" {...register('nom', { required: 'Obligatoire' })} />
              {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom.message}</p>}
            </div>
            <div>
              <label className="label">Prénom</label>
              <input className="input-field" {...register('prenom', { required: 'Obligatoire' })} />
              {errors.prenom && <p className="text-red-500 text-xs mt-1">{errors.prenom.message}</p>}
            </div>
          </div>

          <div>
            <label className="label">Email</label>
            <input type="email" className="input-field" {...register('email', { required: 'Obligatoire' })} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="label">Mot de passe</label>
            <input type="password" className="input-field" {...register('password', {
              required: 'Obligatoire', minLength: { value: 8, message: 'Min 8 caractères' }
            })} />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="label">Téléphone</label>
            <input className="input-field" {...register('telephone')} placeholder="0600000000" />
          </div>

          <div>
            <label className="label">Groupe</label>
            <select className="input-field" {...register('groupeId')}>
              <option value="">-- Sélectionner un groupe --</option>
              {Object.entries(
                groupes.reduce((acc, g) => {
                  const fil = g.filiere?.nom || 'Sans filière'
                  if (!acc[fil]) acc[fil] = []
                  acc[fil].push(g)
                  return acc
                }, {})
              ).map(([filNom, grps]) => (
                <optgroup key={filNom} label={filNom}>
                  {grps.map(g => (
                    <option key={g.id} value={g.id}>{g.nom}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => { setShowModal(false); reset() }} className="btn-secondary">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Création...' : 'Créer le stagiaire'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
