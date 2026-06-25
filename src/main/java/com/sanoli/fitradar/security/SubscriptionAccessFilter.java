package com.sanoli.fitradar.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Criadores mantêm acesso básico (alunos, programas, marketplace) mesmo após o trial.
 * Recursos premium são gateados por {@link ProFeatureAccessFilter}.
 *
 * @deprecated Mantido na cadeia por compatibilidade; não bloqueia mais rotas básicas.
 */
@Component
public class SubscriptionAccessFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        filterChain.doFilter(request, response);
    }
}
