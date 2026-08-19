package com.cmc.app.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class FiliereRequest {

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 150)
    private String nom;

    private String description;

    @Size(max = 10)
    private String code;

    @Min(1) @Max(36)
    private Integer dureeMois;
}
