package com.cmc.app.service;

import com.cmc.app.dto.request.CreateUserRequest;
import com.cmc.app.dto.request.UpdateUserRequest;
import com.cmc.app.dto.response.UserResponse;
import com.cmc.app.entity.Groupe;
import com.cmc.app.entity.Pole;
import com.cmc.app.entity.User;
import com.cmc.app.enums.Role;
import com.cmc.app.exception.ResourceAlreadyExistsException;
import com.cmc.app.exception.ResourceNotFoundException;
import com.cmc.app.repository.GroupeRepository;
import com.cmc.app.repository.PoleRepository;
import com.cmc.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
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
    private final PoleRepository poleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final MailService mailService;
    private final NotificationService notificationService;

    @Transactional
    public UserResponse createUser(CreateUserRequest request, User admin) {
        assertCanManage(admin, request.getRole());
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResourceAlreadyExistsException("Un utilisateur avec cet email existe déjà");
        }

        Groupe groupe = null;
        if (request.getGroupeId() != null) {
            groupe = groupeRepository.findById(request.getGroupeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Groupe non trouvé"));
        }

        Pole pole = null;
        if (request.getPoleId() != null) {
            pole = poleRepository.findById(request.getPoleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Pôle non trouvé"));
        }

        User user = User.builder()
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .telephone(request.getTelephone())
                .role(request.getRole())
                .groupe(groupe)
                .pole(pole)
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

    @Transactional(readOnly = true)
    public UserResponse findById(Long id) {
        return toResponse(getUserOrThrow(id));
    }

    @Transactional
    public UserResponse toggleActif(Long id, User admin) {
        User user = getUserOrThrow(id);
        assertCanManage(admin, user.getRole());
        user.setActif(!user.isActif());
        User saved = userRepository.save(user);
        auditService.log(admin, user.isActif() ? "ACTIVATE_USER" : "DEACTIVATE_USER",
                "User", id, "Changement statut: " + saved.getEmail());
        return toResponse(saved);
    }

    /**
     * Affecte (ou retire si {@code groupeId} est null) le groupe d'un stagiaire.
     * Réservé à l'Admin et au Gestionnaire des stagiaires.
     */
    @Transactional
    public UserResponse assignGroupe(Long userId, Long groupeId, User caller) {
        User user = getUserOrThrow(userId);
        assertCanManage(caller, user.getRole());
        if (user.getRole() != Role.STAGIAIRE) {
            throw new AccessDeniedException("Seul un stagiaire peut être affecté à un groupe");
        }
        Groupe groupe = null;
        if (groupeId != null) {
            groupe = groupeRepository.findById(groupeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Groupe non trouvé: " + groupeId));
        }
        user.setGroupe(groupe);
        User saved = userRepository.save(user);
        auditService.log(caller, "ASSIGN_GROUPE", "User", userId,
                "Affectation groupe: " + (groupe != null ? groupe.getNom() : "aucun"));
        if (groupe != null) {
            notificationService.envoyer(caller, saved, "Affectation à un groupe",
                    "Vous avez été affecté(e) au groupe " + groupe.getNom() + ".", "GROUPE");
        }
        return toResponse(saved);
    }

    /**
     * Affecte (ou retire si {@code poleId} est null) le pôle de rattachement d'un
     * membre du personnel (Chef de pôle, Formateur). Réservé à l'Admin.
     */
    @Transactional
    public UserResponse assignPole(Long userId, Long poleId, User admin) {
        User user = getUserOrThrow(userId);
        Pole pole = null;
        if (poleId != null) {
            pole = poleRepository.findById(poleId)
                    .orElseThrow(() -> new ResourceNotFoundException("Pôle non trouvé: " + poleId));
        }
        user.setPole(pole);
        User saved = userRepository.save(user);
        auditService.log(admin, "ASSIGN_POLE", "User", userId,
                "Rattachement pôle: " + (pole != null ? pole.getNom() : "aucun"));
        return toResponse(saved);
    }

    /**
     * Garde-fou métier : un Gestionnaire ne gère que des STAGIAIRE,
     * un Chef de pôle ne gère que des FORMATEUR, un Admin gère tout.
     */
    private void assertCanManage(User caller, Role targetRole) {
        if (caller == null) return;
        switch (caller.getRole()) {
            case ADMIN -> { /* tout autorisé */ }
            case GESTIONNAIRE -> {
                if (targetRole != Role.STAGIAIRE) {
                    throw new AccessDeniedException("Un gestionnaire ne peut gérer que des stagiaires");
                }
            }
            case CHEF_DE_POLE -> {
                if (targetRole != Role.FORMATEUR) {
                    throw new AccessDeniedException("Un chef de pôle ne peut gérer que des formateurs");
                }
            }
            default -> throw new AccessDeniedException("Action non autorisée pour ce rôle");
        }
    }

    @Transactional
    public void changePassword(Long id, String newPassword, User requester) {
        User user = getUserOrThrow(id);
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        auditService.log(requester, "CHANGE_PASSWORD", "User", id, "Mot de passe modifié");
    }

    /** Changement de mot de passe par l'utilisateur lui-même (vérifie l'ancien). */
    @Transactional
    public void changeOwnPassword(User principal, String currentPassword, String newPassword) {
        User user = getUserOrThrow(principal.getId());
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Le mot de passe actuel est incorrect");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        auditService.log(user, "CHANGE_OWN_PASSWORD", "User", user.getId(), "Mot de passe modifié");
    }

    /** Mise à jour du profil de l'utilisateur connecté (champs autorisés uniquement). */
    @Transactional
    public UserResponse updateOwnProfile(User principal, String telephone) {
        User user = getUserOrThrow(principal.getId());
        user.setTelephone(telephone == null || telephone.isBlank() ? null : telephone.trim());
        User saved = userRepository.save(user);
        auditService.log(user, "UPDATE_OWN_PROFILE", "User", user.getId(), "Profil mis à jour");
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> findStagiairesByGroupe(Long groupeId) {
        return userRepository.findByGroupeIdWithAssociations(groupeId)
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
                .poleId(user.getPole() != null ? user.getPole().getId() : null)
                .poleNom(user.getPole() != null ? user.getPole().getNom() : null)
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
