import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Check, DoorOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { salleService } from '../../services/salleService'

const TYPES = ['Salle de cours', 'Atelier', 'Labo informatique', 'Amphi', 'Salle de réunion']

function SalleForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    nom: initial?.nom || '',
    code: initial?.code || '',
    type: initial?.type || '',
    capacite: initial?.capacite ?? '',
    batiment: initial?.batiment || '',
    disponible: initial?.disponible ?? true,
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.nom.trim()) return toast.error('Le nom est obligatoire')
    onSubmit({
      nom: form.nom.trim(),
      code: form.code.trim() || null,
      type: form.type || null,
      capacite: form.capacite === '' ? null : parseInt(form.capacite, 10),
      batiment: form.batiment.trim() || null,
      disponible: form.disponible,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Nom de la salle *</label>
          <input className="input-field" value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Ex: B-204" />
        </div>
        <div>
          <label className="label">Code</label>
          <input className="input-field" value={form.code} onChange={e => set('code', e.target.value)} placeholder="Ex: B204" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Type</label>
          <select className="input-field" value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="">-- Choisir --</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Capacité</label>
          <input className="input-field" type="number" min="0" value={form.capacite} onChange={e => set('capacite', e.target.value)} placeholder="Ex: 24" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Bâtiment</label>
          <input className="input-field" value={form.batiment} onChange={e => set('batiment', e.target.value)} placeholder="Ex: Bloc B" />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-warm-700 pb-2">
            <input type="checkbox" className="w-4 h-4 rounded accent-primary-600" checked={form.disponible} onChange={e => set('disponible', e.target.checked)} />
            Disponible
          </label>
        </div>
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

export default function SallesPage() {
  const [salles, setSalles] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState({ open: false, data: null })
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, nom: '' })

  useEffect(() => { load() }, [])

  const load = () => {
    setLoading(true)
    salleService.findAll()
      .then(r => setSalles(r.data.data || []))
      .catch(() => toast.error('Erreur chargement salles'))
      .finally(() => setLoading(false))
  }

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (modal.data) {
        await salleService.update(modal.data.id, data)
        toast.success('Salle modifiée')
      } else {
        await salleService.create(data)
        toast.success('Salle créée')
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
      await salleService.delete(confirmDelete.id)
      toast.success('Salle supprimée')
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
          <h1 className="page-title">Salles</h1>
          <p className="page-subtitle">{salles.length} salle(s)</p>
        </div>
        <button onClick={() => setModal({ open: true, data: null })} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nouvelle salle
        </button>
      </div>

      {loading ? (
        <Spinner className="mt-16" size="lg" />
      ) : salles.length === 0 ? (
        <div className="card text-center py-16">
          <DoorOpen size={48} className="mx-auto text-warm-300 mb-4" />
          <p className="text-warm-500 font-medium">Aucune salle</p>
          <p className="text-warm-400 text-sm mt-1">Créez votre première salle</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-warm-50/80 text-left">
                <th className="px-5 py-2.5 text-xs font-bold text-warm-500 uppercase tracking-wider">Salle</th>
                <th className="px-5 py-2.5 text-xs font-bold text-warm-500 uppercase tracking-wider">Type</th>
                <th className="px-5 py-2.5 text-xs font-bold text-warm-500 uppercase tracking-wider">Capacité</th>
                <th className="px-5 py-2.5 text-xs font-bold text-warm-500 uppercase tracking-wider">Bâtiment</th>
                <th className="px-5 py-2.5 text-xs font-bold text-warm-500 uppercase tracking-wider">État</th>
                <th className="px-5 py-2.5 text-xs font-bold text-warm-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-50">
              {salles.map(salle => (
                <tr key={salle.id} className="hover:bg-primary-50/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <DoorOpen size={14} className="text-primary-600" />
                      <span className="font-medium text-warm-800">{salle.nom}</span>
                      {salle.code && <span className="font-mono text-xs text-warm-400">· {salle.code}</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-warm-600">{salle.type || '—'}</td>
                  <td className="px-5 py-3 text-warm-600">{salle.capacite ?? '—'}</td>
                  <td className="px-5 py-3 text-warm-600">{salle.batiment || '—'}</td>
                  <td className="px-5 py-3">
                    {salle.disponible
                      ? <span className="badge-info">Disponible</span>
                      : <span className="text-warm-400 text-xs">Indisponible</span>}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => setModal({ open: true, data: salle })} className="p-1.5 rounded text-blue-500 hover:bg-blue-50" title="Modifier">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setConfirmDelete({ open: true, id: salle.id, nom: salle.nom })} className="p-1.5 rounded text-red-400 hover:bg-red-50" title="Supprimer">
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
        title={modal.data ? 'Modifier la salle' : 'Nouvelle salle'}
      >
        <SalleForm
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
