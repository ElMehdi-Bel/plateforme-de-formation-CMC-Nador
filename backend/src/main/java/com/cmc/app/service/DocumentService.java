package com.cmc.app.service;

import com.cmc.app.dto.response.AbsenceResponse;
import com.cmc.app.dto.response.BulletinResponse;
import com.cmc.app.dto.response.NoteModuleResponse;
import com.cmc.app.entity.Groupe;
import com.cmc.app.entity.Module;
import com.cmc.app.entity.User;
import com.cmc.app.enums.Role;
import com.cmc.app.exception.ResourceNotFoundException;
import com.cmc.app.repository.GroupeRepository;
import com.cmc.app.repository.ModuleRepository;
import com.cmc.app.repository.UserRepository;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Génération de documents :
 *  - attestations de poursuite de formation (PDF, Gestionnaire)
 *  - listes de stagiaires (Excel, Gestionnaire)
 *  - bilans pédagogiques (PDF, Chef de pôle)
 *
 * Le fichier {@code Exemple_AttestationPoursuiteFormation.docx} (racine du dépôt) sert de
 * référence de contenu/mise en page pour l'attestation.
 */
@Service
@RequiredArgsConstructor
public class DocumentService {

    private final UserRepository userRepository;
    private final GroupeRepository groupeRepository;
    private final ModuleRepository moduleRepository;
    private final StatistiqueService statistiqueService;
    private final NoteService noteService;
    private final AbsenceService absenceService;
    private final DisciplineService disciplineService;
    private final AuditService auditService;

    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // ─────────────────────────────────────────────────────────────────────────
    //  Attestation de poursuite de formation (PDF)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public byte[] genererAttestation(Long stagiaireId, User demandeur) {
        User s = userRepository.findByIdWithGroupe(stagiaireId)
                .orElseThrow(() -> new ResourceNotFoundException("Stagiaire non trouvé: " + stagiaireId));
        if (s.getRole() != Role.STAGIAIRE) {
            throw new ResourceNotFoundException("L'utilisateur " + stagiaireId + " n'est pas un stagiaire");
        }

