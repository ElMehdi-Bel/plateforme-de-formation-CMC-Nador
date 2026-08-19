# CMC Nador — Plateforme de Gestion des Stagiaires

Plateforme web complète pour la gestion des stagiaires, formateurs, filières, modules, notes, absences et demandes administratives.

---

## Stack Technique

| Couche | Technologie | IDE recommandé |
|--------|------------|----------------|
| Backend | Java 17 + Spring Boot 3.2 + Spring Security + JWT | **IntelliJ IDEA** |
| Frontend | React 18 + Vite + Tailwind CSS | **VS Code** |
| Base de données | MySQL 8+ | MySQL Workbench |

---

## Architecture

```
Frontend (VS Code) :5173 ↔ REST API /api/v1/* ↔ Backend (IntelliJ) :8080 ↔ MySQL :3306
```

### Rôles utilisateurs
- **ADMIN** : gestion complète de la plateforme
- **FORMATEUR** : gestion notes, absences, cours
- **STAGIAIRE** : consultation, demandes, notifications

---

## Prérequis

- Java 17+
- Node.js 18+
- MySQL 8+
- Maven 3.8+

---

## Installation & Démarrage

### 1. Base de données

```sql
-- Exécuter le script SQL :
mysql -u root -p < database/schema.sql
```

### 2. Backend (IntelliJ IDEA)

```bash
cd backend
# Modifier src/main/resources/application.properties :
# spring.datasource.username=root
# spring.datasource.password=VOTRE_MOT_DE_PASSE

mvn spring-boot:run
# Démarre sur http://localhost:8080
```

### 3. Frontend (VS Code)

```bash
cd frontend
npm install
npm run dev
# Démarre sur http://localhost:5173
```

---

## Compte Admin par défaut

| Champ | Valeur |
|-------|--------|
| Email | admin@cmc-nador.ma |
| Mot de passe | Admin@2024 |

> ⚠️ Changer le mot de passe en production !

---

## API REST — Points clés

```
POST /api/v1/auth/login          → Connexion JWT
POST /api/v1/auth/refresh-token  → Renouvellement token
POST /api/v1/auth/logout         → Déconnexion

GET  /api/v1/users               → Liste utilisateurs (ADMIN)
POST /api/v1/users               → Créer utilisateur (ADMIN)

GET  /api/v1/filieres            → Liste filières
POST /api/v1/filieres            → Créer filière (ADMIN)

POST /api/v1/notes               → Saisir note (FORMATEUR)
GET  /api/v1/notes/stagiaire/{id} → Notes d'un stagiaire

POST /api/v1/absences            → Saisir absence (FORMATEUR)
POST /api/v1/demandes            → Créer demande (STAGIAIRE)
PATCH /api/v1/demandes/{id}/traiter → Traiter demande (ADMIN)

GET  /api/v1/statistiques/dashboard → Stats globales (ADMIN)
GET  /api/v1/auditlogs           → Logs d'audit (ADMIN)
```

---

## Structure du projet

```
Projet Stagiaire CMC/
├── backend/                    → Spring Boot (IntelliJ IDEA)
│   └── src/main/java/com/cmc/app/
│       ├── config/             → SecurityConfig, AppConfig, DataSeeder
│       ├── controller/         → REST Controllers versionnés
│       ├── service/            → Logique métier
│       ├── repository/         → Spring Data JPA
│       ├── entity/             → Entités JPA (User, Note, Absence...)
│       ├── dto/                → Request/Response DTOs
│       ├── security/           → JWT Filter + Service
│       ├── exception/          → Global Exception Handler
│       └── enums/              → Role, StatutDemande, TypeCours...
│
├── frontend/                   → React + Vite (VS Code)
│   └── src/
│       ├── pages/
│       │   ├── admin/          → Dashboard, Stagiaires, Demandes...
│       │   ├── stagiaire/      → Dashboard, Notes, Demandes...
│       │   └── formateur/      → Dashboard, Groupes...
│       ├── components/
│       │   ├── ui/             → Modal, Badge, StatCard, Pagination...
│       │   └── layout/         → Sidebar, Header
│       ├── context/            → AuthContext (JWT + rôles)
│       ├── services/           → Axios services par domaine
│       ├── routes/             → ProtectedRoute (RBAC)
│       └── layouts/            → DashboardLayout
│
└── database/
    └── schema.sql              → Schéma MySQL complet
```

---

## Sécurité

- **JWT Access Token** : 15 minutes
- **JWT Refresh Token** : 7 jours
- **BCrypt** : 12 rounds
- **RBAC** : annotations `@PreAuthorize` sur chaque endpoint
- **CORS** configuré pour le frontend uniquement
- **Audit Logs** : toutes les actions critiques tracées

---

## Fonctionnalités implémentées

- [x] Authentification JWT complète (Access + Refresh Token)
- [x] Gestion des rôles (ADMIN / FORMATEUR / STAGIAIRE)
- [x] Gestion des stagiaires avec pagination et recherche
- [x] Gestion des filières, groupes, modules
- [x] Saisie des notes avec contrôle d'unicité
- [x] Gestion des absences avec justification
- [x] Demandes administratives avec workflow de validation
- [x] Système de notifications interne
- [x] Audit logs complets et asynchrones
- [x] Upload de fichiers (PDF/Vidéo)
- [x] Emplois du temps
- [x] Dashboard analytics avec statistiques
- [x] UI/UX responsive avec Tailwind CSS
- [x] Sidebar dynamique selon le rôle

## Roadmap SaaS future

- [ ] Export PDF des attestations
- [ ] Export Excel des notes
- [ ] Envoi d'emails (Spring Mail)
- [ ] Multi-tenant (isolation par établissement)
- [ ] Application mobile React Native
- [ ] Notifications en temps réel (WebSocket)
- [ ] Intégration paiement (Stripe/CMI)
