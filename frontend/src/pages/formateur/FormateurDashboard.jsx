import { useEffect, useState } from 'react'
import { Users, BookOpen, FileText, UserCheck } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import { useAuth } from '../../context/AuthContext'
import { groupeService } from '../../services/filiereService'
import Spinner from '../../components/ui/Spinner'

export default function FormateurDashboard() {
  const { user } = useAuth()
  const [groupes, setGroupes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.userId) return
    groupeService.findByFormateur(user.userId)
      .then(r => setGroupes(r.data.data || []))
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return <Spinner className="mt-20" size="lg" />

  const totalStagiaires = groupes.reduce((acc, g) => acc + (g.stagiaires?.length || 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bonjour, {user?.fullName} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Espace formateur — CMC Nador</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Mes groupes" value={groupes.length} icon={Users} color="blue" />
        <StatCard title="Total stagiaires" value={totalStagiaires} icon={FileText} color="green" />
        <StatCard title="Modules enseignés" value="—" icon={BookOpen} color="purple" />
        <StatCard title="Absences saisies" value="—" icon={UserCheck} color="orange" />
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Mes groupes</h3>
        {groupes.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">Aucun groupe assigné</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupes.map(g => (
              <div key={g.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900">{g.nom}</h4>
                <p className="text-sm text-gray-500 mt-1">{g.filiere?.nom}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {g.stagiaires?.length || 0} stagiaires
                </p>
                <p className="text-xs text-gray-400">{g.anneeFormation}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
