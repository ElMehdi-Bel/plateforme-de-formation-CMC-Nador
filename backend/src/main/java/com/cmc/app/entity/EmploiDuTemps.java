package com.cmc.app.entity;

import com.cmc.app.enums.StatutEmploi;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

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
    // Non sérialisées : l'API expose EmploiResponse (DTO), pas l'entité.
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "groupe_id")
    private Groupe groupe;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id")
    private Module module;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "formateur_id")
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

    // ─── Workflow de validation (Chef de pôle) ───────────────────────────────
    // Colonne nullable : ddl-auto=update ne rétro-remplit pas les lignes existantes.
    // Une séance sans statut (null) est traitée comme BROUILLON côté lecture.
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "statut", length = 20)
    @Builder.Default
    private StatutEmploi statut = StatutEmploi.BROUILLON;

    @PostLoad
    private void normaliserStatut() {
        if (statut == null) statut = StatutEmploi.BROUILLON;
    }

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "valide_par_id")
    private User validePar;

    /** Nom du validateur, dénormalisé (évite un chargement paresseux). */
    @Column(name = "valide_par_nom", length = 150)
    private String valideParNom;

    @Column(name = "date_validation")
    private LocalDateTime dateValidation;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
