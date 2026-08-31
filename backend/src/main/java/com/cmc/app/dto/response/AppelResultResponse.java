package com.cmc.app.dto.response;

import com.cmc.app.entity.SanctionDiscipline;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/** Résultat de l'enregistrement d'un appel : absences/retards + sanctions déclenchées. */
@Data
@Builder
public class AppelResultResponse {

    private int nbAbsents;
    private int nbRetards;
    private List<AbsenceResponse> enregistrees;
    private List<SanctionDiscipline> sanctions;
    private String message;
}
