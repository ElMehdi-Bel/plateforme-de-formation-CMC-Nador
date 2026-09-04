package com.cmc.app.enums;

public enum TypeFormation {
    RESIDENTIELLE("Résidentielle"),
    ALTERNEE("Alternée");

    private final String label;

    TypeFormation(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
