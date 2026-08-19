package com.cmc.app.dto.response;

import com.cmc.app.entity.Demande;
import com.cmc.app.enums.StatutDemande;
import com.cmc.app.enums.TypeDemande;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DemandeResponse {

    private Long id;
    private TypeDemande typeDemande;
    private StatutDemande statut;
    private String motif;
    private String commentaireAdmin;
    private String documentNom;
    private boolean documentDisponible;
    private LocalDateTime createdAt;
    private LocalDateTime dateTraitement;

    private StagiaireInfo stagiaire;

    @Data
    @Builder
    public static class StagiaireInfo {
        private Long id;
        private String nom;
        private String prenom;
        private String email;
    }

    public static DemandeResponse from(Demande demande) {
        return DemandeResponse.builder()
                .id(demande.getId())
                .typeDemande(demande.getTypeDemande())
                .statut(demande.getStatut())
                .motif(demande.getMotif())
                .commentaireAdmin(demande.getCommentaireAdmin())
                .documentNom(demande.getDocumentNom())
                .documentDisponible(demande.getDocumentUrl() != null)
                .createdAt(demande.getCreatedAt())
                .dateTraitement(demande.getDateTraitement())
                .stagiaire(StagiaireInfo.builder()
                        .id(demande.getStagiaire().getId())
                        .nom(demande.getStagiaire().getNom())
                        .prenom(demande.getStagiaire().getPrenom())
                        .email(demande.getStagiaire().getEmail())
                        .build())
                .build();
    }
}
