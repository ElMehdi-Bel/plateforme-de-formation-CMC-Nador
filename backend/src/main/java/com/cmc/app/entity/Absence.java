package com.cmc.app.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "absences", indexes = {
    @Index(name = "idx_absence_stagiaire", columnList = "stagiaire_id"),
    @Index(name = "idx_absence_date", columnList = "date_absence")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Absence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stagiaire_id", nullable = false)
    private User stagiaire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id")
    private Module module;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "formateur_id")
    private User formateur;

    @Column(name = "date_absence", nullable = false)
    private LocalDate dateAbsence;

    @Column(nullable = false)
    @Builder.Default
    private boolean justifiee = false;

    @Column(columnDefinition = "TEXT")
    private String motif;

    @Column(name = "seance", length = 20)
    @Builder.Default
    private String seance = "MATIN";

    @Column(name = "groupe_code", length = 100)
    private String groupeCode;

    @Column(name = "jour_semaine", length = 20)
    private String jourSemaine;

    @Column(name = "heure_creneau", length = 50)
    private String heureCreneau;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
