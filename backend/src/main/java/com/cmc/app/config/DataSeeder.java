package com.cmc.app.config;

import com.cmc.app.entity.User;
import com.cmc.app.enums.Role;
import com.cmc.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedUser("admin@cmc-nador.ma",        "Admin@2024",   "Admin",        "CMC", Role.ADMIN);
        seedUser("chef@cmc-nador.ma",         "Chef@2024",    "Chef",         "Pole", Role.CHEF_DE_POLE);
        seedUser("gestionnaire@cmc-nador.ma", "Gestion@2024", "Gestionnaire", "Stagiaires", Role.GESTIONNAIRE);
    }

    private void seedUser(String email, String rawPassword, String prenom, String nom, Role role) {
        if (userRepository.existsByEmail(email)) return;
        User user = User.builder()
                .nom(nom)
                .prenom(prenom)
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .role(role)
                .actif(true)
                .build();
        userRepository.save(user);
        log.info("{} account created: {} / {}", role, email, rawPassword);
    }
}
