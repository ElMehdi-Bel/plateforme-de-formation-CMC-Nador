import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import cmcLogo from '../Cmc.jpg'

function ZelligePattern() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="zp" x="0" y="0" width="56" height="56" patternUnits="userSpaceOnUse">
          <polygon points="28,0 56,28 28,56 0,28"   fill="none" stroke="white" strokeWidth="0.6" opacity="0.12"/>
          <polygon points="28,10 46,28 28,46 10,28" fill="none" stroke="white" strokeWidth="0.5" opacity="0.08"/>
          <polygon points="28,20 36,28 28,36 20,28" fill="white" fillOpacity="0.04"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#zp)"/>
    </svg>
  )
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const userData = await login(data.email, data.password)
      const redirects = {
        ADMIN:     '/admin/dashboard',
        FORMATEUR: '/formateur/dashboard',
        STAGIAIRE: '/stagiaire/dashboard',
      }
      toast.success(`Bienvenue, ${userData.fullName}!`)
      navigate(redirects[userData.role] || '/')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Identifiants incorrects')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left decorative panel ── */}
      <div
        className="hidden lg:flex lg:w-[48%] xl:w-[52%] relative overflow-hidden flex-col justify-between p-14"
        style={{ background: 'linear-gradient(160deg, #071e28 0%, #0c3040 45%, #104e60 100%)' }}
      >
        <ZelligePattern />

        {/* Ambient glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary-400/10 blur-[100px] -translate-y-1/3 translate-x-1/3 pointer-events-none"/>
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-accent-500/10 blur-[80px] translate-y-1/3 -translate-x-1/4 pointer-events-none"/>

        {/* Top — logo */}
        <div className="relative z-10">
          <div className="bg-white rounded-2xl px-5 py-3 inline-block shadow-lg">
            <img src={cmcLogo} alt="CMC Nador" className="h-14 w-auto object-contain" />
          </div>
        </div>

        {/* Centre — main content */}
        <div className="relative z-10 space-y-10">
          <div>
            <h2 className="font-display text-4xl xl:text-5xl font-bold text-white leading-[1.1] mb-4">
              Votre plateforme<br/>
              <span className="text-primary-300">de formation</span><br/>
              professionnelle.
            </h2>
            <p className="text-primary-300/70 text-base leading-relaxed max-w-sm">
              Gérez stagiaires, formateurs, notes et emplois du temps depuis un espace centralisé et sécurisé.
            </p>
          </div>

          <div className="space-y-3.5">
            {[
              'Suivi des notes et absences en temps réel',
              'Emplois du temps dynamiques par groupe',
              'Demandes et attestations simplifiées',
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-md bg-primary-600/50 border border-primary-500/40 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 12 12" className="w-3 h-3 text-primary-300 fill-current">
                    <path d="M10.28 2.28L4.5 8.06 1.72 5.28.28 6.72l4.22 4.22 7-7z"/>
                  </svg>
                </div>
                <p className="text-primary-200/80 text-sm">{t}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-px flex-1 bg-primary-800/60"/>
          <span className="text-primary-700 text-[10px] font-bold tracking-widest uppercase">Accès privé</span>
          <div className="h-px flex-1 bg-primary-800/60"/>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 bg-warm-50">
        <div className="w-full max-w-[400px] animate-slide-up">

          {/* Mobile logo */}
          <div className="lg:hidden mb-10">
            <img src={cmcLogo} alt="CMC Nador" className="h-12 w-auto object-contain" />
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-warm-900 leading-tight">Connexion</h1>
            <p className="text-warm-500 text-sm mt-2">Accédez à votre espace personnel CMC.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div>
              <label className="label">Adresse email</label>
              <input
                type="email"
                className="input-field"
                placeholder="votre@email.ma"
                autoComplete="email"
                {...register('email', {
                  required: "L'email est obligatoire",
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Adresse email invalide' },
                })}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="label">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="input-field pr-11"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password', { required: 'Le mot de passe est obligatoire' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600 transition-colors"
                  aria-label={showPwd ? 'Masquer' : 'Afficher'}
                >
                  {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold py-3 px-6 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-px transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 group"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  Connexion en cours…
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform"/>
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-warm-400 text-center mt-10">
            CMC Nador &copy; {new Date().getFullYear()} — Plateforme privée
          </p>
        </div>
      </div>
    </div>
  )
}
