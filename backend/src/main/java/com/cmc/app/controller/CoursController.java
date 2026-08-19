package com.cmc.app.controller;

import com.cmc.app.dto.response.ApiResponse;
import com.cmc.app.dto.response.PageResponse;
import com.cmc.app.entity.Cours;
import com.cmc.app.entity.User;
import com.cmc.app.service.CoursService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/cours")
@RequiredArgsConstructor
public class CoursController {

    private final CoursService coursService;

    @PostMapping(consumes = "multipart/form-data")
    @PreAuthorize("hasAnyRole('FORMATEUR', 'ADMIN')")
    public ResponseEntity<ApiResponse<Cours>> upload(
            @RequestParam Long moduleId,
            @RequestParam String titre,
            @RequestParam(required = false) String description,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User formateur) throws IOException {
        Cours cours = coursService.upload(moduleId, titre, description, file, formateur);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Cours uploadé", cours));
    }

    @GetMapping("/module/{moduleId}")
    public ResponseEntity<ApiResponse<PageResponse<Cours>>> findByModule(
            @PathVariable Long moduleId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Cours> result = coursService.findByModule(moduleId, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(toPage(result)));
    }

    @GetMapping("/groupe/{groupeId}")
    public ResponseEntity<ApiResponse<PageResponse<Cours>>> findByGroupe(
            @PathVariable Long groupeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Cours> result = coursService.findByGroupe(groupeId, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(toPage(result)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FORMATEUR')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User admin) throws IOException {
        coursService.delete(id, admin);
        return ResponseEntity.ok(ApiResponse.success("Cours supprimé", null));
    }

    private <T> PageResponse<T> toPage(Page<T> page) {
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
