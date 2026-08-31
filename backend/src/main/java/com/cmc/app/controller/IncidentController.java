package com.cmc.app.controller;

import com.cmc.app.dto.request.IncidentRequest;
import com.cmc.app.dto.response.ApiResponse;
import com.cmc.app.entity.IncidentDiscipline;
import com.cmc.app.entity.User;
import com.cmc.app.exception.ResourceNotFoundException;
import com.cmc.app.repository.IncidentDisciplineRepository;
import com.cmc.app.repository.UserRepository;
import com.cmc.app.service.AuditService;
import com.cmc.app.service.DisciplineService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/incidents")
@RequiredArgsConstructor
public class IncidentController {

    private final IncidentDisciplineRepository incidentRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final DisciplineService disciplineService;

    @GetMapping("/stagiaire/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE', 'FORMATEUR', 'CHEF_DE_POLE') or #id == authentication.principal.id")
    public ResponseEntity<ApiResponse<List<IncidentDiscipline>>> byStagiaire(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                incidentRepository.findByStagiaireIdOrderByDateIncidentDesc(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('GESTIONNAIRE')")
    public ResponseEntity<ApiResponse<IncidentDiscipline>> create(
            @Valid @RequestBody IncidentRequest request,
            @AuthenticationPrincipal User caller) {
        User stagiaire = userRepository.findById(request.getStagiaireId())
                .orElseThrow(() -> new ResourceNotFoundException("Stagiaire non trouvé"));
        IncidentDiscipline incident = IncidentDiscipline.builder()
                .stagiaire(stagiaire)
                .dateIncident(request.getDateIncident())
                .motif(request.getMotif())
                .description(request.getDescription())
                .creePar(caller)
                .creeParNom(caller.getFullName())
                .build();
        IncidentDiscipline saved = incidentRepository.save(incident);
        auditService.log(caller, "CREATE_INCIDENT", "IncidentDiscipline", saved.getId(),
                "Incident: " + stagiaire.getFullName() + " — " + saved.getMotif());
        // Détermination éventuelle d'une sanction de comportement
        disciplineService.evaluerEtAppliquerSanctions(stagiaire.getId(), caller,
                "Incident : " + saved.getMotif());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Incident enregistré", saved));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('GESTIONNAIRE')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User caller) {
        IncidentDiscipline incident = incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident non trouvé"));
        incidentRepository.delete(incident);
        auditService.log(caller, "DELETE_INCIDENT", "IncidentDiscipline", id, "Incident supprimé");
        return ResponseEntity.ok(ApiResponse.success("Incident supprimé", null));
    }
}
