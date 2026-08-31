package com.cmc.app.repository;

import com.cmc.app.entity.IncidentDiscipline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface IncidentDisciplineRepository extends JpaRepository<IncidentDiscipline, Long> {

    @Query("SELECT i FROM IncidentDiscipline i WHERE i.stagiaire.id = :sid ORDER BY i.dateIncident DESC")
    List<IncidentDiscipline> findByStagiaireIdOrderByDateIncidentDesc(@Param("sid") Long stagiaireId);

    @Query("SELECT COUNT(i) FROM IncidentDiscipline i WHERE i.stagiaire.id = :sid")
    long countByStagiaireId(@Param("sid") Long stagiaireId);
}
