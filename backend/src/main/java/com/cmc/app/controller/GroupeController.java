package com.cmc.app.controller;

import com.cmc.app.dto.request.GroupeRequest;
import com.cmc.app.dto.response.ApiResponse;
import com.cmc.app.entity.Groupe;
import com.cmc.app.entity.User;
import com.cmc.app.service.GroupeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/groupes")
@RequiredArgsConstructor
public class GroupeController {

    private final GroupeService groupeService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Groupe>> create(
            @Valid @RequestBody GroupeRequest request,
            @AuthenticationPrincipal User admin) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Groupe créé", groupeService.create(request, admin)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Groupe>> update(
            @PathVariable Long id,
            @Valid @RequestBody GroupeRequest request,
            @AuthenticationPrincipal User admin) {
        return ResponseEntity.ok(ApiResponse.success(groupeService.update(id, request, admin)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Groupe>>> findAll(
            @RequestParam(required = false) Long filiereId) {
        List<Groupe> groupes = filiereId != null
                ? groupeService.findByFiliere(filiereId)
                : groupeService.findAll();
        return ResponseEntity.ok(ApiResponse.success(groupes));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Groupe>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(groupeService.findById(id)));
    }

    @GetMapping("/formateur/{formateurId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FORMATEUR')")
    public ResponseEntity<ApiResponse<List<Groupe>>> findByFormateur(@PathVariable Long formateurId) {
        return ResponseEntity.ok(ApiResponse.success(groupeService.findByFormateur(formateurId)));
    }

    @PutMapping("/{id}/modules")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> setModules(
            @PathVariable Long id,
            @RequestBody(required = false) List<Long> moduleIds,
            @AuthenticationPrincipal User admin) {
        groupeService.setModules(id, moduleIds != null ? moduleIds : new ArrayList<>(), admin);
        return ResponseEntity.ok(ApiResponse.success("Modules mis à jour", null));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User admin) {
        groupeService.delete(id, admin);
        return ResponseEntity.ok(ApiResponse.success("Groupe supprimé", null));
    }
}
