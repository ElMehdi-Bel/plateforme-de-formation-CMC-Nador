-- =====================================================================
-- V5 — Sanctions de discipline (assiduité / comportement)
-- Persistance des sanctions déterminées « selon le règlement » lors de
-- l'enregistrement des absences (diagramme d'activité Gestion des absences).
-- =====================================================================
CREATE TABLE IF NOT EXISTS `sanctions_discipline` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `stagiaire_id` bigint NOT NULL,
  `type` varchar(20) NOT NULL,                 -- ASSIDUITE | COMPORTEMENT
  `palier` int NOT NULL,
  `sanction` varchar(255) NOT NULL,
  `autorite` varchar(10) NOT NULL,             -- SG | D | CD
  `note_assiduite` double DEFAULT NULL,        -- /10  (au moment de la sanction)
  `note_discipline` double DEFAULT NULL,       -- /15
  `exclusion_definitive` tinyint(1) NOT NULL DEFAULT '0',
  `conseil_alerte` tinyint(1) NOT NULL DEFAULT '0',
  `motif` varchar(255) DEFAULT NULL,
  `declenche_par_id` bigint DEFAULT NULL,
  `declenche_par_nom` varchar(150) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sanction_stagiaire` (`stagiaire_id`),
  KEY `idx_sanction_type` (`type`),
  CONSTRAINT `fk_sanction_stagiaire` FOREIGN KEY (`stagiaire_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sanction_declenche_par` FOREIGN KEY (`declenche_par_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
