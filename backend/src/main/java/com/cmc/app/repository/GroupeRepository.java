package com.cmc.app.repository;

import com.cmc.app.entity.Groupe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GroupeRepository extends JpaRepository<Groupe, Long> {

    @Query("SELECT g FROM Groupe g JOIN FETCH g.filiere WHERE g.filiere.id = :filiereId ORDER BY g.nom")
    List<Groupe> findByFiliereId(@Param("filiereId") Long filiereId);

    @Query("SELECT g FROM Groupe g JOIN FETCH g.filiere ORDER BY g.filiere.nom, g.nom")
    List<Groupe> findAllWithFiliere();

    @Query("SELECT g FROM Groupe g JOIN FETCH g.filiere WHERE g.id = :id")
    java.util.Optional<Groupe> findByIdWithFiliere(@Param("id") Long id);

    @Query("SELECT g FROM Groupe g LEFT JOIN FETCH g.modules WHERE g.id = :id")
    java.util.Optional<Groupe> findByIdWithModules(@Param("id") Long id);

    java.util.Optional<Groupe> findByNomIgnoreCase(String nom);

    boolean existsByCode(String code);

    @Query("SELECT COUNT(u) FROM User u WHERE u.groupe.id = :groupeId")
    long countStagiairesInGroupe(@Param("groupeId") Long groupeId);

    @Query("SELECT DISTINCT g FROM Groupe g JOIN FETCH g.filiere JOIN g.modules m WHERE m.formateur.id = :formateurId")
    List<Groupe> findGroupesByFormateurId(@Param("formateurId") Long formateurId);
}
