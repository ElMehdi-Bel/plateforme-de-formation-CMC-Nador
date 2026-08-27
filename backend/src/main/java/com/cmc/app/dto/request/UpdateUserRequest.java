package com.cmc.app.dto.request;

import com.cmc.app.enums.ModeFormation;
import com.cmc.app.enums.NiveauFormation;
import com.cmc.app.enums.TypeFormation;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateUserRequest {

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 100)
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    @Size(max = 100)
    private String prenom;

    @Pattern(regexp = "^$|^[0-9+\\s-]{10,20}$", message = "Format téléphone invalide")
    private String telephone;

    private Long groupeId;

    private LocalDate dateInscription;

    private LocalDate dateNaissance;

    @Size(max = 100)
    private String lieuNaissance;

    private NiveauFormation niveauFormation;

    private TypeFormation typeFormation;

    private ModeFormation modeFormation;
}
