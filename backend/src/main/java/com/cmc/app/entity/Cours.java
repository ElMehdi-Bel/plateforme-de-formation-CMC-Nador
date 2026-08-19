package com.cmc.app.entity;

import com.cmc.app.enums.TypeCours;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "cours", indexes = {
    @Index(name = "idx_cours_module", columnList = "module_id"),
    @Index(name = "idx_cours_formateur", columnList = "formateur_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Cours {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_cours", nullable = false, length = 20)
    private TypeCours typeCours;

    @Column(name = "fichier_url", length = 500)
    private String fichierUrl;

    @Column(name = "fichier_nom", length = 255)
    private String fichierNom;

    @Column(name = "fichier_taille")
    private Long fichierTaille;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    private Module module;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "formateur_id", nullable = false)
    private User formateur;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
