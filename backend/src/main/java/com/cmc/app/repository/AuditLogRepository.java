package com.cmc.app.repository;

import com.cmc.app.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query(value = "SELECT a FROM AuditLog a LEFT JOIN FETCH a.user WHERE a.user.id = :uid ORDER BY a.createdAt DESC",
           countQuery = "SELECT COUNT(a) FROM AuditLog a WHERE a.user.id = :uid")
    Page<AuditLog> findByUserIdOrderByCreatedAtDesc(@Param("uid") Long userId, Pageable pageable);

    Page<AuditLog> findByEntityTypeOrderByCreatedAtDesc(String entityType, Pageable pageable);

    @Query(value = "SELECT a FROM AuditLog a LEFT JOIN FETCH a.user ORDER BY a.createdAt DESC",
           countQuery = "SELECT COUNT(a) FROM AuditLog a")
    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
