package com.cmc.app.exception;

/** Levée lorsque trop de tentatives de connexion échouées ont été effectuées. */
public class TooManyAttemptsException extends RuntimeException {
    public TooManyAttemptsException(String message) {
        super(message);
    }
}
