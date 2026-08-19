package com.cmc.app.repository;

import com.cmc.app.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByDestinataire_IdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByDestinataire_IdAndLu(Long userId, boolean lu);

    Page<Notification> findByDestinataire_IdAndLuOrderByCreatedAtDesc(Long userId, boolean lu, Pageable pageable);
}
