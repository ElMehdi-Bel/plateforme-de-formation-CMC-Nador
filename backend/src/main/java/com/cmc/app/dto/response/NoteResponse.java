package com.cmc.app.dto.response;

import com.cmc.app.entity.Note;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NoteResponse {

    private Long id;
    private Double valeur;
    private String typeEvaluation;
    private String commentaire;
    private Long stagiaireId;
    private Long moduleId;
    private String moduleNom;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static NoteResponse from(Note n) {
        return NoteResponse.builder()
                .id(n.getId())
                .valeur(n.getValeur())
                .typeEvaluation(n.getTypeEvaluation())
                .commentaire(n.getCommentaire())
                .stagiaireId(n.getStagiaire() != null ? n.getStagiaire().getId() : null)
                .moduleId(n.getModule() != null ? n.getModule().getId() : null)
                .moduleNom(n.getModule() != null ? n.getModule().getNom() : null)
                .createdAt(n.getCreatedAt())
                .updatedAt(n.getUpdatedAt())
                .build();
    }

    public static List<NoteResponse> fromList(List<Note> list) {
        return list.stream().map(NoteResponse::from).toList();
    }
}
