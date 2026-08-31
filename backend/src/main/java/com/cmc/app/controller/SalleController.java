package com.cmc.app.controller;

import com.cmc.app.dto.request.SalleRequest;
import com.cmc.app.dto.response.ApiResponse;
import com.cmc.app.entity.Salle;
import com.cmc.app.entity.User;
import com.cmc.app.service.SalleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/salles")
@RequiredArgsConstructor
public class SalleController {

    private final SalleService salleService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Salle>> create(
            @Valid @RequestBody SalleRequest request,
            @AuthenticationPrincipal User admin) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Salle créée", salleService.create(request, admin)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Salle>> update(
            @PathVariable Long id,
            @Valid @RequestBody SalleRequest request,
            @AuthenticationPrincipal User admin) {
        return ResponseEntity.ok(ApiResponse.success(salleService.update(id, request, admin)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Salle>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(salleService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Salle>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(salleService.findById(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User admin) {
        salleService.delete(id, admin);
        return ResponseEntity.ok(ApiResponse.success("Salle supprimée", null));
    }
}
