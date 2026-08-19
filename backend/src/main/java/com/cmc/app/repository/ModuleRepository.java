package com.cmc.app.repository;

import com.cmc.app.entity.Module;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ModuleRepository extends JpaRepository<Module, Long> {

    @Query("SELECT DISTINCT m FROM Module m LEFT JOIN FETCH m.formateur LEFT JOIN FETCH m.groupes WHERE m.formateur.id = :formateurId ORDER BY m.anneeFormation ASC, m.nom ASC")
    List<Module> findByFormateurId(@Param("formateurId") Long formateurId);

    List<Module> findByFiliereId(Long filiereId);

    @Query("SELECT m FROM Module m LEFT JOIN FETCH m.formateur WHERE m.filiere.id = :filiereId ORDER BY m.anneeFormation ASC, m.nom ASC")
    List<Module> findByFiliereIdOrderByAnneeFormationAscNomAsc(@Param("filiereId") Long filiereId);

    boolean existsByCodeAndFiliereId(String code, Long filiereId);

    @Query("SELECT m FROM Module m LEFT JOIN FETCH m.formateur WHERE LOWER(TRIM(m.nom)) = LOWER(TRIM(:nom))")
    List<Module> findByNomIgnoreCase(@Param("nom") String nom);

    @Query("SELECT m FROM Module m JOIN m.groupes g WHERE g.id = :groupeId")
    List<Module> findByGroupeId(@Param("groupeId") Long groupeId);
}
