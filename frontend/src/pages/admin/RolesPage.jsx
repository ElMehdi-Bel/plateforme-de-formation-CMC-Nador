import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../../components/ui/Spinner'
import { roleService } from '../../services/roleService'

export default function RolesPage() {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    roleService.list()
      .then(r => setRoles(r.data.data || []))
      .catch(() => toast.error('Erreur chargement rôles'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Rôles</h1>
        <p className="page-subtitle">
          Rôles applicatifs et périmètre fonctionnel — référence en lecture seule
        </p>
      </div>

      {loading ? (
        <Spinner className="mt-16" size="lg" />
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-warm-50/80 text-left">
                <th className="px-5 py-2.5 text-xs font-bold text-warm-500 uppercase tracking-wider">Rôle</th>
                <th className="px-5 py-2.5 text-xs font-bold text-warm-500 uppercase tracking-wider">Périmètre</th>
                <th className="px-5 py-2.5 text-xs font-bold text-warm-500 uppercase tracking-wider text-center">Utilisateurs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-50">
              {roles.map(role => (
                <tr key={role.code} className="hover:bg-primary-50/30 transition-colors align-top">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-primary-600" />
                      <span className="font-semibold text-warm-800">{role.libelle}</span>
                    </div>
                    <p className="font-mono text-[11px] text-warm-400 mt-0.5">{role.code}</p>
                  </td>
                  <td className="px-5 py-3 text-warm-600 max-w-xl">{role.description}</td>
                  <td className="px-5 py-3 text-center">
                    <span className="badge-info">{role.utilisateurs}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
