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
 * Bloqueia (402) o CRIADOR sem assinatura/trial nas rotas de gestão.
 * Alunos (STUDENT) nunca são bloqueados por billing — quem paga o SaaS é o criador.
 */
@Component
public class SubscriptionAccessFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public SubscriptionAccessFilter(UserRepository userRepository, ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (!isCreatorProtectedPath(request)) {
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
        if (user == null || user.hasActiveAccess()) {
            filterChain.doFilter(request, response);
            return;
        }

        writePaymentRequired(response, request.getRequestURI(), user.getAccessMessage());
    }

    private boolean isCreatorProtectedPath(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/api/v1/creator-space")
                || path.startsWith("/api/v1/programs")
                || path.startsWith("/api/v1/students")
                || path.startsWith("/api/v1/retention")
                || path.startsWith("/api/v1/copilot")
                || path.startsWith("/api/v1/gamification")
                || path.startsWith("/api/v1/billing/marketplace/sales");
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
