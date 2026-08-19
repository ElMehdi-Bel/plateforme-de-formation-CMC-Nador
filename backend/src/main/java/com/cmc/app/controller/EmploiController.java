package com.cmc.app.controller;

import com.cmc.app.dto.request.EmploiRequest;
import com.cmc.app.dto.response.ApiResponse;
import com.cmc.app.entity.EmploiDuTemps;
import com.cmc.app.entity.User;
import com.cmc.app.exception.ResourceNotFoundException;
import com.cmc.app.repository.UserRepository;
import com.cmc.app.service.EmploiImportService;
import com.cmc.app.service.EmploiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/emplois")
@RequiredArgsConstructor
public class EmploiController {

    private final EmploiService emploiService;
    private final EmploiImportService emploiImportService;
    private final UserRepository userRepository;

    // ─── Import Excel ─────────────────────────────────────────────────────────

    /**
     * Import de l'emploi du temps depuis un fichier Excel.
     * Exemple : POST /api/v1/emplois/import?anneeScolaire=2025-2026&replace=true
     */
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<EmploiImportService.ImportResult>> importExcel(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "2025-2026") String anneeScolaire,
            @RequestParam(defaultValue = "true") boolean replace,
            @AuthenticationPrincipal User admin) throws IOException {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Le fichier Excel est vide ou manquant"));
        }
        String filename = file.getOriginalFilename();
        if (filename == null || (!filename.endsWith(".xlsx") && !filename.endsWith(".xls"))) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Format invalide — seuls les fichiers .xlsx et .xls sont acceptés"));
        }

        EmploiImportService.ImportResult result = emploiImportService.importFromExcel(file, anneeScolaire, replace);
        String msg = String.format("%d séances importées avec succès", result.getImported());
        return ResponseEntity.ok(ApiResponse.success(msg, result));
    }

    // ─── Lecture en grille ────────────────────────────────────────────────────

    /**
     * Retourne l'emploi du temps complet sous forme de grille par jour.
     * Structure : { "LUNDI": [...séances...], "MARDI": [...], ... }
     */
    @GetMapping("/grille")
    public ResponseEntity<ApiResponse<Map<String, List<EmploiDuTemps>>>> getGrille(
            @RequestParam(defaultValue = "2025-2026") String anneeScolaire) {
        return ResponseEntity.ok(ApiResponse.success(emploiImportService.getGrille(anneeScolaire)));
    }

    /**
     * Retourne les séances d'un groupe spécifique (par code, ex: "GE101")
     */
    @GetMapping("/groupe/code/{groupeCode}")
    public ResponseEntity<ApiResponse<List<EmploiDuTemps>>> findByGroupeCode(
            @PathVariable String groupeCode) {
        return ResponseEntity.ok(ApiResponse.success(
                emploiImportService.getGrille("2025-2026")
                        .values().stream()
                        .flatMap(List::stream)
                        .filter(e -> groupeCode.equalsIgnoreCase(e.getGroupeCode()))
                        .toList()));
    }

    /**
     * Retourne les séances d'un formateur (par nom partiel)
     */
    @GetMapping("/formateur/nom/{nom}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FORMATEUR')")
    public ResponseEntity<ApiResponse<List<EmploiDuTemps>>> findByFormateurNom(
            @PathVariable String nom,
            @RequestParam(defaultValue = "2025-2026") String anneeScolaire) {
        return ResponseEntity.ok(ApiResponse.success(
                emploiImportService.getGrille(anneeScolaire)
                        .values().stream()
                        .flatMap(List::stream)
                        .filter(e -> e.getFormateurNom() != null &&
                                e.getFormateurNom().toUpperCase().contains(nom.toUpperCase()))
                        .toList()));
    }

    /**
     * Emploi du temps personnel du stagiaire connecté.
     * Résout automatiquement le groupeCode à partir du compte connecté.
     */
    @GetMapping("/mon-emploi")
    @PreAuthorize("hasAnyRole('STAGIAIRE', 'ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, List<EmploiDuTemps>>>> getMonEmploi(
            @RequestParam(defaultValue = "2025-2026") String anneeScolaire,
            @AuthenticationPrincipal User principal) {

        // Recharger l'utilisateur avec son groupe (lazy → JOIN FETCH)
        User stagiaire = userRepository.findByIdWithGroupe(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        if (stagiaire.getGroupe() == null || stagiaire.getGroupe().getCode() == null) {
            return ResponseEntity.ok(ApiResponse.success(
                    "Aucun groupe assigné à ce compte", Map.of()));
        }

        String groupeCode = stagiaire.getGroupe().getCode();

        // Filtrer la grille par groupeCode
        Map<String, List<EmploiDuTemps>> grilleComplete = emploiImportService.getGrille(anneeScolaire);
        Map<String, List<EmploiDuTemps>> grilleFiltered = new java.util.LinkedHashMap<>();
        for (Map.Entry<String, List<EmploiDuTemps>> entry : grilleComplete.entrySet()) {
            List<EmploiDuTemps> seances = entry.getValue().stream()
                    .filter(e -> groupeCode.equalsIgnoreCase(e.getGroupeCode()))
                    .toList();
            grilleFiltered.put(entry.getKey(), seances);
        }

        return ResponseEntity.ok(ApiResponse.success(grilleFiltered));
    }

    // ─── CRUD standard ────────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<EmploiDuTemps>> create(
            @Valid @RequestBody EmploiRequest request,
            @AuthenticationPrincipal User admin) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(emploiService.create(request, admin)));
    }

    @GetMapping("/groupe/{groupeId}")
    public ResponseEntity<ApiResponse<List<EmploiDuTemps>>> findByGroupe(
            @PathVariable Long groupeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        List<EmploiDuTemps> emplois = (debut != null && fin != null)
                ? emploiService.findByGroupeAndPeriode(groupeId, debut, fin)
                : emploiService.findByGroupe(groupeId);
        return ResponseEntity.ok(ApiResponse.success(emplois));
    }

    @GetMapping("/formateur/{formateurId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FORMATEUR')")
    public ResponseEntity<ApiResponse<List<EmploiDuTemps>>> findByFormateur(
            @PathVariable Long formateurId) {
        return ResponseEntity.ok(ApiResponse.success(emploiService.findByFormateur(formateurId)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User admin) {
        emploiService.delete(id, admin);
        return ResponseEntity.ok(ApiResponse.success("Séance supprimée", null));
    }
}
