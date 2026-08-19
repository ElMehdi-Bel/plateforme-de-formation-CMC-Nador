package com.cmc.app.repository;

import com.cmc.app.entity.Demande;
import com.cmc.app.enums.StatutDemande;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DemandeRepository extends JpaRepository<Demande, Long> {

    @Query(value = "SELECT d FROM Demande d JOIN FETCH d.stagiaire WHERE d.stagiaire.id = :stagiaireId",
           countQuery = "SELECT count(d) FROM Demande d WHERE d.stagiaire.id = :stagiaireId")
    Page<Demande> findByStagiaireId(@Param("stagiaireId") Long stagiaireId, Pageable pageable);

    @Query(value = "SELECT d FROM Demande d JOIN FETCH d.stagiaire WHERE d.statut = :statut",
           countQuery = "SELECT count(d) FROM Demande d WHERE d.statut = :statut")
    Page<Demande> findByStatut(@Param("statut") StatutDemande statut, Pageable pageable);

    @Query(value = "SELECT d FROM Demande d JOIN FETCH d.stagiaire",
           countQuery = "SELECT count(d) FROM Demande d")
    Page<Demande> findAllWithStagiaire(Pageable pageable);

    long countByStatut(StatutDemande statut);

    long countByStagiaireId(Long stagiaireId);

    @Query("SELECT d.typeDemande, COUNT(d) FROM Demande d GROUP BY d.typeDemande ORDER BY COUNT(d) DESC")
    List<Object[]> countParType();

    @Query("SELECT d.statut, COUNT(d) FROM Demande d GROUP BY d.statut")
    List<Object[]> countParStatut();
}
