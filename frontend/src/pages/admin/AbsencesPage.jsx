import { useEffect, useState } from 'react'
import { ClipboardList, History, Check, X, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import { groupeService } from '../../services/groupeService'
import { absenceService } from '../../services/absenceService'
import { userService } from '../../services/userService'

const CRENEAUX = [
  '8H30 -- 11H00',
  '11H00 -- 13H30',
  '13H30 -- 16H00',
  '16H00 -- 18H30',
]

const JOURS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI']

function OngletAppel({ groupes }) {
  const [form, setForm] = useState({
    groupeId: '',
    date: new Date().toISOString().split('T')[0],
    jourSemaine: '',
    creneau: CRENEAUX[0],
  })
  const [stagiaires, setStagiaires] = useState([])
  const [absents, setAbsents] = useState({}) // { stagiaireId: boolean }
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleCharger = async () => {
    if (!form.groupeId) return toast.error('Veuillez choisir un groupe')
    setLoading(true)
    setStagiaires([])
    setAbsents({})
    try {
      // Charger les stagiaires
      const r = await userService.findByGroupe(form.groupeId)
      const list = r.data.data || []
      setStagiaires(list)

      // Charger les absences déjà enregistrées pour cette séance
      const groupe = groupes.find(g => String(g.id) === String(form.groupeId))
      if (groupe?.code) {
        try {
          const ar = await absenceService.getSeance(groupe.code, form.date, form.creneau)
          const dejaAbsents = ar.data.data || []
          const absentMap = {}
          list.forEach(s => { absentMap[s.id] = false })
          dejaAbsents.forEach(a => { absentMap[a.stagiaireId] = true })
          setAbsents(absentMap)
        } catch {
          const absentMap = {}
          list.forEach(s => { absentMap[s.id] = false })
          setAbsents(absentMap)
        }
      } else {
        const absentMap = {}
        list.forEach(s => { absentMap[s.id] = false })
        setAbsents(absentMap)
      }
    } catch {
      toast.error('Erreur lors du chargement des stagiaires')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (id) => {
    setAbsents(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleEnregistrer = async () => {
    if (stagiaires.length === 0) return toast.error('Chargez les stagiaires d\'abord')
    const groupe = groupes.find(g => String(g.id) === String(form.groupeId))
    if (!groupe?.code) return toast.error('Le groupe doit avoir un code')
    setSaving(true)
    try {
      await absenceService.faireAppel({
        groupeCode: groupe.code,
        date: form.date,
        jourSemaine: form.jourSemaine || null,
        heureCreneau: form.creneau,
        absences: stagiaires.map(s => ({
          stagiaireId: s.id,
          absent: !!absents[s.id],
          motif: null,
        })),
      })
      toast.success('Appel enregistré avec succès')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const nbAbsents = Object.values(absents).filter(Boolean).length

  return (
    <div className="space-y-5">
      {/* Filtres */}
      <div className="card">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-40">
            <label className="label">Groupe *</label>
            <select className="input-field" value={form.groupeId} onChange={e => set('groupeId', e.target.value)}>
              <option value="">-- Choisir --</option>
              {groupes.map(g => <option key={g.id} value={g.id}>{g.nom}{g.code ? ` (${g.code})` : ''}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-36">
            <label className="label">Date *</label>
            <input type="date" className="input-field" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          <div className="flex-1 min-w-36">
            <label className="label">Jour</label>
            <select className="input-field" value={form.jourSemaine} onChange={e => set('jourSemaine', e.target.value)}>
              <option value="">-- Jour --</option>
              {JOURS.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-44">
            <label className="label">Créneau *</label>
            <select className="input-field" value={form.creneau} onChange={e => set('creneau', e.target.value)}>
              {CRENEAUX.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button onClick={handleCharger} disabled={loading} className="btn-secondary flex items-center gap-2">
            {loading ? <Spinner size="sm" /> : <ClipboardList size={16} />}
            Charger les stagiaires
          </button>
        </div>
      </div>

      {/* Liste stagiaires */}
      {loading ? (
        <Spinner className="mt-8" size="lg" />
      ) : stagiaires.length > 0 ? (
        <div className="card overflow-hidden p-0">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800">Liste de présence</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {stagiaires.length} stagiaire{stagiaires.length > 1 ? 's' : ''} · {nbAbsents} absent{nbAbsents > 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={handleEnregistrer}
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? <Spinner size="sm" /> : <Check size={16} />}
              Enregistrer l'appel
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {stagiaires.map(s => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                <span className="font-medium text-gray-800">{s.prenom} {s.nom}</span>
                <button
                  onClick={() => handleToggle(s.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    absents[s.id]
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {absents[s.id] ? (
                    <><X size={14} /> Absent</>
                  ) : (
                    <><Check size={14} /> Présent</>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function OngletHistorique({ groupes }) {
  const [selectedGroupe, setSelectedGroupe] = useState('')
  const [absences, setAbsences] = useState([])
  const [loading, setLoading] = useState(false)
  const [justifModal, setJustifModal] = useState({ open: false, id: null })
  const [motif, setMotif] = useState('')
  const [saving, setSaving] = useState(false)

  const handleCharger = async () => {
    if (!selectedGroupe) return toast.error('Veuillez choisir un groupe')
    setLoading(true)
    try {
      const r = await absenceService.findByGroupe(selectedGroupe)
      setAbsences(r.data.data || [])
    } catch {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleJustifier = async () => {
    setSaving(true)
    try {
      await absenceService.justifier(justifModal.id, motif)
      toast.success('Absence justifiée')
      setJustifModal({ open: false, id: null })
      setMotif('')
      handleCharger()
    } catch {
      toast.error('Erreur lors de la justification')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette absence ?')) return
    try {
      await absenceService.delete(id)
      toast.success('Absence supprimée')
      setAbsences(prev => prev.filter(a => a.id !== id))
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-48">
            <label className="label">Groupe</label>
            <select className="input-field" value={selectedGroupe} onChange={e => setSelectedGroupe(e.target.value)}>
              <option value="">-- Choisir un groupe --</option>
              {groupes.map(g => <option key={g.id} value={g.id}>{g.nom}{g.code ? ` (${g.code})` : ''}</option>)}
            </select>
          </div>
          <button onClick={handleCharger} disabled={loading} className="btn-secondary flex items-center gap-2">
            {loading ? <Spinner size="sm" /> : <History size={16} />}
            Afficher
          </button>
        </div>
      </div>

      {loading ? (
        <Spinner className="mt-8" size="lg" />
      ) : absences.length > 0 ? (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-gray-500">Stagiaire</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500">Date</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500">Créneau</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500">Justifiée</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500">Motif</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {absences.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium">{a.stagiairePrenom} {a.stagiaireNom}</td>
                    <td className="px-4 py-2.5 text-gray-600">{a.dateAbsence}</td>
                    <td className="px-4 py-2.5 text-gray-600 text-xs">{a.heureCreneau || '—'}</td>
                    <td className="px-4 py-2.5">
                      {a.justifiee ? (
                        <span className="text-green-600 font-medium">Oui</span>
                      ) : (
                        <span className="text-red-500 font-medium">Non</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs max-w-xs truncate">{a.motif || '—'}</td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex justify-center gap-2">
                        {!a.justifiee && (
                          <button
                            onClick={() => { setJustifModal({ open: true, id: a.id }); setMotif('') }}
                            className="p-1.5 rounded text-green-600 hover:bg-green-50"
                            title="Justifier"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="p-1.5 rounded text-red-400 hover:bg-red-50"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : selectedGroupe && !loading ? (
        <div className="card text-center py-10 text-gray-400">Aucune absence enregistrée pour ce groupe</div>
      ) : null}

      {/* Modal justification */}
      <Modal isOpen={justifModal.open} onClose={() => setJustifModal({ open: false, id: null })} title="Justifier l'absence" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Motif de justification</label>
            <textarea
              className="input-field h-24 resize-none"
              value={motif}
              onChange={e => setMotif(e.target.value)}
              placeholder="Ex: Certificat médical, raison familiale..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setJustifModal({ open: false, id: null })}>Annuler</button>
            <button className="btn-primary flex items-center gap-2" onClick={handleJustifier} disabled={saving}>
              {saving ? <Spinner size="sm" /> : <Check size={16} />}
              Valider
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default function AbsencesPage() {
  const [onglet, setOnglet] = useState('appel')
  const [groupes, setGroupes] = useState([])
  const [loadingInit, setLoadingInit] = useState(true)

  useEffect(() => {
    groupeService.getAll()
      .then(r => setGroupes(r.data.data || []))
      .catch(() => toast.error('Erreur chargement groupes'))
      .finally(() => setLoadingInit(false))
  }, [])

  if (loadingInit) return <Spinner className="mt-16" size="lg" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Absences</h1>
        <p className="text-gray-500 text-sm mt-1">Faire l'appel et consulter l'historique des absences</p>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setOnglet('appel')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            onglet === 'appel' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ClipboardList size={16} />
          Faire l'appel
        </button>
        <button
          onClick={() => setOnglet('historique')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            onglet === 'historique' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <History size={16} />
          Historique
        </button>
      </div>

      {onglet === 'appel' ? (
        <OngletAppel groupes={groupes} />
      ) : (
        <OngletHistorique groupes={groupes} />
      )}
    </div>
  )
}
