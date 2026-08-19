package com.cmc.app.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ModuleRequest {

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 500)
    private String nom;

    @Size(max = 100)
    private String code;

    private String description;

    @Min(1)
    private Integer volumeHoraire;

    @Min(1) @Max(2)
    private Integer anneeFormation;

    @DecimalMin("0.5") @DecimalMax("5.0")
    private Double coefficient;

    @NotNull(message = "La filière est obligatoire")
    private Long filiereId;
}
