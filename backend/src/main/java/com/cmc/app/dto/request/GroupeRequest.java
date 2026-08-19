package com.cmc.app.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class GroupeRequest {

    @NotBlank
    private String nom;

    private String code;

    private String anneeFormation;

    private LocalDate dateDebut;

    private LocalDate dateFin;

    @NotNull
    private Long filiereId;
}
