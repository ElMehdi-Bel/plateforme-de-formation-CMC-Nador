package com.cmc.app.service;

import com.cmc.app.entity.SanctionDiscipline;
import com.cmc.app.entity.User;
import com.cmc.app.enums.Role;
import com.cmc.app.exception.ResourceNotFoundException;
import com.cmc.app.repository.AbsenceRepository;
import com.cmc.app.repository.IncidentDisciplineRepository;
import com.cmc.app.repository.SanctionDisciplineRepository;
import com.cmc.app.repository.UserRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * « Grille de notation de l'Assiduité et du Comportement »
 * (NOTE DE DISCIPLINE — Examens de Passage et de Fin de Formation).
 *
 * Barème (légende de la grille) :
 *   1 séance = 2,5 h ; 1 journée = 5 h (soit 2 séances)
 *   1 retard              = -0,25 point
 *   1 absence d'1 séance  = -0,50 point
 *   Assiduité   : sur 10 points
 *   Comportement: sur 5 points (−1 par indiscipline, cumulatif)
 *   Note de discipline (ND) = assiduité + comportement, sur 15 points
 *   Examen de Passage         : ND pondérée sur 20  = ND × 20 / 15
 *   Examen de Fin de Formation: ND conservée sur 15 (non pondérée)
 */
@Service
@RequiredArgsConstructor
public class DisciplineService {

    private final AbsenceRepository absenceRepository;
    private final IncidentDisciplineRepository incidentRepository;
    private final SanctionDisciplineRepository sanctionRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;

    private static final double PENALITE_RETARD  = 0.25;
    private static final double PENALITE_SEANCE  = 0.50;
    private static final double ASSIDUITE_MAX    = 10.0;
    private static final double COMPORTEMENT_MAX = 5.0;
    // 1 journée = 2 séances d'absence
    private static final double SEANCES_PAR_JOURNEE = 2.0;

    @Transactional(readOnly = true)
    public DisciplineBilan pourStagiaire(Long stagiaireId) {
        User s = userRepository.findById(stagiaireId)
                .orElseThrow(() -> new ResourceNotFoundException("Stagiaire non trouvé: " + stagiaireId));

        long nbRetards          = absenceRepository.countByStagiaireIdAndType(stagiaireId, "RETARD");
        long nbAbsencesSeances  = absenceRepository.countByStagiaireIdAndTypeAndJustifiee(stagiaireId, "ABSENCE", false);
        long nbAbsencesJustif   = absenceRepository.countByStagiaireIdAndTypeAndJustifiee(stagiaireId, "ABSENCE", true);
        long nbIncidents        = incidentRepository.countByStagiaireId(stagiaireId);

        double heuresAbsence = nbAbsencesSeances * 2.5;
        double nbJournees    = nbAbsencesSeances / SEANCES_PAR_JOURNEE;

        double deductionAssiduite = round2(Math.min(ASSIDUITE_MAX,
                nbRetards * PENALITE_RETARD + nbAbsencesSeances * PENALITE_SEANCE));
        double noteAssiduite = round2(Math.max(0, ASSIDUITE_MAX - deductionAssiduite));

        double deductionComportement = Math.min(COMPORTEMENT_MAX, nbIncidents);
        double noteComportement = Math.max(0, COMPORTEMENT_MAX - deductionComportement);

        double noteDiscipline = round2(noteAssiduite + noteComportement);        // /15
        double noteDisciplineSur20 = round2(noteDiscipline * 20.0 / 15.0);       // /20 (Passage)

        // Palier d'assiduité (1..10) : atteint si nbRetards >= 4n OU nbJournees >= n
        int palier = 0;
        for (int n = 1; n <= 10; n++) {
            if (nbRetards >= 4L * n || nbJournees >= n) palier = n;
        }
        boolean exclusionDefinitive = nbRetards > 40 || nbJournees > 10;

        String[] sancA = sanctionAssiduite(palier, exclusionDefinitive);
        String[] sancC = sanctionComportement((int) nbIncidents);

        return DisciplineBilan.builder()
                .stagiaireId(s.getId())
                .stagiaireNom(s.getFullName())
                .nbRetards(nbRetards)
                .nbAbsencesSeances(nbAbsencesSeances)
                .nbAbsencesJustifiees(nbAbsencesJustif)
                .heuresAbsence(round2(heuresAbsence))
                .nbJournees(round2(nbJournees))
                .nbIncidents(nbIncidents)
                .deductionAssiduite(deductionAssiduite)
                .noteAssiduite(noteAssiduite)
                .deductionComportement(deductionComportement)
                .noteComportement(noteComportement)
                .noteDiscipline(noteDiscipline)
                .noteDisciplineSur20(noteDisciplineSur20)
                .palierAssiduite(palier)
                .sanctionAssiduite(sancA[0])
                .autoriteAssiduite(sancA[1])
                .sanctionComportement(sancC[0])
                .autoriteComportement(sancC[1])
                .exclusionDefinitive(exclusionDefinitive)
                .build();
    }

