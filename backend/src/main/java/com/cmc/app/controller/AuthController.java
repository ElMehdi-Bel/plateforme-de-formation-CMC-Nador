package com.cmc.app.controller;

import com.cmc.app.dto.request.LoginRequest;
import com.cmc.app.dto.request.RefreshTokenRequest;
import com.cmc.app.dto.response.ApiResponse;
import com.cmc.app.dto.response.AuthResponse;
import com.cmc.app.entity.User;
import com.cmc.app.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Connexion réussie", response));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@AuthenticationPrincipal User user) {
        authService.logout(user);
        return ResponseEntity.ok(ApiResponse.success("Déconnexion réussie", null));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<User>> me(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(user));
    }
}
