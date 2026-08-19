import { useEffect, useState, useCallback } from 'react'
import { notificationService } from '../../services/filiereService'
import { Bell, BellOff, Check, CheckCheck, Info, FileText, UserCheck, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../../components/ui/Spinner'

const TYPE_CONFIG = {
  DEMANDE:  { icon: FileText,   bg: 'bg-accent-50',   icon_color: 'text-accent-600',   border: 'border-accent-100'  },
  DOCUMENT: { icon: FileText,   bg: 'bg-primary-50',  icon_color: 'text-primary-600',  border: 'border-primary-100' },
  ABSENCE:  { icon: UserCheck,  bg: 'bg-red-50',      icon_color: 'text-red-600',       border: 'border-red-100'     },
  NOTE:     { icon: Calendar,   bg: 'bg-purple-50',   icon_color: 'text-purple-600',   border: 'border-purple-100'  },
  DEFAULT:  { icon: Info,       bg: 'bg-blue-50',     icon_color: 'text-blue-600',      border: 'border-blue-100'    },
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)    return 'À l\'instant'
  if (diff < 3600)  return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`
  return `Il y a ${Math.floor(diff / 86400)}j`
}

function NotifCard({ notif, onRead }) {
  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.DEFAULT
  const Icon = cfg.icon

  const handleClick = () => {
    if (!notif.lu) onRead(notif.id)
  }

  return (
    <div
      onClick={handleClick}
      className={`flex gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer
        ${notif.lu
          ? 'bg-white border-warm-100 opacity-70 hover:opacity-100'
          : `${cfg.bg} ${cfg.border} shadow-sm hover:shadow-card`
        }`}
    >
      {/* Icône */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} border ${cfg.border}`}>
        <Icon size={18} className={cfg.icon_color}/>
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-semibold leading-snug ${notif.lu ? 'text-warm-600' : 'text-warm-900'}`}>
            {notif.titre}
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!notif.lu && (
              <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0"/>
            )}
            <span className="text-[11px] text-warm-400 whitespace-nowrap">
              {timeAgo(notif.createdAt)}
            </span>
          </div>
        </div>
        <p className="text-sm text-warm-500 mt-0.5 leading-relaxed">{notif.message}</p>
        {notif.expediteur && (
          <p className="text-[11px] text-warm-400 mt-1.5 font-medium">
            De : {notif.expediteur.fullName ?? notif.expediteur.nom}
          </p>
        )}
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(true)
  const [loadingMore, setLoadingMore]     = useState(false)
  const [marking, setMarking]             = useState(false)
  const [page, setPage]                   = useState(0)
  const [hasMore, setHasMore]             = useState(false)
  const [totalElements, setTotalElements] = useState(0)

  const load = useCallback(async (pageNum = 0, append = false) => {
    try {
      const res = await notificationService.findAll({ page: pageNum, size: 20 })
      const data = res.data.data
      setNotifications(prev => append ? [...prev, ...data.content] : data.content)
      setHasMore(!data.last)
      setTotalElements(data.totalElements)
      setPage(pageNum)
    } catch {
      toast.error('Impossible de charger les notifications')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => { load(0) }, [load])

  const handleRead = async (id) => {
    try {
      await notificationService.marquerLue(id)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, lu: true } : n)
      )
    } catch {
      toast.error('Erreur lors du marquage')
    }
  }

  const handleReadAll = async () => {
    setMarking(true)
    try {
      await notificationService.toutLire()
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })))
      toast.success('Toutes les notifications marquées comme lues')
    } catch {
      toast.error('Erreur lors du marquage')
    } finally {
      setMarking(false)
    }
  }

  const handleLoadMore = () => {
    setLoadingMore(true)
    load(page + 1, true)
  }

  const nonLues = notifications.filter(n => !n.lu).length

  if (loading) return <Spinner className="mt-20" size="lg"/>

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Bell size={22} className="text-primary-600"/>
            Notifications
          </h1>
          <p className="page-subtitle">
            {totalElements} notification{totalElements !== 1 ? 's' : ''}
            {nonLues > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary-100 text-primary-700">
                {nonLues} non lue{nonLues > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        {nonLues > 0 && (
          <button
            onClick={handleReadAll}
            disabled={marking}
            className="btn-secondary text-xs gap-1.5"
          >
            <CheckCheck size={14}/>
            {marking ? 'En cours…' : 'Tout marquer lu'}
          </button>
        )}
      </div>

      {/* Liste */}
      {notifications.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-warm-100 flex items-center justify-center mb-4">
            <BellOff size={28} className="text-warm-400"/>
          </div>
          <p className="font-display font-semibold text-warm-700 text-lg">Aucune notification</p>
          <p className="text-warm-400 text-sm mt-1">Vous n'avez reçu aucune notification pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map(notif => (
            <NotifCard key={notif.id} notif={notif} onRead={handleRead}/>
          ))}

          {hasMore && (
            <div className="pt-2 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="btn-secondary text-sm"
              >
                {loadingMore ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-warm-300 border-t-warm-600 rounded-full animate-spin"/>
                    Chargement…
                  </span>
                ) : 'Charger plus'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