    private static String[] sanctionAssiduite(int palier, boolean exclusionDefinitive) {
        if (exclusionDefinitive) return new String[]{"Exclusion définitive", "CD"};
        return switch (palier) {
            case 0  -> new String[]{"Aucune", "-"};
            case 1  -> new String[]{"1ère mise en garde", "SG"};
            case 2  -> new String[]{"2ème mise en garde", "SG"};
            case 3  -> new String[]{"1er avertissement", "D"};
            case 4  -> new String[]{"2ème avertissement", "D"};
            case 5  -> new String[]{"Blâme", "CD"};
            case 6  -> new String[]{"Exclusion de 2 jours", "CD"};
            default -> new String[]{"Exclusion temporaire ou définitive (appréciation du Conseil de Discipline)", "CD"};
        };
    }

    private static String[] sanctionComportement(int nbIncidents) {
        return switch (Math.min(nbIncidents, 5)) {
            case 0 -> new String[]{"Aucune", "-"};
            case 1 -> new String[]{"Mise en garde", "SG"};
            case 2 -> new String[]{"Avertissement", "D"};
            case 3 -> new String[]{"Blâme", "CD"};
            case 4 -> new String[]{"Exclusion de 2 jours", "CD"};
            default -> new String[]{"Exclusion définitive", "CD"};
        };
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Détermination + application des sanctions (diagramme Gestion des absences)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Évalue si un nouveau palier de sanction est franchi (assiduité et/ou
     * comportement) par rapport aux sanctions déjà enregistrées. Le cas échéant :
     * enregistre la sanction, notifie le stagiaire, et — selon la gravité —
     * alerte le Conseil de Discipline ou le gestionnaire.
     */
    @Transactional
    public List<SanctionDiscipline> evaluerEtAppliquerSanctions(Long stagiaireId, User declencheur, String motif) {
        User stagiaire = userRepository.findById(stagiaireId)
                .orElseThrow(() -> new ResourceNotFoundException("Stagiaire non trouvé: " + stagiaireId));
        DisciplineBilan b = pourStagiaire(stagiaireId);
        List<SanctionDiscipline> nouvelles = new ArrayList<>();

        // Palier « exclusion définitive » = 11 (sentinelle au-delà des 10 paliers de la grille)
        int palierAssiduite = b.isExclusionDefinitive() ? 11 : b.getPalierAssiduite();
        if (palierAssiduite > 0 && palierAssiduite > sanctionRepository.maxPalier(stagiaireId, "ASSIDUITE")) {
            nouvelles.add(appliquer(stagiaire, "ASSIDUITE", palierAssiduite,
                    b.getSanctionAssiduite(), b.getAutoriteAssiduite(),
                    b.isExclusionDefinitive(), b, declencheur, motif));
        }

        int palierComportement = (int) Math.min(5, b.getNbIncidents());
        if (palierComportement > 0 && palierComportement > sanctionRepository.maxPalier(stagiaireId, "COMPORTEMENT")) {
            boolean exclusionComp = palierComportement >= 5;
            nouvelles.add(appliquer(stagiaire, "COMPORTEMENT", palierComportement,
                    b.getSanctionComportement(), b.getAutoriteComportement(),
                    exclusionComp, b, declencheur, motif));
        }
        return nouvelles;
    }

    private SanctionDiscipline appliquer(User stagiaire, String type, int palier,
                                         String sanction, String autorite, boolean exclusionDefinitive,
                                         DisciplineBilan b, User declencheur, String motif) {
        SanctionDiscipline s = SanctionDiscipline.builder()
                .stagiaire(stagiaire)
                .type(type)
                .palier(palier)
                .sanction(sanction)
                .autorite(autorite)
                .noteAssiduite(b.getNoteAssiduite())
                .noteDiscipline(b.getNoteDiscipline())
                .exclusionDefinitive(exclusionDefinitive)
                .conseilAlerte(exclusionDefinitive || "CD".equals(autorite))
                .motif(motif)
                .declenchePar(declencheur)
                .declencheParNom(declencheur != null ? declencheur.getFullName() : null)
                .build();
        s = sanctionRepository.save(s);

        // Notification au stagiaire
        notificationService.envoyer(declencheur, stagiaire,
                "Sanction disciplinaire — " + ("ASSIDUITE".equals(type) ? "assiduité" : "comportement"),
                sanction + " (décision : " + autoriteLibelle(autorite) + "). "
                        + "Note d'assiduité : " + b.getNoteAssiduite() + "/10.", "SANCTION");

        // Exclusion définitive → alerter le Conseil de Discipline ; sinon informer le gestionnaire
        String titre = exclusionDefinitive
                ? "URGENT — Conseil de Discipline"
                : "Sanction disciplinaire à suivre";
        String msg = (exclusionDefinitive
                ? "Exclusion définitive à examiner pour "
                : "Sanction appliquée à ") + stagiaire.getFullName() + " : " + sanction
                + " (" + autoriteLibelle(autorite) + ").";
        for (User g : userRepository.findByRole(Role.GESTIONNAIRE)) {
            notificationService.envoyer(declencheur, g, titre, msg, "SANCTION");
        }

        auditService.log(declencheur, exclusionDefinitive ? "ALERTE_CONSEIL_DISCIPLINE" : "SANCTION_DISCIPLINE",
                "SanctionDiscipline", s.getId(),
                stagiaire.getFullName() + " — " + sanction + " (" + type + " palier " + palier + ")");
        return s;
    }

    private static String autoriteLibelle(String a) {
        return switch (a) {
            case "SG" -> "Surveillant Général";
            case "D"  -> "Directeur";
            case "CD" -> "Conseil de Discipline";
            default   -> a;
        };
    }

    @Transactional(readOnly = true)
    public List<SanctionDiscipline> sanctionsPourStagiaire(Long stagiaireId) {
        return sanctionRepository.findByStagiaireIdOrderByCreatedAtDesc(stagiaireId);
    }

    @Transactional(readOnly = true)
    public List<SanctionDiscipline> sanctionsRecentes(int limit) {
        return sanctionRepository.findRecent(org.springframework.data.domain.PageRequest.of(0, limit));
    }

    @Data
    @Builder
    public static class DisciplineBilan {
        private Long stagiaireId;
        private String stagiaireNom;
        // Assiduité
        private long nbRetards;
        private long nbAbsencesSeances;
        private long nbAbsencesJustifiees;
        private double heuresAbsence;
        private double nbJournees;
        private double deductionAssiduite;
        private double noteAssiduite;          // /10
        private int palierAssiduite;
        private String sanctionAssiduite;
        private String autoriteAssiduite;
        // Comportement
        private long nbIncidents;
        private double deductionComportement;
        private double noteComportement;       // /5
        private String sanctionComportement;
        private String autoriteComportement;
        // Synthèse
        private double noteDiscipline;         // /15
        private double noteDisciplineSur20;    // /20 (examen de passage)
        private boolean exclusionDefinitive;
    }
}
