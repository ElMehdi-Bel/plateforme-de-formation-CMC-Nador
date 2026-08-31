package com.cmc.app.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "salles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Salle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100, unique = true)
    private String nom;

    @Column(length = 50)
    private String code;

    /** Type libre : "Salle de cours", "Atelier", "Labo informatique", "Amphi"... */
    @Column(length = 100)
    private String type;

    @Column(name = "capacite")
    private Integer capacite;

    @Column(length = 100)
    private String batiment;

    @Column(nullable = false)
    @Builder.Default
    private boolean disponible = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