        Groupe g = s.getGroupe();
        String filiere = (g != null && g.getFiliere() != null) ? g.getFiliere().getNom() : "—";
        String groupe  = (g != null) ? g.getNom() : "—";
        String annee   = (g != null && g.getAnneeFormation() != null) ? g.getAnneeFormation() : "—";

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 56, 56, 72, 56);
            PdfWriter.getInstance(doc, out);
            doc.open();

            Font titleFont = new Font(Font.FontFamily.HELVETICA, 16, Font.BOLD);
            Font h2Font    = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD);
            Font bodyFont  = new Font(Font.FontFamily.HELVETICA, 12, Font.NORMAL);

            Paragraph header = new Paragraph("CMC NADOR\nCité des Métiers et des Compétences", h2Font);
            header.setAlignment(Element.ALIGN_CENTER);
            doc.add(header);
            doc.add(Chunk.NEWLINE);

            Paragraph title = new Paragraph("ATTESTATION DE POURSUITE DE FORMATION", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(24);
            doc.add(title);

            Paragraph body = new Paragraph();
            body.setFont(bodyFont);
            body.setLeading(20);
            body.add("Le Directeur de la Cité des Métiers et des Compétences de Nador atteste que :\n\n");
            body.add("Monsieur / Madame  " + fullNameUpper(s) + "\n");
            if (s.getCnie() != null)      body.add("Titulaire de la CNIE n°  " + s.getCnie() + "\n");
            if (s.getMatricule() != null) body.add("Matricule  " + s.getMatricule() + "\n");
            body.add("\nest régulièrement inscrit(e) et poursuit sa formation au titre de l'année " + annee + " :\n\n");
            body.add("   •  Filière : " + filiere + "\n");
            body.add("   •  Groupe : " + groupe + "\n");
            if (s.getDateInscription() != null) {
                body.add("   •  Date d'inscription : " + s.getDateInscription().format(DF) + "\n");
            }
            body.add("\nLa présente attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.\n");
            doc.add(body);

            Paragraph date = new Paragraph("\n\nFait à Nador, le " + LocalDate.now().format(DF), bodyFont);
            date.setAlignment(Element.ALIGN_RIGHT);
            doc.add(date);

            Paragraph sign = new Paragraph("\n\n\nSignature et cachet", bodyFont);
            sign.setAlignment(Element.ALIGN_RIGHT);
            doc.add(sign);

            doc.close();
            auditService.log(demandeur, "GENERER_ATTESTATION", "User", stagiaireId,
                    "Attestation générée pour " + s.getFullName());
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Erreur génération attestation : " + e.getMessage(), e);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Liste des stagiaires d'un groupe (Excel)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public byte[] genererListeStagiaires(Long groupeId, User demandeur) {
        Groupe g = groupeRepository.findByIdWithFiliere(groupeId)
                .orElseThrow(() -> new ResourceNotFoundException("Groupe non trouvé: " + groupeId));
        List<User> stagiaires = userRepository.findByGroupeId(groupeId);

        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Stagiaires");

            CellStyle headerStyle = wb.createCellStyle();
            org.apache.poi.ss.usermodel.Font hf = wb.createFont();
            hf.setBold(true);
            headerStyle.setFont(hf);

            String filiere = g.getFiliere() != null ? g.getFiliere().getNom() : "—";
            Row info = sheet.createRow(0);
            info.createCell(0).setCellValue("Filière : " + filiere + "   |   Groupe : " + g.getNom()
                    + "   |   Année : " + (g.getAnneeFormation() != null ? g.getAnneeFormation() : "—"));

            String[] cols = {"#", "Matricule", "Nom", "Prénom", "CNIE", "Email", "Téléphone", "Actif"};
            Row head = sheet.createRow(2);
            for (int i = 0; i < cols.length; i++) {
                Cell c = head.createCell(i);
                c.setCellValue(cols[i]);
                c.setCellStyle(headerStyle);
            }

            int r = 3;
            int n = 1;
            for (User s : stagiaires) {
                Row row = sheet.createRow(r++);
                row.createCell(0).setCellValue(n++);
                row.createCell(1).setCellValue(nullSafe(s.getMatricule()));
                row.createCell(2).setCellValue(nullSafe(s.getNom()));
                row.createCell(3).setCellValue(nullSafe(s.getPrenom()));
                row.createCell(4).setCellValue(nullSafe(s.getCnie()));
                row.createCell(5).setCellValue(nullSafe(s.getEmail()));
                row.createCell(6).setCellValue(nullSafe(s.getTelephone()));
                row.createCell(7).setCellValue(s.isActif() ? "Oui" : "Non");
            }
            for (int i = 0; i < cols.length; i++) sheet.autoSizeColumn(i);

            wb.write(out);
            auditService.log(demandeur, "GENERER_LISTE", "Groupe", groupeId,
                    "Liste stagiaires générée (" + stagiaires.size() + ")");
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Erreur génération liste : " + e.getMessage(), e);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Notes d'un groupe/module (Excel)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public byte[] genererExportNotes(Long groupeId, Long moduleId, User demandeur) {
        Groupe g = groupeRepository.findByIdWithFiliere(groupeId)
                .orElseThrow(() -> new ResourceNotFoundException("Groupe non trouvé: " + groupeId));
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module non trouvé: " + moduleId));
        List<NoteModuleResponse> grille = noteService.getGrilleNotes(groupeId, moduleId);

        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Notes");

            CellStyle headerStyle = wb.createCellStyle();
            org.apache.poi.ss.usermodel.Font hf = wb.createFont();
            hf.setBold(true);
            headerStyle.setFont(hf);

            Row info = sheet.createRow(0);
            info.createCell(0).setCellValue("Groupe : " + g.getNom() + "   |   Module : " + module.getNom());

            String[] cols = {"#", "Nom", "Prénom", "CC (/20)", "EFM (/40)", "Moyenne (/20)"};
            Row head = sheet.createRow(2);
            for (int i = 0; i < cols.length; i++) {
                Cell c = head.createCell(i);
                c.setCellValue(cols[i]);
                c.setCellStyle(headerStyle);
            }

            int r = 3, n = 1;
            for (NoteModuleResponse e : grille) {
                Row row = sheet.createRow(r++);
                row.createCell(0).setCellValue(n++);
                row.createCell(1).setCellValue(nullSafe(e.getStagiaireNom()));
                row.createCell(2).setCellValue(nullSafe(e.getStagiairePrenom()));
                row.createCell(3).setCellValue(e.getCc() != null ? String.valueOf(e.getCc()) : "—");
                row.createCell(4).setCellValue(e.getEfm() != null ? String.valueOf(e.getEfm()) : "—");
                row.createCell(5).setCellValue(e.getMoyenne() != null ? String.valueOf(Math.round(e.getMoyenne() * 100.0) / 100.0) : "—");
            }
            for (int i = 0; i < cols.length; i++) sheet.autoSizeColumn(i);

            wb.write(out);
            auditService.log(demandeur, "EXPORT_NOTES", "Groupe", groupeId,
                    "Export Excel notes — " + g.getNom() + " / " + module.getNom());
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Erreur export notes : " + e.getMessage(), e);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Absences d'un groupe (Excel)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public byte[] genererExportAbsences(Long groupeId, User demandeur) {
        Groupe g = groupeRepository.findByIdWithFiliere(groupeId)
                .orElseThrow(() -> new ResourceNotFoundException("Groupe non trouvé: " + groupeId));
        List<AbsenceResponse> absences = absenceService.findByGroupe(groupeId);

        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Absences");

            CellStyle headerStyle = wb.createCellStyle();
            org.apache.poi.ss.usermodel.Font hf = wb.createFont();
            hf.setBold(true);
            headerStyle.setFont(hf);

            Row info = sheet.createRow(0);
            info.createCell(0).setCellValue("Groupe : " + g.getNom()
                    + "   |   Total : " + absences.size());

            String[] cols = {"#", "Nom", "Prénom", "Date", "Type", "Créneau", "Justifiée", "Motif", "Formateur"};
            Row head = sheet.createRow(2);
            for (int i = 0; i < cols.length; i++) {
                Cell c = head.createCell(i);
                c.setCellValue(cols[i]);
                c.setCellStyle(headerStyle);
            }

            int r = 3, n = 1;
            for (AbsenceResponse a : absences) {
                Row row = sheet.createRow(r++);
                row.createCell(0).setCellValue(n++);
                row.createCell(1).setCellValue(nullSafe(a.getStagiaireNom()));
                row.createCell(2).setCellValue(nullSafe(a.getStagiairePrenom()));
                row.createCell(3).setCellValue(a.getDateAbsence() != null ? a.getDateAbsence().format(DF) : "—");
                row.createCell(4).setCellValue("RETARD".equals(a.getType()) ? "Retard" : "Absence");
                row.createCell(5).setCellValue(nullSafe(a.getHeureCreneau()));
                row.createCell(6).setCellValue(a.isJustifiee() ? "Oui" : "Non");
                row.createCell(7).setCellValue(nullSafe(a.getMotif()));
                row.createCell(8).setCellValue(nullSafe(a.getFormateurNom()));
            }
            for (int i = 0; i < cols.length; i++) sheet.autoSizeColumn(i);

            wb.write(out);
            auditService.log(demandeur, "EXPORT_ABSENCES", "Groupe", groupeId,
                    "Export Excel absences — " + g.getNom());
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Erreur export absences : " + e.getMessage(), e);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Bilan pédagogique global (PDF)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public byte[] genererBilan(User demandeur) {
        StatistiqueService.AvanceesStats stats = statistiqueService.getAvanceesStats();

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 56, 56, 72, 56);
            PdfWriter.getInstance(doc, out);
            doc.open();

            Font titleFont = new Font(Font.FontFamily.HELVETICA, 16, Font.BOLD);
            Font bodyFont  = new Font(Font.FontFamily.HELVETICA, 11, Font.NORMAL);

            Paragraph title = new Paragraph("BILAN PÉDAGOGIQUE — CMC NADOR", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(6);
            doc.add(title);
            Paragraph sub = new Paragraph("Édité le " + LocalDate.now().format(DF), bodyFont);
            sub.setAlignment(Element.ALIGN_CENTER);
            sub.setSpacingAfter(24);
            doc.add(sub);

            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{3, 1});
            addRow(table, "Indicateur", "Valeur", true);
            addRow(table, "Stagiaires actifs", String.valueOf(stats.getTotalStagiaires()), false);
            addRow(table, "Formateurs actifs", String.valueOf(stats.getTotalFormateurs()), false);
            addRow(table, "Filières", String.valueOf(stats.getTotalFilieres()), false);
            addRow(table, "Groupes", String.valueOf(stats.getTotalGroupes()), false);
            addRow(table, "Demandes en attente", String.valueOf(stats.getDemandesEnAttente()), false);
            addRow(table, "Total absences", String.valueOf(stats.getTotalAbsences()), false);
            addRow(table, "Absences justifiées", String.valueOf(stats.getAbsencesJustifiees()), false);
            addRow(table, "Absences non justifiées", String.valueOf(stats.getAbsencesNonJustifiees()), false);
            addRow(table, "Moyenne générale",
                    stats.getMoyenneGlobale() != null ? String.valueOf(stats.getMoyenneGlobale()) : "—", false);
            doc.add(table);

            doc.close();
            auditService.log(demandeur, "GENERER_BILAN", "Statistique", null, "Bilan pédagogique généré");
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Erreur génération bilan : " + e.getMessage(), e);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Relevé de notes + Note de discipline (PDF)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public byte[] genererReleveNotes(Long stagiaireId, User demandeur) {
        BulletinResponse b = noteService.getBulletin(stagiaireId);
        DisciplineService.DisciplineBilan d = disciplineService.pourStagiaire(stagiaireId);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 48, 48, 60, 48);
            PdfWriter.getInstance(doc, out);
            doc.open();

            Font titleFont = new Font(Font.FontFamily.HELVETICA, 15, Font.BOLD);
            Font h2Font    = new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD);
            Font body      = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL);

            Paragraph title = new Paragraph("RELEVÉ DE NOTES — CMC NADOR", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(4);
            doc.add(title);

            Paragraph ident = new Paragraph(
                    b.getStagiaireNom()
                    + (b.getFiliereNom() != null ? "  •  " + b.getFiliereNom() : "")
                    + (b.getGroupeNom() != null ? "  •  Groupe " + b.getGroupeNom() : "")
                    + "\nÉdité le " + LocalDate.now().format(DF), body);
            ident.setAlignment(Element.ALIGN_CENTER);
            ident.setSpacingAfter(16);
            doc.add(ident);

            // Tableau des modules
            PdfPTable table = new PdfPTable(new float[]{5, 1.4f, 1.4f, 1.4f, 1.6f});
            table.setWidthPercentage(100);
            addRow5(table, "Module", "Coef.", "CC /20", "EFM /40", "Moyenne /20", true);
            for (BulletinResponse.LigneModule l : b.getModules()) {
                addRow5(table,
                        l.getModuleNom(),
                        fmt(l.getCoefficient()),
                        fmt(l.getCc()), fmt(l.getEfm()), fmt(l.getMoyenne()),
                        false);
            }
            doc.add(table);

            Paragraph moy = new Paragraph("\nMoyenne générale (pondérée par coefficient) : "
                    + (b.getMoyenneGenerale() != null ? b.getMoyenneGenerale() + " / 20" : "—"), h2Font);
            moy.setSpacingAfter(18);
            doc.add(moy);

            // Note de discipline
            Paragraph disciplineTitle = new Paragraph("NOTE DE DISCIPLINE", h2Font);
            disciplineTitle.setSpacingAfter(6);
            doc.add(disciplineTitle);

            PdfPTable dt = new PdfPTable(2);
            dt.setWidthPercentage(100);
            dt.setWidths(new float[]{3, 1});
            addRow(dt, "Indicateur", "Valeur", true);
            addRow(dt, "Retards cumulés", String.valueOf(d.getNbRetards()), false);
            addRow(dt, "Absences (séances non justifiées)", String.valueOf(d.getNbAbsencesSeances()), false);
            addRow(dt, "Équivalent journées", String.valueOf(d.getNbJournees()), false);
            addRow(dt, "Incidents de comportement", String.valueOf(d.getNbIncidents()), false);
            addRow(dt, "Note d'assiduité", d.getNoteAssiduite() + " / 10  (−" + d.getDeductionAssiduite() + ")", false);
            addRow(dt, "Note de comportement", d.getNoteComportement() + " / 5  (−" + d.getDeductionComportement() + ")", false);
            addRow(dt, "Note de discipline (ND)", d.getNoteDiscipline() + " / 15", true);
            addRow(dt, "ND pondérée (examen de passage)", d.getNoteDisciplineSur20() + " / 20", false);
            addRow(dt, "Sanction assiduité en cours", d.getSanctionAssiduite() + "  [" + d.getAutoriteAssiduite() + "]", false);
            addRow(dt, "Sanction comportement en cours", d.getSanctionComportement() + "  [" + d.getAutoriteComportement() + "]", false);
            doc.add(dt);

            Paragraph legende = new Paragraph(
                    "\nBarème : 1 retard = −0,25 pt ; 1 absence de séance = −0,50 pt. "
                    + "1 séance = 2,5 h ; 1 journée = 5 h. SG = Surveillant Général ; D = Directeur ; "
                    + "CD = Conseil de Discipline.",
                    new Font(Font.FontFamily.HELVETICA, 8, Font.ITALIC));
            doc.add(legende);

            doc.close();
            auditService.log(demandeur, "GENERER_RELEVE", "User", stagiaireId,
                    "Relevé de notes généré pour " + b.getStagiaireNom());
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Erreur génération relevé : " + e.getMessage(), e);
        }
    }

    private static String fmt(Double v) { return v != null ? String.valueOf(v) : "—"; }

    private static void addRow5(PdfPTable t, String c1, String c2, String c3, String c4, String c5, boolean header) {
        Font f = new Font(Font.FontFamily.HELVETICA, 9, header ? Font.BOLD : Font.NORMAL);
        for (String c : new String[]{c1, c2, c3, c4, c5}) {
            PdfPCell cell = new PdfPCell(new Phrase(c != null ? c : "", f));
            cell.setPadding(5);
            t.addCell(cell);
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────
    private static void addRow(PdfPTable table, String left, String right, boolean header) {
        Font f = new Font(Font.FontFamily.HELVETICA, 11, header ? Font.BOLD : Font.NORMAL);
        PdfPCell l = new PdfPCell(new Phrase(left, f));
        PdfPCell r = new PdfPCell(new Phrase(right, f));
        l.setPadding(6);
        r.setPadding(6);
        table.addCell(l);
        table.addCell(r);
    }

    private static String fullNameUpper(User u) {
        return (nullSafe(u.getPrenom()) + " " + nullSafe(u.getNom())).trim().toUpperCase();
    }

    private static String nullSafe(String s) {
        return s != null ? s : "";
    }
}
