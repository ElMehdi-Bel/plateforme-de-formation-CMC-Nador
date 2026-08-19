package com.cmc.app.service;

import com.cmc.app.dto.request.GroupeRequest;
import com.cmc.app.entity.Filiere;
import com.cmc.app.entity.Groupe;
import com.cmc.app.entity.Module;
import com.cmc.app.entity.User;
import com.cmc.app.exception.ResourceNotFoundException;
import com.cmc.app.repository.FiliereRepository;
import com.cmc.app.repository.GroupeRepository;
import com.cmc.app.repository.ModuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GroupeService {

    private final GroupeRepository groupeRepository;
    private final FiliereRepository filiereRepository;
    private final ModuleRepository moduleRepository;
    private final AuditService auditService;

    @Transactional
    public Groupe create(GroupeRequest request, User admin) {
        Filiere filiere = filiereRepository.findById(request.getFiliereId())
                .orElseThrow(() -> new ResourceNotFoundException("Filière non trouvée"));

        Groupe groupe = Groupe.builder()
                .nom(request.getNom())
                .code(request.getCode())
                .anneeFormation(request.getAnneeFormation())
                .dateDebut(request.getDateDebut())
                .dateFin(request.getDateFin())
                .filiere(filiere)
                .build();

        Groupe saved = groupeRepository.save(groupe);
        auditService.log(admin, "CREATE_GROUPE", "Groupe", saved.getId(), "Création: " + saved.getNom());
        // Recharger avec filière pour la sérialisation JSON (évite LazyInitializationException)
        return groupeRepository.findByIdWithFiliere(saved.getId()).orElse(saved);
    }

    @Transactional
    public Groupe update(Long id, GroupeRequest request, User admin) {
        Groupe groupe = getOrThrow(id);
        Filiere filiere = filiereRepository.findById(request.getFiliereId())
                .orElseThrow(() -> new ResourceNotFoundException("Filière non trouvée"));

        groupe.setNom(request.getNom());
        groupe.setCode(request.getCode());
        groupe.setAnneeFormation(request.getAnneeFormation());
        groupe.setDateDebut(request.getDateDebut());
        groupe.setDateFin(request.getDateFin());
        groupe.setFiliere(filiere);

        Groupe saved = groupeRepository.save(groupe);
        return groupeRepository.findByIdWithFiliere(saved.getId()).orElse(saved);
    }

    @Transactional(readOnly = true)
    public List<Groupe> findAll() {
        return groupeRepository.findAllWithFiliere();
    }

    @Transactional(readOnly = true)
    public List<Groupe> findByFiliere(Long filiereId) {
        return groupeRepository.findByFiliereId(filiereId);
    }

    @Transactional(readOnly = true)
    public List<Groupe> findByFormateur(Long formateurId) {
        return groupeRepository.findGroupesByFormateurId(formateurId);
    }

    @Transactional(readOnly = true)
    public Groupe findById(Long id) {
        return groupeRepository.findByIdWithFiliere(id)
                .orElseThrow(() -> new ResourceNotFoundException("Groupe non trouvé: " + id));
    }

    @Transactional
    public void setModules(Long groupeId, List<Long> moduleIds, User admin) {
        Groupe groupe = getOrThrow(groupeId);
        List<Module> modules = (moduleIds == null || moduleIds.isEmpty())
                ? new ArrayList<>()
                : moduleRepository.findAllById(moduleIds);
        groupe.setModules(modules);
        groupeRepository.save(groupe);
        auditService.log(admin, "SET_GROUPE_MODULES", "Groupe", groupeId,
                modules.size() + " module(s) assigné(s) au groupe " + groupe.getNom());
    }

    @Transactional
    public void delete(Long id, User admin) {
        Groupe groupe = getOrThrow(id);
        groupeRepository.delete(groupe);
        auditService.log(admin, "DELETE_GROUPE", "Groupe", id, "Suppression: " + groupe.getNom());
    }

    private Groupe getOrThrow(Long id) {
        return groupeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Groupe non trouvé: " + id));
    }
}
