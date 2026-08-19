package com.cmc.app.service;

import com.cmc.app.entity.Filiere;
import com.cmc.app.entity.Groupe;
import com.cmc.app.entity.User;
import com.cmc.app.enums.Role;
import com.cmc.app.repository.FiliereRepository;
import com.cmc.app.repository.GroupeRepository;
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
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImportStagiaireService {

    private final UserRepository     userRepository;
    private final GroupeRepository   groupeRepository;
    private final FiliereRepository  filiereRepository;
    private final PasswordEncoder    passwordEncoder;
    private final MailService        mailService;

    // Colonnes Excel (0-indexé) :
    // 0:EFP 1:Niveau 2:CodeSecteur 3:CodeFiliere 4:Filiere 5:TypeFormation
    // 6:Groupe 7:AnneeEtude 8:Matricule 9:CNIE 10:CodeMassar
    // 11:Nom 12:Prenom 13:NomArabe 14:PrenomArabe 15:Tel
    // 16:Email 17:EmailOFPPT 18:Nationalite 19:DateInscription
    // 20:NiveauScolaire 21:AnneeBac 22:MoyenneBac

    @Transactional
    public Map<String, Object> importFromExcel(MultipartFile file, boolean envoyerEmails) throws IOException {
        int crees = 0, ignores = 0, erreurs = 0;

        try (Workbook wb = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String nom         = get(row, 11);
                String prenom      = get(row, 12);
                String emailPersonnel = get(row, 16);
                String emailOfppt  = get(row, 17);
                String matricule   = get(row, 8);

                // Ligne vide → ignorer
                if (nom.isBlank() && prenom.isBlank()) { ignores++; continue; }

                // Choisir l'email de login : OFPPT en priorité, sinon personnel
                String emailLogin = emailOfppt.isBlank() ? emailPersonnel : emailOfppt;

                if (emailLogin.isBlank()) {
                    log.warn("Ligne {} : pas d'email, stagiaire ignoré", i + 1);
                    erreurs++;
                    continue;
                }

                // Éviter les doublons
                if (userRepository.existsByEmail(emailLogin)) { ignores++; continue; }
                if (!matricule.isBlank() && userRepository.existsByMatricule(matricule)) { ignores++; continue; }

                // Générer le mot de passe : Cmc@ + 4 derniers chars de CNIE
                String cnie = get(row, 9);
                String motDePasse = genererMotDePasse(cnie, matricule, prenom);

                // Chercher ou créer le groupe
                String nomGroupe   = get(row, 6);
                String nomFiliere  = get(row, 4);
                String anneeEtude  = get(row, 7);
                Groupe groupe = trouverOuCreerGroupe(nomGroupe, nomFiliere, anneeEtude);

                // Construire le stagiaire
                User stagiaire = User.builder()
                        .nom(truncate(nom, 100))
                        .prenom(truncate(prenom, 100))
                        .email(emailLogin)
                        .password(passwordEncoder.encode(motDePasse))
                        .telephone(truncate(get(row, 15), 20))
                        .matricule(matricule.isBlank() ? null : truncate(matricule, 50))
                        .cnie(cnie.isBlank() ? null : truncate(cnie, 20))
                        .codeMassar(truncate(get(row, 10), 30))
                        .nomArabe(truncate(get(row, 13), 150))
                        .prenomArabe(truncate(get(row, 14), 150))
                        .emailOfppt(emailOfppt.isBlank() ? null : truncate(emailOfppt, 150))
                        .nationalite(truncate(get(row, 18), 50))
                        .dateInscription(parseDate(get(row, 19)))
                        .niveauScolaire(truncate(get(row, 20), 100))
                        .anneeBac(parseEntier(get(row, 21)))
                        .moyenneBac(parseDouble(get(row, 22)))
                        .role(Role.STAGIAIRE)
                        .actif(true)
                        .groupe(groupe)
                        .build();

                userRepository.save(stagiaire);
                crees++;

                // Envoyer les credentials par email
                if (envoyerEmails) {
                    String dest = emailOfppt.isBlank() ? emailPersonnel : emailOfppt;
                    if (!dest.isBlank()) {
                        mailService.envoyerCredentials(dest, prenom + " " + nom, emailLogin, motDePasse);
                    }
                }
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("crees", crees);
        result.put("ignores", ignores);
        result.put("erreurs", erreurs);
        return result;
    }

    // ── Groupe : trouver ou créer ─────────────────────────────────────────────

    private Groupe trouverOuCreerGroupe(String nomGroupe, String nomFiliere, String anneeEtude) {
        if (nomGroupe.isBlank()) return null;

        // Chercher le groupe existant
        return groupeRepository.findByNomIgnoreCase(nomGroupe).orElseGet(() -> {
            // Chercher ou créer la filière
            Filiere filiere = null;
            if (!nomFiliere.isBlank()) {
                filiere = filiereRepository.findByNomIgnoreCase(nomFiliere)
                        .orElseGet(() -> filiereRepository.save(
                                Filiere.builder()
                                        .nom(truncate(nomFiliere, 300))
                                        .actif(true)
                                        .build()
                        ));
            }

            // Sans filière on ne peut pas créer le groupe (contrainte NOT NULL)
            if (filiere == null) {
                log.warn("Groupe '{}' non créé : filière introuvable et non spécifiée", nomGroupe);
                return null;
            }

            Groupe nouveau = Groupe.builder()
                    .nom(truncate(nomGroupe, 100))
                    .anneeFormation(truncate(anneeEtude, 20))
                    .filiere(filiere)
                    .capaciteMax(30)
                    .build();

            return groupeRepository.save(nouveau);
        });
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private String genererMotDePasse(String cnie, String matricule, String prenom) {
        String base = "Cmc@";
        if (!cnie.isBlank() && cnie.length() >= 4)
            return base + cnie.substring(cnie.length() - 4);
        if (!matricule.isBlank() && matricule.length() >= 4)
            return base + matricule.substring(matricule.length() - 4);
        // fallback : 1ère lettre prénom + 4 chiffres aléatoires
        String initiale = prenom.isBlank() ? "S" : prenom.substring(0, 1).toUpperCase();
        int random = (int)(Math.random() * 9000) + 1000;
        return base + initiale + random;
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

    private LocalDate parseDate(String val) {
        if (val == null || val.isBlank()) return null;
        String[] formats = { "dd/MM/yyyy", "yyyy-MM-dd", "dd-MM-yyyy", "MM/dd/yyyy" };
        for (String fmt : formats) {
            try { return LocalDate.parse(val, DateTimeFormatter.ofPattern(fmt)); }
            catch (DateTimeParseException ignored) {}
        }
        return null;
    }

    private Integer parseEntier(String val) {
        if (val == null || val.isBlank()) return null;
        try { return Integer.parseInt(val.replaceAll("[^0-9]", "")); }
        catch (Exception e) { return null; }
    }

    private Double parseDouble(String val) {
        if (val == null || val.isBlank()) return null;
        try { return Double.parseDouble(val.replace(",", ".")); }
        catch (Exception e) { return null; }
    }

    private String truncate(String val, int max) {
        if (val == null || val.isBlank()) return null;
        return val.length() > max ? val.substring(0, max) : val;
    }
}
