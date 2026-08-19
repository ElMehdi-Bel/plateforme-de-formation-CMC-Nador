package com.cmc.app.service;

import com.cmc.app.entity.Cours;
import com.cmc.app.entity.Module;
import com.cmc.app.entity.User;
import com.cmc.app.enums.TypeCours;
import com.cmc.app.exception.ResourceNotFoundException;
import com.cmc.app.repository.CoursRepository;
import com.cmc.app.repository.ModuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CoursService {

    private final CoursRepository coursRepository;
    private final ModuleRepository moduleRepository;
    private final AuditService auditService;

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Transactional
    public Cours upload(Long moduleId, String titre, String description,
                         MultipartFile file, User formateur) throws IOException {
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module non trouvé"));

        String extension = getExtension(file.getOriginalFilename());
        TypeCours type = detectType(extension);
        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();

        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(uploadPath);
        Files.copy(file.getInputStream(), uploadPath.resolve(fileName));

        Cours cours = Cours.builder()
                .titre(titre)
                .description(description)
                .typeCours(type)
                .fichierUrl("/uploads/" + fileName)
                .fichierNom(file.getOriginalFilename())
                .fichierTaille(file.getSize())
                .module(module)
                .formateur(formateur)
                .build();

        Cours saved = coursRepository.save(cours);
        auditService.log(formateur, "UPLOAD_COURS", "Cours", saved.getId(), "Upload: " + titre);
        return saved;
    }

    public Page<Cours> findByModule(Long moduleId, Pageable pageable) {
        return coursRepository.findByModuleId(moduleId, pageable);
    }

    public Page<Cours> findByGroupe(Long groupeId, Pageable pageable) {
        return coursRepository.findByGroupeId(groupeId, pageable);
    }

    @Transactional
    public void delete(Long id, User admin) throws IOException {
        Cours cours = coursRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cours non trouvé"));

        Path filePath = Paths.get(uploadDir).resolve(
            cours.getFichierUrl().replace("/uploads/", "")).toAbsolutePath();
        Files.deleteIfExists(filePath);

        coursRepository.delete(cours);
        auditService.log(admin, "DELETE_COURS", "Cours", id, "Suppression: " + cours.getTitre());
    }

    private TypeCours detectType(String extension) {
        return switch (extension.toLowerCase()) {
            case "pdf" -> TypeCours.PDF;
            case "mp4", "avi", "mkv", "mov" -> TypeCours.VIDEO;
            default -> TypeCours.AUTRE;
        };
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf('.') + 1);
    }
}
