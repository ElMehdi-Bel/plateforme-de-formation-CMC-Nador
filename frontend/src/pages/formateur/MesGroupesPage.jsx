import { useEffect, useState } from 'react'
import { Users, ChevronDown, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../../components/ui/Spinner'
import { groupeService } from '../../services/filiereService'
import { userService } from '../../services/userService'
import { useAuth } from '../../context/AuthContext'

export default function MesGroupesPage() {
  const { user } = useAuth()
  const [groupes, setGroupes] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})
  const [stagiaires, setStagiaires] = useState({})

  useEffect(() => {
    if (!user?.userId) return
    groupeService.findByFormateur(user.userId)
      .then(r => setGroupes(r.data.data || []))
      .catch(() => toast.error('Erreur chargement groupes'))
      .finally(() => setLoading(false))
  }, [user])

  const toggle = async (groupe) => {
    const isOpen = expanded[groupe.id]
    setExpanded(prev => ({ ...prev, [groupe.id]: !isOpen }))
    if (!isOpen && !stagiaires[groupe.id]) {
      try {
        const r = await userService.findByGroupe(groupe.id)
        setStagiaires(prev => ({ ...prev, [groupe.id]: r.data.data || [] }))
      } catch {
        toast.error('Erreur chargement stagiaires')
      }
    }
  }

  if (loading) return <Spinner className="mt-20" size="lg" />

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Mes Groupes</h1>
        <p className="page-subtitle">{groupes.length} groupe(s) — modules dont vous êtes formateur</p>
      </div>

      {groupes.length === 0 ? (
        <div className="card text-center py-16">
          <Users size={48} className="mx-auto text-warm-300 mb-4" />
          <p className="text-warm-500 font-medium">Aucun groupe</p>
          <p className="text-warm-400 text-sm mt-1">Aucun module ne vous est encore affecté.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groupes.map(groupe => (
            <div key={groupe.id} className="card overflow-hidden p-0">
              <button onClick={() => toggle(groupe)} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-warm-50 text-left">
                {expanded[groupe.id]
                  ? <ChevronDown size={18} className="text-primary-600 flex-shrink-0" />
                  : <ChevronRight size={18} className="text-warm-400 flex-shrink-0" />}
                <Users size={20} className="text-primary-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-warm-900">{groupe.nom}</p>
                  <p className="text-xs text-warm-400 mt-0.5">
                    {groupe.code && <span className="mr-3">Code : {groupe.code}</span>}
                    {groupe.anneeFormation && <span>{groupe.anneeFormation}</span>}
                  </p>
                </div>
              </button>

              {expanded[groupe.id] && (
                <div className="border-t border-warm-100">
                  {!stagiaires[groupe.id] ? (
                    <div className="py-6 flex justify-center"><Spinner size="sm" /></div>
                  ) : stagiaires[groupe.id].length === 0 ? (
                    <p className="py-5 text-center text-warm-400 text-sm">Aucun stagiaire dans ce groupe.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-warm-50/80 text-left">
                          <th className="px-5 py-2 text-xs font-bold text-warm-500 uppercase tracking-wider">#</th>
                          <th className="px-5 py-2 text-xs font-bold text-warm-500 uppercase tracking-wider">Nom</th>
                          <th className="px-5 py-2 text-xs font-bold text-warm-500 uppercase tracking-wider">Matricule</th>
                          <th className="px-5 py-2 text-xs font-bold text-warm-500 uppercase tracking-wider">Email</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-warm-50">
                        {stagiaires[groupe.id].map((s, i) => (
                          <tr key={s.id} className="hover:bg-primary-50/30">
                            <td className="px-5 py-2.5 text-warm-400">{i + 1}</td>
                            <td className="px-5 py-2.5 font-medium text-warm-800">{s.fullName || `${s.prenom} ${s.nom}`}</td>
                            <td className="px-5 py-2.5 font-mono text-xs text-warm-500">{s.matricule || '—'}</td>
                            <td className="px-5 py-2.5 text-warm-500">{s.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
