package com.cmc.app.service;

import com.cmc.app.dto.request.CreateUserRequest;
import com.cmc.app.dto.request.UpdateUserRequest;
import com.cmc.app.dto.response.UserResponse;
import com.cmc.app.entity.Groupe;
import com.cmc.app.entity.User;
import com.cmc.app.enums.Role;
import com.cmc.app.exception.ResourceAlreadyExistsException;
import com.cmc.app.exception.ResourceNotFoundException;
import com.cmc.app.repository.GroupeRepository;
import com.cmc.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final GroupeRepository groupeRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final MailService mailService;

    @Transactional
    public UserResponse createUser(CreateUserRequest request, User admin) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResourceAlreadyExistsException("Un utilisateur avec cet email existe déjà");
        }

        Groupe groupe = null;
        if (request.getGroupeId() != null) {
            groupe = groupeRepository.findById(request.getGroupeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Groupe non trouvé"));
        }

        User user = User.builder()
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .telephone(request.getTelephone())
                .role(request.getRole())
                .groupe(groupe)
                .actif(true)
                .build();

        User saved = userRepository.save(user);
        auditService.log(admin, "CREATE_USER", "User", saved.getId(),
                "Création utilisateur: " + saved.getEmail() + " (" + saved.getRole() + ")");

        // Envoyer les identifiants par email si le role est STAGIAIRE ou FORMATEUR
        mailService.envoyerCredentials(saved.getEmail(),
                saved.getPrenom() + " " + saved.getNom(),
                saved.getEmail(),
                request.getPassword());

        return toResponse(saved);
    }

    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request, User admin) {
        User user = getUserOrThrow(id);

        Groupe groupe = user.getGroupe();
        if (request.getGroupeId() != null) {
            groupe = groupeRepository.findById(request.getGroupeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Groupe non trouvé"));
        } else {
            groupe = null;
        }

        user.setNom(request.getNom());
        user.setPrenom(request.getPrenom());
        user.setTelephone(request.getTelephone());
        user.setGroupe(groupe);
        user.setDateInscription(request.getDateInscription());
        user.setDateNaissance(request.getDateNaissance());
        user.setLieuNaissance(request.getLieuNaissance());
        user.setNiveauFormation(request.getNiveauFormation());
        user.setTypeFormation(request.getTypeFormation());
        user.setModeFormation(request.getModeFormation());

        User saved = userRepository.save(user);
        auditService.log(admin, "UPDATE_USER", "User", saved.getId(),
                "Modification utilisateur: " + saved.getEmail());

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> findByRole(Role role, Pageable pageable) {
        return userRepository.findByRole(role, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> search(Role role, String query, Pageable pageable) {
        return userRepository.searchByRole(role, query, pageable).map(this::toResponse);
    }

    public UserResponse findById(Long id) {
        return toResponse(getUserOrThrow(id));
    }

    @Transactional
    public UserResponse toggleActif(Long id, User admin) {
        User user = getUserOrThrow(id);
        user.setActif(!user.isActif());
        User saved = userRepository.save(user);
        auditService.log(admin, user.isActif() ? "ACTIVATE_USER" : "DEACTIVATE_USER",
                "User", id, "Changement statut: " + saved.getEmail());
        return toResponse(saved);
    }

    @Transactional
    public void changePassword(Long id, String newPassword, User requester) {
        User user = getUserOrThrow(id);
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        auditService.log(requester, "CHANGE_PASSWORD", "User", id, "Mot de passe modifié");
    }

    public List<UserResponse> findStagiairesByGroupe(Long groupeId) {
        return userRepository.findByGroupeId(groupeId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public long countByRole(Role role) {
        return userRepository.countByRoleAndActif(role);
    }

    private User getUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé: " + id));
    }

    public UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .telephone(user.getTelephone())
                .role(user.getRole())
                .actif(user.isActif())
                .groupeId(user.getGroupe() != null ? user.getGroupe().getId() : null)
                .groupeNom(user.getGroupe() != null ? user.getGroupe().getNom() : null)
                .groupeCode(user.getGroupe() != null ? user.getGroupe().getCode() : null)
                .filiereNom(user.getGroupe() != null && user.getGroupe().getFiliere() != null ? user.getGroupe().getFiliere().getNom() : null)
                .matricule(user.getMatricule())
                .dateInscription(user.getDateInscription())
                .dateNaissance(user.getDateNaissance())
                .lieuNaissance(user.getLieuNaissance())
                .niveauFormation(user.getNiveauFormation())
                .typeFormation(user.getTypeFormation())
                .modeFormation(user.getModeFormation())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
