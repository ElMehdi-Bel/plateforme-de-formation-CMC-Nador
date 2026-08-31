package com.cmc.app.dto.response;

import com.cmc.app.enums.Role;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserResponse {
    private Long id;
    private String nom;
    private String prenom;
    private String fullName;
    private String email;
    private String telephone;
    private Role role;
    private boolean actif;
    private Long groupeId;
    private String groupeNom;
    private String groupeCode;
    private String filiereNom;
    private Long poleId;
    private String poleNom;
    private LocalDateTime createdAt;
}
