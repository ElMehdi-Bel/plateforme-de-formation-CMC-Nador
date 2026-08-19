package com.cmc.app.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "filieres")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Filiere {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 300, unique = true)
    private String nom;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 50)
    private String code;

    @Column(name = "duree_mois")
    private Integer dureeMois;

    @Column(nullable = false)
    @Builder.Default
    private boolean actif = true;

    @JsonIgnore
    @OneToMany(mappedBy = "filiere", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Groupe> groupes = new ArrayList<>();

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
