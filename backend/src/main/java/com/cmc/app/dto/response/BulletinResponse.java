package com.cmc.app.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Relevé de notes d'un stagiaire : ligne par module + moyenne générale pondérée
 * par les coefficients de module.
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BulletinResponse {

    private Long stagiaireId;
    private String stagiaireNom;
    private String groupeNom;
    private String filiereNom;

    private List<LigneModule> modules;
    private Double moyenneGenerale;   // pondérée par coefficient, sur 20

    @Data
    @Builder
    public static class LigneModule {
        private Long moduleId;
        private String moduleNom;
        private Double coefficient;
        private Double cc;        // /20
        private Double efm;       // /40
        private Double moyenne;   // /20
    }
}
