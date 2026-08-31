package com.cmc.app.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "poles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Pole {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200, unique = true)
    private String nom;

    @Column(length = 50)
    private String code;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 150, name = "chef_nom")
    private String chefNom;

    @Column(nullable = false)
    @Builder.Default
    private boolean actif = true;

    @JsonIgnore
    @OneToMany(mappedBy = "pole", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Filiere> filieres = new ArrayList<>();

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
