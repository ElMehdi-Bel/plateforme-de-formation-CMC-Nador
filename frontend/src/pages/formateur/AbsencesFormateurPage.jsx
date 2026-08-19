import { useEffect, useState } from 'react'
import { ClipboardList, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../../components/ui/Spinner'
import { useAuth } from '../../context/AuthContext'
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

export default function AbsencesFormateurPage() {
  const { user } = useAuth()
  const [groupes, setGroupes] = useState([])
  const [loadingInit, setLoadingInit] = useState(true)
  const [form, setForm] = useState({
    groupeId: '',
    date: new Date().toISOString().split('T')[0],
    jourSemaine: '',
    creneau: CRENEAUX[0],
  })
  const [stagiaires, setStagiaires] = useState([])
  const [absents, setAbsents] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (!user?.userId) return
    groupeService.findByFormateur(user.userId)
      .then(r => setGroupes(r.data.data || []))
      .catch(() => toast.error('Erreur chargement groupes'))
      .finally(() => setLoadingInit(false))
  }, [user])

  const handleCharger = async () => {
    if (!form.groupeId) return toast.error('Veuillez choisir un groupe')
    setLoading(true)
    setStagiaires([])
    setAbsents({})
    try {
      const r = await userService.findByGroupe(form.groupeId)
      const list = r.data.data || []
      setStagiaires(list)

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

  if (loadingInit) return <Spinner className="mt-16" size="lg" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Faire l'appel</h1>
        <p className="text-gray-500 text-sm mt-1">Enregistrer les présences et absences de vos groupes</p>
      </div>

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
