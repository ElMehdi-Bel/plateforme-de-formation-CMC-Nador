import { useEffect, useMemo, useState } from 'react'
import { ClipboardList, Check, X, Clock, Calendar, ShieldAlert, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../../components/ui/Spinner'
import { useAuth } from '../../context/AuthContext'
import { groupeService } from '../../services/groupeService'
import { absenceService } from '../../services/absenceService'
import { userService } from '../../services/userService'
import { emploiService } from '../../services/emploiService'

const CRENEAUX = ['8H30 -- 11H00', '11H00 -- 13H30', '13H30 -- 16H00', '16H00 -- 18H30']
const JOURS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI']
const TODAY_MAP = ['', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI']

/** Ramène le créneau d'un emploi du temps (« 08H30 --> 11H00 ») vers un créneau standard. */
function normalizeCreneau(c = '') {
  const u = c.toUpperCase()
  if (u.includes('8H30') || u.startsWith('08H30')) return CRENEAUX[0]
  if (u.includes('11H')) return CRENEAUX[1]
  if (u.includes('13H')) return CRENEAUX[2]
  if (u.includes('16H')) return CRENEAUX[3]
  return CRENEAUX[0]
}

const STATUTS = [
  { key: 'PRESENT', label: 'Présent', cls: 'bg-green-100 text-green-700 hover:bg-green-200', icon: Check },
  { key: 'RETARD',  label: 'Retard',  cls: 'bg-amber-100 text-amber-700 hover:bg-amber-200', icon: Clock },
  { key: 'ABSENT',  label: 'Absent',  cls: 'bg-red-100 text-red-700 hover:bg-red-200',       icon: X },
]

export default function AbsencesFormateurPage() {
  const { user } = useAuth()
  const [groupes, setGroupes] = useState([])
  const [seances, setSeances] = useState([])
  const [loadingInit, setLoadingInit] = useState(true)

  const [seanceKey, setSeanceKey] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [stagiaires, setStagiaires] = useState([])
  const [statuts, setStatuts] = useState({}) // { stagiaireId: 'PRESENT'|'RETARD'|'ABSENT' }
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!user?.userId) return
    Promise.all([
      groupeService.findByFormateur(user.userId).then(r => setGroupes(r.data.data || [])),
      user?.fullName
        ? emploiService.findByFormateurNom(user.fullName).then(r => setSeances(r.data.data || []))
        : Promise.resolve(),
    ])
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoadingInit(false))
  }, [user])

  // Séances uniques (jour + créneau + groupe)
  const seancesUniques = useMemo(() => {
    const seen = new Set()
    return seances.filter(s => {
      const k = `${s.jourSemaine}|${normalizeCreneau(s.creneau)}|${s.groupeCode}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
  }, [seances])

  const selected = useMemo(
    () => seancesUniques.find(s => `${s.jourSemaine}|${normalizeCreneau(s.creneau)}|${s.groupeCode}` === seanceKey),
    [seancesUniques, seanceKey],
  )

  const resolveGroupe = (code) => groupes.find(g => (g.code || '').toUpperCase() === (code || '').toUpperCase())

  const handleCharger = async () => {
    if (!selected) return toast.error('Choisissez une séance')
    const groupe = resolveGroupe(selected.groupeCode)
    if (!groupe) return toast.error(`Groupe « ${selected.groupeCode} » introuvable dans vos groupes`)

    setLoading(true)
    setResult(null)
    setStagiaires([])
    setStatuts({})
    try {
      const r = await userService.findByGroupe(groupe.id)
      const list = r.data.data || []
      setStagiaires(list)

      const creneau = normalizeCreneau(selected.creneau)
      const init = {}
      list.forEach(s => { init[s.id] = 'PRESENT' })
      try {
        const ar = await absenceService.getSeance(groupe.code, date, creneau)
        ;(ar.data.data || []).forEach(a => {
          init[a.stagiaireId] = a.type === 'RETARD' ? 'RETARD' : 'ABSENT'
        })
      } catch { /* pas d'appel précédent */ }
      setStatuts(init)
    } catch {
      toast.error('Erreur lors du chargement des stagiaires')
    } finally {
      setLoading(false)
    }
  }

  const setStatut = (id, key) => setStatuts(prev => ({ ...prev, [id]: key }))

  const handleEnregistrer = async () => {
    const groupe = resolveGroupe(selected?.groupeCode)
    if (!groupe?.code) return toast.error('Groupe invalide')
    setSaving(true)
    try {
      const r = await absenceService.faireAppel({
        groupeCode: groupe.code,
        date,
        jourSemaine: selected.jourSemaine,
        heureCreneau: normalizeCreneau(selected.creneau),
        absences: stagiaires.map(s => ({ stagiaireId: s.id, statut: statuts[s.id] || 'PRESENT', motif: null })),
      })
      const data = r.data.data
      setResult(data)
      toast.success(data?.message || 'Appel enregistré')
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  const counts = useMemo(() => {
    const v = Object.values(statuts)
    return {
      retards: v.filter(x => x === 'RETARD').length,
      absents: v.filter(x => x === 'ABSENT').length,
    }
  }, [statuts])

  if (loadingInit) return <Spinner className="mt-16" size="lg" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Faire l'appel</h1>
        <p className="text-gray-500 text-sm mt-1">Sélectionnez une séance de votre emploi du temps</p>
      </div>

      {/* 1. Sélection de la séance */}
      <div className="card">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-64">
            <label className="label flex items-center gap-1.5"><Calendar size={13} /> Séance</label>
            <select className="input-field" value={seanceKey} onChange={e => setSeanceKey(e.target.value)}>
              <option value="">-- Choisir une séance --</option>
              {seancesUniques.map(s => {
                const k = `${s.jourSemaine}|${normalizeCreneau(s.creneau)}|${s.groupeCode}`
                return (
                  <option key={k} value={k}>
                    {s.jourSemaine} · {normalizeCreneau(s.creneau)} · {s.groupeCode}
                    {s.moduleNom ? ` — ${s.moduleNom}` : ''}
                  </option>
                )
              })}
            </select>
            {seancesUniques.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">Aucune séance dans votre emploi du temps.</p>
            )}
          </div>
          <div className="min-w-36">
            <label className="label">Date</label>
            <input type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <button onClick={handleCharger} disabled={loading || !selected} className="btn-secondary flex items-center gap-2">
            {loading ? <Spinner size="sm" /> : <ClipboardList size={16} />}
            Afficher les stagiaires
          </button>
        </div>
        {selected && TODAY_MAP[new Date(date).getDay()] !== selected.jourSemaine && (
          <p className="text-xs text-amber-600 mt-2">
            ⚠️ La date choisie ({TODAY_MAP[new Date(date).getDay()] || '—'}) ne correspond pas au jour de la séance ({selected.jourSemaine}).
          </p>
        )}
      </div>

      {/* 2-4. Liste + saisie présence/retard/absence */}
      {loading ? (
        <Spinner className="mt-8" size="lg" />
      ) : stagiaires.length > 0 ? (
        <div className="card overflow-hidden p-0">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="font-semibold text-gray-800">Liste de présence</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {stagiaires.length} stagiaire(s) · {counts.retards} retard(s) · {counts.absents} absent(s)
              </p>
            </div>
            <button onClick={handleEnregistrer} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Spinner size="sm" /> : <Check size={16} />}
              Enregistrer l'appel
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {stagiaires.map(s => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                <span className="font-medium text-gray-800">{s.prenom} {s.nom}</span>
                <div className="flex gap-1.5">
                  {STATUTS.map(st => {
                    const active = (statuts[s.id] || 'PRESENT') === st.key
                    const Icon = st.icon
                    return (
                      <button
                        key={st.key}
                        onClick={() => setStatut(s.id, st.key)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          active ? st.cls : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        <Icon size={13} /> {st.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* 5-9. Résultat + sanctions */}
      {result && (
        <div className="card space-y-3 border-l-4 border-l-emerald-400">
          <p className="font-semibold text-emerald-700 flex items-center gap-2">
            <Check size={16} /> {result.message}
          </p>
          <p className="text-sm text-gray-600">
            {result.nbAbsents} absence(s) · {result.nbRetards} retard(s) enregistré(s).
          </p>

          {result.sanctions?.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-2">
                <ShieldAlert size={15} className="text-amber-600" /> Sanction(s) déterminée(s) selon le règlement
              </h3>
              <div className="border border-gray-100 rounded-lg divide-y divide-gray-100 text-sm">
                {result.sanctions.map(sn => (
                  <div key={sn.id} className="px-3 py-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-medium text-gray-800">{sn.stagiaireNom}</span>
                      <span className="text-xs text-gray-400">
                        {sn.type === 'ASSIDUITE' ? 'Assiduité' : 'Comportement'} · palier {sn.palier}
                      </span>
                    </div>
                    <p className="text-gray-700">
                      {sn.sanction} <span className="text-gray-400">— décision {sn.autorite}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Note d'assiduité mise à jour : {sn.noteAssiduite}/10 · ND {sn.noteDiscipline}/15
                    </p>
                    {sn.exclusionDefinitive && (
                      <p className="text-xs text-red-600 font-semibold flex items-center gap-1 mt-0.5">
                        <AlertTriangle size={12} /> Conseil de Discipline alerté (exclusion définitive)
                      </p>
                    )}
                    {!sn.exclusionDefinitive && sn.conseilAlerte && (
                      <p className="text-xs text-amber-600 mt-0.5">Gestionnaire informé.</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Aucune sanction applicable.</p>
          )}
        </div>
      )}
    </div>
  )
}
