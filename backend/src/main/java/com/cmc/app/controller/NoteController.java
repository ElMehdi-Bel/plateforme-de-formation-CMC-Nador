package com.cmc.app.controller;

import com.cmc.app.dto.request.NoteRequest;
import com.cmc.app.dto.request.SaisirNoteRequest;
import com.cmc.app.dto.response.ApiResponse;
import com.cmc.app.dto.response.NoteModuleResponse;
import com.cmc.app.dto.response.PageResponse;
import com.cmc.app.entity.Note;
import com.cmc.app.entity.User;
import com.cmc.app.service.NoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    @PostMapping
    @PreAuthorize("hasAnyRole('FORMATEUR', 'ADMIN')")
    public ResponseEntity<ApiResponse<Note>> saveNote(
            @Valid @RequestBody NoteRequest request,
            @AuthenticationPrincipal User formateur) {
        return ResponseEntity.ok(ApiResponse.success(noteService.createOrUpdate(request, formateur)));
    }

    @GetMapping("/grille")
    @PreAuthorize("hasAnyRole('ADMIN', 'FORMATEUR')")
    public ResponseEntity<ApiResponse<List<NoteModuleResponse>>> getGrille(
            @RequestParam Long groupeId,
            @RequestParam Long moduleId) {
        return ResponseEntity.ok(ApiResponse.success(noteService.getGrilleNotes(groupeId, moduleId)));
    }

    @PostMapping("/saisir")
    @PreAuthorize("hasAnyRole('FORMATEUR', 'ADMIN')")
    public ResponseEntity<ApiResponse<NoteModuleResponse>> saisirNote(
            @RequestBody SaisirNoteRequest request,
            @AuthenticationPrincipal User formateur) {
        return ResponseEntity.ok(ApiResponse.success(noteService.saisirNote(request, formateur)));
    }

    @GetMapping("/stagiaire/{stagiaireId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FORMATEUR') or #stagiaireId == authentication.principal.id")
    public ResponseEntity<ApiResponse<PageResponse<Note>>> findByStagiaire(
            @PathVariable Long stagiaireId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Note> notes = noteService.findByStagiaire(stagiaireId, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(PageResponse.<Note>builder()
                .content(notes.getContent())
                .page(notes.getNumber())
                .size(notes.getSize())
                .totalElements(notes.getTotalElements())
                .totalPages(notes.getTotalPages())
                .last(notes.isLast())
                .build()));
    }

    @GetMapping("/stagiaire/{stagiaireId}/moyenne")
    public ResponseEntity<ApiResponse<Map<String, Double>>> getMoyenne(@PathVariable Long stagiaireId) {
        Double moyenne = noteService.getMoyenneGenerale(stagiaireId).orElse(0.0);
        return ResponseEntity.ok(ApiResponse.success(Map.of("moyenne", moyenne)));
    }

    @GetMapping("/groupe/{groupeId}/module/{moduleId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FORMATEUR')")
    public ResponseEntity<ApiResponse<List<Note>>> getParGroupe(
            @PathVariable Long groupeId,
            @PathVariable Long moduleId) {
        return ResponseEntity.ok(ApiResponse.success(noteService.getNotesParGroupe(groupeId, moduleId)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User admin) {
        noteService.delete(id, admin);
        return ResponseEntity.ok(ApiResponse.success("Note supprimée", null));
    }
}
