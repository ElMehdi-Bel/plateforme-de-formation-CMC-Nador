package com.cmc.app.controller;

import com.cmc.app.dto.request.AffecterGroupeRequest;
import com.cmc.app.dto.request.AssignBatchRequest;
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
import java.util.Set;
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

    /** Modules sans formateur affecté. */
    @GetMapping("/non-affectes")
    @PreAuthorize("hasAnyRole('ADMIN', 'CHEF_DE_POLE')")
    public ResponseEntity<ApiResponse<List<Module>>> nonAffectes() {
        return ResponseEntity.ok(ApiResponse.success(moduleService.findNonAffectes()));
    }

    /** Charge horaire par formateur (nb modules + volume horaire cumulé). */
    @GetMapping("/charge-formateurs")
    @PreAuthorize("hasAnyRole('ADMIN', 'CHEF_DE_POLE')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> chargeFormateurs() {
        List<Map<String, Object>> result = moduleService.chargeParFormateur().stream()
                .map(row -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("formateurId", row[0]);
                    m.put("formateurNom", row[1] + " " + row[2]);
                    m.put("nbModules", ((Number) row[3]).intValue());
                    m.put("volumeHoraire", ((Number) row[4]).intValue());
                    return m;
                })
                .toList();
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/groupe/{groupeId}")
    public ResponseEntity<ApiResponse<List<Module>>> findByGroupe(@PathVariable Long groupeId) {
        return ResponseEntity.ok(ApiResponse.success(moduleService.findByGroupe(groupeId)));
    }

    /**
     * Étape « groupe d'abord » : modules proposables pour un groupe (référentiel
     * de sa filière), avec le formateur actuel de chacun et le flag
     * {@code lieAuGroupe} (déjà présent dans groupe_modules).
     */
    @GetMapping("/pour-groupe/{groupeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CHEF_DE_POLE')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> pourGroupe(@PathVariable Long groupeId) {
        Set<Long> lies = moduleService.moduleIdsDuGroupe(groupeId);
        List<Map<String, Object>> result = moduleService.modulesPourGroupe(groupeId).stream()
                .map(m -> {
                    Map<String, Object> dto = new HashMap<>();
                    dto.put("id",             m.getId());
                    dto.put("nom",            m.getNom());
                    dto.put("code",           m.getCode());
                    dto.put("volumeHoraire",  m.getVolumeHoraire());
                    dto.put("anneeFormation", m.getAnneeFormation());
                    dto.put("coefficient",    m.getCoefficient());
                    dto.put("formateurId",    m.getFormateurId());
                    dto.put("formateurNom",   m.getFormateurNom());
                    dto.put("lieAuGroupe",    lies.contains(m.getId()));
                    return dto;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /** Affecte un formateur aux modules cochés d'un groupe (et les rattache au groupe). */
    @PutMapping("/affecter-groupe")
    @PreAuthorize("hasRole('CHEF_DE_POLE')")
    public ResponseEntity<ApiResponse<Integer>> affecterGroupe(
            @Valid @RequestBody AffecterGroupeRequest request,
            @AuthenticationPrincipal User chef) {
        int n = moduleService.affecterAuGroupe(
                request.getFormateurId(), request.getGroupeId(), request.getModuleIds(), chef);
        return ResponseEntity.ok(ApiResponse.success(n + " module(s) affecté(s) au formateur", n));
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
    @PreAuthorize("hasRole('CHEF_DE_POLE')")
    public ResponseEntity<ApiResponse<Module>> assignFormateur(
            @PathVariable Long moduleId,
            @PathVariable Long formateurId,
            @AuthenticationPrincipal User admin) {
        return ResponseEntity.ok(ApiResponse.success("Formateur assigné",
                moduleService.assignFormateur(moduleId, formateurId, admin)));
    }

    /** Affectation « par groupe » : un formateur → plusieurs modules d'un coup. */
    @PutMapping("/assign-batch")
    @PreAuthorize("hasRole('CHEF_DE_POLE')")
    public ResponseEntity<ApiResponse<Integer>> assignBatch(
            @jakarta.validation.Valid @RequestBody AssignBatchRequest request,
            @AuthenticationPrincipal User chef) {
        int n = moduleService.assignFormateurBatch(request.getFormateurId(), request.getModuleIds(), chef);
        return ResponseEntity.ok(ApiResponse.success(n + " module(s) affecté(s)", n));
    }

    @DeleteMapping("/{moduleId}/formateur")
    @PreAuthorize("hasRole('CHEF_DE_POLE')")
    public ResponseEntity<ApiResponse<Void>> removeFormateur(
            @PathVariable Long moduleId,
            @AuthenticationPrincipal User admin) {
        moduleService.removeFormateur(moduleId, admin);
        return ResponseEntity.ok(ApiResponse.success("Formateur retiré", null));
    }
}
