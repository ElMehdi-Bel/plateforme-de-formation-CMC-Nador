-- V3 — Dénormalisation du nom du validateur d'emploi du temps
-- (cohérent avec formateur_nom / groupe_code / module_nom déjà présents),
-- pour éviter tout chargement paresseux lors de la sérialisation.
ALTER TABLE `emploi_du_temps`
  ADD COLUMN `valide_par_nom` VARCHAR(150) DEFAULT NULL AFTER `valide_par_id`;

UPDATE `emploi_du_temps` e
  JOIN `users` u ON u.id = e.valide_par_id
  SET e.valide_par_nom = CONCAT(u.prenom, ' ', u.nom)
  WHERE e.valide_par_id IS NOT NULL;
