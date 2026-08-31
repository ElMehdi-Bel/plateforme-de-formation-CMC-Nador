package com.cmc.app.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SalleRequest {

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 100)
    private String nom;

    @Size(max = 50)
    private String code;

    @Size(max = 100)
    private String type;

    @Min(0)
    private Integer capacite;

    @Size(max = 100)
    private String batiment;

    private Boolean disponible;
}
