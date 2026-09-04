package com.cmc.app.service;

import com.cmc.app.entity.User;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.ColumnText;
import com.itextpdf.text.pdf.PdfContentByte;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
public class AttestationPdfService {

    @Value("${app.etablissement.nom}")
    private String etablissementNom;

    @Value("${app.etablissement.ville}")
    private String etablissementVille;

    @Value("${app.annee-scolaire}")
    private String anneeScolaire;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private static final BaseColor VERT_OFPPT  = new BaseColor(0, 150, 82);
    private static final BaseColor GRIS_OFPPT  = new BaseColor(128, 130, 133);
    private static final BaseColor BLEU_OFPPT  = new BaseColor(0, 92, 169);
    private static final BaseColor TEXTE_FONCE = new BaseColor(20, 20, 20);

    public byte[] genererAttestationPoursuiteFormation(User stagiaire) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document doc = new Document(PageSize.A4, 56, 56, 105, 60);
            PdfWriter writer = PdfWriter.getInstance(doc, out);
            doc.open();

            // ── Polices ──────────────────────────────────────────────
            Font ofpptFont     = FontFactory.getFont(FontFactory.TIMES_BOLD, 22, TEXTE_FONCE);
            Font subHeaderFont = FontFactory.getFont(FontFactory.TIMES_ROMAN, 8.5f, BaseColor.DARK_GRAY);
            Font titleFont     = FontFactory.getFont(FontFactory.TIMES_BOLD, 12.5f, TEXTE_FONCE);
            Font refFont       = FontFactory.getFont(FontFactory.TIMES_ITALIC, 10.5f, TEXTE_FONCE);
            Font labelFont     = FontFactory.getFont(FontFactory.TIMES_BOLDITALIC, 11, TEXTE_FONCE);
            Font valueFont     = FontFactory.getFont(FontFactory.TIMES_ROMAN, 11, TEXTE_FONCE);
            Font valueBoldFont = FontFactory.getFont(FontFactory.TIMES_BOLD, 11, TEXTE_FONCE);
            Font italicFont    = FontFactory.getFont(FontFactory.TIMES_ITALIC, 10.5f, TEXTE_FONCE);
            Font boldItalicFont= FontFactory.getFont(FontFactory.TIMES_BOLDITALIC, 10.5f, TEXTE_FONCE);
            Font sigFont       = FontFactory.getFont(FontFactory.TIMES_BOLD, 9.5f, TEXTE_FONCE);

            // ── En-tête : logo dessiné + texte (positionné dans la marge haute) ──
            PdfContentByte cb = writer.getDirectContent();
            float pageHeight = PageSize.A4.getHeight();
            float logoX = 56, logoY = pageHeight - 50;
            dessinerLogo(cb, logoX, logoY, 15);

            ColumnText.showTextAligned(cb, Element.ALIGN_LEFT, new Phrase("OFPPT", ofpptFont), logoX + 62, logoY - 8, 0);
            ColumnText.showTextAligned(cb, Element.ALIGN_LEFT,
                    new Phrase("Office de la Formation Professionnelle et de la Promotion du Travail", subHeaderFont),
                    logoX, logoY - 32, 0);

            // ── Titre encadré ────────────────────────────────────────
            PdfPTable titleTable = new PdfPTable(1);
            titleTable.setWidthPercentage(78);
            titleTable.setHorizontalAlignment(Element.ALIGN_CENTER);
            PdfPCell titleCell = new PdfPCell(new Phrase("ATTESTATION DE POURSUITE DE FORMATION", titleFont));
            titleCell.setPadding(9);
            titleCell.setBorderWidth(1.4f);
            titleCell.setBorderColor(TEXTE_FONCE);
            titleCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            titleTable.addCell(titleCell);
            doc.add(titleTable);
            doc.add(new Paragraph(" ", valueFont));

            // ── Réf ──────────────────────────────────────────────────
            Chunk refChunk = new Chunk("Réf :", refFont);
            refChunk.setUnderline(0.5f, -2f);
            doc.add(new Paragraph(refChunk));
            doc.add(new Paragraph(" ", valueFont));

            // ── Directeur / établissement ────────────────────────────
            Paragraph directeur = new Paragraph();
            directeur.add(new Chunk("Je soussigné Directeur de l'établissement : ", boldItalicFont));
            directeur.add(new Chunk(etablissementNom, valueBoldFont));
            doc.add(directeur);
            doc.add(new Paragraph(" ", valueFont));

            // ── Champs du stagiaire ──────────────────────────────────
            String nomComplet = stagiaire.getNom().toUpperCase() + " " + stagiaire.getPrenom().toUpperCase();
            addField(doc, "Atteste que le stagiaire :", nomComplet, labelFont, valueBoldFont);

            String naissance = (stagiaire.getDateNaissance() != null ? stagiaire.getDateNaissance().format(DATE_FMT) : "")
                    + " à " + nullToEmpty(stagiaire.getLieuNaissance()).toUpperCase();
            addField(doc, "Né le :", naissance, labelFont, valueFont);

            addField(doc, "Niveau de formation :",
                    stagiaire.getNiveauFormation() != null ? stagiaire.getNiveauFormation().getLabel() : "",
                    labelFont, valueFont);

            String filiereNom = stagiaire.getGroupe() != null && stagiaire.getGroupe().getFiliere() != null
                    ? stagiaire.getGroupe().getFiliere().getNom() : "";
            String codeGroupe = stagiaire.getGroupe() != null ? stagiaire.getGroupe().getCode() : null;
            addField(doc, "Spécialité :",
                    filiereNom + (codeGroupe != null && !codeGroupe.isBlank() ? " (" + codeGroupe + ")" : ""),
                    labelFont, valueFont);

