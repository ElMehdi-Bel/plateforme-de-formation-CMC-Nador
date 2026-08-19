package com.cmc.app.service;

import com.cmc.app.dto.request.ModuleRequest;
import com.cmc.app.entity.Filiere;
import com.cmc.app.entity.Module;
import com.cmc.app.entity.User;
import com.cmc.app.exception.ResourceNotFoundException;
import com.cmc.app.repository.FiliereRepository;
import com.cmc.app.repository.ModuleRepository;
import com.cmc.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ModuleService {

    private final ModuleRepository moduleRepository;
    private final FiliereRepository filiereRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Transactional
    public Module create(ModuleRequest req, User admin) {
        Filiere filiere = filiereRepository.findById(req.getFiliereId())
                .orElseThrow(() -> new ResourceNotFoundException("Filière non trouvée"));

        Module module = Module.builder()
                .nom(req.getNom())
                .code(req.getCode())
                .description(req.getDescription())
                .volumeHoraire(req.getVolumeHoraire())
                .anneeFormation(req.getAnneeFormation())
                .coefficient(req.getCoefficient() != null ? req.getCoefficient() : 1.0)
                .filiere(filiere)
                .build();

        Module saved = moduleRepository.save(module);
        auditService.log(admin, "CREATE_MODULE", "Module", saved.getId(), "Création: " + saved.getNom());
        return saved;
    }

    @Transactional
    public Module update(Long id, ModuleRequest req, User admin) {
        Module module = getOrThrow(id);
        Filiere filiere = filiereRepository.findById(req.getFiliereId())
                .orElseThrow(() -> new ResourceNotFoundException("Filière non trouvée"));

        module.setNom(req.getNom());
        module.setCode(req.getCode());
        module.setDescription(req.getDescription());
        module.setVolumeHoraire(req.getVolumeHoraire());
        module.setAnneeFormation(req.getAnneeFormation());
        module.setCoefficient(req.getCoefficient() != null ? req.getCoefficient() : 1.0);
        module.setFiliere(filiere);

        Module saved = moduleRepository.save(module);
        auditService.log(admin, "UPDATE_MODULE", "Module", id, "Modification: " + saved.getNom());
        return saved;
    }

    @Transactional
    public Module assignFormateur(Long moduleId, Long formateurId, User admin) {
        Module module = getOrThrow(moduleId);
        User formateur = userRepository.findById(formateurId)
                .orElseThrow(() -> new ResourceNotFoundException("Formateur non trouvé: " + formateurId));
        module.setFormateur(formateur);
        Module saved = moduleRepository.save(module);
        auditService.log(admin, "ASSIGN_FORMATEUR", "Module", moduleId,
                "Formateur assigné: " + formateur.getFullName() + " → " + module.getNom());
        return saved;
    }

    @Transactional
    public void removeFormateur(Long moduleId, User admin) {
        Module module = getOrThrow(moduleId);
        auditService.log(admin, "REMOVE_FORMATEUR", "Module", moduleId, "Formateur retiré de: " + module.getNom());
        module.setFormateur(null);
        moduleRepository.save(module);
    }

    @Transactional
    public void delete(Long id, User admin) {
        Module module = getOrThrow(id);
        auditService.log(admin, "DELETE_MODULE", "Module", id, "Suppression: " + module.getNom());
        moduleRepository.delete(module);
    }

    public List<Module> findByFiliere(Long filiereId) {
        return moduleRepository.findByFiliereIdOrderByAnneeFormationAscNomAsc(filiereId);
    }

    public List<Module> findAll() {
        return moduleRepository.findAll();
    }

    public List<Module> findByGroupe(Long groupeId) {
        return moduleRepository.findByGroupeId(groupeId);
    }

    public List<Module> findByFormateur(Long formateurId) {
        return moduleRepository.findByFormateurId(formateurId);
    }

    private Module getOrThrow(Long id) {
        return moduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Module non trouvé: " + id));
    }
}
