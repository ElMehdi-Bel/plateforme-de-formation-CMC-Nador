package com.cmc.app.dto.request;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class AppelRequest {

    private String groupeCode;
    private LocalDate date;
    private String jourSemaine;
    private String heureCreneau;
    private List<AbsenceItem> absences;

    @Data
    public static class AbsenceItem {
        private Long stagiaireId;
        private boolean absent;
        private String motif;
    }
}
