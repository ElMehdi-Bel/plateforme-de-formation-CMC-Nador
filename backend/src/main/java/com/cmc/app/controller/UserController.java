package com.cmc.app.controller;

import com.cmc.app.dto.request.ChangePasswordRequest;
import com.cmc.app.dto.request.CreateUserRequest;
import com.cmc.app.dto.request.UpdateProfileRequest;
import com.cmc.app.dto.request.UpdateUserRequest;
import com.cmc.app.dto.response.ApiResponse;
import com.cmc.app.dto.response.PageResponse;
import com.cmc.app.dto.response.UserResponse;
import com.cmc.app.entity.User;
import com.cmc.app.enums.Role;
import com.cmc.app.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE', 'CHEF_DE_POLE')")
    public ResponseEntity<ApiResponse<UserResponse>> create(
            @Valid @RequestBody CreateUserRequest request,
            @AuthenticationPrincipal User admin) {
        UserResponse user = userService.createUser(request, admin);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Utilisateur créé avec succès", user));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE', 'CHEF_DE_POLE')")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> findAll(
            @RequestParam(defaultValue = "STAGIAIRE") Role role,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by("nom").ascending());
        Page<UserResponse> result = search.isBlank()
                ? userService.findByRole(role, pageable)
                : userService.search(role, search, pageable);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.<UserResponse>builder()
                .content(result.getContent())
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE', 'CHEF_DE_POLE', 'FORMATEUR') or #id == authentication.principal.id")
    public ResponseEntity<ApiResponse<UserResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(userService.findById(id)));
    }

    // ─── Espace « Mon compte » (tous rôles) ──────────────────────────────────

    @PatchMapping("/me/password")
    public ResponseEntity<ApiResponse<Void>> changeOwnPassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal User principal) {
        userService.changeOwnPassword(principal, request.getCurrentPassword(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success("Mot de passe modifié", null));
    }

    @PatchMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateOwnProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal User principal) {
        return ResponseEntity.ok(ApiResponse.success("Profil mis à jour",
                userService.updateOwnProfile(principal, request.getTelephone())));
    }

    @PatchMapping("/{id}/toggle-actif")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE', 'CHEF_DE_POLE')")
    public ResponseEntity<ApiResponse<UserResponse>> toggleActif(
            @PathVariable Long id,
            @AuthenticationPrincipal User admin) {
        return ResponseEntity.ok(ApiResponse.success(userService.toggleActif(id, admin)));
    }

    /** Affecter un stagiaire à un groupe (Gestionnaire des stagiaires). */
    @PatchMapping("/{id}/groupe")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE')")
    public ResponseEntity<ApiResponse<UserResponse>> assignGroupe(
            @PathVariable Long id,
            @RequestParam(required = false) Long groupeId,
            @AuthenticationPrincipal User caller) {
        return ResponseEntity.ok(ApiResponse.success("Groupe affecté",
                userService.assignGroupe(id, groupeId, caller)));
    }

    /** Rattacher un membre du personnel (chef de pôle / formateur) à un pôle. */
    @PatchMapping("/{id}/pole")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> assignPole(
            @PathVariable Long id,
            @RequestParam(required = false) Long poleId,
            @AuthenticationPrincipal User admin) {
        return ResponseEntity.ok(ApiResponse.success("Pôle affecté",
                userService.assignPole(id, poleId, admin)));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE', 'CHEF_DE_POLE')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> stats() {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "stagiaires", userService.countByRole(Role.STAGIAIRE),
                "formateurs", userService.countByRole(Role.FORMATEUR)
        )));
    }

    @GetMapping("/groupe/{groupeId}/stagiaires")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE', 'CHEF_DE_POLE', 'FORMATEUR')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> findByGroupe(@PathVariable Long groupeId) {
        return ResponseEntity.ok(ApiResponse.success(userService.findStagiairesByGroupe(groupeId)));
    }
}
