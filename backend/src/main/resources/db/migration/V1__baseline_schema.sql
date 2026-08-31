-- =====================================================================
-- V1 — Schéma de référence (baseline)
-- =====================================================================
-- Ce script représente l'état du schéma au moment de l'introduction de
-- Flyway. Sur une base EXISTANTE il n'est PAS exécuté (baseline-on-migrate) ;
-- sur une base VIERGE il crée l'intégralité des tables.
--
-- Les colonnes d'énumération sont volontairement en VARCHAR (et non en
-- ENUM MySQL natif) : ajouter une valeur d'enum ne nécessite alors aucune
-- migration de type de colonne.
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `poles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nom` varchar(200) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `description` text,
  `chef_nom` varchar(150) DEFAULT NULL,
  `actif` bit(1) NOT NULL DEFAULT b'1',
  `created_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pole_nom` (`nom`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `salles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `type` varchar(100) DEFAULT NULL,
  `capacite` int DEFAULT NULL,
  `batiment` varchar(100) DEFAULT NULL,
  `disponible` bit(1) NOT NULL DEFAULT b'1',
  `created_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_salle_nom` (`nom`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `filieres` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nom` varchar(300) DEFAULT NULL,
  `description` text,
  `code` varchar(50) DEFAULT NULL,
  `duree_mois` int DEFAULT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT '1',
  `pole_id` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_filiere_nom` (`nom`),
  KEY `idx_filiere_nom` (`nom`),
  KEY `idx_filiere_pole` (`pole_id`),
  CONSTRAINT `fk_filiere_pole` FOREIGN KEY (`pole_id`) REFERENCES `poles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `groupes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) NOT NULL,
  `code` varchar(10) DEFAULT NULL,
  `annee_formation` varchar(20) DEFAULT NULL,
  `date_debut` date DEFAULT NULL,
  `date_fin` date DEFAULT NULL,
  `capacite_max` int DEFAULT '20',
  `filiere_id` bigint NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_groupe_code` (`code`),
  KEY `idx_groupe_filiere` (`filiere_id`),
  CONSTRAINT `fk_groupe_filiere` FOREIGN KEY (`filiere_id`) REFERENCES `filieres` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `role` varchar(30) NOT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT '1',
  `groupe_id` bigint DEFAULT NULL,
  `pole_id` bigint DEFAULT NULL,
  `matricule` varchar(50) DEFAULT NULL,
  `cnie` varchar(20) DEFAULT NULL,
  `code_massar` varchar(30) DEFAULT NULL,
  `nom_arabe` varchar(150) DEFAULT NULL,
  `prenom_arabe` varchar(150) DEFAULT NULL,
  `email_ofppt` varchar(150) DEFAULT NULL,
  `nationalite` varchar(50) DEFAULT NULL,
  `date_inscription` date DEFAULT NULL,
  `niveau_scolaire` varchar(100) DEFAULT NULL,
  `annee_bac` int DEFAULT NULL,
  `moyenne_bac` double DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_email` (`email`),
  KEY `idx_user_email` (`email`),
  KEY `idx_user_role` (`role`),
  KEY `idx_user_groupe` (`groupe_id`),
  KEY `idx_user_pole` (`pole_id`),
  CONSTRAINT `fk_user_groupe` FOREIGN KEY (`groupe_id`) REFERENCES `groupes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_user_pole` FOREIGN KEY (`pole_id`) REFERENCES `poles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `modules` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nom` varchar(500) DEFAULT NULL,
  `code` varchar(100) DEFAULT NULL,
  `description` text,
  `volume_horaire` int DEFAULT NULL,
  `coefficient` double DEFAULT '1',
  `annee_formation` int DEFAULT NULL,
  `filiere_id` bigint DEFAULT NULL,
  `formateur_id` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_module_filiere` (`filiere_id`),
  KEY `idx_module_formateur` (`formateur_id`),
  CONSTRAINT `fk_module_filiere` FOREIGN KEY (`filiere_id`) REFERENCES `filieres` (`id`),
  CONSTRAINT `fk_module_formateur` FOREIGN KEY (`formateur_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `groupe_modules` (
  `groupe_id` bigint NOT NULL,
  `module_id` bigint NOT NULL,
  PRIMARY KEY (`groupe_id`,`module_id`),
  KEY `idx_gm_module` (`module_id`),
  CONSTRAINT `fk_gm_groupe` FOREIGN KEY (`groupe_id`) REFERENCES `groupes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_gm_module` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `stagiaire_id` bigint NOT NULL,
  `module_id` bigint NOT NULL,
  `formateur_id` bigint NOT NULL,
  `valeur` double NOT NULL,
  `type_evaluation` varchar(50) NOT NULL DEFAULT 'CONTROLE',
  `commentaire` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_note_stagiaire_module_type` (`stagiaire_id`,`module_id`,`type_evaluation`),
  KEY `idx_note_stagiaire` (`stagiaire_id`),
  KEY `idx_note_module` (`module_id`),
  KEY `idx_note_formateur` (`formateur_id`),
  CONSTRAINT `fk_note_stagiaire` FOREIGN KEY (`stagiaire_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_note_module` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_note_formateur` FOREIGN KEY (`formateur_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `absences` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `stagiaire_id` bigint NOT NULL,
  `module_id` bigint DEFAULT NULL,
  `formateur_id` bigint NOT NULL,
  `date_absence` date NOT NULL,
  `justifiee` tinyint(1) NOT NULL DEFAULT '0',
  `motif` text,
  `seance` varchar(20) DEFAULT 'MATIN',
  `groupe_code` varchar(100) DEFAULT NULL,
  `heure_creneau` varchar(50) DEFAULT NULL,
  `jour_semaine` varchar(20) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_absence_stagiaire` (`stagiaire_id`),
  KEY `idx_absence_date` (`date_absence`),
  KEY `idx_absence_module` (`module_id`),
  KEY `idx_absence_formateur` (`formateur_id`),
  CONSTRAINT `fk_absence_stagiaire` FOREIGN KEY (`stagiaire_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_absence_module` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_absence_formateur` FOREIGN KEY (`formateur_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cours` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `titre` varchar(200) NOT NULL,
  `description` text,
  `type_cours` varchar(20) NOT NULL,
  `fichier_url` varchar(500) DEFAULT NULL,
  `fichier_nom` varchar(255) DEFAULT NULL,
  `fichier_taille` bigint DEFAULT NULL,
  `module_id` bigint NOT NULL,
  `formateur_id` bigint NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cours_module` (`module_id`),
  KEY `idx_cours_formateur` (`formateur_id`),
  CONSTRAINT `fk_cours_module` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cours_formateur` FOREIGN KEY (`formateur_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `emploi_du_temps` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `groupe_id` bigint DEFAULT NULL,
  `module_id` bigint DEFAULT NULL,
  `formateur_id` bigint DEFAULT NULL,
  `date_seance` date DEFAULT NULL,
  `heure_debut` time NOT NULL,
  `heure_fin` time NOT NULL,
  `salle` varchar(100) DEFAULT NULL,
  `jour_semaine` varchar(20) DEFAULT NULL,
  `annee_scolaire` varchar(20) DEFAULT NULL,
  `creneau` varchar(30) DEFAULT NULL,
  `formateur_nom` varchar(150) DEFAULT NULL,
  `groupe_code` varchar(100) DEFAULT NULL,
  `module_nom` varchar(200) DEFAULT NULL,
  `statut` varchar(20) NOT NULL DEFAULT 'BROUILLON',
  `valide_par_id` bigint DEFAULT NULL,
  `date_validation` datetime(6) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_emploi_groupe` (`groupe_id`),
  KEY `idx_emploi_date` (`date_seance`),
  KEY `idx_emploi_jour` (`jour_semaine`),
  KEY `idx_emploi_module` (`module_id`),
  KEY `idx_emploi_formateur` (`formateur_id`),
  KEY `idx_emploi_valide_par` (`valide_par_id`),
  CONSTRAINT `fk_emploi_groupe` FOREIGN KEY (`groupe_id`) REFERENCES `groupes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_emploi_module` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_emploi_formateur` FOREIGN KEY (`formateur_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_emploi_valide_par` FOREIGN KEY (`valide_par_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `demandes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `stagiaire_id` bigint NOT NULL,
  `type_demande` varchar(40) NOT NULL,
  `statut` varchar(20) NOT NULL DEFAULT 'EN_ATTENTE',
  `motif` text,
  `commentaire_admin` text,
  `traite_par` bigint DEFAULT NULL,
  `date_traitement` datetime DEFAULT NULL,
  `document_nom` varchar(255) DEFAULT NULL,
  `document_url` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_demande_stagiaire` (`stagiaire_id`),
  KEY `idx_demande_statut` (`statut`),
  KEY `idx_demande_traite_par` (`traite_par`),
  CONSTRAINT `fk_demande_stagiaire` FOREIGN KEY (`stagiaire_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_demande_traite_par` FOREIGN KEY (`traite_par`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `destinataire_id` bigint NOT NULL,
  `expediteur_id` bigint DEFAULT NULL,
  `titre` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `lu` tinyint(1) NOT NULL DEFAULT '0',
  `type` varchar(50) DEFAULT NULL,
  `lu_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notif_destinataire` (`destinataire_id`),
  KEY `idx_notif_lu` (`lu`),
  KEY `idx_notif_expediteur` (`expediteur_id`),
  CONSTRAINT `fk_notif_destinataire` FOREIGN KEY (`destinataire_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notif_expediteur` FOREIGN KEY (`expediteur_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(100) DEFAULT NULL,
  `entity_id` bigint DEFAULT NULL,
  `details` text,
  `ip_address` varchar(50) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_action` (`action`),
  KEY `idx_audit_date` (`created_at`),
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `token` varchar(512) NOT NULL,
  `user_id` bigint NOT NULL,
  `expiry_date` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_refresh_token` (`token`),
  KEY `idx_refresh_user` (`user_id`),
  CONSTRAINT `fk_refresh_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
