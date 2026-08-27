package com.cmc.app.entity;

import com.cmc.app.enums.ModeFormation;
import com.cmc.app.enums.NiveauFormation;
import com.cmc.app.enums.Role;
import com.cmc.app.enums.TypeFormation;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_email", columnList = "email", unique = true),
    @Index(name = "idx_user_role", columnList = "role")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(nullable = false, length = 100)
    private String prenom;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @JsonIgnore
    @Column(nullable = false)
    private String password;

    @Column(length = 20)
    private String telephone;

    @Column(length = 50, unique = true)
    private String matricule;

    @Column(length = 20)
    private String cnie;

    @Column(length = 30, name = "code_massar")
    private String codeMassar;

    @Column(length = 150, name = "nom_arabe")
    private String nomArabe;

    @Column(length = 150, name = "prenom_arabe")
    private String prenomArabe;

    @Column(length = 150, name = "email_ofppt")
    private String emailOfppt;

    @Column(length = 50)
    private String nationalite;

    @Column(name = "date_inscription")
    private LocalDate dateInscription;

    @Column(length = 100, name = "niveau_scolaire")
    private String niveauScolaire;

    @Column(name = "annee_bac")
    private Integer anneeBac;

    @Column(name = "moyenne_bac")
    private Double moyenneBac;

    @Column(name = "date_naissance")
    private LocalDate dateNaissance;

    @Column(name = "lieu_naissance", length = 100)
    private String lieuNaissance;

    @Enumerated(EnumType.STRING)
    @Column(name = "niveau_formation", length = 30)
    private NiveauFormation niveauFormation;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_formation", length = 30)
    private TypeFormation typeFormation;

    @Enumerated(EnumType.STRING)
    @Column(name = "mode_formation", length = 30)
    private ModeFormation modeFormation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(nullable = false)
    @Builder.Default
    private boolean actif = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "groupe_id")
    private Groupe groupe;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @JsonIgnore
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @JsonIgnore
    @Override
    public String getUsername() {
        return email;
    }

    @JsonIgnore
    @Override
    public boolean isAccountNonExpired() { return true; }

    @JsonIgnore
    @Override
    public boolean isAccountNonLocked() { return actif; }

    @JsonIgnore
    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @JsonIgnore
    @Override
    public boolean isEnabled() { return actif; }

    public String getFullName() {
        return prenom + " " + nom;
    }
}
