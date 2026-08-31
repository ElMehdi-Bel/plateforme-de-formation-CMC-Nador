import { useState } from 'react'
import { FileBarChart, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../../components/ui/Spinner'
import { documentService } from '../../services/documentService'

export default function BilansPage() {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      await documentService.bilan()
      toast.success('Bilan généré')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la génération')
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Bilans</h1>
        <p className="page-subtitle">Générer le bilan pédagogique global du pôle</p>
      </div>

      <div className="card max-w-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary-50 border border-primary-100 flex-shrink-0">
            <FileBarChart size={22} className="text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-warm-900">Bilan pédagogique (PDF)</h3>
            <p className="text-sm text-warm-500 mt-1">
              Synthèse des effectifs, des absences et des moyennes à la date du jour.
            </p>
            <button onClick={handleDownload} disabled={loading} className="btn-primary flex items-center gap-2 mt-4">
              {loading ? <Spinner size="sm" /> : <Download size={16} />}
              Générer le bilan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
