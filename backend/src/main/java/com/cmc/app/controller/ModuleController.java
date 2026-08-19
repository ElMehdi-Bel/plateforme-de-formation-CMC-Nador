package com.cmc.app.controller;

import com.cmc.app.dto.request.ModuleRequest;
import com.cmc.app.dto.response.ApiResponse;
import com.cmc.app.entity.Module;
import com.cmc.app.entity.User;
import com.cmc.app.service.ModuleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/modules")
@RequiredArgsConstructor
public class ModuleController {

    private final ModuleService moduleService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Module>> create(
            @Valid @RequestBody ModuleRequest request,
            @AuthenticationPrincipal User admin) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Module créé", moduleService.create(request, admin)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Module>> update(
            @PathVariable Long id,
            @Valid @RequestBody ModuleRequest request,
            @AuthenticationPrincipal User admin) {
        return ResponseEntity.ok(ApiResponse.success("Module modifié", moduleService.update(id, request, admin)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User admin) {
        moduleService.delete(id, admin);
        return ResponseEntity.ok(ApiResponse.success("Module supprimé", null));
    }

    @GetMapping("/filiere/{filiereId}")
    public ResponseEntity<ApiResponse<List<Module>>> findByFiliere(@PathVariable Long filiereId) {
        return ResponseEntity.ok(ApiResponse.success(moduleService.findByFiliere(filiereId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Module>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(moduleService.findAll()));
    }

    @GetMapping("/groupe/{groupeId}")
    public ResponseEntity<ApiResponse<List<Module>>> findByGroupe(@PathVariable Long groupeId) {
        return ResponseEntity.ok(ApiResponse.success(moduleService.findByGroupe(groupeId)));
    }

    @GetMapping("/formateur/{formateurId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> findByFormateur(@PathVariable Long formateurId) {
        List<Map<String, Object>> result = moduleService.findByFormateur(formateurId).stream()
                .map(m -> {
                    Map<String, Object> dto = new HashMap<>();
                    dto.put("id",             m.getId());
                    dto.put("nom",            m.getNom());
                    dto.put("code",           m.getCode());
                    dto.put("volumeHoraire",  m.getVolumeHoraire());
                    dto.put("anneeFormation", m.getAnneeFormation());
                    dto.put("coefficient",    m.getCoefficient());
                    dto.put("groupes", m.getGroupes().stream()
                            .map(g -> Map.of("id", g.getId(), "nom", g.getNom(), "code", g.getCode() != null ? g.getCode() : ""))
                            .collect(Collectors.toList()));
                    return dto;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{moduleId}/formateur/{formateurId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Module>> assignFormateur(
            @PathVariable Long moduleId,
            @PathVariable Long formateurId,
            @AuthenticationPrincipal User admin) {
        return ResponseEntity.ok(ApiResponse.success("Formateur assigné",
                moduleService.assignFormateur(moduleId, formateurId, admin)));
    }

    @DeleteMapping("/{moduleId}/formateur")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> removeFormateur(
            @PathVariable Long moduleId,
            @AuthenticationPrincipal User admin) {
        moduleService.removeFormateur(moduleId, admin);
        return ResponseEntity.ok(ApiResponse.success("Formateur retiré", null));
    }
}
