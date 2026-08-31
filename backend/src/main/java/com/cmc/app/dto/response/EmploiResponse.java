package com.cmc.app.dto.response;

import com.cmc.app.entity.EmploiDuTemps;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

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
    private LocalDate dateSeance;
    private String anneeScolaire;

    // Libellés dénormalisés (toujours renseignés, y compris pour les imports Excel)
    private String formateurNom;
    private String groupeCode;
    private String moduleNom;

    // FK résolues si la séance est rattachée à des entités connues
    private Long groupeId;
    private Long moduleId;
    private Long formateurId;

    // Workflow de validation
    private String statut;
    private String valideParNom;
    private LocalDateTime dateValidation;

    /** Mappe une entité vers son DTO sans déclencher de chargement paresseux. */
    public static EmploiResponse from(EmploiDuTemps e) {
        return EmploiResponse.builder()
                .id(e.getId())
                .jourSemaine(e.getJourSemaine())
                .creneau(e.getCreneau())
                .heureDebut(e.getHeureDebut())
                .heureFin(e.getHeureFin())
                .salle(e.getSalle())
                .dateSeance(e.getDateSeance())
                .anneeScolaire(e.getAnneeScolaire())
                .formateurNom(e.getFormateurNom())
                .groupeCode(e.getGroupeCode())
                .moduleNom(e.getModuleNom())
                .groupeId(e.getGroupe() != null ? e.getGroupe().getId() : null)
                .moduleId(e.getModule() != null ? e.getModule().getId() : null)
                .formateurId(e.getFormateur() != null ? e.getFormateur().getId() : null)
                .statut(e.getStatut() != null ? e.getStatut().name() : null)
                .valideParNom(e.getValideParNom())
                .dateValidation(e.getDateValidation())
                .build();
    }

    public static List<EmploiResponse> fromList(List<EmploiDuTemps> list) {
        return list.stream().map(EmploiResponse::from).toList();
    }
}
