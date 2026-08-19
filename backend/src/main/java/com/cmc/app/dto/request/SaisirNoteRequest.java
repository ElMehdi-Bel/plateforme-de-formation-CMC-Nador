package com.cmc.app.dto.request;

import lombok.Data;

@Data
public class SaisirNoteRequest {

    private Long stagiaireId;
    private Long moduleId;
    private String typeEvaluation; // "CC" ou "EFM"
    private Double valeur;
    private String commentaire;
}
