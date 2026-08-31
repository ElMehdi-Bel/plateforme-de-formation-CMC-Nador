package com.cmc.app.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/** Affectation d'un formateur à plusieurs modules en une opération. */
@Data
public class AssignBatchRequest {

    @NotNull(message = "Le formateur est obligatoire")
    private Long formateurId;

    @NotEmpty(message = "Sélectionnez au moins un module")
    private List<Long> moduleIds;
}
