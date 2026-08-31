-- =====================================================================
-- V4 — Discipline : incidents de comportement + type d'absence (retard)
-- Support de la « Grille de notation de l'Assiduité et du Comportement »
-- =====================================================================

-- Nature de l'écart : ABSENCE (défaut) ou RETARD
ALTER TABLE `absences`
  ADD COLUMN `type` VARCHAR(20) NOT NULL DEFAULT 'ABSENCE' AFTER `justifiee`;

-- Incidents de comportement (indiscipline)
CREATE TABLE IF NOT EXISTS `incidents_discipline` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `stagiaire_id` bigint NOT NULL,
  `date_incident` date NOT NULL,
  `motif` varchar(200) NOT NULL,
  `description` text,
  `cree_par_id` bigint DEFAULT NULL,
  `cree_par_nom` varchar(150) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_incident_stagiaire` (`stagiaire_id`),
  KEY `idx_incident_cree_par` (`cree_par_id`),
  CONSTRAINT `fk_incident_stagiaire` FOREIGN KEY (`stagiaire_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_incident_cree_par` FOREIGN KEY (`cree_par_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
