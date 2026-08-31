import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Check, Layers } from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { poleService } from '../../services/poleService'

function PoleForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    nom: initial?.nom || '',
    code: initial?.code || '',
    chefNom: initial?.chefNom || '',
    description: initial?.description || '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.nom.trim()) return toast.error('Le nom est obligatoire')
    onSubmit({
      nom: form.nom.trim(),
      code: form.code.trim() || null,
      chefNom: form.chefNom.trim() || null,
      description: form.description.trim() || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Nom du pôle *</label>
        <input className="input-field" value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Ex: Pôle Digital & IA" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Code</label>
          <input className="input-field" value={form.code} onChange={e => set('code', e.target.value)} placeholder="Ex: PDIA" />
        </div>
        <div>
          <label className="label">Chef de pôle</label>
          <input className="input-field" value={form.chefNom} onChange={e => set('chefNom', e.target.value)} placeholder="Nom du responsable" />
        </div>
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input-field" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optionnelle..." />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Annuler</button>
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
          {loading ? <Spinner size="sm" /> : <Check size={16} />}
          {initial ? 'Modifier' : 'Créer'}
        </button>
      </div>
    </form>
  )
}

export default function PolesPage() {
  const [poles, setPoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState({ open: false, data: null })
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, nom: '' })

  useEffect(() => { load() }, [])

  const load = () => {
    setLoading(true)
    poleService.findAll()
      .then(r => setPoles(r.data.data || []))
      .catch(() => toast.error('Erreur chargement pôles'))
      .finally(() => setLoading(false))
  }

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (modal.data) {
        await poleService.update(modal.data.id, data)
        toast.success('Pôle modifié')
      } else {
        await poleService.create(data)
        toast.success('Pôle créé')
      }
      setModal({ open: false, data: null })
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await poleService.delete(confirmDelete.id)
      toast.success('Pôle supprimé')
      setConfirmDelete({ open: false })
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur suppression')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Pôles</h1>
          <p className="page-subtitle">{poles.length} pôle(s)</p>
        </div>
        <button onClick={() => setModal({ open: true, data: null })} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nouveau pôle
        </button>
      </div>

      {loading ? (
        <Spinner className="mt-16" size="lg" />
      ) : poles.length === 0 ? (
        <div className="card text-center py-16">
          <Layers size={48} className="mx-auto text-warm-300 mb-4" />
          <p className="text-warm-500 font-medium">Aucun pôle</p>
          <p className="text-warm-400 text-sm mt-1">Créez votre premier pôle</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-warm-50/80 text-left">
                <th className="px-5 py-2.5 text-xs font-bold text-warm-500 uppercase tracking-wider">Pôle</th>
                <th className="px-5 py-2.5 text-xs font-bold text-warm-500 uppercase tracking-wider">Code</th>
                <th className="px-5 py-2.5 text-xs font-bold text-warm-500 uppercase tracking-wider">Chef de pôle</th>
                <th className="px-5 py-2.5 text-xs font-bold text-warm-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-50">
              {poles.map(pole => (
                <tr key={pole.id} className="hover:bg-primary-50/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Layers size={14} className="text-primary-600" />
                      <span className="font-medium text-warm-800">{pole.nom}</span>
                    </div>
                    {pole.description && <p className="text-xs text-warm-400 mt-0.5">{pole.description}</p>}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-warm-500">{pole.code || '—'}</td>
                  <td className="px-5 py-3 text-warm-600">{pole.chefNom || '—'}</td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => setModal({ open: true, data: pole })} className="p-1.5 rounded text-blue-500 hover:bg-blue-50" title="Modifier">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setConfirmDelete({ open: true, id: pole.id, nom: pole.nom })} className="p-1.5 rounded text-red-400 hover:bg-red-50" title="Supprimer">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, data: null })}
        title={modal.data ? 'Modifier le pôle' : 'Nouveau pôle'}
      >
        <PoleForm
          initial={modal.data}
          onSubmit={handleSave}
          onCancel={() => setModal({ open: false, data: null })}
          loading={saving}
        />
      </Modal>

      <ConfirmDialog
        isOpen={confirmDelete.open}
        message={`Supprimer "${confirmDelete.nom}" ? Cette action est irréversible.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({ open: false })}
        loading={saving}
      />
    </div>
  )
}
