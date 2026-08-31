import { useEffect, useState, useRef } from 'react'
import { Plus, Search, UserCheck, UserX, Upload, Mail, FileSpreadsheet, UsersRound, ShieldAlert, Trash2 } from 'lucide-react'
import { userService } from '../../services/userService'
import { disciplineService } from '../../services/disciplineService'
import { useAuth } from '../../context/AuthContext'
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
  const { isGestionnaire } = useAuth()
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
  const [assignTarget, setAssignTarget] = useState(null)   // stagiaire dont on change le groupe
  const [assignGroupeId, setAssignGroupeId] = useState('')
  const [assigning, setAssigning] = useState(false)
  // Discipline
  const [discTarget, setDiscTarget] = useState(null)
  const [discBilan, setDiscBilan] = useState(null)
  const [incidents, setIncidents] = useState([])
  const [sanctions, setSanctions] = useState([])
  const [incForm, setIncForm] = useState({ dateIncident: new Date().toISOString().slice(0, 10), motif: '', description: '' })
  const [incSaving, setIncSaving] = useState(false)
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

  const openAssign = (s) => {
    setAssignTarget(s)
    setAssignGroupeId(s.groupeId ? String(s.groupeId) : '')
  }

  const handleAssign = async () => {
    setAssigning(true)
    try {
      await userService.assignGroupe(assignTarget.id, assignGroupeId || null)
      toast.success(assignGroupeId ? 'Stagiaire affecté au groupe' : 'Stagiaire retiré de son groupe')
      setAssignTarget(null)
      load()
    } catch (e) {
      toast.error(e.response?.data?.message || "Erreur lors de l'affectation")
    } finally {
      setAssigning(false)
    }
  }

  const openDiscipline = async (s) => {
    setDiscTarget(s)
    setDiscBilan(null)
    setIncidents([])
    setSanctions([])
    setIncForm({ dateIncident: new Date().toISOString().slice(0, 10), motif: '', description: '' })
    await refreshDiscipline(s.id)
  }

  const refreshDiscipline = async (id) => {
    try {
      const [b, inc, sanc] = await Promise.all([
        disciplineService.forStagiaire(id),
        disciplineService.incidents(id),
        disciplineService.sanctions(id),
      ])
      setDiscBilan(b.data.data)
      setIncidents(inc.data.data || [])
      setSanctions(sanc.data.data || [])
    } catch {
      toast.error('Erreur chargement discipline')
    }
  }

  const handleAddIncident = async (e) => {
    e.preventDefault()
    if (!incForm.motif.trim()) return toast.error('Le motif est obligatoire')
    setIncSaving(true)
    try {
      await disciplineService.addIncident({ stagiaireId: discTarget.id, ...incForm, motif: incForm.motif.trim() })
      toast.success('Incident enregistré')
      setIncForm(f => ({ ...f, motif: '', description: '' }))
      await refreshDiscipline(discTarget.id)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally {
      setIncSaving(false)
    }
  }

  const handleDeleteIncident = async (id) => {
    try {
      await disciplineService.deleteIncident(id)
      await refreshDiscipline(discTarget.id)
    } catch {
      toast.error('Erreur suppression')
    }
  }

  // Options de groupes regroupées par filière (réutilisées dans 2 formulaires)
  const groupeOptions = Object.entries(
    groupes.reduce((acc, g) => {
      const fil = g.filiere?.nom || g.filiereNom || 'Sans filière'
      ;(acc[fil] = acc[fil] || []).push(g)
      return acc
    }, {})
  )

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
                            onClick={() => openAssign(s)}
                            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                            title="Affecter à un groupe"
                          >
                            <UsersRound size={16} className="text-primary-600" />
                          </button>
                          <button
                            onClick={() => openDiscipline(s)}
                            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                            title="Discipline & assiduité"
                          >
                            <ShieldAlert size={16} className="text-amber-600" />
                          </button>
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
              {groupeOptions.map(([filNom, grps]) => (
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

      {/* Modal Affectation à un groupe */}
      <Modal
        isOpen={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        title={`Affecter — ${assignTarget?.fullName || ''}`}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Groupe</label>
            <select
              className="input-field"
              value={assignGroupeId}
              onChange={e => setAssignGroupeId(e.target.value)}
            >
              <option value="">— Aucun groupe —</option>
              {groupeOptions.map(([filNom, grps]) => (
                <optgroup key={filNom} label={filNom}>
                  {grps.map(g => (
                    <option key={g.id} value={g.id}>{g.nom}{g.code ? ` (${g.code})` : ''}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Le groupe conditionne l'emploi du temps, les notes et les absences du stagiaire.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setAssignTarget(null)}>Annuler</button>
            <button className="btn-primary flex items-center gap-2" onClick={handleAssign} disabled={assigning}>
              {assigning ? <Spinner size="sm" /> : <UsersRound size={16} />}
              Enregistrer
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Discipline & assiduité */}
      <Modal
        isOpen={!!discTarget}
        onClose={() => setDiscTarget(null)}
        title={`Discipline — ${discTarget?.fullName || ''}`}
        size="lg"
      >
        {!discBilan ? (
          <div className="py-8 flex justify-center"><Spinner size="md" /></div>
        ) : (
          <div className="space-y-5">
            {/* Bilan */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 rounded-lg py-3">
                <p className="text-xl font-bold text-gray-800">{discBilan.noteAssiduite}/10</p>
                <p className="text-xs text-gray-500">Assiduité</p>
              </div>
              <div className="bg-gray-50 rounded-lg py-3">
                <p className="text-xl font-bold text-gray-800">{discBilan.noteComportement}/5</p>
                <p className="text-xs text-gray-500">Comportement</p>
              </div>
              <div className="bg-primary-50 rounded-lg py-3">
                <p className="text-xl font-bold text-primary-700">{discBilan.noteDiscipline}/15</p>
                <p className="text-xs text-gray-500">Note de discipline</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
              <div><span className="text-gray-400 text-xs block">Retards</span>{discBilan.nbRetards}</div>
              <div><span className="text-gray-400 text-xs block">Absences (séances)</span>{discBilan.nbAbsencesSeances}</div>
              <div><span className="text-gray-400 text-xs block">Journées</span>{discBilan.nbJournees}</div>
              <div><span className="text-gray-400 text-xs block">ND /20 (passage)</span>{discBilan.noteDisciplineSur20}</div>
            </div>
            {discBilan.palierAssiduite > 0 && (
              <p className="text-sm bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-amber-800">
                Assiduité : <strong>{discBilan.sanctionAssiduite}</strong> — décision {discBilan.autoriteAssiduite}
              </p>
            )}
            {discBilan.nbIncidents > 0 && (
              <p className="text-sm bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-amber-800">
                Comportement : <strong>{discBilan.sanctionComportement}</strong> — décision {discBilan.autoriteComportement}
              </p>
            )}

            {/* Sanctions enregistrées */}
            {sanctions.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 text-sm mb-2">Sanctions enregistrées ({sanctions.length})</h4>
                <div className="border border-gray-100 rounded-lg divide-y divide-gray-100 text-sm max-h-40 overflow-y-auto">
                  {sanctions.map(sn => (
                    <div key={sn.id} className="px-3 py-2">
                      <p className="font-medium text-gray-800">{sn.sanction} <span className="text-xs text-gray-400">— {sn.autorite}</span></p>
                      <p className="text-xs text-gray-400">
                        {sn.type === 'ASSIDUITE' ? 'Assiduité' : 'Comportement'} · palier {sn.palier} · {sn.createdAt?.slice(0, 10)}
                        {sn.exclusionDefinitive ? ' · Conseil de Discipline' : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Incidents */}
            <div>
              <h4 className="font-semibold text-gray-800 text-sm mb-2">Incidents de comportement ({incidents.length})</h4>
              {incidents.length > 0 && (
                <div className="border border-gray-100 rounded-lg divide-y divide-gray-100 mb-3 max-h-40 overflow-y-auto">
                  {incidents.map(inc => (
                    <div key={inc.id} className="flex items-start justify-between px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium text-gray-800">{inc.motif}</p>
                        <p className="text-xs text-gray-400">{inc.dateIncident}{inc.creeParNom ? ` · ${inc.creeParNom}` : ''}</p>
                        {inc.description && <p className="text-xs text-gray-500 mt-0.5">{inc.description}</p>}
                      </div>
                      {isGestionnaire && (
                        <button onClick={() => handleDeleteIncident(inc.id)} className="p-1 rounded text-red-400 hover:bg-red-50">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {isGestionnaire ? (
                <form onSubmit={handleAddIncident} className="space-y-2 bg-gray-50 rounded-lg p-3">
                  <div className="grid sm:grid-cols-3 gap-2">
                    <input type="date" className="input-field text-sm" value={incForm.dateIncident}
                      onChange={e => setIncForm(f => ({ ...f, dateIncident: e.target.value }))} />
                    <input className="input-field text-sm sm:col-span-2" placeholder="Motif (ex: perturbation du cours)"
                      value={incForm.motif} onChange={e => setIncForm(f => ({ ...f, motif: e.target.value }))} />
                  </div>
                  <input className="input-field text-sm" placeholder="Description (optionnel)"
                    value={incForm.description} onChange={e => setIncForm(f => ({ ...f, description: e.target.value }))} />
                  <div className="flex justify-end">
                    <button type="submit" disabled={incSaving} className="btn-primary flex items-center gap-2 text-sm">
                      {incSaving ? <Spinner size="sm" /> : <Plus size={14} />} Ajouter l'incident
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-xs text-gray-400">Seul le gestionnaire des stagiaires peut enregistrer un incident.</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
