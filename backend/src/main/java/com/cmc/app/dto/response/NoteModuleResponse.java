package com.cmc.app.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NoteModuleResponse {

    private Long stagiaireId;
    private String stagiaireNom;
    private String stagiairePrenom;
    private Long moduleId;
    private String moduleNom;
    private Double cc;
    private Long ccNoteId;
    private Double efm;
    private Long efmNoteId;
    private Double moyenne;
}
