package com.cmc.app.repository;

import com.cmc.app.entity.Absence;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface AbsenceRepository extends JpaRepository<Absence, Long> {

    List<Absence> findByStagiaireId(Long stagiaireId);

    Page<Absence> findByStagiaireId(Long stagiaireId, Pageable pageable);

    long countByStagiaireId(Long stagiaireId);

    long countByStagiaireIdAndJustifiee(Long stagiaireId, boolean justifiee);

    @Query("SELECT a FROM Absence a WHERE a.stagiaire.groupe.id = :groupeId AND a.dateAbsence = :date")
    List<Absence> findByGroupeIdAndDate(@Param("groupeId") Long groupeId,
                                         @Param("date") LocalDate date);

    @Query("SELECT a FROM Absence a WHERE a.dateAbsence BETWEEN :debut AND :fin AND a.stagiaire.id = :stagiaireId")
    List<Absence> findByStagiaireIdAndPeriode(@Param("stagiaireId") Long stagiaireId,
                                               @Param("debut") LocalDate debut,
                                               @Param("fin") LocalDate fin);

    List<Absence> findByStagiaireIdOrderByDateAbsenceDesc(Long stagiaireId);

    @Query("SELECT a FROM Absence a WHERE a.groupeCode = :groupeCode AND a.dateAbsence = :date AND a.heureCreneau = :creneau")
    List<Absence> findBySeance(@Param("groupeCode") String groupeCode,
                                @Param("date") LocalDate date,
                                @Param("creneau") String creneau);

    @Query("SELECT a FROM Absence a WHERE a.stagiaire.groupe.id = :groupeId ORDER BY a.dateAbsence DESC")
    List<Absence> findByGroupeIdOrderByDate(@Param("groupeId") Long groupeId);

    @Query("SELECT COUNT(a) FROM Absence a WHERE a.stagiaire.id = :id")
    long countAllByStagiaireId(@Param("id") Long id);

    @Query("SELECT COUNT(a) FROM Absence a WHERE a.stagiaire.id = :id AND a.justifiee = false")
    long countNonJustifieeByStagiaireId(@Param("id") Long id);

    long countByJustifiee(boolean justifiee);

    @Query(value = "SELECT MONTH(date_absence) AS mois, YEAR(date_absence) AS annee, COUNT(*) AS cnt " +
                   "FROM absences WHERE date_absence >= :since " +
                   "GROUP BY YEAR(date_absence), MONTH(date_absence) " +
                   "ORDER BY YEAR(date_absence) ASC, MONTH(date_absence) ASC",
           nativeQuery = true)
    List<Object[]> countParMois(@Param("since") java.time.LocalDate since);
}
