package com.cmc.app.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PoleRequest {

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 200)
    private String nom;

    @Size(max = 50)
    private String code;

    private String description;

    @Size(max = 150)
    private String chefNom;
}
