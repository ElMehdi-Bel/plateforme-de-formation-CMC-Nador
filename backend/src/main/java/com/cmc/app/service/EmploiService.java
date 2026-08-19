package com.cmc.app.service;

import com.cmc.app.dto.request.EmploiRequest;
import com.cmc.app.entity.EmploiDuTemps;
import com.cmc.app.entity.Groupe;
import com.cmc.app.entity.Module;
import com.cmc.app.entity.User;
import com.cmc.app.exception.ResourceNotFoundException;
import com.cmc.app.repository.EmploiDuTempsRepository;
import com.cmc.app.repository.GroupeRepository;
import com.cmc.app.repository.ModuleRepository;
import com.cmc.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EmploiService {

    private final EmploiDuTempsRepository emploiRepository;
    private final GroupeRepository groupeRepository;
    private final ModuleRepository moduleRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

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

    public List<EmploiDuTemps> findByGroupeAndPeriode(Long groupeId, LocalDate debut, LocalDate fin) {
        return emploiRepository.findByGroupeIdAndPeriode(groupeId, debut, fin);
    }

    @Transactional
    public void delete(Long id, User admin) {
        EmploiDuTemps emploi = emploiRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Séance non trouvée"));
        emploiRepository.delete(emploi);
        auditService.log(admin, "DELETE_EMPLOI", "EmploiDuTemps", id, "Suppression séance");
    }
}
