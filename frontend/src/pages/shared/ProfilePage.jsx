import { useEffect, useState } from 'react'
import { User, Phone, Lock, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../../components/ui/Spinner'
import { userService } from '../../services/userService'
import { authService } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'

const ROLE_LABEL = {
  ADMIN: 'Administrateur',
  CHEF_DE_POLE: 'Chef de pôle',
  GESTIONNAIRE: 'Gestionnaire des stagiaires',
  FORMATEUR: 'Formateur',
  STAGIAIRE: 'Stagiaire',
}

export default function ProfilePage() {
  const { user } = useAuth()

  const [telephone, setTelephone] = useState(user?.telephone || '')
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    authService.me()
      .then(r => setTelephone(r.data.data?.telephone || ''))
      .catch(() => {})
  }, [])

  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' })
  const [savingPwd, setSavingPwd] = useState(false)

  const saveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      await userService.updateOwnProfile({ telephone: telephone.trim() })
      const stored = JSON.parse(localStorage.getItem('user') || '{}')
      localStorage.setItem('user', JSON.stringify({ ...stored, telephone: telephone.trim() || null }))
      toast.success('Profil mis à jour')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour')
    } finally {
      setSavingProfile(false)
    }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    if (pwd.next.length < 8) return toast.error('Le nouveau mot de passe doit faire au moins 8 caractères')
    if (pwd.next !== pwd.confirm) return toast.error('La confirmation ne correspond pas')
    setSavingPwd(true)
    try {
      await userService.changeOwnPassword(pwd.current, pwd.next)
      setPwd({ current: '', next: '', confirm: '' })
      toast.success('Mot de passe modifié')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur — vérifiez votre mot de passe actuel')
    } finally {
      setSavingPwd(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="page-title">Mon compte</h1>
        <p className="page-subtitle">Coordonnées et sécurité</p>
      </div>

      {/* Identité (lecture seule) */}
      <div className="card space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg font-bold">{user?.fullName?.charAt(0)?.toUpperCase() || 'U'}</span>
          </div>
          <div>
            <p className="font-semibold text-warm-900">{user?.fullName}</p>
            <p className="text-sm text-warm-500">{user?.email}</p>
            <span className="badge-info mt-1 inline-block">{ROLE_LABEL[user?.role] || user?.role}</span>
          </div>
        </div>
      </div>

      {/* Coordonnées */}
      <form onSubmit={saveProfile} className="card space-y-4">
        <h3 className="font-semibold text-warm-900 flex items-center gap-2">
          <User size={16} className="text-primary-600" /> Coordonnées
        </h3>
        <div>
          <label className="label flex items-center gap-1.5"><Phone size={13} /> Téléphone</label>
          <input
            className="input-field max-w-xs"
            value={telephone}
            onChange={e => setTelephone(e.target.value)}
            placeholder="0600000000"
          />
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={savingProfile} className="btn-primary flex items-center gap-2">
            {savingProfile ? <Spinner size="sm" /> : <Check size={16} />} Enregistrer
          </button>
        </div>
      </form>

      {/* Mot de passe */}
      <form onSubmit={savePassword} className="card space-y-4">
        <h3 className="font-semibold text-warm-900 flex items-center gap-2">
          <Lock size={16} className="text-primary-600" /> Changer le mot de passe
        </h3>
        <div>
          <label className="label">Mot de passe actuel</label>
          <input type="password" className="input-field max-w-xs" autoComplete="current-password"
            value={pwd.current} onChange={e => setPwd(p => ({ ...p, current: e.target.value }))} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Nouveau mot de passe</label>
            <input type="password" className="input-field" autoComplete="new-password"
              value={pwd.next} onChange={e => setPwd(p => ({ ...p, next: e.target.value }))} />
          </div>
          <div>
            <label className="label">Confirmer</label>
            <input type="password" className="input-field" autoComplete="new-password"
              value={pwd.confirm} onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={savingPwd} className="btn-primary flex items-center gap-2">
            {savingPwd ? <Spinner size="sm" /> : <Lock size={16} />} Modifier
          </button>
        </div>
      </form>
    </div>
  )
}
