package com.cmc.app.service;

import com.cmc.app.entity.Module;
import com.cmc.app.entity.Note;
import com.cmc.app.entity.User;
import com.cmc.app.enums.Role;
import com.cmc.app.exception.ResourceNotFoundException;
import com.cmc.app.repository.ModuleRepository;
import com.cmc.app.repository.NoteRepository;
import com.cmc.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImportNoteService {

    private final NoteRepository noteRepository;
    private final UserRepository userRepository;
    private final ModuleRepository moduleRepository;
    private final AuditService auditService;

    /**
     * Importe les notes depuis un fichier Excel.
     * Format attendu (ligne 0 = en-tête ignorée) :
     *   col 0 : Matricule du stagiaire
     *   col 1 : Nom (référence, non utilisé pour la recherche)
     *   col 2 : Prénom (référence, non utilisé pour la recherche)
     *   col 3 : Note CC  (/20)
     *   col 4 : Note EFM (/40)
     */
    @Transactional
    public Map<String, Integer> importNotes(MultipartFile file, Long groupeId, Long moduleId, User formateur)
            throws IOException {

        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module non trouvé"));

        int imported = 0;
        int errors = 0;
        int skipped = 0;

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) { skipped++; continue; }

                String matricule = getCellString(row, 0);
                String ccStr     = getCellString(row, 3);
                String efmStr    = getCellString(row, 4);

                if (matricule.isBlank()) { skipped++; continue; }

                Optional<User> stagiaireOpt = userRepository.findByMatricule(matricule);
                if (stagiaireOpt.isEmpty()) {
                    log.warn("Stagiaire introuvable - matricule: {}", matricule);
                    errors++;
                    continue;
                }

                User stagiaire = stagiaireOpt.get();
                if (stagiaire.getRole() != Role.STAGIAIRE) { errors++; continue; }

                if (!ccStr.isBlank()) {
                    Double cc = parseNote(ccStr);
                    if (cc != null && cc >= 0 && cc <= 20) {
                        upsertNote(stagiaire, module, formateur, "CC", cc);
                        imported++;
                    } else {
                        errors++;
                    }
                }

                if (!efmStr.isBlank()) {
                    Double efm = parseNote(efmStr);
                    if (efm != null && efm >= 0 && efm <= 40) {
                        upsertNote(stagiaire, module, formateur, "EFM", efm);
                        imported++;
                    } else {
                        errors++;
                    }
                }
            }
        }

        auditService.log(formateur, "IMPORT_NOTES", "Note", moduleId,
                "Import Excel notes: " + imported + " notes importées, " + errors + " erreurs");

        Map<String, Integer> result = new HashMap<>();
        result.put("imported", imported);
        result.put("errors", errors);
        result.put("skipped", skipped);
        return result;
    }

    /**
     * Génère un fichier Excel pré-rempli avec la liste des stagiaires du groupe,
     * prêt à être rempli par le formateur.
     */
    public byte[] generateTemplate(Long groupeId, Long moduleId) throws IOException {
        List<User> stagiaires = userRepository.findByGroupeId(groupeId).stream()
                .filter(u -> u.getRole() == Role.STAGIAIRE)
                .sorted(Comparator.comparing(User::getNom).thenComparing(User::getPrenom))
                .collect(Collectors.toList());

        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Notes");

            // Style en-tête
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            String[] colonnes = {"Matricule", "Nom", "Prénom", "CC (/20)", "EFM (/40)"};
            Row header = sheet.createRow(0);
            for (int i = 0; i < colonnes.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(colonnes[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowNum = 1;
            for (User s : stagiaires) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(s.getMatricule() != null ? s.getMatricule() : "");
                row.createCell(1).setCellValue(s.getNom());
                row.createCell(2).setCellValue(s.getPrenom());
                row.createCell(3); // CC — à remplir
                row.createCell(4); // EFM — à remplir
            }

            for (int i = 0; i < colonnes.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private void upsertNote(User stagiaire, Module module, User formateur, String type, Double valeur) {
        Optional<Note> existing = noteRepository.findByStagiaireIdAndModuleIdAndTypeEvaluation(
                stagiaire.getId(), module.getId(), type);

        if (existing.isPresent()) {
            Note note = existing.get();
            note.setValeur(valeur);
            noteRepository.save(note);
        } else {
            noteRepository.save(Note.builder()
                    .stagiaire(stagiaire)
                    .module(module)
                    .formateur(formateur)
                    .valeur(valeur)
                    .typeEvaluation(type)
                    .build());
        }
    }

    private String getCellString(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                double val = cell.getNumericCellValue();
                yield val == (long) val ? String.valueOf((long) val) : String.valueOf(val);
            }
            default -> "";
        };
    }

    private Double parseNote(String val) {
        try { return Double.parseDouble(val.replace(",", ".")); }
        catch (Exception e) { return null; }
    }
}
