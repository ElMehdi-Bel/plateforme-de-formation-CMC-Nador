package com.cmc.app.service;

import com.cmc.app.entity.Groupe;
import com.cmc.app.entity.Module;
import com.cmc.app.entity.User;
import com.cmc.app.enums.Role;
import com.cmc.app.repository.GroupeRepository;
import com.cmc.app.repository.ModuleRepository;
import com.cmc.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Import formateurs depuis Excel.
 *
 * Format attendu (ligne 1 = en-têtes, données à partir de la ligne 2) :
 *  A: Nom     B: Prénom     C: Email     D: Mot de passe (optionnel)
 *  E: Téléphone (optionnel)
 *  F: Module  (nom exact ou partiel, optionnel)
 *  G: Groupe  (nom exact ou partiel, optionnel)
 *
 * Plusieurs lignes avec le même email = plusieurs modules affectés au même formateur.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ImportFormateurService {

    private final UserRepository    userRepository;
    private final ModuleRepository  moduleRepository;
    private final GroupeRepository  groupeRepository;
    private final PasswordEncoder   passwordEncoder;

    @Transactional
    public Map<String, Object> importFromExcel(MultipartFile file) throws IOException {
        int crees        = 0;
        int misAJour     = 0;
        int modulesAssignes = 0;
        int groupesAssignes = 0;
        int ignores      = 0;
        int erreurs      = 0;

        try (Workbook wb = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);

            // Excel laisse souvent des dizaines de milliers de lignes "utilisées"
            // (mise en forme) bien après les vraies données : on arrête après une
            // longue série de lignes vides pour éviter un import qui tourne pendant
            // des heures sur un fichier mal formé.
            int lignesVidesConsecutives = 0;
            final int MAX_LIGNES_VIDES_CONSECUTIVES = 200;

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) {
                    ignores++;
                    lignesVidesConsecutives++;
                    if (lignesVidesConsecutives >= MAX_LIGNES_VIDES_CONSECUTIVES) break;
                    continue;
                }

                String nom         = get(row, 0);
                String prenom      = get(row, 1);
                String email       = get(row, 2).toLowerCase().trim();
                String password    = get(row, 3);
                String telephone   = get(row, 4);
                String moduleName  = get(row, 5);
                String groupeName  = get(row, 6);

                // Ligne vide → ignorer
                if (nom.isBlank() && email.isBlank()) {
                    ignores++;
                    lignesVidesConsecutives++;
                    if (lignesVidesConsecutives >= MAX_LIGNES_VIDES_CONSECUTIVES) break;
                    continue;
                }
                lignesVidesConsecutives = 0;
                if (email.isBlank()) {
                    log.warn("Ligne {} ignorée : email manquant", i + 1);
                    erreurs++;
                    continue;
                }

                // ── Trouver ou créer le formateur ─────────────────────────────
                User formateur;
                if (!userRepository.existsByEmail(email)) {
                    if (nom.isBlank()) {
                        log.warn("Ligne {} ignorée : nom manquant pour le nouveau compte {}", i + 1, email);
                        erreurs++;
                        continue;
                    }
                    String pwd = password.isBlank()
                            ? genPassword(nom)
                            : password;

                    formateur = User.builder()
                            .nom(truncate(nom.toUpperCase(), 100))
                            .prenom(truncate(capitaliser(prenom), 100))
                            .email(email)
                            .password(passwordEncoder.encode(pwd))
                            .telephone(telephone.isBlank() ? null : truncate(telephone, 20))
                            .role(Role.FORMATEUR)
                            .actif(true)
                            .build();
                    userRepository.save(formateur);
                    crees++;
                } else {
                    formateur = userRepository.findByEmail(email).orElse(null);
                    if (formateur == null) { erreurs++; continue; }
                    if (formateur.getRole() != Role.FORMATEUR) {
                        log.warn("Ligne {} : {} n'est pas un formateur (rôle: {})", i + 1, email, formateur.getRole());
                        erreurs++;
                        continue;
                    }
                    misAJour++;
                }

                // ── Affecter le module ────────────────────────────────────────
                if (!moduleName.isBlank()) {
                    List<Module> modules = moduleRepository.findByNomIgnoreCase(moduleName);
                    if (modules.isEmpty()) {
                        log.warn("Ligne {} : module '{}' non trouvé", i + 1, moduleName);
                    } else {
                        if (modules.size() > 1) {
                            log.warn("Ligne {} : {} modules trouvés pour '{}', le premier est utilisé",
                                    i + 1, modules.size(), moduleName);
                        }
                        Module module = modules.get(0);
                        module.setFormateur(formateur);
                        moduleRepository.save(module);
                        modulesAssignes++;

                        // ── Affecter un ou plusieurs groupes (séparés par virgule ou point-virgule) ──
                        if (!groupeName.isBlank()) {
                            String[] noms = groupeName.split("[,;]");
                            for (String gNom : noms) {
                                String gTrim = gNom.trim();
                                if (gTrim.isBlank()) continue;
                                Optional<Groupe> groupeOpt = groupeRepository.findByNomIgnoreCase(gTrim);
                                if (groupeOpt.isEmpty()) {
                                    log.warn("Ligne {} : groupe '{}' non trouvé", i + 1, gTrim);
                                } else {
                                    Groupe groupe = groupeOpt.get();
                                    boolean dejaPresent = groupe.getModules().stream()
                                            .anyMatch(m -> m.getId().equals(module.getId()));
                                    if (!dejaPresent) {
                                        groupe.getModules().add(module);
                                        groupeRepository.save(groupe);
                                        groupesAssignes++;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("formateursCreés",    crees);
        result.put("formateursExistants", misAJour);
        result.put("modulesAssignés",    modulesAssignes);
        result.put("groupesAssignés",    groupesAssignes);
        result.put("lignesIgnorées",     ignores);
        result.put("erreurs",            erreurs);
        return result;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String genPassword(String nom) {
        // Cmc@ + 4 premiers caractères du nom (majuscules)
        String clean = nom.replaceAll("[^a-zA-Z]", "").toUpperCase();
        String suffix = clean.length() >= 4 ? clean.substring(0, 4) : String.format("%04d", (int)(Math.random() * 9000 + 1000));
        return "Cmc@" + suffix;
    }

    private String capitaliser(String val) {
        if (val == null || val.isBlank()) return val;
        return val.substring(0, 1).toUpperCase() + val.substring(1).toLowerCase();
    }

    private String get(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                double v = cell.getNumericCellValue();
                yield v == (long) v ? String.valueOf((long) v) : String.valueOf(v);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default      -> "";
        };
    }

    private String truncate(String val, int max) {
        if (val == null) return null;
        return val.length() > max ? val.substring(0, max) : val;
    }
}
