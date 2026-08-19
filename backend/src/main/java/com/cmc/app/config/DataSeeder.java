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
        if (!userRepository.existsByEmail("admin@cmc-nador.ma")) {
            User admin = User.builder()
                    .nom("Admin")
                    .prenom("CMC")
                    .email("admin@cmc-nador.ma")
                    .password(passwordEncoder.encode("Admin@2024"))
                    .role(Role.ADMIN)
                    .actif(true)
                    .build();
            userRepository.save(admin);
            log.info("Admin account created: admin@cmc-nador.ma / Admin@2024");
        }
    }
}
