package com.cmc.app.service;

import com.cmc.app.dto.request.PoleRequest;
import com.cmc.app.entity.Pole;
import com.cmc.app.entity.User;
import com.cmc.app.exception.ResourceAlreadyExistsException;
import com.cmc.app.exception.ResourceNotFoundException;
import com.cmc.app.repository.PoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PoleService {

    private final PoleRepository poleRepository;
    private final AuditService auditService;

    @Transactional
    public Pole create(PoleRequest request, User admin) {
        if (poleRepository.existsByNom(request.getNom())) {
            throw new ResourceAlreadyExistsException("Un pôle avec ce nom existe déjà");
        }
        Pole pole = Pole.builder()
                .nom(request.getNom())
                .code(request.getCode())
                .description(request.getDescription())
                .chefNom(request.getChefNom())
                .build();
        Pole saved = poleRepository.save(pole);
        auditService.log(admin, "CREATE_POLE", "Pole", saved.getId(), "Création: " + saved.getNom());
        return saved;
    }

    @Transactional
    public Pole update(Long id, PoleRequest request, User admin) {
        Pole pole = getOrThrow(id);
        pole.setNom(request.getNom());
        pole.setCode(request.getCode());
        pole.setDescription(request.getDescription());
        pole.setChefNom(request.getChefNom());
        Pole saved = poleRepository.save(pole);
        auditService.log(admin, "UPDATE_POLE", "Pole", id, "Modification: " + saved.getNom());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Pole> findAll() {
        return poleRepository.findAllOrdered();
    }

    public Pole findById(Long id) {
        return getOrThrow(id);
    }

    @Transactional
    public void delete(Long id, User admin) {
        Pole pole = getOrThrow(id);
        poleRepository.delete(pole);
        auditService.log(admin, "DELETE_POLE", "Pole", id, "Suppression: " + pole.getNom());
    }

    private Pole getOrThrow(Long id) {
        return poleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pôle non trouvé: " + id));
    }
}
