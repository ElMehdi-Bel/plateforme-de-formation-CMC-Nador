package com.cmc.app.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "sanctions_discipline", indexes = {
    @Index(name = "idx_sanction_stagiaire", columnList = "stagiaire_id"),
    @Index(name = "idx_sanction_type", columnList = "type")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SanctionDiscipline {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stagiaire_id", nullable = false)
    private User stagiaire;

    /** ASSIDUITE | COMPORTEMENT */
    @Column(nullable = false, length = 20)
    private String type;

    @Column(nullable = false)
    private int palier;

    @Column(nullable = false, length = 255)
    private String sanction;

    /** SG | D | CD */
    @Column(nullable = false, length = 10)
    private String autorite;

    @Column(name = "note_assiduite")
    private Double noteAssiduite;

    @Column(name = "note_discipline")
    private Double noteDiscipline;

    @Column(name = "exclusion_definitive", nullable = false)
    @Builder.Default
    private boolean exclusionDefinitive = false;

    @Column(name = "conseil_alerte", nullable = false)
    @Builder.Default
    private boolean conseilAlerte = false;

    @Column(length = 255)
    private String motif;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "declenche_par_id")
    private User declenchePar;

    @Column(name = "declenche_par_nom", length = 150)
    private String declencheParNom;

    public Long getStagiaireId() { return stagiaire != null ? stagiaire.getId() : null; }
    public String getStagiaireNom() { return stagiaire != null ? stagiaire.getFullName() : null; }

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
