import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { noteService } from '../../services/noteService'
import SkeletonTable from '../../components/ui/SkeletonTable'

function moyenneColor(m) {
  if (m === null || m === undefined) return 'text-gray-400'
  if (m >= 12) return 'text-green-600 font-bold'
  if (m >= 10) return 'text-orange-500 font-bold'
  return 'text-red-600 font-bold'
}

function groupNotesByModule(notes) {
  const map = {}
  notes.forEach(n => {
    const moduleId = n.module?.id
    if (!moduleId) return
    if (!map[moduleId]) {
      map[moduleId] = { moduleNom: n.module?.nom || '—', cc: null, efm: null }
    }
    const type = n.typeEvaluation?.toUpperCase()
    if (type === 'CC') map[moduleId].cc = n.valeur
    else if (type === 'EFM') map[moduleId].efm = n.valeur
  })
  return Object.values(map)
}

export default function MesNotesPage() {
  const { user } = useAuth()
  const [groupedNotes, setGroupedNotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.userId) return
    setLoading(true)
    // Fetch all notes (no pagination needed for grouped view)
    noteService.findByStagiaire(user.userId, { page: 0, size: 200 })
      .then(r => {
        const notes = r.data.data?.content || []
        setGroupedNotes(groupNotesByModule(notes))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes Notes</h1>
        <p className="text-gray-500 text-sm mt-1">Relevé de notes par module (CC et EFM)</p>
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="p-6"><SkeletonTable rows={6} cols={4} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">Module</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 text-center">CC (/20)</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 text-center">EFM (/40)</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 text-center">Moy. Module (/20)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {groupedNotes.map((row, i) => {
                  const moyenne =
                    row.cc !== null && row.cc !== undefined &&
                    row.efm !== null && row.efm !== undefined
                      ? (row.cc + row.efm) / 3
                      : null
                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-800">{row.moduleNom}</td>
                      <td className="px-5 py-3 text-center">
                        {row.cc !== null && row.cc !== undefined ? (
                          <span className="font-semibold text-gray-700">{row.cc}/20</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {row.efm !== null && row.efm !== undefined ? (
                          <span className="font-semibold text-gray-700">{row.efm}/40</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {moyenne !== null ? (
                          <span className={moyenneColor(moyenne)}>{Number(moyenne).toFixed(2)}/20</span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {groupedNotes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-400 py-10">
                      Aucune note disponible
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
