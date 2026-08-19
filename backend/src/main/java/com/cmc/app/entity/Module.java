package com.cmc.app.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "modules")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Module {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String nom;

    @Column(length = 100)
    private String code;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "volume_horaire")
    private Integer volumeHoraire;

    @Column(name = "annee_formation")
    private Integer anneeFormation;

    @Column(name = "coefficient")
    @Builder.Default
    private Double coefficient = 1.0;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "filiere_id")
    private Filiere filiere;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "formateur_id")
    private User formateur;

    public Long getFormateurId()  { return formateur != null ? formateur.getId()       : null; }
    public String getFormateurNom() { return formateur != null ? formateur.getFullName() : null; }

    @JsonIgnore
    @ManyToMany(mappedBy = "modules")
    @Builder.Default
    private List<Groupe> groupes = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "module", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Cours> cours = new ArrayList<>();

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
