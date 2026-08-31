package com.cmc.app.controller;

import com.cmc.app.dto.response.ApiResponse;
import com.cmc.app.entity.SanctionDiscipline;
import com.cmc.app.entity.User;
import com.cmc.app.service.DisciplineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/discipline")
@RequiredArgsConstructor
public class DisciplineController {

    private final DisciplineService disciplineService;

    /** Bilan de discipline du stagiaire connecté. */
    @GetMapping("/me")
    @PreAuthorize("hasRole('STAGIAIRE')")
    public ResponseEntity<ApiResponse<DisciplineService.DisciplineBilan>> me(
            @AuthenticationPrincipal User stagiaire) {
        return ResponseEntity.ok(ApiResponse.success(disciplineService.pourStagiaire(stagiaire.getId())));
    }

    @GetMapping("/stagiaire/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE', 'FORMATEUR', 'CHEF_DE_POLE') or #id == authentication.principal.id")
    public ResponseEntity<ApiResponse<DisciplineService.DisciplineBilan>> pourStagiaire(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(disciplineService.pourStagiaire(id)));
    }

    /** Historique des sanctions d'un stagiaire. */
    @GetMapping("/stagiaire/{id}/sanctions")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE', 'FORMATEUR', 'CHEF_DE_POLE') or #id == authentication.principal.id")
    public ResponseEntity<ApiResponse<List<SanctionDiscipline>>> sanctionsStagiaire(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(disciplineService.sanctionsPourStagiaire(id)));
    }

    /** Sanctions récentes — suivi par le gestionnaire / l'admin. */
    @GetMapping("/sanctions")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE')")
    public ResponseEntity<ApiResponse<List<SanctionDiscipline>>> sanctionsRecentes(
            @RequestParam(defaultValue = "30") int limit) {
        return ResponseEntity.ok(ApiResponse.success(disciplineService.sanctionsRecentes(limit)));
    }
}
