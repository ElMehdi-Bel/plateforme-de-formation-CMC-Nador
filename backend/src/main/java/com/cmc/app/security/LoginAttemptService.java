package com.cmc.app.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Anti-brute-force très simple : compte les échecs de connexion par adresse IP
 * et verrouille temporairement au-delà d'un seuil. Stockage en mémoire
 * (suffisant pour une instance unique ; à remplacer par Redis si scale-out).
 */
@Service
@Slf4j
public class LoginAttemptService {

    @Value("${app.security.login.max-attempts:5}")
    private int maxAttempts;

    @Value("${app.security.login.lock-minutes:15}")
    private long lockMinutes;

    private final Map<String, Attempt> attempts = new ConcurrentHashMap<>();

    private static final class Attempt {
        int count;
        Instant lockedUntil;
    }

    public boolean isBlocked(String key) {
        Attempt a = attempts.get(key);
        if (a == null || a.lockedUntil == null) return false;
        if (Instant.now().isAfter(a.lockedUntil)) {
            attempts.remove(key);
            return false;
        }
        return true;
    }

    public void loginFailed(String key) {
        Attempt a = attempts.computeIfAbsent(key, k -> new Attempt());
        a.count++;
        if (a.count >= maxAttempts) {
            a.lockedUntil = Instant.now().plus(Duration.ofMinutes(lockMinutes));
            log.warn("Trop de tentatives de connexion échouées depuis {} — verrouillé {} min", key, lockMinutes);
        }
    }

    public void loginSucceeded(String key) {
        attempts.remove(key);
    }
}
