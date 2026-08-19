package com.cmc.app.dto.request;

import com.cmc.app.enums.Role;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateUserRequest {

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 100)
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    @Size(max = 100)
    private String prenom;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format email invalide")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    private String password;

    @Pattern(regexp = "^[0-9+\\s-]{10,20}$", message = "Format téléphone invalide")
    private String telephone;

    @NotNull(message = "Le rôle est obligatoire")
    private Role role;

    private Long groupeId;
}
