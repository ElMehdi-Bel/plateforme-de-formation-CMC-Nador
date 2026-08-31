package com.cmc.app.repository;

import com.cmc.app.entity.Pole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PoleRepository extends JpaRepository<Pole, Long> {

    boolean existsByNom(String nom);

    Optional<Pole> findByNomIgnoreCase(String nom);

    @Query("SELECT p FROM Pole p ORDER BY p.nom")
    List<Pole> findAllOrdered();
}
