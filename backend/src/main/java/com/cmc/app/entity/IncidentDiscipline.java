package com.cmc.app.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "incidents_discipline", indexes = {
    @Index(name = "idx_incident_stagiaire", columnList = "stagiaire_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class IncidentDiscipline {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stagiaire_id", nullable = false)
    private User stagiaire;

    @Column(name = "date_incident", nullable = false)
    private LocalDate dateIncident;

    @Column(nullable = false, length = 200)
    private String motif;

    @Column(columnDefinition = "TEXT")
    private String description;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cree_par_id")
    private User creePar;

    @Column(name = "cree_par_nom", length = 150)
    private String creeParNom;

    public Long getStagiaireId() { return stagiaire != null ? stagiaire.getId() : null; }

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
