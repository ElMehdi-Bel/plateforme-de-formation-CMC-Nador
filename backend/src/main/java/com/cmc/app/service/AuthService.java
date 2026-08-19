package com.cmc.app.service;

import com.cmc.app.dto.request.LoginRequest;
import com.cmc.app.dto.response.AuthResponse;
import com.cmc.app.entity.RefreshToken;
import com.cmc.app.entity.User;
import com.cmc.app.exception.InvalidTokenException;
import com.cmc.app.repository.RefreshTokenRepository;
import com.cmc.app.repository.UserRepository;
import com.cmc.app.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuditService auditService;

    @Value("${app.jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = (User) authentication.getPrincipal();
        String accessToken = jwtService.generateAccessToken(user);
        RefreshToken refreshToken = createRefreshToken(user);

        auditService.log(user, "LOGIN", "User", user.getId(), "Connexion réussie");
        log.info("User {} logged in successfully", user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
    }

    @Transactional
    public AuthResponse refreshToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new InvalidTokenException("Refresh token invalide"));

        if (refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken);
            throw new InvalidTokenException("Refresh token expiré. Veuillez vous reconnecter.");
        }

        User user = refreshToken.getUser();
        String newAccessToken = jwtService.generateAccessToken(user);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
    }

    @Transactional
    public void logout(User user) {
        refreshTokenRepository.deleteByUser(user);
        auditService.log(user, "LOGOUT", "User", user.getId(), "Déconnexion");
    }

    private RefreshToken createRefreshToken(User user) {
        refreshTokenRepository.deleteByUser(user);

        RefreshToken refreshToken = RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .expiryDate(Instant.now().plusMillis(refreshTokenExpiration))
                .build();

        return refreshTokenRepository.save(refreshToken);
    }
}
