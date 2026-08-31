package com.cmc.app.service;

import com.cmc.app.dto.request.EmploiRequest;
import com.cmc.app.dto.request.EmploiSeanceRequest;
import com.cmc.app.entity.EmploiDuTemps;
import com.cmc.app.entity.Groupe;
import com.cmc.app.entity.Module;
import com.cmc.app.entity.User;
import com.cmc.app.enums.StatutEmploi;
import com.cmc.app.exception.ResourceNotFoundException;
import com.cmc.app.repository.EmploiDuTempsRepository;
import com.cmc.app.repository.GroupeRepository;
import com.cmc.app.repository.ModuleRepository;
import com.cmc.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EmploiService {

    private final EmploiDuTempsRepository emploiRepository;
    private final GroupeRepository groupeRepository;
    private final ModuleRepository moduleRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    @Transactional
    public EmploiDuTemps create(EmploiRequest request, User admin) {
        Groupe groupe = groupeRepository.findById(request.getGroupeId())
                .orElseThrow(() -> new ResourceNotFoundException("Groupe non trouvé"));
        Module module = moduleRepository.findById(request.getModuleId())
                .orElseThrow(() -> new ResourceNotFoundException("Module non trouvé"));
        User formateur = userRepository.findById(request.getFormateurId())
                .orElseThrow(() -> new ResourceNotFoundException("Formateur non trouvé"));

        EmploiDuTemps emploi = EmploiDuTemps.builder()
                .groupe(groupe)
                .module(module)
                .formateur(formateur)
                .dateSeance(request.getDateSeance())
                .heureDebut(request.getHeureDebut())
                .heureFin(request.getHeureFin())
                .salle(request.getSalle())
                .jourSemaine(request.getDateSeance().getDayOfWeek().name())
                .build();

        EmploiDuTemps saved = emploiRepository.save(emploi);
        auditService.log(admin, "CREATE_EMPLOI", "EmploiDuTemps", saved.getId(),
                "Séance créée pour groupe " + groupe.getNom());
        return saved;
    }

    public List<EmploiDuTemps> findByGroupe(Long groupeId) {
        return emploiRepository.findByGroupeId(groupeId);
    }

    public List<EmploiDuTemps> findByFormateur(Long formateurId) {
        return emploiRepository.findByFormateurId(formateurId);
    }

    public List<EmploiDuTemps> findByAnneeAndFormateurNom(String annee, String nom) {
        return emploiRepository.findByAnneeAndFormateurNomOrdered(annee, nom);
    }

    public List<EmploiDuTemps> findByGroupeAndPeriode(Long groupeId, LocalDate debut, LocalDate fin) {
        return emploiRepository.findByGroupeIdAndPeriode(groupeId, debut, fin);
    }

    @Transactional
    public EmploiDuTemps createSeance(EmploiSeanceRequest request, User admin) {
        Groupe groupe = groupeRepository.findById(request.getGroupeId())
                .orElseThrow(() -> new ResourceNotFoundException("Groupe non trouvé"));
        Module module = moduleRepository.findById(request.getModuleId())
                .orElseThrow(() -> new ResourceNotFoundException("Module non trouvé"));
        User formateur = userRepository.findById(request.getFormateurId())
                .orElseThrow(() -> new ResourceNotFoundException("Formateur non trouvé"));

        CreneauDetails cd = resolveCreneauDetails(request.getCreneauKey());
        String annee = request.getAnneeScolaire() != null ? request.getAnneeScolaire() : "2025-2026";

        String groupeCode = groupe.getCode() != null ? groupe.getCode() : groupe.getNom();
        assertNoConflit(annee, request.getJourSemaine().toUpperCase(), cd.label(),
                request.getSalle(), groupeCode, formateur.getFullName(), null);

        EmploiDuTemps seance = EmploiDuTemps.builder()
                .groupe(groupe)
                .module(module)
                .formateur(formateur)
                .groupeCode(groupeCode)
                .moduleNom(module.getNom())
                .formateurNom(formateur.getFullName())
                .jourSemaine(request.getJourSemaine().toUpperCase())
                .heureDebut(cd.debut())
                .heureFin(cd.fin())
                .creneau(cd.label())
                .salle(request.getSalle())
                .anneeScolaire(annee)
                .build();

        EmploiDuTemps saved = emploiRepository.save(seance);
        auditService.log(admin, "CREATE_SEANCE", "EmploiDuTemps", saved.getId(),
                "Séance créée: " + groupe.getNom() + " " + request.getJourSemaine() + " " + cd.label());
        return saved;
    }

    @Transactional
    public EmploiDuTemps updateSeance(Long id, EmploiSeanceRequest request, User admin) {
        EmploiDuTemps seance = emploiRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Séance non trouvée"));

        Groupe groupe = groupeRepository.findById(request.getGroupeId())
                .orElseThrow(() -> new ResourceNotFoundException("Groupe non trouvé"));
        Module module = moduleRepository.findById(request.getModuleId())
                .orElseThrow(() -> new ResourceNotFoundException("Module non trouvé"));
        User formateur = userRepository.findById(request.getFormateurId())
                .orElseThrow(() -> new ResourceNotFoundException("Formateur non trouvé"));

        CreneauDetails cd = resolveCreneauDetails(request.getCreneauKey());
        String annee = request.getAnneeScolaire() != null ? request.getAnneeScolaire() : seance.getAnneeScolaire();
        String groupeCode = groupe.getCode() != null ? groupe.getCode() : groupe.getNom();
        assertNoConflit(annee, request.getJourSemaine().toUpperCase(), cd.label(),
                request.getSalle(), groupeCode, formateur.getFullName(), id);

        seance.setGroupe(groupe);
        seance.setModule(module);
        seance.setFormateur(formateur);
        seance.setGroupeCode(groupeCode);
        seance.setModuleNom(module.getNom());
        seance.setFormateurNom(formateur.getFullName());
        seance.setJourSemaine(request.getJourSemaine().toUpperCase());
        seance.setHeureDebut(cd.debut());
        seance.setHeureFin(cd.fin());
        seance.setCreneau(cd.label());
        seance.setSalle(request.getSalle());
        if (request.getAnneeScolaire() != null) {
            seance.setAnneeScolaire(request.getAnneeScolaire());
        }

        EmploiDuTemps saved = emploiRepository.save(seance);
        auditService.log(admin, "UPDATE_SEANCE", "EmploiDuTemps", id,
                "Séance modifiée: " + groupe.getNom() + " " + request.getJourSemaine() + " " + cd.label());
        return saved;
    }

    @Transactional
    public void delete(Long id, User admin) {
        EmploiDuTemps emploi = emploiRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Séance non trouvée"));
        emploiRepository.delete(emploi);
        auditService.log(admin, "DELETE_EMPLOI", "EmploiDuTemps", id, "Suppression séance");
    }

    /**
     * Valide une séance d'emploi du temps (Chef de pôle / Admin).
     * Passe le statut à VALIDE et trace le validateur.
     */
    @Transactional
    public EmploiDuTemps valider(Long id, User chef) {
        EmploiDuTemps seance = emploiRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Séance non trouvée"));
        seance.setStatut(StatutEmploi.VALIDE);
        seance.setValidePar(chef);
        seance.setValideParNom(chef.getFullName());
        seance.setDateValidation(java.time.LocalDateTime.now());
        EmploiDuTemps saved = emploiRepository.save(seance);
        auditService.log(chef, "VALIDER_EMPLOI", "EmploiDuTemps", id,
                "Séance validée: " + (seance.getGroupeCode() != null ? seance.getGroupeCode() : id));
        if (seance.getFormateur() != null) {
            notificationService.envoyer(chef, seance.getFormateur(), "Emploi du temps validé",
                    "Votre séance " + nz(seance.getGroupeCode()) + " " + nz(seance.getJourSemaine())
                            + " " + nz(seance.getCreneau()) + " a été validée.", "EMPLOI");
        }
        return saved;
    }

    // ─── Validation par lot ─────────────────────────────────────────────────
    /** Valide toutes les séances BROUILLON d'une année (option: d'un seul groupe). */
    @Transactional
    public int validerLot(String annee, String groupeCode, User chef) {
        String gc = (groupeCode == null || groupeCode.isBlank()) ? null : groupeCode;
        List<EmploiDuTemps> aValider = emploiRepository.findToValidate(annee, StatutEmploi.BROUILLON, gc);
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        for (EmploiDuTemps e : aValider) {
            e.setStatut(StatutEmploi.VALIDE);
            e.setValidePar(chef);
            e.setValideParNom(chef.getFullName());
            e.setDateValidation(now);
        }
        emploiRepository.saveAll(aValider);
        auditService.log(chef, "VALIDER_EMPLOI_LOT", "EmploiDuTemps", null,
                aValider.size() + " séance(s) validée(s) (" + annee + (gc != null ? " / " + gc : "") + ")");
        return aValider.size();
    }

    // ─── Détection de conflits ──────────────────────────────────────────────
    /** Lève une exception si le créneau est déjà occupé par la même salle, le même groupe ou le même formateur. */
    private void assertNoConflit(String annee, String jour, String creneau,
                                 String salle, String groupeCode, String formateurNom, Long excludeId) {
        List<EmploiDuTemps> memeCreneau =
                emploiRepository.findByAnneeScolaireAndJourSemaineAndCreneau(annee, jour, creneau);
        for (EmploiDuTemps e : memeCreneau) {
            if (excludeId != null && excludeId.equals(e.getId())) continue;
            if (salle != null && !salle.isBlank() && salle.equalsIgnoreCase(e.getSalle())) {
                throw new IllegalStateException("Conflit : la salle " + salle + " est déjà occupée le "
                        + jour + " (" + creneau + ") par le groupe " + nz(e.getGroupeCode()) + ".");
            }
            if (groupeCode != null && groupeCode.equalsIgnoreCase(e.getGroupeCode())) {
                throw new IllegalStateException("Conflit : le groupe " + groupeCode + " a déjà une séance le "
                        + jour + " (" + creneau + ").");
            }
            if (formateurNom != null && formateurNom.equalsIgnoreCase(e.getFormateurNom())) {
                throw new IllegalStateException("Conflit : le formateur " + formateurNom
                        + " a déjà une séance le " + jour + " (" + creneau + ").");
            }
        }
    }

    /** Liste tous les chevauchements existants dans la grille (salle / groupe / formateur). */
    public List<Conflit> listConflits(String annee) {
        List<EmploiDuTemps> all = emploiRepository.findAllByAnneeScolaireOrdered(annee);
        java.util.Map<String, List<EmploiDuTemps>> parCreneau = new java.util.LinkedHashMap<>();
        for (EmploiDuTemps e : all) {
            parCreneau.computeIfAbsent(nz(e.getJourSemaine()) + "|" + nz(e.getCreneau()),
                    k -> new ArrayList<>()).add(e);
        }
        List<Conflit> conflits = new ArrayList<>();
        for (var entry : parCreneau.entrySet()) {
            List<EmploiDuTemps> bucket = entry.getValue();
            for (int i = 0; i < bucket.size(); i++) {
                for (int j = i + 1; j < bucket.size(); j++) {
                    EmploiDuTemps a = bucket.get(i), b = bucket.get(j);
                    String[] kv = entry.getKey().split("\\|", 2);
                    if (a.getSalle() != null && a.getSalle().equalsIgnoreCase(b.getSalle())) {
                        conflits.add(new Conflit("SALLE", a.getSalle(), kv[0], kv.length > 1 ? kv[1] : "",
                                nz(a.getGroupeCode()) + " ↔ " + nz(b.getGroupeCode())));
                    }
                    if (a.getGroupeCode() != null && a.getGroupeCode().equalsIgnoreCase(b.getGroupeCode())) {
                        conflits.add(new Conflit("GROUPE", nz(a.getGroupeCode()), kv[0], kv.length > 1 ? kv[1] : "",
                                nz(a.getModuleNom()) + " ↔ " + nz(b.getModuleNom())));
                    }
                    if (a.getFormateurNom() != null && a.getFormateurNom().equalsIgnoreCase(b.getFormateurNom())) {
                        conflits.add(new Conflit("FORMATEUR", nz(a.getFormateurNom()), kv[0], kv.length > 1 ? kv[1] : "",
                                nz(a.getGroupeCode()) + " ↔ " + nz(b.getGroupeCode())));
                    }
                }
            }
        }
        return conflits;
    }

    public record Conflit(String type, String cible, String jour, String creneau, String detail) {}

    private static String nz(String s) { return s != null ? s : ""; }

    private record CreneauDetails(LocalTime debut, LocalTime fin, String label) {}

    private CreneauDetails resolveCreneauDetails(String creneauKey) {
        return switch (creneauKey.toUpperCase()) {
            case "08H30" -> new CreneauDetails(LocalTime.of(8, 30),  LocalTime.of(11, 0),  "08H30 --> 11H00");
            case "11H00" -> new CreneauDetails(LocalTime.of(11, 0),  LocalTime.of(13, 30), "11H00 --> 13H30");
            case "13H30" -> new CreneauDetails(LocalTime.of(13, 30), LocalTime.of(16, 0),  "13H30 --> 16H00");
            case "16H00" -> new CreneauDetails(LocalTime.of(16, 0),  LocalTime.of(18, 30), "16H00 --> 18H30");
            default -> throw new IllegalArgumentException("Créneau invalide : " + creneauKey);
        };
    }
}
