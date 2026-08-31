package com.cmc.app.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * Affectation « groupe d'abord » : on choisit un groupe, puis les modules de ce
 * groupe que le formateur doit enseigner. Les modules cochés sont affectés au
 * formateur ET rattachés au groupe ; ceux décochés qui étaient à ce formateur
 * pour ce groupe lui sont retirés. Une liste vide = retirer le formateur de tous
 * les modules de ce groupe.
 */
@Data
public class AffecterGroupeRequest {

    @NotNull(message = "Le formateur est obligatoire")
    private Long formateurId;

    @NotNull(message = "Le groupe est obligatoire")
    private Long groupeId;

    @NotNull(message = "La liste des modules est obligatoire (peut être vide)")
    private List<Long> moduleIds = new ArrayList<>();
}
