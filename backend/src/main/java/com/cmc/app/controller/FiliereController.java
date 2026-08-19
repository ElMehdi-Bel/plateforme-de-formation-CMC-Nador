package com.cmc.app.controller;

import com.cmc.app.dto.request.FiliereRequest;
import com.cmc.app.dto.response.ApiResponse;
import com.cmc.app.entity.Filiere;
import com.cmc.app.entity.User;
import com.cmc.app.service.FiliereService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/filieres")
@RequiredArgsConstructor
public class FiliereController {

    private final FiliereService filiereService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Filiere>> create(
            @Valid @RequestBody FiliereRequest request,
            @AuthenticationPrincipal User admin) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Filière créée", filiereService.create(request, admin)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Filiere>> update(
            @PathVariable Long id,
            @Valid @RequestBody FiliereRequest request,
            @AuthenticationPrincipal User admin) {
        return ResponseEntity.ok(ApiResponse.success(filiereService.update(id, request, admin)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Filiere>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(filiereService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Filiere>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(filiereService.findById(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User admin) {
        filiereService.delete(id, admin);
        return ResponseEntity.ok(ApiResponse.success("Filière supprimée", null));
    }
}
