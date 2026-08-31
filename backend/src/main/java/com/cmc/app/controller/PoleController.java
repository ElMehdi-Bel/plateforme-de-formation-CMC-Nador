package com.cmc.app.controller;

import com.cmc.app.dto.request.PoleRequest;
import com.cmc.app.dto.response.ApiResponse;
import com.cmc.app.entity.Pole;
import com.cmc.app.entity.User;
import com.cmc.app.service.PoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/poles")
@RequiredArgsConstructor
public class PoleController {

    private final PoleService poleService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Pole>> create(
            @Valid @RequestBody PoleRequest request,
            @AuthenticationPrincipal User admin) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Pôle créé", poleService.create(request, admin)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Pole>> update(
            @PathVariable Long id,
            @Valid @RequestBody PoleRequest request,
            @AuthenticationPrincipal User admin) {
        return ResponseEntity.ok(ApiResponse.success(poleService.update(id, request, admin)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Pole>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(poleService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Pole>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(poleService.findById(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User admin) {
        poleService.delete(id, admin);
        return ResponseEntity.ok(ApiResponse.success("Pôle supprimé", null));
    }
}
