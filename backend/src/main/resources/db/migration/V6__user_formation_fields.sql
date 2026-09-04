-- V6 — Champs formation / naissance du stagiaire (fonctionnalité attestations OFPPT)
-- Ajoutés à l'entité User par la branche « certification » ; V1 (baseline) les
-- ignorait encore. Colonnes nullables, aucune donnée à rétro-remplir.
ALTER TABLE `users`
  ADD COLUMN `date_naissance`   DATE         DEFAULT NULL AFTER `moyenne_bac`,
  ADD COLUMN `lieu_naissance`   VARCHAR(100) DEFAULT NULL AFTER `date_naissance`,
  ADD COLUMN `niveau_formation` VARCHAR(30)  DEFAULT NULL AFTER `lieu_naissance`,
  ADD COLUMN `type_formation`   VARCHAR(30)  DEFAULT NULL AFTER `niveau_formation`,
  ADD COLUMN `mode_formation`   VARCHAR(30)  DEFAULT NULL AFTER `type_formation`;
