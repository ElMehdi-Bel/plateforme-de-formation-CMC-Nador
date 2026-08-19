package com.cmc.app.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class NotificationRequest {

    @NotNull
    private Long destinataireId;

    public Long getDestinatireId() { return destinataireId; }

    @NotBlank
    private String titre;

    @NotBlank
    private String message;

    private String type;
}
