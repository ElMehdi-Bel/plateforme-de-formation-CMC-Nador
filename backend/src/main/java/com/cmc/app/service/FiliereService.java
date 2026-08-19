package com.cmc.app.service;

import com.cmc.app.dto.request.FiliereRequest;
import com.cmc.app.entity.Filiere;
import com.cmc.app.entity.User;
import com.cmc.app.exception.ResourceAlreadyExistsException;
import com.cmc.app.exception.ResourceNotFoundException;
import com.cmc.app.repository.FiliereRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FiliereService {

    private final FiliereRepository filiereRepository;
    private final AuditService auditService;

    @Transactional
    public Filiere create(FiliereRequest request, User admin) {
        if (filiereRepository.existsByNom(request.getNom())) {
            throw new ResourceAlreadyExistsException("Une filière avec ce nom existe déjà");
        }
        Filiere filiere = Filiere.builder()
                .nom(request.getNom())
                .description(request.getDescription())
                .code(request.getCode())
                .dureeMois(request.getDureeMois())
                .build();
        Filiere saved = filiereRepository.save(filiere);
        auditService.log(admin, "CREATE_FILIERE", "Filiere", saved.getId(), "Création: " + saved.getNom());
        return saved;
    }

    @Transactional
    public Filiere update(Long id, FiliereRequest request, User admin) {
        Filiere filiere = getOrThrow(id);
        filiere.setNom(request.getNom());
        filiere.setDescription(request.getDescription());
        filiere.setCode(request.getCode());
        filiere.setDureeMois(request.getDureeMois());
        Filiere saved = filiereRepository.save(filiere);
        auditService.log(admin, "UPDATE_FILIERE", "Filiere", id, "Modification: " + saved.getNom());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Filiere> findAll() {
        return filiereRepository.findAllDistinctOrdered();
    }

    public Page<Filiere> search(String query, Pageable pageable) {
        return filiereRepository.searchByNom(query, pageable);
    }

    public Filiere findById(Long id) {
        return getOrThrow(id);
    }

    @Transactional
    public void delete(Long id, User admin) {
        Filiere filiere = getOrThrow(id);
        filiereRepository.delete(filiere);
        auditService.log(admin, "DELETE_FILIERE", "Filiere", id, "Suppression: " + filiere.getNom());
    }

    private Filiere getOrThrow(Long id) {
        return filiereRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Filière non trouvée: " + id));
    }
}
