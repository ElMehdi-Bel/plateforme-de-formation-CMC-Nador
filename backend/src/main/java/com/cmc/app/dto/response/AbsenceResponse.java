package com.cmc.app.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class AbsenceResponse {

    private Long id;
    private Long stagiaireId;
    private String stagiaireNom;
    private String stagiairePrenom;
    private String groupeCode;
    private String jourSemaine;
    private String heureCreneau;
    private LocalDate dateAbsence;
    private boolean justifiee;
    private String type;          // ABSENCE | RETARD
    private String motif;
    private String formateurNom;
    private LocalDateTime createdAt;
}
