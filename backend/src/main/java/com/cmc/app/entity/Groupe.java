package com.cmc.app.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "groupes", indexes = {
    @Index(name = "idx_groupe_filiere", columnList = "filiere_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Groupe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(length = 50, unique = true)
    private String code;

    @Column(name = "annee_formation")
    private String anneeFormation;

    @Column(name = "date_debut")
    private LocalDate dateDebut;

    @Column(name = "date_fin")
    private LocalDate dateFin;

    @Column(name = "capacite_max")
    @Builder.Default
    private Integer capaciteMax = 20;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "filiere_id", nullable = false)
    private Filiere filiere;

    @JsonIgnore
    @OneToMany(mappedBy = "groupe", fetch = FetchType.LAZY)
    @Builder.Default
    private List<User> stagiaires = new ArrayList<>();

    @JsonIgnore
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "groupe_modules",
        joinColumns = @JoinColumn(name = "groupe_id"),
        inverseJoinColumns = @JoinColumn(name = "module_id")
    )
    @Builder.Default
    private List<Module> modules = new ArrayList<>();

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
