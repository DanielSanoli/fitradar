package com.sanoli.fitradar.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * SPA fallback: deep links do React (refresh / bookmark) recebem {@code index.html}.
 * Arquivos estáticos reais (JS, CSS, SW, ícones) continuam servidos pelo handler padrão.
 */
@Controller
public class SpaForwardController {

    @GetMapping({
            "/login",
            "/register",
            "/billing-required",
            "/404",
            "/c",
            "/c/**",
            "/app",
            "/app/**",
            "/student",
            "/student/**"
    })
    public String forwardSpaRoutes() {
        return "forward:/index.html";
    }
}
