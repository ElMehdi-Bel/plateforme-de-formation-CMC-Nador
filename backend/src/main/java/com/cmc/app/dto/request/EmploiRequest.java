package com.cmc.app.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class EmploiRequest {

    @NotNull
    private Long groupeId;

    @NotNull
    private Long moduleId;

    @NotNull
    private Long formateurId;

    @NotNull
    private LocalDate dateSeance;

    @NotNull
    private LocalTime heureDebut;

    @NotNull
    private LocalTime heureFin;

    private String salle;
}
