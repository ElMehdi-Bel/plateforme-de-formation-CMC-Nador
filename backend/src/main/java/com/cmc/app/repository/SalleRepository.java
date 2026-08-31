package com.cmc.app.repository;

import com.cmc.app.entity.Salle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SalleRepository extends JpaRepository<Salle, Long> {

    boolean existsByNom(String nom);

    @Query("SELECT s FROM Salle s ORDER BY s.nom")
    List<Salle> findAllOrdered();
}
