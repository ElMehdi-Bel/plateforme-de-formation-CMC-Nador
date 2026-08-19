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
@PreAuthorize("hasRole('ADMIN')")
public class StatistiqueController {

    private final StatistiqueService statistiqueService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<StatistiqueService.DashboardStats>> dashboard() {
        return ResponseEntity.ok(ApiResponse.success(statistiqueService.getDashboardStats()));
    }

    @GetMapping("/avancees")
    public ResponseEntity<ApiResponse<StatistiqueService.AvanceesStats>> avancees() {
        return ResponseEntity.ok(ApiResponse.success(statistiqueService.getAvanceesStats()));
    }
}
