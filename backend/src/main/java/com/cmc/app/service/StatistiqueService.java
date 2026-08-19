package com.cmc.app.service;

import com.cmc.app.enums.Role;
import com.cmc.app.enums.StatutDemande;
import com.cmc.app.repository.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatistiqueService {

    private final UserRepository userRepository;
    private final FiliereRepository filiereRepository;
    private final GroupeRepository groupeRepository;
    private final DemandeRepository demandeRepository;
    private final AbsenceRepository absenceRepository;
    private final NoteRepository noteRepository;

    public DashboardStats getDashboardStats() {
        return DashboardStats.builder()
                .totalStagiaires(userRepository.countByRoleAndActif(Role.STAGIAIRE))
                .totalFormateurs(userRepository.countByRoleAndActif(Role.FORMATEUR))
                .totalFilieres(filiereRepository.count())
                .totalGroupes(groupeRepository.count())
                .demandesEnAttente(demandeRepository.countByStatut(StatutDemande.EN_ATTENTE))
                .build();
    }

    public AvanceesStats getAvanceesStats() {
        long absJust    = absenceRepository.countByJustifiee(true);
        long absNonJust = absenceRepository.countByJustifiee(false);

        LocalDate since = LocalDate.now().minusMonths(5).withDayOfMonth(1);
        List<StatParMois> absParMois = absenceRepository.countParMois(since).stream()
                .map(row -> new StatParMois(
                        ((Number) row[0]).intValue(),
                        ((Number) row[1]).intValue(),
                        ((Number) row[2]).longValue()))
                .collect(Collectors.toList());

        List<StatParLabel> demandesParType = demandeRepository.countParType().stream()
                .map(row -> new StatParLabel(row[0].toString(), ((Number) row[1]).longValue()))
                .collect(Collectors.toList());

        List<StatParLabel> demandesParStatut = demandeRepository.countParStatut().stream()
                .map(row -> new StatParLabel(row[0].toString(), ((Number) row[1]).longValue()))
                .collect(Collectors.toList());

        Double moyenne = noteRepository.findMoyenneGlobale().orElse(null);

        return AvanceesStats.builder()
                .totalStagiaires(userRepository.countByRoleAndActif(Role.STAGIAIRE))
                .totalFormateurs(userRepository.countByRoleAndActif(Role.FORMATEUR))
                .totalFilieres(filiereRepository.count())
                .totalGroupes(groupeRepository.count())
                .demandesEnAttente(demandeRepository.countByStatut(StatutDemande.EN_ATTENTE))
                .totalAbsences(absJust + absNonJust)
                .absencesJustifiees(absJust)
                .absencesNonJustifiees(absNonJust)
                .moyenneGlobale(moyenne != null ? Math.round(moyenne * 100.0) / 100.0 : null)
                .absencesParMois(absParMois)
                .demandesParType(demandesParType)
                .demandesParStatut(demandesParStatut)
                .build();
    }

    @Data @Builder
    public static class DashboardStats {
        private long totalStagiaires;
        private long totalFormateurs;
        private long totalFilieres;
        private long totalGroupes;
        private long demandesEnAttente;
    }

    @Data @Builder
    public static class AvanceesStats {
        private long totalStagiaires;
        private long totalFormateurs;
        private long totalFilieres;
        private long totalGroupes;
        private long demandesEnAttente;
        private long totalAbsences;
        private long absencesJustifiees;
        private long absencesNonJustifiees;
        private Double moyenneGlobale;
        private List<StatParMois> absencesParMois;
        private List<StatParLabel> demandesParType;
        private List<StatParLabel> demandesParStatut;
    }

    @Data @AllArgsConstructor
    public static class StatParMois {
        private int mois;
        private int annee;
        private long count;
    }

    @Data @AllArgsConstructor
    public static class StatParLabel {
        private String label;
        private long count;
    }
}
