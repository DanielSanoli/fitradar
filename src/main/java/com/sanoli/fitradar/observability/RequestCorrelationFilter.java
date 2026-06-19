package com.sanoli.fitradar.observability;

import io.sentry.Sentry;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Propaga um requestId por requisição (MDC + header de resposta + Sentry).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestCorrelationFilter extends OncePerRequestFilter {

    public static final String REQUEST_ID = "requestId";
    public static final String REQUEST_ID_HEADER = "X-Request-Id";

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String requestId = resolveRequestId(request);
        MDC.put(REQUEST_ID, requestId);
        response.setHeader(REQUEST_ID_HEADER, requestId);
        Sentry.configureScope(scope -> {
            scope.setTag(REQUEST_ID, requestId);
            scope.setTag("http.method", request.getMethod());
            scope.setTag("http.route", request.getRequestURI());
        });
        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(REQUEST_ID);
        }
    }

    private String resolveRequestId(HttpServletRequest request) {
        String incoming = request.getHeader(REQUEST_ID_HEADER);
        if (incoming != null && !incoming.isBlank() && incoming.length() <= 64) {
            return incoming.trim();
        }
        return UUID.randomUUID().toString();
    }
}
