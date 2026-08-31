import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute from './routes/ProtectedRoute'
import DashboardLayout from './layouts/DashboardLayout'
import Spinner from './components/ui/Spinner'

// Pages publiques — chargées immédiatement (premier rendu)
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'

// Pages Admin
const AdminDashboard   = lazy(() => import('./pages/admin/AdminDashboard'))
const StagiairesPage   = lazy(() => import('./pages/admin/StagiairesPage'))
const FormateursPage   = lazy(() => import('./pages/admin/FormateursPage'))
const DemandesPage     = lazy(() => import('./pages/admin/DemandesPage'))
const FilieresPage     = lazy(() => import('./pages/admin/FilieresPage'))
const ModulesPage      = lazy(() => import('./pages/admin/ModulesPage'))
const EmploisPage      = lazy(() => import('./pages/admin/EmploisPage'))
const PolesPage        = lazy(() => import('./pages/admin/PolesPage'))
const SallesPage       = lazy(() => import('./pages/admin/SallesPage'))
const RolesPage        = lazy(() => import('./pages/admin/RolesPage'))
const PersonnelPage    = lazy(() => import('./pages/admin/PersonnelPage'))
const AbsencesPage     = lazy(() => import('./pages/admin/AbsencesPage'))
const StatistiquesPage = lazy(() => import('./pages/admin/StatistiquesPage'))
const AuditLogsPage    = lazy(() => import('./pages/admin/AuditLogsPage'))

// Pages Chef de pôle
const ChefDashboard   = lazy(() => import('./pages/chef/ChefDashboard'))
const BilansPage      = lazy(() => import('./pages/chef/BilansPage'))

// Pages Gestionnaire des stagiaires
const GestionnaireDashboard = lazy(() => import('./pages/gestionnaire/GestionnaireDashboard'))
const DocumentsPage         = lazy(() => import('./pages/gestionnaire/DocumentsPage'))

// Pages Stagiaire
const StagiaireDashboard = lazy(() => import('./pages/stagiaire/StagiaireDashboard'))
const MesNotesPage       = lazy(() => import('./pages/stagiaire/MesNotesPage'))
const MesDemandesPage    = lazy(() => import('./pages/stagiaire/MesDemandesPage'))
const MonEmploiPage      = lazy(() => import('./pages/stagiaire/MonEmploiPage'))
const MesAbsencesPage    = lazy(() => import('./pages/stagiaire/MesAbsencesPage'))
const MesCoursPage       = lazy(() => import('./pages/stagiaire/MesCoursPage'))

// Pages Formateur
const FormateurDashboard     = lazy(() => import('./pages/formateur/FormateurDashboard'))
const NotesFormateurPage     = lazy(() => import('./pages/formateur/NotesFormateurPage'))
const AbsencesFormateurPage  = lazy(() => import('./pages/formateur/AbsencesFormateurPage'))
const MesGroupesPage         = lazy(() => import('./pages/formateur/MesGroupesPage'))
const MonEmploiFormateurPage = lazy(() => import('./pages/formateur/MonEmploiPage'))
const MesCoursFormateurPage  = lazy(() => import('./pages/formateur/MesCoursPage'))

// Pages partagées
const NotificationsPage = lazy(() => import('./pages/shared/NotificationsPage'))
const ProfilePage       = lazy(() => import('./pages/shared/ProfilePage'))

const ALL_ROLES = ['ADMIN', 'CHEF_DE_POLE', 'GESTIONNAIRE', 'FORMATEUR', 'STAGIAIRE']

const PageLoader = () => (
  <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>
)

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* ADMIN Routes */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/personnel" element={<PersonnelPage />} />
                <Route path="/admin/stagiaires" element={<StagiairesPage />} />
                <Route path="/admin/formateurs" element={<FormateursPage />} />
                <Route path="/admin/filieres" element={<FilieresPage />} />
                <Route path="/admin/modules" element={<ModulesPage />} />
                <Route path="/admin/poles" element={<PolesPage />} />
                <Route path="/admin/salles" element={<SallesPage />} />
                <Route path="/admin/roles" element={<RolesPage />} />
                <Route path="/admin/emplois" element={<EmploisPage />} />
                <Route path="/admin/demandes" element={<DemandesPage />} />
                <Route path="/admin/absences" element={<AbsencesPage />} />
                <Route path="/admin/notifications" element={<NotificationsPage />} />
                <Route path="/admin/statistiques" element={<StatistiquesPage />} />
                <Route path="/admin/auditlogs" element={<AuditLogsPage />} />
              </Route>
            </Route>

            {/* CHEF DE PÔLE Routes */}
            <Route element={<ProtectedRoute allowedRoles={['CHEF_DE_POLE']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/chef/dashboard" element={<ChefDashboard />} />
                <Route path="/chef/emplois" element={<EmploisPage />} />
                <Route path="/chef/formateurs" element={<FormateursPage />} />
                <Route path="/chef/modules" element={<ModulesPage />} />
                <Route path="/chef/statistiques" element={<StatistiquesPage />} />
                <Route path="/chef/bilans" element={<BilansPage />} />
                <Route path="/chef/notifications" element={<NotificationsPage />} />
              </Route>
            </Route>

            {/* GESTIONNAIRE DES STAGIAIRES Routes */}
            <Route element={<ProtectedRoute allowedRoles={['GESTIONNAIRE']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/gestionnaire/dashboard" element={<GestionnaireDashboard />} />
                <Route path="/gestionnaire/stagiaires" element={<StagiairesPage />} />
                <Route path="/gestionnaire/emplois" element={<EmploisPage />} />
                <Route path="/gestionnaire/absences" element={<AbsencesPage />} />
                <Route path="/gestionnaire/demandes" element={<DemandesPage />} />
                <Route path="/gestionnaire/documents" element={<DocumentsPage />} />
                <Route path="/gestionnaire/notifications" element={<NotificationsPage />} />
              </Route>
            </Route>

            {/* STAGIAIRE Routes */}
            <Route element={<ProtectedRoute allowedRoles={['STAGIAIRE']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/stagiaire/dashboard" element={<StagiaireDashboard />} />
                <Route path="/stagiaire/notes" element={<MesNotesPage />} />
                <Route path="/stagiaire/absences" element={<MesAbsencesPage />} />
                <Route path="/stagiaire/cours" element={<MesCoursPage />} />
                <Route path="/stagiaire/emploi" element={<MonEmploiPage />} />
                <Route path="/stagiaire/demandes" element={<MesDemandesPage />} />
                <Route path="/stagiaire/notifications" element={<NotificationsPage />} />
              </Route>
            </Route>

            {/* FORMATEUR Routes */}
            <Route element={<ProtectedRoute allowedRoles={['FORMATEUR']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/formateur/dashboard" element={<FormateurDashboard />} />
                <Route path="/formateur/groupes" element={<MesGroupesPage />} />
                <Route path="/formateur/notes" element={<NotesFormateurPage />} />
                <Route path="/formateur/absences" element={<AbsencesFormateurPage />} />
                <Route path="/formateur/cours" element={<MesCoursFormateurPage />} />
                <Route path="/formateur/emploi" element={<MonEmploiFormateurPage />} />
                <Route path="/formateur/notifications" element={<NotificationsPage />} />
              </Route>
            </Route>

            {/* Mon compte — tous rôles */}
            <Route element={<ProtectedRoute allowedRoles={ALL_ROLES} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/mon-compte" element={<ProfilePage />} />
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      </BrowserRouter>
    </AuthProvider>
  )
}
