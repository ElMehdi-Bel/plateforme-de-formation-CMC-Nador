package com.cmc.app.controller;

import com.cmc.app.dto.response.ApiResponse;
import com.cmc.app.entity.User;
import com.cmc.app.service.ImportFormateurService;
import com.cmc.app.service.ImportService;
import com.cmc.app.service.ImportStagiaireService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/import")
@RequiredArgsConstructor
public class ImportController {

    private final ImportService          importService;
    private final ImportStagiaireService importStagiaireService;
    private final ImportFormateurService importFormateurService;

    @PostMapping("/excel")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> importExcel(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User admin) {
        try {
            Map<String, Integer> result = importService.importFromExcel(file, admin);
            return ResponseEntity.ok(ApiResponse.success("Import réussi", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Erreur lors de l'import : " + e.getMessage()));
        }
    }

    @PostMapping("/formateurs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> importFormateurs(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User admin) {
        try {
            Map<String, Object> result = importFormateurService.importFromExcel(file);
            return ResponseEntity.ok(ApiResponse.success("Import formateurs réussi", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Erreur lors de l'import : " + e.getMessage()));
        }
    }

    @PostMapping("/stagiaires")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> importStagiaires(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "envoyerEmails", defaultValue = "false") boolean envoyerEmails,
            @AuthenticationPrincipal User admin) {
        try {
            Map<String, Object> result = importStagiaireService.importFromExcel(file, envoyerEmails);
            return ResponseEntity.ok(ApiResponse.success("Import stagiaires réussi", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Erreur lors de l'import : " + e.getMessage()));
        }
    }
}
