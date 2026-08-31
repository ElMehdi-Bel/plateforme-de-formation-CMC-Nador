package com.cmc.app.service;

import com.cmc.app.dto.request.ModuleRequest;
import com.cmc.app.entity.Filiere;
import com.cmc.app.entity.Module;
import com.cmc.app.entity.User;
import com.cmc.app.entity.Groupe;
import com.cmc.app.exception.ResourceNotFoundException;
import com.cmc.app.repository.FiliereRepository;
import com.cmc.app.repository.GroupeRepository;
import com.cmc.app.repository.ModuleRepository;
import com.cmc.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ModuleService {

    private final ModuleRepository moduleRepository;
    private final FiliereRepository filiereRepository;
    private final GroupeRepository groupeRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

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
        User formateur = userRepository.findById(formateurId)
                .orElseThrow(() -> new ResourceNotFoundException("Formateur non trouvé: " + formateurId));
        Module module = doAssign(getOrThrow(moduleId), formateur, admin);
        return module;
    }

    /** Affecte un formateur à plusieurs modules (workflow « par groupe »). */
    @Transactional
    public int assignFormateurBatch(Long formateurId, List<Long> moduleIds, User chef) {
        if (moduleIds == null || moduleIds.isEmpty()) return 0;
        User formateur = userRepository.findById(formateurId)
                .orElseThrow(() -> new ResourceNotFoundException("Formateur non trouvé: " + formateurId));
        int n = 0;
        for (Long id : moduleIds) {
            doAssign(getOrThrow(id), formateur, chef);
            n++;
        }
        return n;
    }

    private Module doAssign(Module module, User formateur, User auteur) {
        module.setFormateur(formateur);
        moduleRepository.save(module);

        // Le formateur enseigne le module aux groupes qui le contiennent.
        // Si le module n'est rattaché à aucun groupe, on le rattache à tous les
        // groupes de sa filière — sinon le formateur n'aurait aucun groupe.
        int rattaches = 0;
        if (module.getGroupes().isEmpty() && module.getFiliere() != null) {
            List<Groupe> groupes = groupeRepository.findByFiliereId(module.getFiliere().getId());
            for (Groupe g : groupes) {
                if (!g.getModules().contains(module)) {
                    g.getModules().add(module);
                    rattaches++;
                }
            }
            groupeRepository.saveAll(groupes);
        }

        auditService.log(auteur, "ASSIGN_FORMATEUR", "Module", module.getId(),
                "Formateur assigné: " + formateur.getFullName() + " → " + module.getNom()
                        + (rattaches > 0 ? " (module rattaché à " + rattaches + " groupe(s))" : ""));
        return module;
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
        return moduleRepository.findAllWithFormateur();
    }

    public List<Module> findNonAffectes() {
        return moduleRepository.findNonAffectes();
    }

    public List<Object[]> chargeParFormateur() {
        return moduleRepository.chargeParFormateur();
    }

    public List<Module> findByGroupe(Long groupeId) {
        return moduleRepository.findByGroupeId(groupeId);
    }

    // ── Affectation « groupe d'abord » ────────────────────────────────────────

    /**
     * Modules proposables pour un groupe = tous les modules de la filière du
     * groupe (le lien direct groupe↔module étant souvent vide, on se base sur la
     * filière, qui est la vraie source du référentiel). Le formateur courant de
     * chaque module est fourni via {@code getFormateurId()/getFormateurNom()}.
     */
    @Transactional(readOnly = true)
    public List<Module> modulesPourGroupe(Long groupeId) {
        Groupe g = groupeRepository.findByIdWithFiliere(groupeId)
                .orElseThrow(() -> new ResourceNotFoundException("Groupe non trouvé: " + groupeId));
        if (g.getFiliere() == null) return List.of();
        return moduleRepository.findByFiliereIdOrderByAnneeFormationAscNomAsc(g.getFiliere().getId());
    }

    /** Ids des modules déjà rattachés au groupe (table groupe_modules). */
    @Transactional(readOnly = true)
    public Set<Long> moduleIdsDuGroupe(Long groupeId) {
        Groupe g = groupeRepository.findByIdWithModules(groupeId)
                .orElseThrow(() -> new ResourceNotFoundException("Groupe non trouvé: " + groupeId));
        return g.getModules().stream().map(Module::getId).collect(Collectors.toSet());
    }

    /**
     * Affecte un formateur aux modules cochés d'un groupe : pose le formateur sur
     * chaque module coché ET rattache le module au groupe. Les modules du groupe
     * qui étaient à ce formateur mais ne sont plus cochés lui sont retirés (le
     * rattachement au groupe est conservé).
     *
     * @return nombre de modules affectés au formateur
     */
    @Transactional
    public int affecterAuGroupe(Long formateurId, Long groupeId, List<Long> moduleIds, User chef) {
        User formateur = userRepository.findById(formateurId)
                .orElseThrow(() -> new ResourceNotFoundException("Formateur non trouvé: " + formateurId));
        Groupe groupe = groupeRepository.findByIdWithModules(groupeId)
                .orElseThrow(() -> new ResourceNotFoundException("Groupe non trouvé: " + groupeId));

        Set<Long> cibles = new HashSet<>(moduleIds != null ? moduleIds : List.of());

        int affectes = 0;
        int rattaches = 0;
        for (Long mid : cibles) {
            Module m = getOrThrow(mid);
            m.setFormateur(formateur);
            moduleRepository.save(m);
            boolean present = groupe.getModules().stream().anyMatch(x -> x.getId().equals(m.getId()));
            if (!present) { groupe.getModules().add(m); rattaches++; }
            affectes++;
        }

        int retires = 0;
        for (Module m : new ArrayList<>(groupe.getModules())) {
            if (!cibles.contains(m.getId())
                    && m.getFormateur() != null
                    && m.getFormateur().getId().equals(formateurId)) {
                m.setFormateur(null);
                moduleRepository.save(m);
                retires++;
            }
        }

        groupeRepository.save(groupe);

        auditService.log(chef, "AFFECTER_GROUPE", "Groupe", groupeId,
                "Formateur " + formateur.getFullName() + " → " + affectes + " module(s) du groupe "
                        + groupe.getNom()
                        + (rattaches > 0 ? " (" + rattaches + " rattaché(s) au groupe)" : "")
                        + (retires > 0 ? " (" + retires + " retiré(s))" : ""));

        if (affectes > 0) {
            notificationService.envoyer(chef, formateur, "Nouvelle affectation",
                    "Vous enseignez désormais " + affectes + " module(s) du groupe " + groupe.getNom() + ".",
                    "AFFECTATION");
        }
        return affectes;
    }

    public List<Module> findByFormateur(Long formateurId) {
        return moduleRepository.findByFormateurId(formateurId);
    }

    private Module getOrThrow(Long id) {
        return moduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Module non trouvé: " + id));
    }
}
