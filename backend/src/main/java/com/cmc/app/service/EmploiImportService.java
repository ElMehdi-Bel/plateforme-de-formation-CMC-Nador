package com.cmc.app.service;

import com.cmc.app.entity.EmploiDuTemps;
import com.cmc.app.repository.EmploiDuTempsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalTime;
import java.util.*;

/**
 * Service d'import de l'emploi du temps depuis le fichier Excel
 * Format attendu : "Emplois INDUS 2025-2026.xlsx"
 *
 * Structure de la feuille "TABLEAU GLOBAL" :
 * - Ligne 4 (index 3) : noms des salles dans les colonnes D à AL (index 3 à 38)
 * - Jours : blocs de 16 lignes commençant aux indices 4, 20, 36, 52, 68, 84
 * - Chaque jour contient 4 créneaux de 4 lignes chacun :
 *     offset +0 : étiquette du créneau (col C)
 *     offset +1 : nom du formateur
 *     offset +2 : code groupe
 *     offset +3 : note / module (optionnel)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmploiImportService {

    private final EmploiDuTempsRepository emploiRepository;

    // Jours de la semaine dans l'ordre du fichier Excel
    private static final String[] JOURS = {"LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"};

    // Ligne de début (0-indexé) de chaque bloc jour dans TABLEAU GLOBAL
    private static final int[] JOUR_START_ROWS = {4, 20, 36, 52, 68, 84};

    // Colonnes des salles : index 3 (D) à 37 (AL)
    // La colonne 38 (AM) contient "HORAIRE" en doublon — on l'exclut
    private static final int SALLE_COL_START = 3;
    private static final int SALLE_COL_END = 37;

    // Colonne du créneau horaire (colonne C = index 2)
    private static final int CRENEAU_COL = 2;

    // Mapping créneaux → heures
    private static final Map<String, LocalTime[]> CRENEAU_HEURES = new LinkedHashMap<>();
    static {
        CRENEAU_HEURES.put("08H30",  new LocalTime[]{LocalTime.of(8, 30),  LocalTime.of(11, 0)});
        CRENEAU_HEURES.put("11H00",  new LocalTime[]{LocalTime.of(11, 0),  LocalTime.of(13, 30)});
        CRENEAU_HEURES.put("13H30",  new LocalTime[]{LocalTime.of(13, 30), LocalTime.of(16, 0)});
        CRENEAU_HEURES.put("16H00",  new LocalTime[]{LocalTime.of(16, 0),  LocalTime.of(18, 30)});
        CRENEAU_HEURES.put("19H00",  new LocalTime[]{LocalTime.of(19, 0),  LocalTime.of(21, 0)});
    }

    @Transactional
    public ImportResult importFromExcel(MultipartFile file, String anneeScolaire, boolean replaceExisting) throws IOException {
        int imported = 0;
        int skipped = 0;
        List<String> errors = new ArrayList<>();

        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            // Chercher la feuille TABLEAU GLOBAL
            Sheet sheet = workbook.getSheet("TABLEAU GLOBAL");
            if (sheet == null) {
                // Essayer le premier onglet si le nom diffère
                sheet = workbook.getSheetAt(0);
                log.warn("Feuille 'TABLEAU GLOBAL' non trouvée, utilisation de la première feuille: {}", sheet.getSheetName());
            }

            // Supprimer les données existantes si demandé
            if (replaceExisting) {
                emploiRepository.deleteByAnneeScolaire(anneeScolaire);
                log.info("Données existantes pour {} supprimées", anneeScolaire);
            }

            // Lire la ligne des salles (ligne 4 = index 3)
            Row salleRow = sheet.getRow(3);
            Map<Integer, String> salleMap = new HashMap<>();
            if (salleRow != null) {
                for (int col = SALLE_COL_START; col <= SALLE_COL_END; col++) {
                    String salleName = getCellString(salleRow, col);
                    if (!salleName.isBlank()) {
                        salleMap.put(col, salleName.trim());
                    }
                }
            }
            log.info("Salles détectées: {}", salleMap);

            List<EmploiDuTemps> toSave = new ArrayList<>();

            // Parcourir chaque jour
            for (int jourIdx = 0; jourIdx < JOURS.length; jourIdx++) {
                String jour = JOURS[jourIdx];
                int startRow = JOUR_START_ROWS[jourIdx];

                // 4 créneaux de 4 lignes chacun dans chaque bloc jour
                for (int slotIdx = 0; slotIdx < 4; slotIdx++) {
                    int slotRow = startRow + (slotIdx * 4); // ligne 0 du créneau

                    // Lire le créneau depuis la colonne C
                    Row creneauRow = sheet.getRow(slotRow);
                    if (creneauRow == null) continue;

                    String creneauLabel = getCellString(creneauRow, CRENEAU_COL);
                    LocalTime[] heures = parseCreneau(creneauLabel);

                    // Lignes formateur et groupe
                    Row formateurRow = sheet.getRow(slotRow + 1);
                    Row groupeRow   = sheet.getRow(slotRow + 2);
                    Row moduleRow   = sheet.getRow(slotRow + 3);

                    if (formateurRow == null && groupeRow == null) continue;

                    // Parcourir chaque colonne salle
                    for (Map.Entry<Integer, String> salleEntry : salleMap.entrySet()) {
                        int col = salleEntry.getKey();
                        String salle = salleEntry.getValue();

                        String formateurNom = formateurRow != null ? getCellString(formateurRow, col).trim() : "";
                        String groupeCode   = groupeRow   != null ? getCellString(groupeRow,   col).trim() : "";
                        String moduleNom    = moduleRow   != null ? getCellString(moduleRow,   col).trim() : "";

                        // Ignorer les cellules vides
                        if (formateurNom.isBlank() && groupeCode.isBlank()) continue;
                        // Ignorer les cellules d'en-tête
                        if (formateurNom.equalsIgnoreCase("FORMATEUR") || groupeCode.equalsIgnoreCase("GROUPE")) continue;

                        try {
                            EmploiDuTemps emploi = EmploiDuTemps.builder()
                                    .jourSemaine(jour)
                                    .creneau(creneauLabel.isBlank() ? buildCreneauLabel(heures) : creneauLabel.trim())
                                    .heureDebut(heures[0])
                                    .heureFin(heures[1])
                                    .salle(salle)
                                    .formateurNom(formateurNom.isBlank() ? null : formateurNom)
                                    .groupeCode(groupeCode.isBlank() ? null : groupeCode)
                                    .moduleNom(moduleNom.isBlank() ? null : moduleNom)
                                    .anneeScolaire(anneeScolaire)
                                    .build();

                            toSave.add(emploi);
                            imported++;
                        } catch (Exception e) {
                            String msg = String.format("Erreur ligne %d, col %d: %s", slotRow, col, e.getMessage());
                            errors.add(msg);
                            skipped++;
                            log.warn(msg);
                        }
                    }
                }
            }

            // Sauvegarde en batch
            emploiRepository.saveAll(toSave);
            log.info("Import terminé: {} séances importées, {} ignorées", imported, skipped);
        }

        return ImportResult.builder()
                .imported(imported)
                .skipped(skipped)
                .errors(errors)
                .anneeScolaire(anneeScolaire)
                .build();
    }

    /**
     * Retourne la liste des séances regroupées par jour pour l'affichage en grille.
     * Structure: { "LUNDI": [...], "MARDI": [...], ... }
     */
    public Map<String, List<EmploiDuTemps>> getGrille(String anneeScolaire) {
        List<EmploiDuTemps> all = emploiRepository.findAllByAnneeScolaireOrdered(anneeScolaire);
        Map<String, List<EmploiDuTemps>> grille = new LinkedHashMap<>();
        for (String jour : JOURS) {
            grille.put(jour, new ArrayList<>());
        }
        for (EmploiDuTemps e : all) {
            grille.computeIfAbsent(e.getJourSemaine(), k -> new ArrayList<>()).add(e);
        }
        return grille;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private String getCellString(Row row, int col) {
        if (row == null) return "";
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue();
            case NUMERIC -> DateUtil.isCellDateFormatted(cell)
                    ? cell.getLocalDateTimeCellValue().toString()
                    : String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> {
                try { yield cell.getStringCellValue(); }
                catch (Exception e) { yield String.valueOf(cell.getNumericCellValue()); }
            }
            default -> "";
        };
    }

    private LocalTime[] parseCreneau(String label) {
        if (label == null || label.isBlank()) {
            return new LocalTime[]{LocalTime.of(8, 30), LocalTime.of(11, 0)};
        }
        String upper = label.toUpperCase().trim();
        // IMPORTANT : vérifier "8H30" (sans zéro) en premier via startsWith
        // car "8H30 -- 11H00" contient aussi "11H00" — l'ordre des contains est piégeux
        if (upper.startsWith("8H30") || upper.startsWith("08H30")) return CRENEAU_HEURES.get("08H30");
        if (upper.startsWith("11H"))  return CRENEAU_HEURES.get("11H00");
        if (upper.startsWith("13H"))  return CRENEAU_HEURES.get("13H30");
        if (upper.startsWith("16H"))  return CRENEAU_HEURES.get("16H00");
        if (upper.startsWith("19H"))  return CRENEAU_HEURES.get("19H00");
        // Fallback contains (pour d'autres formats)
        for (Map.Entry<String, LocalTime[]> entry : CRENEAU_HEURES.entrySet()) {
            if (upper.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        return new LocalTime[]{LocalTime.of(8, 30), LocalTime.of(11, 0)};
    }

    private String buildCreneauLabel(LocalTime[] heures) {
        if (heures == null || heures.length < 2) return "";
        return String.format("%02dH%02d --> %02dH%02d",
                heures[0].getHour(), heures[0].getMinute(),
                heures[1].getHour(), heures[1].getMinute());
    }

    // ─── Result DTO ───────────────────────────────────────────────────────────
    @lombok.Data
    @lombok.Builder
    public static class ImportResult {
        private int imported;
        private int skipped;
        private List<String> errors;
        private String anneeScolaire;
    }
}
