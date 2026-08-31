package com.cmc.app.service;

import com.cmc.app.dto.request.SalleRequest;
import com.cmc.app.entity.Salle;
import com.cmc.app.entity.User;
import com.cmc.app.exception.ResourceAlreadyExistsException;
import com.cmc.app.exception.ResourceNotFoundException;
import com.cmc.app.repository.SalleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SalleService {

    private final SalleRepository salleRepository;
    private final AuditService auditService;

    @Transactional
    public Salle create(SalleRequest request, User admin) {
        if (salleRepository.existsByNom(request.getNom())) {
            throw new ResourceAlreadyExistsException("Une salle avec ce nom existe déjà");
        }
        Salle salle = Salle.builder()
                .nom(request.getNom())
                .code(request.getCode())
                .type(request.getType())
                .capacite(request.getCapacite())
                .batiment(request.getBatiment())
                .disponible(request.getDisponible() == null || request.getDisponible())
                .build();
        Salle saved = salleRepository.save(salle);
        auditService.log(admin, "CREATE_SALLE", "Salle", saved.getId(), "Création: " + saved.getNom());
        return saved;
    }

    @Transactional
    public Salle update(Long id, SalleRequest request, User admin) {
        Salle salle = getOrThrow(id);
        salle.setNom(request.getNom());
        salle.setCode(request.getCode());
        salle.setType(request.getType());
        salle.setCapacite(request.getCapacite());
        salle.setBatiment(request.getBatiment());
        if (request.getDisponible() != null) salle.setDisponible(request.getDisponible());
        Salle saved = salleRepository.save(salle);
        auditService.log(admin, "UPDATE_SALLE", "Salle", id, "Modification: " + saved.getNom());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Salle> findAll() {
        return salleRepository.findAllOrdered();
    }

    public Salle findById(Long id) {
        return getOrThrow(id);
    }

    @Transactional
    public void delete(Long id, User admin) {
        Salle salle = getOrThrow(id);
        salleRepository.delete(salle);
        auditService.log(admin, "DELETE_SALLE", "Salle", id, "Suppression: " + salle.getNom());
    }

    private Salle getOrThrow(Long id) {
        return salleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Salle non trouvée: " + id));
    }
}
