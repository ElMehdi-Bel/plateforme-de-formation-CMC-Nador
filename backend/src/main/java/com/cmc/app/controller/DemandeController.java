package com.cmc.app.controller;

import com.cmc.app.dto.request.DemandeRequest;
import com.cmc.app.dto.response.ApiResponse;
import com.cmc.app.dto.response.DemandeResponse;
import com.cmc.app.dto.response.PageResponse;
import com.cmc.app.entity.User;
import com.cmc.app.enums.StatutDemande;
import com.cmc.app.service.DemandeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/demandes")
@RequiredArgsConstructor
public class DemandeController {

    private final DemandeService demandeService;

    @PostMapping
    @PreAuthorize("hasRole('STAGIAIRE')")
    public ResponseEntity<ApiResponse<DemandeResponse>> create(
            @Valid @RequestBody DemandeRequest request,
            @AuthenticationPrincipal User stagiaire) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Demande envoyée",
                        DemandeResponse.from(demandeService.create(request, stagiaire))));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE')")
    public ResponseEntity<ApiResponse<PageResponse<DemandeResponse>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) StatutDemande statut) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<DemandeResponse> result = (statut != null
                ? demandeService.findByStatut(statut, pageable)
                : demandeService.findAll(pageable))
                .map(DemandeResponse::from);
        return ResponseEntity.ok(ApiResponse.success(toPage(result)));
    }

    @GetMapping("/mes-demandes")
    @PreAuthorize("hasRole('STAGIAIRE')")
    public ResponseEntity<ApiResponse<PageResponse<DemandeResponse>>> mesDemandes(
            @AuthenticationPrincipal User stagiaire,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<DemandeResponse> result = demandeService
                .findByStagiaire(stagiaire.getId(),
                        PageRequest.of(page, size, Sort.by("createdAt").descending()))
                .map(DemandeResponse::from);
        return ResponseEntity.ok(ApiResponse.success(toPage(result)));
    }

    @PatchMapping("/{id}/traiter")
    @PreAuthorize("hasRole('GESTIONNAIRE')")
    public ResponseEntity<ApiResponse<DemandeResponse>> traiter(
            @PathVariable Long id,
            @RequestParam StatutDemande statut,
            @RequestParam(required = false) String commentaire,
            @AuthenticationPrincipal User admin) {
        return ResponseEntity.ok(ApiResponse.success(
                DemandeResponse.from(demandeService.traiter(id, statut, commentaire, admin))));
    }

    @PostMapping(value = "/{id}/document", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('GESTIONNAIRE')")
    public ResponseEntity<ApiResponse<DemandeResponse>> uploadDocument(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User admin) {
        return ResponseEntity.ok(ApiResponse.success("Document uploadé avec succès",
                DemandeResponse.from(demandeService.uploadDocument(id, file, admin))));
    }

    @GetMapping("/{id}/document")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return demandeService.getDocument(id, user);
    }

    private static <T> PageResponse<T> toPage(Page<T> page) {
        return PageResponse.<T>builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}
