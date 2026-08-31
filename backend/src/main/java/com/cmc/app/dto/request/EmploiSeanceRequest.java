package com.cmc.app.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class EmploiSeanceRequest {

    @NotNull
    private Long groupeId;

    @NotNull
    private Long moduleId;

    @NotNull
    private Long formateurId;

    @NotBlank
    private String jourSemaine;   // LUNDI | MARDI | MERCREDI | JEUDI | VENDREDI | SAMEDI

    @NotBlank
    private String creneauKey;    // 08H30 | 11H00 | 13H30 | 16H00

    private String salle;

    private String anneeScolaire; // ex: "2025-2026"
}
