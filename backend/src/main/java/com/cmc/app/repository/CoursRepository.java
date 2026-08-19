package com.cmc.app.repository;

import com.cmc.app.entity.Cours;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CoursRepository extends JpaRepository<Cours, Long> {

    Page<Cours> findByModuleId(Long moduleId, Pageable pageable);

    Page<Cours> findByFormateurId(Long formateurId, Pageable pageable);

    @Query("SELECT c FROM Cours c JOIN c.module m JOIN m.groupes g WHERE g.id = :groupeId")
    Page<Cours> findByGroupeId(@Param("groupeId") Long groupeId, Pageable pageable);
}
