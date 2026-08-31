-- =====================================================================
-- V2 — Conversion des colonnes ENUM natives MySQL en VARCHAR
-- =====================================================================
-- Sur une base créée par l'ancien `ddl-auto=update`, Hibernate 6 avait
-- généré des colonnes ENUM('...') natives. Ajouter une valeur d'enum y
-- imposait un ALTER de type (c'est ce qui avait cassé l'ajout des rôles
-- CHEF_DE_POLE / GESTIONNAIRE).
--
-- On repasse tout en VARCHAR : les valeurs existantes sont conservées
-- telles quelles, et les futures valeurs d'enum ne nécessitent plus
-- aucune migration de schéma.
--
-- Sur une base neuve (créée par V1) ces colonnes sont déjà en VARCHAR :
-- les MODIFY ci-dessous sont alors des non-opérations.
-- =====================================================================

ALTER TABLE `users`           MODIFY COLUMN `role`         VARCHAR(30) NOT NULL;
ALTER TABLE `cours`           MODIFY COLUMN `type_cours`   VARCHAR(20) NOT NULL;
ALTER TABLE `demandes`        MODIFY COLUMN `type_demande` VARCHAR(40) NOT NULL;
ALTER TABLE `demandes`        MODIFY COLUMN `statut`       VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE';
ALTER TABLE `emploi_du_temps` MODIFY COLUMN `statut`       VARCHAR(20) NOT NULL DEFAULT 'BROUILLON';
