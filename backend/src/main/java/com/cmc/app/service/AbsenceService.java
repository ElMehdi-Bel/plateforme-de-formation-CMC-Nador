package com.cmc.app.service;

import com.cmc.app.dto.request.AbsenceRequest;
import com.cmc.app.dto.request.AppelRequest;
import com.cmc.app.dto.response.AbsenceResponse;
import com.cmc.app.dto.response.AppelResultResponse;
import com.cmc.app.entity.Absence;
import com.cmc.app.entity.Module;
import com.cmc.app.entity.SanctionDiscipline;
import com.cmc.app.entity.User;
import com.cmc.app.exception.ResourceNotFoundException;
import com.cmc.app.repository.AbsenceRepository;
import com.cmc.app.repository.ModuleRepository;
import com.cmc.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AbsenceService {

    private final AbsenceRepository absenceRepository;
    private final UserRepository userRepository;
    private final ModuleRepository moduleRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final DisciplineService disciplineService;

    @Transactional
    public AbsenceResponse create(AbsenceRequest request, User formateur) {
        User stagiaire = userRepository.findById(request.getStagiaireId())
                .orElseThrow(() -> new ResourceNotFoundException("Stagiaire non trouvé"));

        Module module = null;
        if (request.getModuleId() != null) {
            module = moduleRepository.findById(request.getModuleId()).orElse(null);
        }

        Absence absence = Absence.builder()
                .stagiaire(stagiaire)
                .module(module)
                .formateur(formateur)
                .dateAbsence(request.getDateAbsence())
                .justifiee(request.isJustifiee())
                .motif(request.getMotif())
                .seance(request.getSeance() != null ? request.getSeance() : "MATIN")
                .build();

        Absence saved = absenceRepository.save(absence);
        auditService.log(formateur, "CREATE_ABSENCE", "Absence", saved.getId(),
                "Absence enregistrée pour " + stagiaire.getFullName());
        return toResponse(saved);
    }

    @Transactional
    public AppelResultResponse faireAppel(AppelRequest request, User formateur) {
        // Remplacer l'appel existant pour cette séance
        absenceRepository.deleteAll(absenceRepository.findBySeance(
                request.getGroupeCode(), request.getDate(), request.getHeureCreneau()));

        List<AbsenceResponse> enregistrees = new ArrayList<>();
        Set<Long> stagiairesConcernes = new LinkedHashSet<>();
        int nbAbsents = 0, nbRetards = 0;

        for (AppelRequest.AbsenceItem item : (request.getAbsences() != null ? request.getAbsences() : List.<AppelRequest.AbsenceItem>of())) {
            String statut = item.resolvedStatut();
            if (!"ABSENT".equals(statut) && !"RETARD".equals(statut)) continue;

            User stagiaire = userRepository.findById(item.getStagiaireId())
                    .orElseThrow(() -> new ResourceNotFoundException("Stagiaire non trouvé: " + item.getStagiaireId()));

            boolean retard = "RETARD".equals(statut);
            Absence saved = absenceRepository.save(Absence.builder()
                    .stagiaire(stagiaire)
                    .formateur(formateur)
                    .dateAbsence(request.getDate())
                    .groupeCode(request.getGroupeCode())
                    .jourSemaine(request.getJourSemaine())
                    .heureCreneau(request.getHeureCreneau())
                    .justifiee(false)
                    .type(retard ? "RETARD" : "ABSENCE")
                    .motif(item.getMotif())
                    .build());

            enregistrees.add(toResponse(saved));
            stagiairesConcernes.add(stagiaire.getId());
            if ("RETARD".equals(statut)) nbRetards++; else nbAbsents++;

            notificationService.envoyer(formateur, stagiaire,
                    "RETARD".equals(statut) ? "Retard enregistré" : "Absence enregistrée",
                    ("RETARD".equals(statut) ? "Un retard" : "Une absence")
                            + " a été enregistré(e) pour la séance du " + request.getDate()
                            + (request.getHeureCreneau() != null ? " (" + request.getHeureCreneau() + ")" : "") + ".",
                    "ABSENCE");
        }

        // Calcul du cumul + détermination des sanctions selon le règlement
        List<SanctionDiscipline> sanctions = new ArrayList<>();
        String motif = "Appel " + request.getGroupeCode() + " du " + request.getDate();
        for (Long sid : stagiairesConcernes) {
            sanctions.addAll(disciplineService.evaluerEtAppliquerSanctions(sid, formateur, motif));
        }

        if (formateur != null) {
            auditService.log(formateur, "FAIRE_APPEL", "Absence", null,
                    "Appel " + request.getGroupeCode() + " du " + request.getDate()
                            + " — " + nbAbsents + " absent(s), " + nbRetards + " retard(s), "
                            + sanctions.size() + " sanction(s)");
        }

        return AppelResultResponse.builder()
                .nbAbsents(nbAbsents)
                .nbRetards(nbRetards)
                .enregistrees(enregistrees)
                .sanctions(sanctions)
                .message("Absences enregistrées avec succès")
                .build();
    }

    @Transactional(readOnly = true)
    public List<AbsenceResponse> findByStagiaire(Long stagiaireId) {
        return absenceRepository.findByStagiaireIdOrderByDateAbsenceDesc(stagiaireId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AbsenceResponse> findByGroupe(Long groupeId) {
        return absenceRepository.findByGroupeIdOrderByDate(groupeId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AbsenceResponse> getAppelSeance(String groupeCode, LocalDate date, String creneau) {
        return absenceRepository.findBySeance(groupeCode, date, creneau)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public AbsenceResponse justifier(Long id, String motif, User admin) {
        Absence absence = absenceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Absence non trouvée"));
        absence.setJustifiee(true);
        absence.setMotif(motif);
        return toResponse(absenceRepository.save(absence));
    }

    public Page<Absence> findByStagiaire(Long stagiaireId, Pageable pageable) {
        return absenceRepository.findByStagiaireId(stagiaireId, pageable);
    }



    public long countByStagiaire(Long stagiaireId) {
        return absenceRepository.countByStagiaireId(stagiaireId);
    }

    public long countInjustifiees(Long stagiaireId) {
        return absenceRepository.countByStagiaireIdAndJustifiee(stagiaireId, false);
    }

    @Transactional
    public void delete(Long id, User admin) {
        Absence absence = absenceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Absence non trouvée"));
        absenceRepository.delete(absence);
        auditService.log(admin, "DELETE_ABSENCE", "Absence", id, "Suppression absence");
    }

    private AbsenceResponse toResponse(Absence a) {
        String formateurNom = null;
        if (a.getFormateur() != null) {
            formateurNom = a.getFormateur().getFullName();
        }
        String groupeCode = a.getGroupeCode();
        if (groupeCode == null && a.getStagiaire() != null && a.getStagiaire().getGroupe() != null) {
            groupeCode = a.getStagiaire().getGroupe().getCode();
        }
        return AbsenceResponse.builder()
                .id(a.getId())
                .stagiaireId(a.getStagiaire() != null ? a.getStagiaire().getId() : null)
                .stagiaireNom(a.getStagiaire() != null ? a.getStagiaire().getNom() : null)
                .stagiairePrenom(a.getStagiaire() != null ? a.getStagiaire().getPrenom() : null)
                .groupeCode(groupeCode)
                .jourSemaine(a.getJourSemaine())
                .heureCreneau(a.getHeureCreneau())
                .dateAbsence(a.getDateAbsence())
                .justifiee(a.isJustifiee())
                .type(a.getType())
                .motif(a.getMotif())
                .formateurNom(formateurNom)
                .createdAt(a.getCreatedAt())
                .build();
    }
}
