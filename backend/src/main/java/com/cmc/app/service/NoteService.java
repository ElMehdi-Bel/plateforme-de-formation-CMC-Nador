package com.cmc.app.service;

import com.cmc.app.dto.request.NoteRequest;
import com.cmc.app.dto.request.SaisirNoteRequest;
import com.cmc.app.dto.response.BulletinResponse;
import com.cmc.app.dto.response.NoteModuleResponse;
import com.cmc.app.entity.Module;
import com.cmc.app.entity.Note;
import com.cmc.app.entity.User;
import com.cmc.app.enums.Role;
import com.cmc.app.exception.ResourceNotFoundException;
import com.cmc.app.repository.ModuleRepository;
import com.cmc.app.repository.NoteRepository;
import com.cmc.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteRepository noteRepository;
    private final UserRepository userRepository;
    private final ModuleRepository moduleRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    @Transactional
    public Note createOrUpdate(NoteRequest request, User formateur) {
        User stagiaire = userRepository.findById(request.getStagiaireId())
                .orElseThrow(() -> new ResourceNotFoundException("Stagiaire non trouvé"));
        Module module = moduleRepository.findById(request.getModuleId())
                .orElseThrow(() -> new ResourceNotFoundException("Module non trouvé"));

        Optional<Note> existing = noteRepository.findByStagiaireIdAndModuleIdAndTypeEvaluation(
                request.getStagiaireId(), request.getModuleId(), request.getTypeEvaluation());

        Note note;
        if (existing.isPresent()) {
            note = existing.get();
            note.setValeur(request.getValeur());
            note.setCommentaire(request.getCommentaire());
        } else {
            note = Note.builder()
                    .stagiaire(stagiaire)
                    .module(module)
                    .formateur(formateur)
                    .valeur(request.getValeur())
                    .typeEvaluation(request.getTypeEvaluation())
                    .commentaire(request.getCommentaire())
                    .build();
        }

        Note saved = noteRepository.save(note);
        auditService.log(formateur, "SAVE_NOTE", "Note", saved.getId(),
                "Note " + saved.getValeur() + "/20 pour " + stagiaire.getFullName());
        notificationService.envoyer(formateur, stagiaire, "Nouvelle note",
                "Une note (" + request.getTypeEvaluation() + ") a été saisie en « " + module.getNom() + " ».", "NOTE");
        return saved;
    }

    public Page<Note> findByStagiaire(Long stagiaireId, Pageable pageable) {
        return noteRepository.findByStagiaireIdWithModule(stagiaireId, pageable);
    }

    public List<Note> findByStagiaireAndModule(Long stagiaireId, Long moduleId) {
        return noteRepository.findByStagiaireIdAndModuleId(stagiaireId, moduleId);
    }

    /**
     * Moyenne générale <b>pondérée par les coefficients de module</b>.
     * moyenne_module = (CC + EFM) / 3  (CC/20, EFM/40 → résultat /20)
     * moyenne_generale = Σ(moyenne_module × coef) / Σ(coef)
     */
    public Optional<Double> getMoyenneGenerale(Long stagiaireId) {
        BulletinResponse b = getBulletin(stagiaireId);
        return Optional.ofNullable(b.getMoyenneGenerale());
    }

    @Transactional(readOnly = true)
    public BulletinResponse getBulletin(Long stagiaireId) {
        User stagiaire = userRepository.findByIdWithGroupe(stagiaireId)
                .orElseThrow(() -> new ResourceNotFoundException("Stagiaire non trouvé"));

        List<Note> notes = noteRepository.findByStagiaireIdWithModule(stagiaireId);

        // Regrouper par module
        Map<Long, List<Note>> parModule = notes.stream()
                .filter(n -> n.getModule() != null)
                .collect(Collectors.groupingBy(n -> n.getModule().getId()));

        List<BulletinResponse.LigneModule> lignes = new java.util.ArrayList<>();
        double sommePonderee = 0, sommeCoef = 0;

        for (List<Note> mNotes : parModule.values()) {
            Module module = mNotes.get(0).getModule();
            Double cc  = valeur(mNotes, "CC");
            Double efm = valeur(mNotes, "EFM");
            Double moyenne = (cc != null && efm != null)
                    ? Math.round((cc + efm) / 3.0 * 100.0) / 100.0
                    : null;
            double coef = module.getCoefficient() != null ? module.getCoefficient() : 1.0;

            lignes.add(BulletinResponse.LigneModule.builder()
                    .moduleId(module.getId())
                    .moduleNom(module.getNom())
                    .coefficient(coef)
                    .cc(cc).efm(efm).moyenne(moyenne)
                    .build());

            if (moyenne != null) {
                sommePonderee += moyenne * coef;
                sommeCoef += coef;
            }
        }
        lignes.sort(java.util.Comparator.comparing(l -> l.getModuleNom() == null ? "" : l.getModuleNom()));

        Double moyenneGenerale = sommeCoef > 0
                ? Math.round(sommePonderee / sommeCoef * 100.0) / 100.0
                : null;

        return BulletinResponse.builder()
                .stagiaireId(stagiaire.getId())
                .stagiaireNom(stagiaire.getFullName())
                .groupeNom(stagiaire.getGroupe() != null ? stagiaire.getGroupe().getNom() : null)
                .filiereNom(stagiaire.getGroupe() != null && stagiaire.getGroupe().getFiliere() != null
                        ? stagiaire.getGroupe().getFiliere().getNom() : null)
                .modules(lignes)
                .moyenneGenerale(moyenneGenerale)
                .build();
    }

    private static Double valeur(List<Note> notes, String type) {
        return notes.stream()
                .filter(n -> type.equalsIgnoreCase(n.getTypeEvaluation()))
                .map(Note::getValeur)
                .findFirst().orElse(null);
    }

    public List<Note> getNotesParGroupe(Long groupeId, Long moduleId) {
        return noteRepository.findByGroupeIdAndModuleIdWithModule(groupeId, moduleId);
    }

    public List<NoteModuleResponse> getGrilleNotes(Long groupeId, Long moduleId) {
        List<User> stagiaires = userRepository.findByGroupeId(groupeId).stream()
                .filter(u -> u.getRole() == Role.STAGIAIRE)
                .collect(Collectors.toList());

        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module non trouvé"));

        List<Note> notes = noteRepository.findByGroupeAndModule(groupeId, moduleId);
        Map<String, Note> noteMap = notes.stream()
                .collect(Collectors.toMap(
                        n -> n.getStagiaire().getId() + "_" + n.getTypeEvaluation(),
                        n -> n,
                        (a, b) -> a
                ));

        return stagiaires.stream().map(s -> {
            Note ccNote = noteMap.get(s.getId() + "_CC");
            Note efmNote = noteMap.get(s.getId() + "_EFM");
            Double cc = ccNote != null ? ccNote.getValeur() : null;
            Double efm = efmNote != null ? efmNote.getValeur() : null;
            Double moyenne = (cc != null && efm != null) ? (cc + efm) / 3.0 : null;
            return NoteModuleResponse.builder()
                    .stagiaireId(s.getId())
                    .stagiaireNom(s.getNom())
                    .stagiairePrenom(s.getPrenom())
                    .moduleId(module.getId())
                    .moduleNom(module.getNom())
                    .cc(cc)
                    .ccNoteId(ccNote != null ? ccNote.getId() : null)
                    .efm(efm)
                    .efmNoteId(efmNote != null ? efmNote.getId() : null)
                    .moyenne(moyenne)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public NoteModuleResponse saisirNote(SaisirNoteRequest req, User formateur) {
        User stagiaire = userRepository.findById(req.getStagiaireId())
                .orElseThrow(() -> new ResourceNotFoundException("Stagiaire non trouvé"));
        Module module = moduleRepository.findById(req.getModuleId())
                .orElseThrow(() -> new ResourceNotFoundException("Module non trouvé"));

        Optional<Note> existing = noteRepository.findByStagiaireIdAndModuleIdAndTypeEvaluation(
                req.getStagiaireId(), req.getModuleId(), req.getTypeEvaluation());

        Note note;
        if (existing.isPresent()) {
            note = existing.get();
            note.setValeur(req.getValeur());
            note.setCommentaire(req.getCommentaire());
        } else {
            note = Note.builder()
                    .stagiaire(stagiaire)
                    .module(module)
                    .formateur(formateur)
                    .valeur(req.getValeur())
                    .typeEvaluation(req.getTypeEvaluation())
                    .commentaire(req.getCommentaire())
                    .build();
        }
        noteRepository.save(note);

        auditService.log(formateur, "SAISIR_NOTE", "Note", note.getId(),
                "Note " + req.getTypeEvaluation() + " " + req.getValeur() + " pour " + stagiaire.getFullName());
        notificationService.envoyer(formateur, stagiaire, "Nouvelle note",
                "Une note (" + req.getTypeEvaluation() + ") a été saisie en « " + module.getNom() + " ».", "NOTE");

        // Recalculer la réponse
        Optional<Note> ccNote = noteRepository.findByStagiaireIdAndModuleIdAndTypeEvaluation(
                req.getStagiaireId(), req.getModuleId(), "CC");
        Optional<Note> efmNote = noteRepository.findByStagiaireIdAndModuleIdAndTypeEvaluation(
                req.getStagiaireId(), req.getModuleId(), "EFM");

        Double cc = ccNote.map(Note::getValeur).orElse(null);
        Double efm = efmNote.map(Note::getValeur).orElse(null);
        Double moyenne = (cc != null && efm != null) ? (cc + efm) / 3.0 : null;

        return NoteModuleResponse.builder()
                .stagiaireId(stagiaire.getId())
                .stagiaireNom(stagiaire.getNom())
                .stagiairePrenom(stagiaire.getPrenom())
                .moduleId(module.getId())
                .moduleNom(module.getNom())
                .cc(cc)
                .ccNoteId(ccNote.map(Note::getId).orElse(null))
                .efm(efm)
                .efmNoteId(efmNote.map(Note::getId).orElse(null))
                .moyenne(moyenne)
                .build();
    }

    @Transactional
    public void delete(Long id, User admin) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Note non trouvée"));
        noteRepository.delete(note);
        auditService.log(admin, "DELETE_NOTE", "Note", id, "Suppression note");
    }
}
