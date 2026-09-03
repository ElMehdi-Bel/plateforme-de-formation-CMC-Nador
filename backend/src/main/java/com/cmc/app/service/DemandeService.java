package com.cmc.app.service;

import com.cmc.app.dto.request.DemandeRequest;
import com.cmc.app.entity.Demande;
import com.cmc.app.entity.User;
import com.cmc.app.enums.Role;
import com.cmc.app.enums.StatutDemande;
import com.cmc.app.enums.TypeDemande;
import com.cmc.app.exception.ResourceNotFoundException;
import com.cmc.app.repository.DemandeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class DemandeService {

    private final DemandeRepository demandeRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final DocumentService documentService;

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Transactional
    public Demande create(DemandeRequest request, User stagiaire) {
        Demande demande = Demande.builder()
                .stagiaire(stagiaire)
                .typeDemande(request.getTypeDemande())
                .motif(request.getMotif())
                .statut(StatutDemande.EN_ATTENTE)
                .build();

        return demandeRepository.save(demande);
    }

    @Transactional
    public Demande traiter(Long id, StatutDemande statut, String commentaire, User admin) {
        Demande demande = getOrThrow(id);

        // Attestation de poursuite de formation : génération automatique du PDF
        // dès l'approbation (via DocumentService), sans upload manuel.
        if (statut == StatutDemande.APPROUVEE && demande.getTypeDemande() == TypeDemande.ATTESTATION_POURSUITE_FORMATION) {
            genererEtAttacherAttestation(demande, admin);
        } else {
            demande.setStatut(statut);
        }

        demande.setCommentaireAdmin(commentaire);
        demande.setTraitePar(admin);
        demande.setDateTraitement(LocalDateTime.now());

        Demande saved = demandeRepository.save(demande);

        if (saved.getStatut() != StatutDemande.DOCUMENT_PRET) {
            String msg = statut == StatutDemande.APPROUVEE
                    ? "Votre demande a été approuvée."
                    : "Votre demande a été rejetée. " + (commentaire != null ? commentaire : "");
            try {
                notificationService.envoyer(admin, demande.getStagiaire(),
                        "Demande " + demande.getTypeDemande().name(), msg, "DEMANDE");
            } catch (Exception ex) {
                log.warn("Notification non envoyée pour demande {}: {}", id, ex.getMessage());
            }
        }

        auditService.log(admin, "TRAITER_DEMANDE", "Demande", id,
                "Demande " + statut.name() + " pour " + demande.getStagiaire().getFullName());

        return saved;
    }

    private void genererEtAttacherAttestation(Demande demande, User admin) {
        byte[] pdf = documentService.genererAttestation(demande.getStagiaire().getId(), admin);

        try {
            Path dirPath = Paths.get(uploadDir, "demandes", String.valueOf(demande.getId())).toAbsolutePath();
            Files.createDirectories(dirPath);

            String storedName = "attestation_" + demande.getId() + "_" + System.currentTimeMillis() + ".pdf";
            Path filePath = dirPath.resolve(storedName);

            if (demande.getDocumentUrl() != null) {
                try { Files.deleteIfExists(Paths.get(demande.getDocumentUrl())); } catch (IOException ignored) {}
            }

            Files.write(filePath, pdf);

            String nomFichier = "Attestation_Poursuite_Formation_" + demande.getStagiaire().getNom()
                    + "_" + demande.getStagiaire().getPrenom() + ".pdf";
            demande.setDocumentUrl(filePath.toString());
            demande.setDocumentNom(nomFichier);
            demande.setStatut(StatutDemande.DOCUMENT_PRET);

            try {
                notificationService.envoyer(admin, demande.getStagiaire(),
                        "Attestation disponible",
                        "Votre attestation de poursuite de formation a été générée. Vous pouvez la télécharger depuis votre espace.",
                        "DOCUMENT");
            } catch (Exception ex) {
                log.warn("Notification non envoyée pour demande {}: {}", demande.getId(), ex.getMessage());
            }
        } catch (IOException e) {
            log.error("Erreur génération attestation pour demande {}: {}", demande.getId(), e.getMessage(), e);
            throw new RuntimeException("Erreur lors de la sauvegarde de l'attestation : " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public Page<Demande> findByStagiaire(Long stagiaireId, Pageable pageable) {
        return demandeRepository.findByStagiaireId(stagiaireId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Demande> findAll(Pageable pageable) {
        return demandeRepository.findAllWithStagiaire(pageable);
    }

    @Transactional(readOnly = true)
    public Page<Demande> findByStatut(StatutDemande statut, Pageable pageable) {
        return demandeRepository.findByStatut(statut, pageable);
    }

    public long countEnAttente() {
        return demandeRepository.countByStatut(StatutDemande.EN_ATTENTE);
    }

    @Transactional
    public Demande uploadDocument(Long id, MultipartFile file, User admin) {
        Demande demande = getOrThrow(id);

        if (demande.getStatut() != StatutDemande.APPROUVEE && demande.getStatut() != StatutDemande.DOCUMENT_PRET) {
            throw new IllegalStateException("La demande doit être approuvée avant d'uploader un document");
        }
        if (file.isEmpty()) {
            throw new IllegalStateException("Le fichier est vide");
        }

        try {
            Path dirPath = Paths.get(uploadDir, "demandes", String.valueOf(id)).toAbsolutePath();
            Files.createDirectories(dirPath);

            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
            String ext = originalName.contains(".") ? originalName.substring(originalName.lastIndexOf('.')) : "";
            String storedName = "doc_" + id + "_" + System.currentTimeMillis() + ext;
            Path filePath = dirPath.resolve(storedName);

            if (demande.getDocumentUrl() != null) {
                try { Files.deleteIfExists(Paths.get(demande.getDocumentUrl())); } catch (IOException ignored) {}
            }

            Files.write(filePath, file.getBytes());

            demande.setDocumentUrl(filePath.toString());
            demande.setDocumentNom(originalName);
            demande.setStatut(StatutDemande.DOCUMENT_PRET);

            Demande saved = demandeRepository.save(demande);

            try {
                notificationService.envoyer(admin, demande.getStagiaire(),
                        "Document disponible",
                        "Votre document (" + demande.getTypeDemande().name().replace('_', ' ') +
                        ") est prêt. Vous pouvez le télécharger depuis votre espace.",
                        "DOCUMENT");
            } catch (Exception ex) {
                log.warn("Notification non envoyée pour demande {}: {}", id, ex.getMessage());
            }

            auditService.log(admin, "UPLOAD_DOCUMENT", "Demande", id,
                    "Document uploadé pour " + demande.getStagiaire().getFullName());

            return saved;
        } catch (IOException e) {
            log.error("Erreur upload document pour demande {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Erreur lors de la sauvegarde du fichier : " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public ResponseEntity<Resource> getDocument(Long id, User user) {
        Demande demande = getOrThrow(id);

        if (user.getRole() == Role.STAGIAIRE && !demande.getStagiaire().getId().equals(user.getId())) {
            throw new AccessDeniedException("Accès refusé");
        }
        if (demande.getDocumentUrl() == null) {
            throw new ResourceNotFoundException("Aucun document disponible pour cette demande");
        }

        try {
            Path filePath = Paths.get(demande.getDocumentUrl());
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                throw new ResourceNotFoundException("Fichier introuvable sur le serveur");
            }

            String contentType = "application/octet-stream";
            try {
                String detected = Files.probeContentType(filePath);
                if (detected != null) contentType = detected;
            } catch (IOException ignored) {}

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + demande.getDocumentNom() + "\"")
                    .body(resource);
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors du téléchargement", e);
        }
    }

    private Demande getOrThrow(Long id) {
        return demandeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Demande non trouvée: " + id));
    }
}
