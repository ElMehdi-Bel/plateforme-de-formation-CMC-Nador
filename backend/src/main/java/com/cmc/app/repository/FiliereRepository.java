package com.cmc.app.repository;

import com.cmc.app.entity.Filiere;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FiliereRepository extends JpaRepository<Filiere, Long> {

    boolean existsByNom(String nom);

    java.util.Optional<Filiere> findByNomIgnoreCase(String nom);

    List<Filiere> findByActif(boolean actif);

    @Query("SELECT DISTINCT f FROM Filiere f ORDER BY f.nom")
    List<Filiere> findAllDistinctOrdered();

    @Query("SELECT f FROM Filiere f WHERE LOWER(f.nom) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Filiere> searchByNom(@Param("search") String search, Pageable pageable);
}
