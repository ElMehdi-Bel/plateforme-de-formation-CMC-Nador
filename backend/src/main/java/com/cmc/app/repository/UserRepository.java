package com.cmc.app.repository;

import com.cmc.app.entity.User;
import com.cmc.app.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByMatricule(String matricule);

    List<User> findByRole(Role role);

    Page<User> findByRole(Role role, Pageable pageable);

    Page<User> findByRoleAndActif(Role role, boolean actif, Pageable pageable);

    List<User> findByGroupeId(Long groupeId);

    @Query("SELECT u FROM User u WHERE u.role = :role AND " +
           "(LOWER(u.nom) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.prenom) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> searchByRole(@Param("role") Role role,
                            @Param("search") String search,
                            Pageable pageable);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.actif = true")
    long countByRoleAndActif(@Param("role") Role role);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.groupe g LEFT JOIN FETCH g.filiere WHERE u.id = :id")
    Optional<User> findByIdWithGroupe(@Param("id") Long id);
}
