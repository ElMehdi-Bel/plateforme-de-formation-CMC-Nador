package com.cmc.app.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.LocalTime;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EmploiResponse {
    private Long id;
    private String jourSemaine;
    private String creneau;
    private LocalTime heureDebut;
    private LocalTime heureFin;
    private String salle;
    private String formateurNom;
    private String groupeCode;
    private String moduleNom;
    private String anneeScolaire;
    // FKs résolus si présents
    private Long groupeId;
    private Long formateurId;
    private Long moduleId;
}