            addField(doc, "En:",
                    stagiaire.getGroupe() != null ? nullToEmpty(stagiaire.getGroupe().getAnneeFormation()) : "",
                    labelFont, valueFont);

            // Type Formation + Mode sur la même ligne (2 colonnes)
            PdfPTable ligneTypeMode = new PdfPTable(2);
            ligneTypeMode.setWidthPercentage(100);
            ligneTypeMode.setWidths(new float[]{1.3f, 1f});
            ligneTypeMode.getDefaultCell().setBorder(Rectangle.NO_BORDER);
            ligneTypeMode.getDefaultCell().setPaddingBottom(6);

            Paragraph typeP = new Paragraph();
            typeP.add(new Chunk("Type Formation: ", labelFont));
            typeP.add(new Chunk(stagiaire.getTypeFormation() != null ? stagiaire.getTypeFormation().getLabel() : "", valueFont));
            PdfPCell typeCell = new PdfPCell(typeP);
            typeCell.setBorder(Rectangle.NO_BORDER);
            ligneTypeMode.addCell(typeCell);

            Paragraph modeP = new Paragraph();
            modeP.add(new Chunk("Mode : ", labelFont));
            modeP.add(new Chunk(stagiaire.getModeFormation() != null ? stagiaire.getModeFormation().getLabel() : "", valueBoldFont));
            PdfPCell modeCell = new PdfPCell(modeP);
            modeCell.setBorder(Rectangle.NO_BORDER);
            ligneTypeMode.addCell(modeCell);

            doc.add(ligneTypeMode);

            addField(doc, "N° d'inscription :", nullToEmpty(stagiaire.getMatricule()), labelFont, valueFont);
            addField(doc, "Année de Formation:", nullToEmpty(anneeScolaire), labelFont, valueFont);

            doc.add(new Paragraph(" ", valueFont));
            String depuis = stagiaire.getDateInscription() != null ? stagiaire.getDateInscription().format(DATE_FMT) : "";
            doc.add(new Paragraph(" - Poursuit sa formation à l'établissement depuis : " + depuis, italicFont));
            doc.add(new Paragraph(" ", valueFont));
            doc.add(new Paragraph("Cette attestation est délivrée à l'intéressé pour servir et valoir ce que de droit.", boldItalicFont));
            doc.add(new Paragraph(" ", valueFont));
            doc.add(new Paragraph(" ", valueFont));

            Paragraph faitA = new Paragraph("Fait à : " + etablissementVille, italicFont);
            faitA.setAlignment(Element.ALIGN_RIGHT);
            doc.add(faitA);
            Paragraph le = new Paragraph("Le : " + LocalDate.now().format(DATE_FMT), italicFont);
            le.setAlignment(Element.ALIGN_RIGHT);
            doc.add(le);

            doc.add(new Paragraph(" ", valueFont));
            doc.add(new Paragraph(" ", valueFont));
            doc.add(new Paragraph(" ", valueFont));

            PdfPTable sigTable = new PdfPTable(2);
            sigTable.setWidthPercentage(100);
            Chunk c1Chunk = new Chunk("Signature et Cachet du\nSurveillant Général", sigFont);
            c1Chunk.setUnderline(0.4f, -2f);
            PdfPCell c1 = new PdfPCell(new Phrase(c1Chunk));
            c1.setBorder(Rectangle.NO_BORDER);
            c1.setHorizontalAlignment(Element.ALIGN_CENTER);
            Chunk c2Chunk = new Chunk("Signature et cachet\ndu Directeur:", sigFont);
            c2Chunk.setUnderline(0.4f, -2f);
            PdfPCell c2 = new PdfPCell(new Phrase(c2Chunk));
            c2.setBorder(Rectangle.NO_BORDER);
            c2.setHorizontalAlignment(Element.ALIGN_CENTER);
            sigTable.addCell(c1);
            sigTable.addCell(c2);
            doc.add(sigTable);

            doc.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la génération du PDF : " + e.getMessage(), e);
        }
    }

    private void addField(Document doc, String label, String value, Font labelFont, Font valueFont) throws DocumentException {
        Paragraph p = new Paragraph();
        p.add(new Chunk(label + " ", labelFont));
        p.add(new Chunk(value, valueFont));
        p.setSpacingAfter(6);
        doc.add(p);
    }

    private void dessinerLogo(PdfContentByte cb, float x, float y, float taille) {
        dessinerLosange(cb, x, y - taille * 0.3f, taille, VERT_OFPPT);
        dessinerLosange(cb, x + taille * 0.75f, y - taille * 0.3f, taille, GRIS_OFPPT);
        dessinerLosange(cb, x + taille * 1.55f, y, taille * 1.25f, BLEU_OFPPT);
    }

    private void dessinerLosange(PdfContentByte cb, float cx, float cy, float taille, BaseColor couleur) {
        float h = taille / 2f;
        cb.saveState();
        cb.setColorStroke(couleur);
        cb.setLineWidth(2.2f);
        cb.moveTo(cx, cy + h);
        cb.lineTo(cx + h, cy);
        cb.lineTo(cx, cy - h);
        cb.lineTo(cx - h, cy);
        cb.closePathStroke();
        cb.restoreState();
    }

    private String nullToEmpty(String s) {
        return s == null ? "" : s;
    }
}
