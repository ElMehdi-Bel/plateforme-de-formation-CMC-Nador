package com.cmc.app.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class NoteRequest {

    @NotNull
    private Long stagiaireId;

    @NotNull
    private Long moduleId;

    @NotNull
    @DecimalMin("0.0")
    @DecimalMax("20.0")
    private Double valeur;

    @NotBlank
    private String typeEvaluation;

    private String commentaire;
}
