package com.cmc.app.controller;

import com.cmc.app.dto.request.AbsenceRequest;
import com.cmc.app.dto.request.AppelRequest;
import com.cmc.app.dto.response.AbsenceResponse;
import com.cmc.app.dto.response.ApiResponse;
import com.cmc.app.dto.response.PageResponse;
import com.cmc.app.entity.Absence;
import com.cmc.app.entity.User;
import com.cmc.app.service.AbsenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/absences")
@RequiredArgsConstructor
public class AbsenceController {

    private final AbsenceService absenceService;

    @PostMapping
    @PreAuthorize("hasAnyRole('FORMATEUR', 'ADMIN')")
    public ResponseEntity<ApiResponse<Absence>> create(
            @Valid @RequestBody AbsenceRequest request,
            @AuthenticationPrincipal User formateur) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(absenceService.create(request, formateur)));
    }

    @PostMapping("/appel")
    @PreAuthorize("hasAnyRole('FORMATEUR', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AbsenceResponse>>> faireAppel(
            @RequestBody AppelRequest request,
            @AuthenticationPrincipal User formateur) {
        return ResponseEntity.ok(ApiResponse.success(absenceService.faireAppel(request, formateur)));
    }

    @GetMapping("/seance")
    @PreAuthorize("hasAnyRole('ADMIN', 'FORMATEUR')")
    public ResponseEntity<ApiResponse<List<AbsenceResponse>>> getSeance(
            @RequestParam String groupeCode,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam String creneau) {
        return ResponseEntity.ok(ApiResponse.success(absenceService.getAppelSeance(groupeCode, date, creneau)));
    }

    @GetMapping("/stagiaire/{stagiaireId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FORMATEUR') or #stagiaireId == authentication.principal.id")
    public ResponseEntity<ApiResponse<PageResponse<Absence>>> findByStagiairePaged(
            @PathVariable Long stagiaireId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Absence> absences = absenceService.findByStagiaire(stagiaireId, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(PageResponse.<Absence>builder()
                .content(absences.getContent())
                .page(absences.getNumber())
                .size(absences.getSize())
                .totalElements(absences.getTotalElements())
                .totalPages(absences.getTotalPages())
                .last(absences.isLast())
                .build()));
    }

    @GetMapping("/stagiaire/{stagiaireId}/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'FORMATEUR') or #stagiaireId == authentication.principal.id")
    public ResponseEntity<ApiResponse<List<AbsenceResponse>>> findByStagiaire(
            @PathVariable Long stagiaireId) {
        return ResponseEntity.ok(ApiResponse.success(absenceService.findByStagiaire(stagiaireId)));
    }

    @GetMapping("/groupe/{groupeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FORMATEUR')")
    public ResponseEntity<ApiResponse<List<AbsenceResponse>>> findByGroupe(
            @PathVariable Long groupeId) {
        return ResponseEntity.ok(ApiResponse.success(absenceService.findByGroupe(groupeId)));
    }

    @GetMapping("/stagiaire/{stagiaireId}/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'FORMATEUR') or #stagiaireId == authentication.principal.id")
    public ResponseEntity<ApiResponse<Map<String, Long>>> stats(@PathVariable Long stagiaireId) {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "total", absenceService.countByStagiaire(stagiaireId),
                "injustifiees", absenceService.countInjustifiees(stagiaireId)
        )));
    }

    /**
     * Endpoint dédié au stagiaire connecté — pas besoin de passer l'ID en URL.
     */
    @GetMapping("/mes-absences")
    @PreAuthorize("hasRole('STAGIAIRE')")
    public ResponseEntity<ApiResponse<List<AbsenceResponse>>> getMesAbsences(
            @AuthenticationPrincipal User stagiaire) {
        return ResponseEntity.ok(ApiResponse.success(absenceService.findByStagiaire(stagiaire.getId())));
    }

    @GetMapping("/mes-absences/stats")
    @PreAuthorize("hasRole('STAGIAIRE')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getMesStats(
            @AuthenticationPrincipal User stagiaire) {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "total", absenceService.countByStagiaire(stagiaire.getId()),
                "injustifiees", absenceService.countInjustifiees(stagiaire.getId())
        )));
    }

    @PutMapping("/{id}/justifier")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AbsenceResponse>> justifier(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal User admin) {
        String motif = body != null ? body.get("motif") : null;
        return ResponseEntity.ok(ApiResponse.success(absenceService.justifier(id, motif, admin)));
    }

    @PatchMapping("/{id}/justifier")
    @PreAuthorize("hasAnyRole('ADMIN', 'FORMATEUR')")
    public ResponseEntity<ApiResponse<Absence>> justifierPatch(
            @PathVariable Long id,
            @RequestParam String motif,
            @AuthenticationPrincipal User admin) {
        absenceService.justifier(id, motif, admin);
        return ResponseEntity.ok(ApiResponse.success("Absence justifiée", null));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User admin) {
        absenceService.delete(id, admin);
        return ResponseEntity.ok(ApiResponse.success("Absence supprimée", null));
    }
}
