package com.cmc.app.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notes", indexes = {
    @Index(name = "idx_note_stagiaire", columnList = "stagiaire_id"),
    @Index(name = "idx_note_module", columnList = "module_id")
},
uniqueConstraints = {
    @UniqueConstraint(name = "uk_note_stagiaire_module_type",
        columnNames = {"stagiaire_id", "module_id", "type_evaluation"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stagiaire_id", nullable = false)
    private User stagiaire;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    private Module module;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "formateur_id", nullable = false)
    private User formateur;

    @Column(nullable = false)
    private Double valeur;

    @Column(name = "type_evaluation", length = 50)
    @Builder.Default
    private String typeEvaluation = "CC";

    @Column(columnDefinition = "TEXT")
    private String commentaire;

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
