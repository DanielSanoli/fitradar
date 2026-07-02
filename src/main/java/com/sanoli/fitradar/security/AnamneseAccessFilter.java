package com.sanoli.fitradar.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.UserRole;
import com.sanoli.fitradar.exception.ErrorResponse;
import com.sanoli.fitradar.repository.AnamneseRepository;
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
 * Bloqueia rotas do aluno (treinos, programas, check-ins) até preencher a anamnese.
 */
@Component
public class AnamneseAccessFilter extends OncePerRequestFilter {

    private static final String ANAMNESE_REQUIRED_MESSAGE = "Preencha a anamnese para continuar";

    private final UserRepository userRepository;
    private final AnamneseRepository anamneseRepository;
    private final ObjectMapper objectMapper;

    public AnamneseAccessFilter(
            UserRepository userRepository,
            AnamneseRepository anamneseRepository,
            ObjectMapper objectMapper
    ) {
        this.userRepository = userRepository;
        this.anamneseRepository = anamneseRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (!requiresAnamneseGate(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            filterChain.doFilter(request, response);
            return;
        }

        if (principal.getRole() != UserRole.STUDENT) {
            filterChain.doFilter(request, response);
            return;
        }

        AppUser user = userRepository.findById(principal.getId()).orElse(null);
        if (user == null || anamneseRepository.existsByStudentId(user.getId())) {
            filterChain.doFilter(request, response);
            return;
        }

        writeForbidden(response, request.getRequestURI(), ANAMNESE_REQUIRED_MESSAGE);
    }

    private boolean requiresAnamneseGate(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path.startsWith("/api/v1/auth") || path.startsWith("/api/v1/anamnese")) {
            return false;
        }
        return path.startsWith("/api/v1/my");
    }

    private void writeForbidden(HttpServletResponse response, String path, String message) throws IOException {
        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.FORBIDDEN.value(),
                "ANAMNESE_REQUIRED",
                message,
                path
        );

        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), error);
    }
}
