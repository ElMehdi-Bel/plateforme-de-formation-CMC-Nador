package com.cmc.app.controller;

import com.cmc.app.dto.response.ApiResponse;
import com.cmc.app.enums.Role;
import com.cmc.app.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * "Gérer les rôles" (Administrateur) — référence en lecture seule.
 * Les rôles sont un enum figé ({@link Role}) ; cet endpoint expose leur libellé,
 * leur description fonctionnelle et le nombre d'utilisateurs rattachés.
 */
@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class RoleController {

    private final UserRepository userRepository;

    private static final Map<Role, String[]> META = Map.of(
            Role.ADMIN,        new String[]{"Administrateur",            "Gère les utilisateurs, filières, groupes, modules, pôles, salles et rôles."},
            Role.CHEF_DE_POLE, new String[]{"Chef de pôle",             "Crée, modifie et valide les emplois du temps, affecte les modules aux formateurs, consulte les statistiques et génère les bilans."},
            Role.GESTIONNAIRE, new String[]{"Gestionnaire des stagiaires", "Gère les stagiaires et leurs groupes, suit les absences, traite les dossiers administratifs, imprime les listes et génère les attestations."},
            Role.FORMATEUR,    new String[]{"Formateur",                "Consulte ses groupes et son emploi du temps, dépose les supports de cours, saisit les absences et les notes."},
            Role.STAGIAIRE,    new String[]{"Stagiaire",                "Consulte ses notes, ses absences, son emploi du temps et dépose des demandes administratives."}
    );

    @GetMapping
    public ResponseEntity<ApiResponse<List<RoleInfo>>> list() {
        List<RoleInfo> roles = java.util.Arrays.stream(Role.values())
                .map(r -> new RoleInfo(
                        r.name(),
                        META.get(r)[0],
                        META.get(r)[1],
                        userRepository.countByRole(r)))
                .toList();
        return ResponseEntity.ok(ApiResponse.success(roles));
    }

    @Data
    @AllArgsConstructor
    public static class RoleInfo {
        private String code;
        private String libelle;
        private String description;
        private long utilisateurs;
    }
}
