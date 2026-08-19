package com.cmc.app.entity;

import com.cmc.app.enums.StatutDemande;
import com.cmc.app.enums.TypeDemande;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "demandes", indexes = {
    @Index(name = "idx_demande_stagiaire", columnList = "stagiaire_id"),
    @Index(name = "idx_demande_statut", columnList = "statut")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Demande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stagiaire_id", nullable = false)
    private User stagiaire;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_demande", nullable = false, length = 50)
    private TypeDemande typeDemande;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private StatutDemande statut = StatutDemande.EN_ATTENTE;

    @Column(columnDefinition = "TEXT")
    private String motif;

    @Column(name = "commentaire_admin", columnDefinition = "TEXT")
    private String commentaireAdmin;

    @Column(name = "document_url")
    private String documentUrl;

    @Column(name = "document_nom")
    private String documentNom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "traite_par")
    private User traitePar;

    @Column(name = "date_traitement")
    private LocalDateTime dateTraitement;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
