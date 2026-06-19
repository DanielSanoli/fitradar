package com.sanoli.fitradar.observability;

import com.sanoli.fitradar.config.ObservabilityProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Protege endpoints de métricas com token de gestão (opt-in por env).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class ManagementMetricsFilter extends OncePerRequestFilter {

    private static final String MANAGEMENT_TOKEN_HEADER = "X-Management-Token";

    private final ObservabilityProperties observabilityProperties;

    public ManagementMetricsFilter(ObservabilityProperties observabilityProperties) {
        this.observabilityProperties = observabilityProperties;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.startsWith("/actuator/prometheus") && !path.startsWith("/actuator/metrics");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if (!observabilityProperties.isMetricsEnabled()) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        String expected = observabilityProperties.getManagementToken();
        if (expected == null || expected.isBlank()) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN);
            return;
        }

        String provided = request.getHeader(MANAGEMENT_TOKEN_HEADER);
        if (provided == null || !constantTimeEquals(expected, provided)) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private static boolean constantTimeEquals(String expected, String actual) {
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                actual.getBytes(StandardCharsets.UTF_8));
    }
}
