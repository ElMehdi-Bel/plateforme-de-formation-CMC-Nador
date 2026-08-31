package com.cmc.app.controller;

import com.cmc.app.dto.response.ApiResponse;
import com.cmc.app.service.StatistiqueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/statistiques")
@RequiredArgsConstructor
public class StatistiqueController {

    private final StatistiqueService statistiqueService;

    /** Compteurs du tableau de bord — visible par tous les profils "staff". */
    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'CHEF_DE_POLE', 'GESTIONNAIRE')")
    public ResponseEntity<ApiResponse<StatistiqueService.DashboardStats>> dashboard() {
        return ResponseEntity.ok(ApiResponse.success(statistiqueService.getDashboardStats()));
    }

    /** "Consulter les statistiques" (diagramme) = Chef de pôle ; ADMIN en lecture. */
    @GetMapping("/avancees")
    @PreAuthorize("hasAnyRole('ADMIN', 'CHEF_DE_POLE')")
    public ResponseEntity<ApiResponse<StatistiqueService.AvanceesStats>> avancees() {
        return ResponseEntity.ok(ApiResponse.success(statistiqueService.getAvanceesStats()));
    }
}
