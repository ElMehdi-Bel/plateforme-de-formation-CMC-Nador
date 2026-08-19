import { useEffect, useState } from 'react'
import { FileText, UserCheck, BookOpen, ClipboardList } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import { useAuth } from '../../context/AuthContext'
import { noteService } from '../../services/noteService'
import { absenceService } from '../../services/absenceService'
import { demandeService } from '../../services/demandeService'
import Spinner from '../../components/ui/Spinner'

export default function StagiaireDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState({ moyenne: 0, absences: 0, injustifiees: 0, demandes: 0 })
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState([])

  useEffect(() => {
    if (!user?.userId) return
    const id = user.userId

    Promise.all([
      noteService.getMoyenne(id),
      absenceService.stats(id),
      demandeService.mesDemandes({ page: 0, size: 5 }),
      noteService.findByStagiaire(id, { page: 0, size: 5 }),
    ]).then(([moy, abs, dem, n]) => {
      setData({
        moyenne: moy.data.data.moyenne?.toFixed(2) || '—',
        absences: abs.data.data.total || 0,
        injustifiees: abs.data.data.injustifiees || 0,
        demandes: dem.data.data.totalElements || 0,
      })
      setNotes(n.data.data.content || [])
    }).finally(() => setLoading(false))
  }, [user])

  if (loading) return <Spinner className="mt-20" size="lg" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bonjour, {user?.fullName} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Voici un aperçu de votre parcours de formation</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Moyenne générale" value={`${data.moyenne}/20`} icon={FileText} color="blue" />
        <StatCard title="Total absences" value={data.absences} icon={UserCheck} color="orange" />
        <StatCard title="Non justifiées" value={data.injustifiees} icon={UserCheck} color="red" />
        <StatCard title="Mes demandes" value={data.demandes} icon={ClipboardList} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Dernières notes</h3>
          {notes.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">Aucune note disponible</p>
          ) : (
            <div className="space-y-3">
              {notes.map(n => (
                <div key={n.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{n.module?.nom}</p>
                    <p className="text-xs text-gray-500">{n.typeEvaluation}</p>
                  </div>
                  <span className={`text-lg font-bold ${n.valeur >= 10 ? 'text-green-600' : 'text-red-500'}`}>
                    {n.valeur}/20
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Informations du compte</h3>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Nom complet', value: user?.fullName },
              { label: 'Email', value: user?.email },
              { label: 'Rôle', value: user?.role },
              { label: 'Groupe', value: user?.groupeNom || user?.groupeCode || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-900">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
