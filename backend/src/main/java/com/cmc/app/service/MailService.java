package com.cmc.app.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class MailService {

    private final JavaMailSender mailSender;

    @Async
    public void envoyerCredentials(String destinataire, String nomComplet, String email, String motDePasse) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(destinataire);
            helper.setSubject("Bienvenue sur la plateforme CMC Nador — Vos identifiants de connexion");
            helper.setText(buildEmailHtml(nomComplet, email, motDePasse), true);

            mailSender.send(message);
            log.info("Email envoyé à {}", destinataire);
        } catch (MessagingException e) {
            log.error("Erreur envoi email à {} : {}", destinataire, e.getMessage());
        }
    }

    private String buildEmailHtml(String nom, String email, String motDePasse) {
        return """
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: #1e40af; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 22px;">CMC Nador</h1>
                <p style="color: #bfdbfe; margin: 4px 0 0 0; font-size: 14px;">Plateforme de gestion des stagiaires</p>
              </div>
              <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                <p style="color: #374151; font-size: 16px;">Bonjour <strong>%s</strong>,</p>
                <p style="color: #6b7280;">Votre compte a été créé. Voici vos identifiants de connexion :</p>
                <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <p style="margin: 0 0 10px 0;"><strong style="color: #374151;">Email :</strong>
                    <span style="color: #2563eb; font-family: monospace;">%s</span></p>
                  <p style="margin: 0;"><strong style="color: #374151;">Mot de passe :</strong>
                    <span style="color: #2563eb; font-family: monospace; font-size: 18px;">%s</span></p>
                </div>
                <p style="color: #6b7280; font-size: 13px;">
                  Connectez-vous sur la plateforme et changez votre mot de passe après la première connexion.
                </p>
                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">CMC Nador © %d — Message automatique</p>
                </div>
              </div>
            </div>
            """.formatted(nom, email, motDePasse, java.time.Year.now().getValue());
    }
}
