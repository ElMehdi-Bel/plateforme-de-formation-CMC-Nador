package com.cmc.app.repository;

import com.cmc.app.entity.EmploiDuTemps;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface EmploiDuTempsRepository extends JpaRepository<EmploiDuTemps, Long> {

    List<EmploiDuTemps> findByGroupeId(Long groupeId);

    List<EmploiDuTemps> findByFormateurId(Long formateurId);

    List<EmploiDuTemps> findByGroupeCodeIgnoreCase(String groupeCode);

    List<EmploiDuTemps> findByFormateurNomContainingIgnoreCase(String formateurNom);

    List<EmploiDuTemps> findByAnneeScolaire(String anneeScolaire);

    List<EmploiDuTemps> findByJourSemaineAndAnneeScolaire(String jourSemaine, String anneeScolaire);

    String JOUR_ORDER =
           "CASE e.jourSemaine " +
           "WHEN 'LUNDI' THEN 1 WHEN 'MARDI' THEN 2 WHEN 'MERCREDI' THEN 3 " +
           "WHEN 'JEUDI' THEN 4 WHEN 'VENDREDI' THEN 5 WHEN 'SAMEDI' THEN 6 ELSE 7 END, e.heureDebut";

    @Query("SELECT e FROM EmploiDuTemps e WHERE e.anneeScolaire = :annee ORDER BY " + JOUR_ORDER)
    List<EmploiDuTemps> findAllByAnneeScolaireOrdered(@Param("annee") String annee);

    @Query("SELECT e FROM EmploiDuTemps e WHERE e.anneeScolaire = :annee " +
           "AND LOWER(e.groupeCode) = LOWER(:groupeCode) ORDER BY " + JOUR_ORDER)
    List<EmploiDuTemps> findByAnneeAndGroupeCodeOrdered(@Param("annee") String annee,
                                                        @Param("groupeCode") String groupeCode);

    @Query("SELECT e FROM EmploiDuTemps e WHERE e.anneeScolaire = :annee " +
           "AND LOWER(e.formateurNom) LIKE LOWER(CONCAT('%', :nom, '%')) ORDER BY " + JOUR_ORDER)
    List<EmploiDuTemps> findByAnneeAndFormateurNomOrdered(@Param("annee") String annee,
                                                          @Param("nom") String nom);

    List<EmploiDuTemps> findByAnneeScolaireAndJourSemaineAndCreneau(String anneeScolaire, String jourSemaine, String creneau);

    List<EmploiDuTemps> findByAnneeScolaireAndStatut(String anneeScolaire, com.cmc.app.enums.StatutEmploi statut);

    @Query("SELECT e FROM EmploiDuTemps e WHERE e.anneeScolaire = :annee AND e.statut = :statut " +
           "AND (:groupeCode IS NULL OR LOWER(e.groupeCode) = LOWER(:groupeCode))")
    List<EmploiDuTemps> findToValidate(@Param("annee") String annee,
                                       @Param("statut") com.cmc.app.enums.StatutEmploi statut,
                                       @Param("groupeCode") String groupeCode);

    @Query("SELECT e FROM EmploiDuTemps e WHERE e.groupe.id = :groupeId AND e.dateSeance BETWEEN :debut AND :fin ORDER BY e.dateSeance, e.heureDebut")
    List<EmploiDuTemps> findByGroupeIdAndPeriode(@Param("groupeId") Long groupeId,
                                                  @Param("debut") LocalDate debut,
                                                  @Param("fin") LocalDate fin);

    @Query("SELECT e FROM EmploiDuTemps e WHERE e.formateur.id = :formateurId AND e.dateSeance BETWEEN :debut AND :fin ORDER BY e.dateSeance, e.heureDebut")
    List<EmploiDuTemps> findByFormateurIdAndPeriode(@Param("formateurId") Long formateurId,
                                                     @Param("debut") LocalDate debut,
                                                     @Param("fin") LocalDate fin);

    @Modifying
    @Query("DELETE FROM EmploiDuTemps e WHERE e.anneeScolaire = :annee")
    void deleteByAnneeScolaire(@Param("annee") String annee);
}
