import { Trash2, AlertTriangle } from 'lucide-react'
import Spinner from './Spinner'

/**
 * Boîte de confirmation générique.
 *
 * Props :
 *  - isOpen        : affiche / masque
 *  - title         : titre optionnel
 *  - message       : texte (string ou noeud React)
 *  - confirmLabel  : libellé du bouton d'action (défaut « Supprimer »)
 *  - danger        : bouton rouge (défaut true) ou bouton primaire
 *  - loading       : désactive le bouton + spinner
 *  - onConfirm / onCancel
 */
export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Supprimer',
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        {title && (
          <div className="flex items-center gap-2 mb-3">
            {danger && <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />}
            <h3 className="font-semibold text-warm-900">{title}</h3>
          </div>
        )}
        <p className="text-warm-700 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="btn-secondary">Annuler</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`${danger ? 'btn-danger' : 'btn-primary'} flex items-center gap-2`}
          >
            {loading ? <Spinner size="sm" /> : danger ? <Trash2 size={16} /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
