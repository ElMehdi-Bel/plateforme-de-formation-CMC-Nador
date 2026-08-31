package com.cmc.app.controller;

import com.cmc.app.dto.request.EmploiRequest;
import com.cmc.app.dto.request.EmploiSeanceRequest;
import com.cmc.app.dto.response.ApiResponse;
import com.cmc.app.dto.response.EmploiResponse;
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
import java.util.LinkedHashMap;
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

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('CHEF_DE_POLE')")
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

    /** Grille complète par jour : { "LUNDI": [...], "MARDI": [...], ... } */
    @GetMapping("/grille")
    public ResponseEntity<ApiResponse<Map<String, List<EmploiResponse>>>> getGrille(
            @RequestParam(defaultValue = "2025-2026") String anneeScolaire) {
        return ResponseEntity.ok(ApiResponse.success(toGrilleDto(emploiImportService.getGrille(anneeScolaire))));
    }

    /** Séances d'un groupe (par code) — requête ciblée. */
    @GetMapping("/groupe/code/{groupeCode}")
    public ResponseEntity<ApiResponse<List<EmploiResponse>>> findByGroupeCode(
            @PathVariable String groupeCode,
            @RequestParam(defaultValue = "2025-2026") String anneeScolaire) {
        return ResponseEntity.ok(ApiResponse.success(EmploiResponse.fromList(
                emploiImportService.getGrilleByGroupeCode(anneeScolaire, groupeCode)
                        .values().stream().flatMap(List::stream).toList())));
    }

    /** Séances d'un formateur (par nom partiel) — requête ciblée, scopée par année. */
    @GetMapping("/formateur/nom/{nom}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CHEF_DE_POLE', 'GESTIONNAIRE', 'FORMATEUR')")
    public ResponseEntity<ApiResponse<List<EmploiResponse>>> findByFormateurNom(
            @PathVariable String nom,
            @RequestParam(defaultValue = "2025-2026") String anneeScolaire) {
        return ResponseEntity.ok(ApiResponse.success(EmploiResponse.fromList(
                emploiService.findByAnneeAndFormateurNom(anneeScolaire, nom))));
    }

    /**
     * Emploi du temps personnel du stagiaire connecté (résolu via son groupe).
     */
    @GetMapping("/mon-emploi")
    @PreAuthorize("hasAnyRole('STAGIAIRE', 'ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, List<EmploiResponse>>>> getMonEmploi(
            @RequestParam(defaultValue = "2025-2026") String anneeScolaire,
            @AuthenticationPrincipal User principal) {

        User stagiaire = userRepository.findByIdWithGroupe(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        if (stagiaire.getGroupe() == null || stagiaire.getGroupe().getCode() == null) {
            return ResponseEntity.ok(ApiResponse.success("Aucun groupe assigné à ce compte", Map.of()));
        }

        Map<String, List<EmploiResponse>> grille = toGrilleDto(
                emploiImportService.getGrilleByGroupeCode(anneeScolaire, stagiaire.getGroupe().getCode()));
        return ResponseEntity.ok(ApiResponse.success(grille));
    }

    // ─── CRUD standard ────────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('CHEF_DE_POLE')")
    public ResponseEntity<ApiResponse<EmploiResponse>> create(
            @Valid @RequestBody EmploiRequest request,
            @AuthenticationPrincipal User admin) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(EmploiResponse.from(emploiService.create(request, admin))));
    }

    @PostMapping("/seance")
    @PreAuthorize("hasRole('CHEF_DE_POLE')")
    public ResponseEntity<ApiResponse<EmploiResponse>> createSeance(
            @Valid @RequestBody EmploiSeanceRequest request,
            @AuthenticationPrincipal User admin) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(EmploiResponse.from(emploiService.createSeance(request, admin))));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CHEF_DE_POLE')")
    public ResponseEntity<ApiResponse<EmploiResponse>> updateSeance(
            @PathVariable Long id,
            @Valid @RequestBody EmploiSeanceRequest request,
            @AuthenticationPrincipal User admin) {
        return ResponseEntity.ok(ApiResponse.success(
                EmploiResponse.from(emploiService.updateSeance(id, request, admin))));
    }

    /** Validation d'une séance par le Chef de pôle (BROUILLON → VALIDE). */
    @PatchMapping("/{id}/valider")
    @PreAuthorize("hasRole('CHEF_DE_POLE')")
    public ResponseEntity<ApiResponse<EmploiResponse>> valider(
            @PathVariable Long id,
            @AuthenticationPrincipal User chef) {
        return ResponseEntity.ok(ApiResponse.success("Séance validée",
                EmploiResponse.from(emploiService.valider(id, chef))));
    }

    /** Validation en lot : toute la grille d'une année, ou d'un seul groupe. */
    @PatchMapping("/valider-lot")
    @PreAuthorize("hasRole('CHEF_DE_POLE')")
    public ResponseEntity<ApiResponse<Integer>> validerLot(
            @RequestParam(defaultValue = "2025-2026") String anneeScolaire,
            @RequestParam(required = false) String groupeCode,
            @AuthenticationPrincipal User chef) {
        int n = emploiService.validerLot(anneeScolaire, groupeCode, chef);
        return ResponseEntity.ok(ApiResponse.success(n + " séance(s) validée(s)", n));
    }

    /** Liste des conflits de la grille (salle / groupe / formateur sur le même créneau). */
    @GetMapping("/conflits")
    @PreAuthorize("hasAnyRole('ADMIN', 'CHEF_DE_POLE')")
    public ResponseEntity<ApiResponse<List<EmploiService.Conflit>>> conflits(
            @RequestParam(defaultValue = "2025-2026") String anneeScolaire) {
        return ResponseEntity.ok(ApiResponse.success(emploiService.listConflits(anneeScolaire)));
    }

    @GetMapping("/groupe/{groupeId}")
    public ResponseEntity<ApiResponse<List<EmploiResponse>>> findByGroupe(
            @PathVariable Long groupeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        List<EmploiDuTemps> emplois = (debut != null && fin != null)
                ? emploiService.findByGroupeAndPeriode(groupeId, debut, fin)
                : emploiService.findByGroupe(groupeId);
        return ResponseEntity.ok(ApiResponse.success(EmploiResponse.fromList(emplois)));
    }

    @GetMapping("/formateur/{formateurId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CHEF_DE_POLE', 'GESTIONNAIRE', 'FORMATEUR')")
    public ResponseEntity<ApiResponse<List<EmploiResponse>>> findByFormateur(
            @PathVariable Long formateurId) {
        return ResponseEntity.ok(ApiResponse.success(
                EmploiResponse.fromList(emploiService.findByFormateur(formateurId))));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CHEF_DE_POLE')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User admin) {
        emploiService.delete(id, admin);
        return ResponseEntity.ok(ApiResponse.success("Séance supprimée", null));
    }

    private static Map<String, List<EmploiResponse>> toGrilleDto(Map<String, List<EmploiDuTemps>> grille) {
        Map<String, List<EmploiResponse>> out = new LinkedHashMap<>();
        grille.forEach((jour, seances) -> out.put(jour, EmploiResponse.fromList(seances)));
        return out;
    }
}
