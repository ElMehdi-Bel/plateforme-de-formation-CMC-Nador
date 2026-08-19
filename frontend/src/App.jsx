import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute from './routes/ProtectedRoute'
import DashboardLayout from './layouts/DashboardLayout'

// Pages publiques
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'

// Pages Admin
import AdminDashboard from './pages/admin/AdminDashboard'
import StagiairesPage from './pages/admin/StagiairesPage'
import FormateursPage from './pages/admin/FormateursPage'
import DemandesPage from './pages/admin/DemandesPage'
import FilieresPage from './pages/admin/FilieresPage'
import ModulesPage from './pages/admin/ModulesPage'
import EmploisPage from './pages/admin/EmploisPage'

// Pages Stagiaire
import StagiaireDashboard from './pages/stagiaire/StagiaireDashboard'
import MesNotesPage from './pages/stagiaire/MesNotesPage'
import MesDemandesPage from './pages/stagiaire/MesDemandesPage'
import MonEmploiPage from './pages/stagiaire/MonEmploiPage'
import MesAbsencesPage from './pages/stagiaire/MesAbsencesPage'

// Pages Admin (Notes & Absences & Stats & Audit)
import NotesPage from './pages/admin/NotesPage'
import AbsencesPage from './pages/admin/AbsencesPage'
import StatistiquesPage from './pages/admin/StatistiquesPage'
import AuditLogsPage from './pages/admin/AuditLogsPage'

// Pages Formateur
import FormateurDashboard from './pages/formateur/FormateurDashboard'
import NotesFormateurPage from './pages/formateur/NotesFormateurPage'
import AbsencesFormateurPage from './pages/formateur/AbsencesFormateurPage'

// Pages partagées
import NotificationsPage from './pages/shared/NotificationsPage'

import Spinner from './components/ui/Spinner'

const Placeholder = ({ title }) => (
  <div className="card text-center py-16">
    <h2 className="text-xl font-semibold text-gray-700">{title}</h2>
    <p className="text-gray-400 mt-2">Page en cours de développement</p>
  </div>
)

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* ADMIN Routes */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/stagiaires" element={<StagiairesPage />} />
              <Route path="/admin/formateurs" element={<FormateursPage />} />
              <Route path="/admin/filieres" element={<FilieresPage />} />
              <Route path="/admin/modules" element={<ModulesPage />} />
              <Route path="/admin/emplois" element={<EmploisPage />} />
              <Route path="/admin/demandes" element={<DemandesPage />} />
              <Route path="/admin/notes" element={<NotesPage />} />
              <Route path="/admin/absences" element={<AbsencesPage />} />
              <Route path="/admin/notifications" element={<NotificationsPage />} />
              <Route path="/admin/statistiques" element={<StatistiquesPage />} />
              <Route path="/admin/auditlogs" element={<AuditLogsPage />} />
            </Route>
          </Route>

          {/* STAGIAIRE Routes */}
          <Route element={<ProtectedRoute allowedRoles={['STAGIAIRE']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/stagiaire/dashboard" element={<StagiaireDashboard />} />
              <Route path="/stagiaire/notes" element={<MesNotesPage />} />
              <Route path="/stagiaire/absences" element={<MesAbsencesPage />} />
              <Route path="/stagiaire/cours" element={<Placeholder title="Mes Cours" />} />
              <Route path="/stagiaire/emploi" element={<MonEmploiPage />} />
              <Route path="/stagiaire/demandes" element={<MesDemandesPage />} />
              <Route path="/stagiaire/notifications" element={<NotificationsPage />} />
            </Route>
          </Route>

          {/* FORMATEUR Routes */}
          <Route element={<ProtectedRoute allowedRoles={['FORMATEUR']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/formateur/dashboard" element={<FormateurDashboard />} />
              <Route path="/formateur/groupes" element={<Placeholder title="Mes Groupes" />} />
              <Route path="/formateur/notes" element={<NotesFormateurPage />} />
              <Route path="/formateur/absences" element={<AbsencesFormateurPage />} />
              <Route path="/formateur/cours" element={<Placeholder title="Mes Cours" />} />
              <Route path="/formateur/emploi" element={<Placeholder title="Mon Emploi du temps" />} />
              <Route path="/formateur/notifications" element={<NotificationsPage />} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      </BrowserRouter>
    </AuthProvider>
  )
}
