package com.cmc.app.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class IncidentRequest {

    @NotNull(message = "Le stagiaire est obligatoire")
    private Long stagiaireId;

    @NotNull(message = "La date est obligatoire")
    private LocalDate dateIncident;

    @NotBlank(message = "Le motif est obligatoire")
    @Size(max = 200)
    private String motif;

    private String description;
}
