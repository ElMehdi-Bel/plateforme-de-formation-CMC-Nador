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

    @Query("SELECT e FROM EmploiDuTemps e WHERE e.anneeScolaire = :annee ORDER BY " +
           "CASE e.jourSemaine " +
           "WHEN 'LUNDI' THEN 1 WHEN 'MARDI' THEN 2 WHEN 'MERCREDI' THEN 3 " +
           "WHEN 'JEUDI' THEN 4 WHEN 'VENDREDI' THEN 5 WHEN 'SAMEDI' THEN 6 ELSE 7 END, " +
           "e.heureDebut")
    List<EmploiDuTemps> findAllByAnneeScolaireOrdered(@Param("annee") String annee);

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
