package com.cmc.app.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class AbsenceRequest {

    @NotNull
    private Long stagiaireId;

    private Long moduleId;

    @NotNull
    private LocalDate dateAbsence;

    private boolean justifiee;

    private String motif;

    private String seance;
}
