package com.cmc.app.controller;

import com.cmc.app.entity.User;
import com.cmc.app.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    private static final String XLSX =
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    /** Attestation de poursuite de formation (PDF) — Gestionnaire des stagiaires. */
    @GetMapping("/attestation/{stagiaireId}")
    @PreAuthorize("hasRole('GESTIONNAIRE')")
    public ResponseEntity<byte[]> attestation(
            @PathVariable Long stagiaireId,
            @AuthenticationPrincipal User caller) {
        byte[] pdf = documentService.genererAttestation(stagiaireId, caller);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=attestation_" + stagiaireId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    /** Liste des stagiaires d'un groupe (Excel) — "Imprimer les listes". */
    @GetMapping("/liste-stagiaires/{groupeId}")
    @PreAuthorize("hasRole('GESTIONNAIRE')")
    public ResponseEntity<byte[]> listeStagiaires(
            @PathVariable Long groupeId,
            @AuthenticationPrincipal User caller) {
        byte[] xlsx = documentService.genererListeStagiaires(groupeId, caller);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=liste_stagiaires_groupe_" + groupeId + ".xlsx")
                .contentType(MediaType.parseMediaType(XLSX))
                .body(xlsx);
    }

    /** Relevé de notes + note de discipline (PDF). */
    @GetMapping("/releve-notes/{stagiaireId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE', 'FORMATEUR') or #stagiaireId == authentication.principal.id")
    public ResponseEntity<byte[]> releveNotes(
            @PathVariable Long stagiaireId,
            @AuthenticationPrincipal User caller) {
        byte[] pdf = documentService.genererReleveNotes(stagiaireId, caller);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=releve_notes_" + stagiaireId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    /** Bilan pédagogique global (PDF) — Chef de pôle. */
    @GetMapping("/bilan")
    @PreAuthorize("hasRole('CHEF_DE_POLE')")
    public ResponseEntity<byte[]> bilan(@AuthenticationPrincipal User caller) {
        byte[] pdf = documentService.genererBilan(caller);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=bilan_pedagogique.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
