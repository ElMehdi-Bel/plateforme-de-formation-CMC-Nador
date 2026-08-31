package com.cmc.app.repository;

import com.cmc.app.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByDestinataire_IdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Query(value = "SELECT n FROM Notification n LEFT JOIN FETCH n.expediteur " +
                   "WHERE n.destinataire.id = :uid ORDER BY n.createdAt DESC",
           countQuery = "SELECT COUNT(n) FROM Notification n WHERE n.destinataire.id = :uid")
    Page<Notification> findForUserWithExpediteur(@Param("uid") Long uid, Pageable pageable);

    long countByDestinataire_IdAndLu(Long userId, boolean lu);

    Page<Notification> findByDestinataire_IdAndLuOrderByCreatedAtDesc(Long userId, boolean lu, Pageable pageable);
}
