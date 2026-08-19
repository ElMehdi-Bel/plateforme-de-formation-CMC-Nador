package com.cmc.app.service;

import com.cmc.app.entity.Filiere;
import com.cmc.app.entity.Module;
import com.cmc.app.entity.User;
import com.cmc.app.repository.FiliereRepository;
import com.cmc.app.repository.ModuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImportService {

    private final FiliereRepository filiereRepository;
    private final ModuleRepository moduleRepository;
    private final AuditService auditService;

    @Transactional
    public Map<String, Integer> importFromExcel(MultipartFile file, User admin) throws IOException {
        int filieresCrees = 0;
        int modulesCrees = 0;
        int lignesIgnorees = 0;

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            // Chercher la ligne d'en-tête (première ligne non vide)
            int startRow = 1; // par défaut on saute la ligne 0 (en-têtes)

            for (int i = startRow; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String nomFiliere    = getCellValue(row, 0);
                String anneeStr      = getCellValue(row, 1);
                String codeModule    = getCellValue(row, 2);
                String nomModule     = getCellValue(row, 3);
                String masseHoraire  = getCellValue(row, 4);

                // Ignorer les lignes vides
                if (nomFiliere.isBlank() && nomModule.isBlank()) {
                    lignesIgnorees++;
                    continue;
                }
                if (nomFiliere.isBlank() || nomModule.isBlank()) {
                    lignesIgnorees++;
                    continue;
                }

                // Créer ou retrouver la filière
                Filiere filiere = filiereRepository.findByNomIgnoreCase(nomFiliere)
                        .orElseGet(() -> {
                            Filiere f = Filiere.builder()
                                    .nom(truncate(nomFiliere, 300))
                                    .actif(true)
                                    .build();
                            return filiereRepository.save(f);
                        });

                // Parser l'année de formation (1 ou 2)
                Integer annee = parseAnnee(anneeStr);

                // Parser la masse horaire (ex: "90h" ou "90")
                Integer volumeH = parseMasseHoraire(masseHoraire);

                // Tronquer les valeurs pour éviter tout dépassement
                String codeClean = codeModule.isBlank() ? null : truncate(codeModule.trim(), 100);
                String nomClean  = truncate(nomModule.trim(), 500);

                // Vérifier si le module existe déjà (par code + filière)
                if (codeClean != null && moduleRepository.existsByCodeAndFiliereId(codeClean, filiere.getId())) {
                    lignesIgnorees++;
                    continue;
                }

                Module module = Module.builder()
                        .nom(nomClean)
                        .code(codeClean)
                        .volumeHoraire(volumeH)
                        .anneeFormation(annee)
                        .filiere(filiere)
                        .coefficient(1.0)
                        .build();

                moduleRepository.save(module);
                modulesCrees++;
            }
        }

        // Recompter les filières créées
        filieresCrees = (int) filiereRepository.count();

        Map<String, Integer> result = new HashMap<>();
        result.put("filieres", filieresCrees);
        result.put("modules", modulesCrees);
        result.put("lignesIgnorees", lignesIgnorees);
        return result;
    }

    private String getCellValue(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                double val = cell.getNumericCellValue();
                yield val == (long) val ? String.valueOf((long) val) : String.valueOf(val);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default      -> "";
        };
    }

    private Integer parseAnnee(String val) {
        if (val == null || val.isBlank()) return null;
        String clean = val.replaceAll("[^0-9]", "");
        try { return Integer.parseInt(clean); } catch (Exception e) { return null; }
    }

    private Integer parseMasseHoraire(String val) {
        if (val == null || val.isBlank()) return null;
        String clean = val.replaceAll("[^0-9]", "");
        try { return Integer.parseInt(clean); } catch (Exception e) { return null; }
    }

    private String truncate(String val, int max) {
        if (val == null) return null;
        return val.length() > max ? val.substring(0, max) : val;
    }
}
