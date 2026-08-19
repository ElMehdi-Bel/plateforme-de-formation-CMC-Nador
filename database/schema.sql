-- ============================================================
-- CMC NADOR PLATFORM — MySQL Schema
-- Engine: InnoDB | Charset: utf8mb4
-- ============================================================

CREATE DATABASE IF NOT EXISTS cmc_nador
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cmc_nador;

-- ==================== FILIERES ====================
CREATE TABLE IF NOT EXISTS filieres (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  nom         VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  code        VARCHAR(10),
  duree_mois  INT,
  actif       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_filiere_nom (nom)
) ENGINE=InnoDB;

-- ==================== GROUPES ====================
CREATE TABLE IF NOT EXISTS groupes (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  nom              VARCHAR(100) NOT NULL,
  code             VARCHAR(10) UNIQUE,
  annee_formation  VARCHAR(20),
  date_debut       DATE,
  date_fin         DATE,
  capacite_max     INT DEFAULT 20,
  filiere_id       BIGINT NOT NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (filiere_id) REFERENCES filieres(id) ON DELETE CASCADE,
  INDEX idx_groupe_filiere (filiere_id)
) ENGINE=InnoDB;

-- ==================== USERS ====================
CREATE TABLE IF NOT EXISTS users (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  nom         VARCHAR(100) NOT NULL,
  prenom      VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  telephone   VARCHAR(20),
  role        ENUM('ADMIN','STAGIAIRE','FORMATEUR') NOT NULL,
  actif       BOOLEAN NOT NULL DEFAULT TRUE,
  groupe_id   BIGINT,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME,
  FOREIGN KEY (groupe_id) REFERENCES groupes(id) ON DELETE SET NULL,
  INDEX idx_user_email (email),
  INDEX idx_user_role (role),
  INDEX idx_user_groupe (groupe_id)
) ENGINE=InnoDB;

