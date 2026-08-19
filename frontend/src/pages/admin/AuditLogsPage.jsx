import { useEffect, useState, useCallback } from 'react'
import { auditService } from '../../services/filiereService'
import Spinner from '../../components/ui/Spinner'
import Pagination from '../../components/ui/Pagination'
import { ShieldCheck, Search, User, Tag, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

const ACTION_COLORS = {
  CREATE:           'bg-primary-50 text-primary-700 border-primary-100',
  UPDATE:           'bg-blue-50 text-blue-700 border-blue-100',
  DELETE:           'bg-red-50 text-red-700 border-red-100',
  LOGIN:            'bg-purple-50 text-purple-700 border-purple-100',
  LOGOUT:           'bg-warm-100 text-warm-600 border-warm-200',
  TRAITER_DEMANDE:  'bg-accent-50 text-accent-700 border-accent-100',
  UPLOAD_DOCUMENT:  'bg-teal-50 text-teal-700 border-teal-100',
  IMPORT:           'bg-indigo-50 text-indigo-700 border-indigo-100',
}

function actionBadgeCls(action) {
  const key = Object.keys(ACTION_COLORS).find(k => action?.toUpperCase().includes(k))
  return key ? ACTION_COLORS[key] : 'bg-warm-100 text-warm-600 border-warm-200'
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) +
         ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default function AuditLogsPage() {
  const [logs, setLogs]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [search, setSearch]     = useState('')
  const [filtered, setFiltered] = useState([])

  const load = useCallback(async (p = 0) => {
    setLoading(true)
    try {
      const res = await auditService.findAll({ page: p, size: 50 })
      const data = res.data.data
      setLogs(data.content)
      setFiltered(data.content)
      setTotalPages(data.totalPages)
      setTotalElements(data.totalElements)
      setPage(p)
      setSearch('')
    } catch {
      toast.error('Impossible de charger les logs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(0) }, [load])

  useEffect(() => {
    if (!search.trim()) { setFiltered(logs); return }
    const q = search.toLowerCase()
    setFiltered(logs.filter(l =>
      l.action?.toLowerCase().includes(q) ||
      l.entityType?.toLowerCase().includes(q) ||
      l.details?.toLowerCase().includes(q) ||
      l.user?.fullName?.toLowerCase().includes(q)
    ))
  }, [search, logs])

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ShieldCheck size={22} className="text-primary-600"/>
            Audit Logs
          </h1>
          <p className="page-subtitle">{totalElements} action{totalElements !== 1 ? 's' : ''} enregistrée{totalElements !== 1 ? 's' : ''}</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400"/>
          <input
            type="text"
            className="input-field pl-9 text-sm"
            placeholder="Filtrer par action, utilisateur…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <Spinner className="mt-16" size="lg"/>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <ShieldCheck size={36} className="text-warm-300 mx-auto mb-3"/>
          <p className="font-display font-semibold text-warm-600">Aucun log trouvé</p>
          <p className="text-warm-400 text-sm mt-1">
            {search ? 'Aucun résultat pour ce filtre.' : 'Aucune action enregistrée.'}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Action</th>
                <th>Utilisateur</th>
                <th>Entité</th>
                <th>Détails</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-warm-100">
              {filtered.map((log, i) => (
                <tr key={log.id}>
                  <td className="text-warm-400 text-xs tabular-nums">
                    {page * 50 + i + 1}
                  </td>
                  <td>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${actionBadgeCls(log.action)}`}>
                      <Tag size={10}/>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    {log.user ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-700 text-[10px] font-bold">
                            {log.user.fullName?.charAt(0) || log.user.nom?.charAt(0) || '?'}
                          </span>
                        </div>
                        <span className="text-sm text-warm-800 font-medium">
                          {log.user.fullName || `${log.user.prenom} ${log.user.nom}`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-warm-400 text-xs">Système</span>
                    )}
                  </td>
                  <td>
                    {log.entityType ? (
                      <div className="flex items-center gap-1.5 text-xs text-warm-600">
                        <FileText size={12} className="text-warm-400"/>
                        <span>{log.entityType}</span>
                        {log.entityId && <span className="text-warm-400">#{log.entityId}</span>}
                      </div>
                    ) : (
                      <span className="text-warm-300">—</span>
                    )}
                  </td>
                  <td className="max-w-xs">
                    <p className="text-sm text-warm-600 truncate" title={log.details}>
                      {log.details || <span className="text-warm-300">—</span>}
                    </p>
                  </td>
                  <td className="text-xs text-warm-500 whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={load}
        />
      )}
    </div>
  )
}
