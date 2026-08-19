package com.cmc.app.repository;

import com.cmc.app.entity.Note;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface NoteRepository extends JpaRepository<Note, Long> {

    List<Note> findByStagiaireId(Long stagiaireId);

    Page<Note> findByStagiaireId(Long stagiaireId, Pageable pageable);

    List<Note> findByStagiaireIdAndModuleId(Long stagiaireId, Long moduleId);

    Optional<Note> findByStagiaireIdAndModuleIdAndTypeEvaluation(
        Long stagiaireId, Long moduleId, String typeEvaluation);

    @Query("SELECT AVG(n.valeur) FROM Note n WHERE n.stagiaire.id = :stagiaireId")
    Optional<Double> findMoyenneGenerale(@Param("stagiaireId") Long stagiaireId);

    @Query("SELECT AVG(n.valeur) FROM Note n WHERE n.module.id = :moduleId AND n.stagiaire.groupe.id = :groupeId")
    Optional<Double> findMoyenneModuleParGroupe(@Param("moduleId") Long moduleId,
                                                 @Param("groupeId") Long groupeId);

    @Query("SELECT n FROM Note n WHERE n.stagiaire.groupe.id = :groupeId AND n.module.id = :moduleId")
    List<Note> findByGroupeIdAndModuleId(@Param("groupeId") Long groupeId,
                                          @Param("moduleId") Long moduleId);

    @Query("SELECT n FROM Note n WHERE n.stagiaire.groupe.id = :groupeId AND n.module.id = :moduleId ORDER BY n.stagiaire.nom")
    List<Note> findByGroupeAndModule(@Param("groupeId") Long groupeId,
                                      @Param("moduleId") Long moduleId);

    List<Note> findByStagiaireIdOrderByCreatedAtDesc(Long stagiaireId);

    @Query("SELECT AVG(n.valeur) FROM Note n")
    java.util.Optional<Double> findMoyenneGlobale();
}
