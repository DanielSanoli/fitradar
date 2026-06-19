package com.sanoli.fitradar.exception;

public class WebhookUnauthorizedException extends RuntimeException {

    public WebhookUnauthorizedException(String message) {
        super(message);
    }
}
