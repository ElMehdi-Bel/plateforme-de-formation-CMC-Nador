package com.cmc.app.service;

import com.cmc.app.dto.request.NotificationRequest;
import com.cmc.app.entity.Notification;
import com.cmc.app.entity.User;
import com.cmc.app.exception.ResourceNotFoundException;
import com.cmc.app.repository.NotificationRepository;
import com.cmc.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public Notification envoyer(User expediteur, User destinataire, String titre, String message, String type) {
        Notification notif = Notification.builder()
                .expediteur(expediteur)
                .destinataire(destinataire)
                .titre(titre)
                .message(message)
                .type(type)
                .build();
        return notificationRepository.save(notif);
    }

    @Transactional
    public Notification envoyerParRequest(NotificationRequest request, User expediteur) {
        User destinataire = userRepository.findById(request.getDestinatireId())
                .orElseThrow(() -> new ResourceNotFoundException("Destinataire non trouvé"));
        return envoyer(expediteur, destinataire, request.getTitre(), request.getMessage(), request.getType());
    }

    public Page<Notification> findForUser(Long userId, Pageable pageable) {
        return notificationRepository.findForUserWithExpediteur(userId, pageable);
    }

    public long countNonLues(Long userId) {
        return notificationRepository.countByDestinataire_IdAndLu(userId, false);
    }

    @Transactional
    public void marquerLue(Long notifId, Long userId) {
        Notification notif = notificationRepository.findById(notifId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification non trouvée"));
        if (notif.getDestinataire().getId().equals(userId)) {
            notif.marquerLu();
            notificationRepository.save(notif);
        }
    }

    @Transactional
    public void marquerToutesLues(Long userId) {
        notificationRepository.findByDestinataire_IdAndLuOrderByCreatedAtDesc(userId, false,
                Pageable.unpaged()).forEach(n -> {
            n.marquerLu();
            notificationRepository.save(n);
        });
    }
}
