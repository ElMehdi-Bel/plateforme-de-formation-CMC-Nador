package com.cmc.app.controller;

import com.cmc.app.dto.request.NoteRequest;
import com.cmc.app.dto.request.SaisirNoteRequest;
import com.cmc.app.dto.response.ApiResponse;
import com.cmc.app.dto.response.BulletinResponse;
import com.cmc.app.dto.response.NoteModuleResponse;
import com.cmc.app.dto.response.NoteResponse;
import com.cmc.app.dto.response.PageResponse;
import com.cmc.app.entity.Note;
import com.cmc.app.entity.User;
import com.cmc.app.service.ImportNoteService;
import com.cmc.app.service.NoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;
    private final ImportNoteService importNoteService;

    @PostMapping
    @PreAuthorize("hasRole('FORMATEUR')")
    public ResponseEntity<ApiResponse<NoteResponse>> saveNote(
            @Valid @RequestBody NoteRequest request,
            @AuthenticationPrincipal User formateur) {
        return ResponseEntity.ok(ApiResponse.success(
                NoteResponse.from(noteService.createOrUpdate(request, formateur))));
    }

    @GetMapping("/grille")
    @PreAuthorize("hasAnyRole('ADMIN', 'FORMATEUR')")
    public ResponseEntity<ApiResponse<List<NoteModuleResponse>>> getGrille(
            @RequestParam Long groupeId,
            @RequestParam Long moduleId) {
        return ResponseEntity.ok(ApiResponse.success(noteService.getGrilleNotes(groupeId, moduleId)));
    }

    @PostMapping("/saisir")
    @PreAuthorize("hasRole('FORMATEUR')")
    public ResponseEntity<ApiResponse<NoteModuleResponse>> saisirNote(
            @RequestBody SaisirNoteRequest request,
            @AuthenticationPrincipal User formateur) {
        return ResponseEntity.ok(ApiResponse.success(noteService.saisirNote(request, formateur)));
    }

    @GetMapping("/stagiaire/{stagiaireId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FORMATEUR') or #stagiaireId == authentication.principal.id")
    public ResponseEntity<ApiResponse<PageResponse<NoteResponse>>> findByStagiaire(
            @PathVariable Long stagiaireId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Note> notes = noteService.findByStagiaire(stagiaireId, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(PageResponse.<NoteResponse>builder()
                .content(NoteResponse.fromList(notes.getContent()))
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

    /** Relevé de notes : ligne par module + moyenne générale pondérée par coefficient. */
    @GetMapping("/stagiaire/{stagiaireId}/bulletin")
    @PreAuthorize("hasAnyRole('ADMIN', 'FORMATEUR', 'GESTIONNAIRE', 'CHEF_DE_POLE') or #stagiaireId == authentication.principal.id")
    public ResponseEntity<ApiResponse<BulletinResponse>> bulletin(@PathVariable Long stagiaireId) {
        return ResponseEntity.ok(ApiResponse.success(noteService.getBulletin(stagiaireId)));
    }

    @GetMapping("/groupe/{groupeId}/module/{moduleId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FORMATEUR')")
    public ResponseEntity<ApiResponse<List<NoteResponse>>> getParGroupe(
            @PathVariable Long groupeId,
            @PathVariable Long moduleId) {
        return ResponseEntity.ok(ApiResponse.success(
                NoteResponse.fromList(noteService.getNotesParGroupe(groupeId, moduleId))));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('FORMATEUR')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User admin) {
        noteService.delete(id, admin);
        return ResponseEntity.ok(ApiResponse.success("Note supprimée", null));
    }

    @PostMapping("/import")
    @PreAuthorize("hasRole('FORMATEUR')")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> importNotes(
            @RequestParam("file") MultipartFile file,
            @RequestParam Long groupeId,
            @RequestParam Long moduleId,
            @AuthenticationPrincipal User formateur) {
        try {
            Map<String, Integer> result = importNoteService.importNotes(file, groupeId, moduleId, formateur);
            return ResponseEntity.ok(ApiResponse.success("Notes importées avec succès", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Erreur lors de l'import : " + e.getMessage()));
        }
    }

    @GetMapping("/template")
    @PreAuthorize("hasRole('FORMATEUR')")
    public ResponseEntity<byte[]> downloadTemplate(
            @RequestParam Long groupeId,
            @RequestParam Long moduleId) {
        try {
            byte[] excel = importNoteService.generateTemplate(groupeId, moduleId);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=grille_notes.xlsx")
                    .contentType(MediaType.parseMediaType(
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(excel);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
