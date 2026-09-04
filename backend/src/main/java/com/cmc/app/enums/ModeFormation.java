package com.cmc.app.enums;

public enum ModeFormation {
    DIPLOMANTE("Diplômante"),
    QUALIFIANTE("Qualifiante");

    private final String label;

    ModeFormation(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
