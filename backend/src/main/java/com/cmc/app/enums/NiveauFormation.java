package com.cmc.app.enums;

public enum NiveauFormation {
    SPECIALISATION("Spécialisation"),
    QUALIFICATION("Qualification"),
    TECHNICIEN("Technicien"),
    TECHNICIEN_SPECIALISE("Technicien Spécialisé");

    private final String label;

    NiveauFormation(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
