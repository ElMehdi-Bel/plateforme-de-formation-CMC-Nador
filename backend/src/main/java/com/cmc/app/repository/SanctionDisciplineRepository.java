package com.cmc.app.repository;

import com.cmc.app.entity.SanctionDiscipline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SanctionDisciplineRepository extends JpaRepository<SanctionDiscipline, Long> {

    @Query("SELECT s FROM SanctionDiscipline s WHERE s.stagiaire.id = :sid ORDER BY s.createdAt DESC")
    List<SanctionDiscipline> findByStagiaireIdOrderByCreatedAtDesc(@Param("sid") Long stagiaireId);

    @Query("SELECT COALESCE(MAX(s.palier), 0) FROM SanctionDiscipline s WHERE s.stagiaire.id = :sid AND s.type = :type")
    int maxPalier(@Param("sid") Long stagiaireId, @Param("type") String type);

    @Query("SELECT s FROM SanctionDiscipline s LEFT JOIN FETCH s.stagiaire ORDER BY s.createdAt DESC")
    List<SanctionDiscipline> findRecent(org.springframework.data.domain.Pageable pageable);
}
