import { useEffect, useState } from 'react'
import { Plus, Search, UserCheck, UserX, Layers, ShieldCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { userService } from '../../services/userService'
import { poleService } from '../../services/poleService'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import SkeletonTable from '../../components/ui/SkeletonTable'
import Spinner from '../../components/ui/Spinner'

const ROLES = [
  { value: 'CHEF_DE_POLE', label: 'Chef de pôle' },
  { value: 'GESTIONNAIRE', label: 'Gestionnaire des stagiaires' },
  { value: 'FORMATEUR',    label: 'Formateur' },
]
const ROLE_LABEL = Object.fromEntries(ROLES.map(r => [r.value, r.label]))

export default function PersonnelPage() {
  const [roleFilter, setRoleFilter] = useState('CHEF_DE_POLE')
  const [users, setUsers] = useState([])
  const [poles, setPoles] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [poleTarget, setPoleTarget] = useState(null)
  const [poleValue, setPoleValue] = useState('')

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: { role: 'CHEF_DE_POLE' },
  })
  const watchRole = watch('role')

  const load = () => {
    setLoading(true)
    userService.findAll({ role: roleFilter, search, page, size: 15 })
      .then(r => {
        setUsers(r.data.data.content)
        setTotalPages(r.data.data.totalPages)
      })
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [roleFilter, search, page])
  useEffect(() => { poleService.findAll().then(r => setPoles(r.data.data || [])).catch(() => {}) }, [])

  const handleCreate = async (data) => {
    setSaving(true)
    try {
      await userService.create({
        ...data,
        telephone: data.telephone?.trim() || undefined,
        poleId: data.role === 'CHEF_DE_POLE' && data.poleId ? Number(data.poleId) : undefined,
      })
      toast.success('Compte créé')
      setShowModal(false)
      reset({ role: roleFilter })
      load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (id) => {
    try { await userService.toggleActif(id); load() }
    catch (e) { toast.error(e.response?.data?.message || 'Erreur') }
  }

  const openPole = (u) => { setPoleTarget(u); setPoleValue(u.poleId ? String(u.poleId) : '') }
  const handleAssignPole = async () => {
    setSaving(true)
    try {
      await userService.assignPole(poleTarget.id, poleValue || null)
      toast.success('Pôle mis à jour')
      setPoleTarget(null)
      load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Personnel</h1>
          <p className="page-subtitle">Comptes chefs de pôle, gestionnaires et formateurs</p>
        </div>
        <button onClick={() => { reset({ role: roleFilter }); setShowModal(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nouveau compte
        </button>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            {ROLES.map(r => (
              <button
                key={r.value}
                onClick={() => { setRoleFilter(r.value); setPage(0) }}
                className={`px-3 py-1.5 ${roleFilter === r.value ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="relative max-w-xs flex-1">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input className="input-field pl-9" placeholder="Rechercher..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(0) }} />
          </div>
        </div>

        {loading ? <SkeletonTable rows={6} cols={5} /> : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nom complet</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Pôle</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(u => (
                    <tr key={u.id}>
                      <td className="font-medium text-gray-900">{u.fullName}</td>
                      <td className="text-gray-500">{u.email}</td>
                      <td><Badge variant="info">{ROLE_LABEL[u.role] || u.role}</Badge></td>
                      <td className="text-gray-600">{u.poleNom || (u.role === 'CHEF_DE_POLE' ? <span className="text-amber-500">Non rattaché</span> : '—')}</td>
                      <td><Badge variant={u.actif ? 'success' : 'danger'}>{u.actif ? 'Actif' : 'Inactif'}</Badge></td>
                      <td>
                        <div className="flex items-center gap-2">
                          {u.role === 'CHEF_DE_POLE' && (
                            <button onClick={() => openPole(u)} className="p-1.5 rounded hover:bg-gray-100" title="Rattacher à un pôle">
                              <Layers size={16} className="text-primary-600" />
                            </button>
                          )}
                          <button onClick={() => handleToggle(u.id)} className="p-1.5 rounded hover:bg-gray-100" title={u.actif ? 'Désactiver' : 'Activer'}>
                            {u.actif ? <UserX size={16} className="text-red-500" /> : <UserCheck size={16} className="text-green-500" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={6} className="text-center text-gray-400 py-8">Aucun compte</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Modal création */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); reset({ role: roleFilter }) }} title="Nouveau compte">
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Mot de passe</label>
              <input type="password" className="input-field"
                {...register('password', { required: 'Obligatoire', minLength: { value: 8, message: 'Min 8 caractères' } })} />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="label">Rôle</label>
              <select className="input-field" {...register('role', { required: true })}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Téléphone (optionnel)</label>
            <input className="input-field" {...register('telephone')} placeholder="0600000000" />
          </div>
          {watchRole === 'CHEF_DE_POLE' && (
            <div>
              <label className="label flex items-center gap-1.5"><Layers size={13} /> Pôle de rattachement</label>
              <select className="input-field" {...register('poleId')}>
                <option value="">— À définir plus tard —</option>
                {poles.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => { setShowModal(false); reset({ role: roleFilter }) }} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Spinner size="sm" /> : <ShieldCheck size={16} />} Créer le compte
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal rattachement pôle */}
      <Modal isOpen={!!poleTarget} onClose={() => setPoleTarget(null)} title={`Pôle — ${poleTarget?.fullName || ''}`} size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Pôle de rattachement</label>
            <select className="input-field" value={poleValue} onChange={e => setPoleValue(e.target.value)}>
              <option value="">— Aucun —</option>
              {poles.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setPoleTarget(null)}>Annuler</button>
            <button className="btn-primary flex items-center gap-2" onClick={handleAssignPole} disabled={saving}>
              {saving ? <Spinner size="sm" /> : <Layers size={16} />} Enregistrer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
