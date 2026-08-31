package com.cmc.app.dto.request;

import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @Pattern(regexp = "^$|^[0-9+\\s-]{6,20}$", message = "Format téléphone invalide")
    private String telephone;
}