-- ==================== MODULES ====================
CREATE TABLE IF NOT EXISTS modules (
  id             BIGINT AUTO_INCREMENT PRIMARY KEY,
  nom            VARCHAR(150) NOT NULL,
  code           VARCHAR(10),
  description    TEXT,
  volume_horaire INT,
  coefficient    DOUBLE DEFAULT 1.0,
  formateur_id   BIGINT,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (formateur_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ==================== GROUPE_MODULES (M2M) ====================
CREATE TABLE IF NOT EXISTS groupe_modules (
  groupe_id  BIGINT NOT NULL,
  module_id  BIGINT NOT NULL,
  PRIMARY KEY (groupe_id, module_id),
  FOREIGN KEY (groupe_id) REFERENCES groupes(id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ==================== COURS ====================
CREATE TABLE IF NOT EXISTS cours (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  titre         VARCHAR(200) NOT NULL,
  description   TEXT,
  type_cours    ENUM('PDF','VIDEO','AUTRE') NOT NULL,
  fichier_url   VARCHAR(500),
  fichier_nom   VARCHAR(255),
  fichier_taille BIGINT,
  module_id     BIGINT NOT NULL,
  formateur_id  BIGINT NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
  FOREIGN KEY (formateur_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_cours_module (module_id),
  INDEX idx_cours_formateur (formateur_id)
) ENGINE=InnoDB;

-- ==================== NOTES ====================
CREATE TABLE IF NOT EXISTS notes (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  stagiaire_id     BIGINT NOT NULL,
  module_id        BIGINT NOT NULL,
  formateur_id     BIGINT NOT NULL,
  valeur           DOUBLE NOT NULL CHECK (valeur >= 0 AND valeur <= 20),
  type_evaluation  VARCHAR(50) NOT NULL DEFAULT 'CONTROLE',
  commentaire      TEXT,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME,
  FOREIGN KEY (stagiaire_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
  FOREIGN KEY (formateur_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_note_stagiaire_module_type (stagiaire_id, module_id, type_evaluation),
  INDEX idx_note_stagiaire (stagiaire_id),
  INDEX idx_note_module (module_id)
) ENGINE=InnoDB;

-- ==================== ABSENCES ====================
CREATE TABLE IF NOT EXISTS absences (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  stagiaire_id  BIGINT NOT NULL,
  module_id     BIGINT,
  formateur_id  BIGINT NOT NULL,
  date_absence  DATE NOT NULL,
  justifiee     BOOLEAN NOT NULL DEFAULT FALSE,
  motif         TEXT,
  seance        VARCHAR(20) DEFAULT 'MATIN',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stagiaire_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE SET NULL,
  FOREIGN KEY (formateur_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_absence_stagiaire (stagiaire_id),
  INDEX idx_absence_date (date_absence)
) ENGINE=InnoDB;

-- ==================== DEMANDES ====================
CREATE TABLE IF NOT EXISTS demandes (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  stagiaire_id      BIGINT NOT NULL,
  type_demande      ENUM('ATTESTATION_INSCRIPTION','ATTESTATION_STAGE','RELEVE_NOTES','CERTIFICAT_PRESENCE','AUTRE') NOT NULL,
  statut            ENUM('EN_ATTENTE','APPROUVEE','REJETEE','DOCUMENT_PRET') NOT NULL DEFAULT 'EN_ATTENTE',
  motif             TEXT,
  commentaire_admin TEXT,
  document_url      VARCHAR(500),
  document_nom      VARCHAR(255),
  traite_par        BIGINT,
  date_traitement   DATETIME,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME,
  FOREIGN KEY (stagiaire_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (traite_par) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_demande_stagiaire (stagiaire_id),
  INDEX idx_demande_statut (statut)
) ENGINE=InnoDB;

-- ==================== EMPLOI DU TEMPS ====================
CREATE TABLE IF NOT EXISTS emploi_du_temps (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  groupe_id     BIGINT NOT NULL,
  module_id     BIGINT NOT NULL,
  formateur_id  BIGINT NOT NULL,
  date_seance   DATE NOT NULL,
  heure_debut   TIME NOT NULL,
  heure_fin     TIME NOT NULL,
  salle         VARCHAR(100),
  jour_semaine  VARCHAR(20),
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (groupe_id) REFERENCES groupes(id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
  FOREIGN KEY (formateur_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_emploi_groupe (groupe_id),
  INDEX idx_emploi_date (date_seance)
) ENGINE=InnoDB;

-- ==================== NOTIFICATIONS ====================
CREATE TABLE IF NOT EXISTS notifications (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  destinataire_id  BIGINT NOT NULL,
  expediteur_id    BIGINT,
  titre            VARCHAR(200) NOT NULL,
  message          TEXT NOT NULL,
  lu               BOOLEAN NOT NULL DEFAULT FALSE,
  type             VARCHAR(50),
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  lu_at            DATETIME,
  FOREIGN KEY (destinataire_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (expediteur_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_notif_destinataire (destinataire_id),
  INDEX idx_notif_lu (lu)
) ENGINE=InnoDB;

-- ==================== REFRESH TOKENS ====================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  token        VARCHAR(512) NOT NULL UNIQUE,
  user_id      BIGINT NOT NULL,
  expiry_date  DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ==================== AUDIT LOGS ====================
CREATE TABLE IF NOT EXISTS audit_logs (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id      BIGINT,
  action       VARCHAR(100) NOT NULL,
  entity_type  VARCHAR(100),
  entity_id    BIGINT,
  details      TEXT,
  ip_address   VARCHAR(50),
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_action (action),
  INDEX idx_audit_date (created_at)
) ENGINE=InnoDB;

-- ==================== ADMIN PAR DEFAUT ====================
-- Mot de passe: Admin@2024 (BCrypt encodé)
INSERT IGNORE INTO users (nom, prenom, email, password, role, actif)
VALUES (
  'Admin', 'CMC',
  'admin@cmc-nador.ma',
  '$2a$12$LZkbECLPnGWkSuXHSz0FvuXLSrJz8gILSl5n3TXsYQSdJK3PsxvJa',
  'ADMIN',
  TRUE
);
