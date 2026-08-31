# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CMC Nador — a full-stack internship management platform (stagiaires, formateurs, filières, modules, notes, absences, demandes administratives).

**Architecture:**
```
Frontend React :5173 ↔ REST API /api/v1/* ↔ Backend Spring Boot :8080 ↔ MySQL :3306
```

## Commands

### Backend (from `backend/`)
```bash
mvn spring-boot:run          # Start backend on :8080
mvn test                     # Run all tests
mvn test -Dtest=ClassName    # Run a single test class
mvn package -DskipTests      # Build JAR
```

### Frontend (from `frontend/`)
```bash
npm install      # Install dependencies
npm run dev      # Start dev server on :5173
npm run build    # Production build
npm run lint     # ESLint (max-warnings 0)
npm run preview  # Preview production build
```

## Database Setup

Schema is managed by **Flyway** — versioned SQL migrations in `backend/src/main/resources/db/migration/` (`V1__baseline_schema.sql`, `V2__…`, …). Hibernate runs in `ddl-auto=validate` mode (checks entities match, never alters). To change the schema, add a new `V<n>__description.sql` file — never edit an applied migration. An existing pre-Flyway database is auto-baselined at V1 on first startup (`baseline-on-migrate=true`). Java enums are stored as `VARCHAR` (`@JdbcTypeCode(SqlTypes.VARCHAR)` on the entity fields), so adding an enum value needs no column migration.

Ensure MySQL is running; DB credentials come from env vars or `application-local.properties` (gitignored — copy `application-local.properties.example`). The database `cmc_nador` is created automatically on first run.

**Default accounts** (seeded by `DataSeeder` on startup):
- Admin — `admin@cmc-nador.ma` / `Admin@2024`
- Chef de pôle — `chef@cmc-nador.ma` / `Chef@2024`
- Gestionnaire des stagiaires — `gestionnaire@cmc-nador.ma` / `Gestion@2024`

## Configuration

Backend config lives in `backend/src/main/resources/application.properties`. Key values to change per environment:
- `spring.datasource.username` / `spring.datasource.password`
- `app.jwt.secret` (must be 256-bit minimum)
- `app.cors.allowed-origins`

The Vite dev server proxies `/api/v1/*` to `localhost:8080` — check `vite.config.js` if proxy issues arise.

## Architecture

### Backend (`backend/src/main/java/com/cmc/app/`)

Standard layered Spring Boot app:
- **`controller/`** — REST controllers, all versioned under `/api/v1/`. Authorization enforced via `@PreAuthorize` annotations.
- **`service/`** — Business logic. `AuditService` is used by other services to log critical actions asynchronously.
- **`repository/`** — Spring Data JPA repositories.
- **`entity/`** — JPA entities: `User`, `Pole`, `Salle`, `Filiere`, `Groupe`, `Module`, `Cours`, `Note`, `Absence`, `Demande`, `EmploiDuTemps`, `Notification`, `AuditLog`, `RefreshToken`.
- **`security/`** — `JwtAuthenticationFilter` (per-request JWT validation) + `JwtService` (token generation/parsing).
- **`config/`** — `SecurityConfig` (filter chain, CORS, RBAC path rules), `ApplicationConfig` (beans), `DataSeeder` (admin seed on startup).
- **`dto/`** — Separated into `request/` and `response/` packages.
- **`enums/`** — `Role` (ADMIN, CHEF_DE_POLE, GESTIONNAIRE, FORMATEUR, STAGIAIRE), `StatutEmploi` (BROUILLON, VALIDE), `TypeCours`, `TypeDemande`, etc.
- **`exception/`** — Custom exceptions with a global exception handler.

**Security model:** Stateless JWT. Access token = 15 min, Refresh token = 7 days (stored in DB, one per user). The filter chain permits `/api/v1/auth/**` and `/uploads/**` publicly; authorization is enforced almost entirely by per-method `@PreAuthorize` (the `/api/v1/{admin,formateur,stagiaire}/**` path rules are vestigial — controllers sit on `/api/v1/<domain>`).

**Role perimeters follow the use-case diagram — ADMIN is NOT a superuser.** ADMIN writes only on users / poles / salles / roles / filieres / groupes / modules; on everything else (emplois du temps, notes, absences, demandes, documents) ADMIN is read-only. Emploi CRUD + validation = CHEF_DE_POLE; module→formateur assignment = CHEF_DE_POLE; note entry = FORMATEUR; absence appel = FORMATEUR, justify/delete = GESTIONNAIRE; demande processing = GESTIONNAIRE. Shared frontend pages gate write controls via `useAuth()` flags (`canWrite`, `canManage`, `canCrud`, `canAssign`).

**File uploads:** Stored to `./uploads` directory. Apache POI handles Excel export; iText handles PDF generation.

### Frontend (`frontend/src/`)

React 18 + Vite SPA:
- **`services/api.js`** — Central Axios instance with base URL `/api/v1`. Request interceptor attaches JWT from `localStorage`. Response interceptor handles 401s by attempting a token refresh via `/auth/refresh-token`, then retrying the original request; on failure it clears storage and redirects to `/login`.
- **`services/`** — One file per domain (`authService`, `userService`, `noteService`, `absenceService`, `demandeService`, `filiereService`, `moduleService`, `groupeService`, `emploiService`, `importService`). All call the shared `api` instance.
- **`context/AuthContext.jsx`** — Global auth state. Exposes `user`, `login`, `logout`, `loading`, and boolean helpers `isAdmin`, `isChefPole`, `isGestionnaire`, `isFormateur`, `isStagiaire`. User object and tokens are persisted in `localStorage`.
- **`routes/ProtectedRoute.jsx`** — Wraps route groups with `allowedRoles` check. Redirects unauthenticated users to `/login`; redirects wrong-role users to their own dashboard.
- **`layouts/DashboardLayout.jsx`** — Shared shell (Sidebar + Header + `<Outlet />`). All role dashboards render inside this layout.
- **`pages/`** — Organized by role: `admin/`, `stagiaire/`, `formateur/`, `shared/` (e.g., `NotificationsPage`).
- **`components/ui/`** — Reusable primitives: `Modal`, `Badge`, `Spinner`, `Pagination`, `SkeletonTable`, `StatCard`.

**Routing pattern in `App.jsx`:** Five `<ProtectedRoute allowedRoles={[...]}>` wrappers (admin, chef, gestionnaire, stagiaire, formateur), each containing a `<DashboardLayout>` with nested role-specific routes. The chef and gestionnaire spaces reuse the admin page components under `/chef/*` and `/gestionnaire/*` paths. Several routes render a `<Placeholder>` component for features still in development.

**Forms:** `react-hook-form` + `zod` for validation. Notifications via `react-hot-toast`. Charts via `recharts`.
