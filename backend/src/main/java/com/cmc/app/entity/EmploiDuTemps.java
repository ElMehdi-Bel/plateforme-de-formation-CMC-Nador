package com.cmc.app.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "emploi_du_temps", indexes = {
    @Index(name = "idx_emploi_groupe", columnList = "groupe_id"),
    @Index(name = "idx_emploi_jour", columnList = "jour_semaine"),
    @Index(name = "idx_emploi_date", columnList = "date_seance")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EmploiDuTemps {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ─── FK optionnelles (présentes si entités connues en base) ───────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "groupe_id")
    @JsonIgnoreProperties({"stagiaires", "modules", "filiere", "hibernateLazyInitializer"})
    private Groupe groupe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer"})
    private Module module;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "formateur_id")
    @JsonIgnoreProperties({"password", "authorities", "groupe", "hibernateLazyInitializer"})
    private User formateur;

    // ─── Champs textuels directs depuis l'Excel (toujours renseignés) ─────────
    @Column(name = "formateur_nom", length = 150)
    private String formateurNom;

    @Column(name = "groupe_code", length = 100)
    private String groupeCode;

    @Column(name = "module_nom", length = 200)
    private String moduleNom;

    // ─── Planification ────────────────────────────────────────────────────────
    @Column(name = "jour_semaine", length = 20, nullable = false)
    private String jourSemaine;   // LUNDI, MARDI, MERCREDI, JEUDI, VENDREDI, SAMEDI

    @Column(name = "heure_debut", nullable = false)
    private LocalTime heureDebut;

    @Column(name = "heure_fin", nullable = false)
    private LocalTime heureFin;

    @Column(name = "creneau", length = 30)
    private String creneau;       // ex: "08H30 --> 11H00"

    @Column(length = 100)
    private String salle;

    @Column(name = "date_seance")
    private LocalDate dateSeance; // optionnel (peut être null si planning hebdo générique)

    @Column(name = "annee_scolaire", length = 20)
    private String anneeScolaire; // ex: "2025-2026"

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
