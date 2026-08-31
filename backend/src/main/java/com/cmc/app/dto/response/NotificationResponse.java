package com.cmc.app.dto.response;

import com.cmc.app.entity.Notification;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NotificationResponse {

    private Long id;
    private String titre;
    private String message;
    private boolean lu;
    private String type;
    private String expediteurNom;
    private LocalDateTime createdAt;
    private LocalDateTime luAt;

    public static NotificationResponse from(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .titre(n.getTitre())
                .message(n.getMessage())
                .lu(n.isLu())
                .type(n.getType())
                .expediteurNom(n.getExpediteur() != null ? n.getExpediteur().getFullName() : null)
                .createdAt(n.getCreatedAt())
                .luAt(n.getLuAt())
                .build();
    }

    public static List<NotificationResponse> fromList(List<Notification> list) {
        return list.stream().map(NotificationResponse::from).toList();
    }
}
