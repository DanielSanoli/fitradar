package com.sanoli.fitradar.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.UserRole;
import com.sanoli.fitradar.exception.ErrorResponse;
import com.sanoli.fitradar.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;

/**
 * Bloqueia recursos premium (Copilot, retenção avançada) para criadores sem Pro/trial.
 * Recursos básicos (alunos, programas) permanecem acessíveis no plano Free pós-trial.
 */
@Component
public class ProFeatureAccessFilter extends OncePerRequestFilter {

    private static final String PRO_FEATURE_MESSAGE = "Recurso disponível no plano Pro";

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public ProFeatureAccessFilter(UserRepository userRepository, ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (!isPremiumCreatorPath(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            filterChain.doFilter(request, response);
            return;
        }

        if (principal.getRole() != UserRole.CREATOR) {
            filterChain.doFilter(request, response);
            return;
        }

        AppUser user = userRepository.findById(principal.getId()).orElse(null);
        if (user == null || user.hasProFeatures()) {
            filterChain.doFilter(request, response);
            return;
        }

        writePaymentRequired(response, request.getRequestURI(), PRO_FEATURE_MESSAGE);
    }

    private boolean isPremiumCreatorPath(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/api/v1/copilot") || path.startsWith("/api/v1/retention");
    }

    private void writePaymentRequired(HttpServletResponse response, String path, String message) throws IOException {
        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.PAYMENT_REQUIRED.value(),
                "SUBSCRIPTION_REQUIRED",
                message,
                path
        );

        response.setStatus(HttpStatus.PAYMENT_REQUIRED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), error);
    }
}
