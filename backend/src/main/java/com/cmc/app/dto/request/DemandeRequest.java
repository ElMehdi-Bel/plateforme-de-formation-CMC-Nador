package com.cmc.app.dto.request;

import com.cmc.app.enums.TypeDemande;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DemandeRequest {

    @NotNull
    private TypeDemande typeDemande;

    private String motif;
}
