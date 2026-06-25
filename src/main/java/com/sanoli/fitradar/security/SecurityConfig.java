package com.sanoli.fitradar.security;

import com.sanoli.fitradar.config.AppRuntimeProperties;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.web.util.matcher.RegexRequestMatcher;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final AppRuntimeProperties appRuntimeProperties;

    public SecurityConfig(AppRuntimeProperties appRuntimeProperties) {
        this.appRuntimeProperties = appRuntimeProperties;
    }

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter,
            SubscriptionAccessFilter subscriptionAccessFilter
    ) throws Exception {
        http
                .cors(withDefaults())
                .headers(headers -> {
                    headers.contentTypeOptions(withDefaults());
                    headers.frameOptions(frame -> frame.deny());
                    headers.referrerPolicy(referrer -> referrer
                            .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN));
                    headers.permissionsPolicy(permissions -> permissions
                            .policy("geolocation=(), microphone=(), camera=()"));
                    headers.xssProtection(xss -> xss.disable());
                })
                .csrf(AbstractHttpConfigurer::disable)
                .anonymous(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex.authenticationEntryPoint(
                        (request, response, authException) -> response.sendError(HttpServletResponse.SC_UNAUTHORIZED)
                ))
                .authorizeHttpRequests(auth -> {
                    auth.requestMatchers(
                            "/",
                            "/index.html",
                            "/login",
                            "/login/**",
                            "/register",
                            "/register/**",
                            "/billing-required",
                            "/change-password",
                            "/accept-terms",
                            "/404",
                            "/app",
                            "/app/**",
                            "/student",
                            "/student/**",
                            "/offline.html",
                            "/privacy.html",
                            "/terms.html",
                            "/manifest.webmanifest",
                            "/sw.js",
                            "/registerSW.js",
                            "/push-sw.js",
                            "/assets/**",
                            "/icons/**",
                            "/uploads/logos/**",
                            "/favicon.svg",
                            "/favicon.ico"
                    ).permitAll();
                    auth.requestMatchers(new RegexRequestMatcher("/workbox-.*\\.js", null)).permitAll();
                    if (!appRuntimeProperties.isProduction()) {
                        auth.requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll();
                    }
                    auth.requestMatchers(HttpMethod.POST,
                            "/api/v1/auth/register",
                            "/api/v1/auth/login",
                            "/api/v1/auth/refresh",
                            "/api/v1/auth/forgot-password",
                            "/api/v1/auth/reset-password",
                            "/api/v1/auth/logout",
                            "/api/v1/auth/accept-invite"
                    ).permitAll();
                    auth.requestMatchers(HttpMethod.GET, "/api/v1/auth/verify-email").permitAll();
                    auth.requestMatchers(HttpMethod.GET, "/api/v1/public/**").permitAll();
                    auth.requestMatchers(HttpMethod.GET, "/api/v1/push/config").permitAll();
                    auth.requestMatchers(HttpMethod.POST, "/api/v1/billing/webhook").permitAll();
                    auth.requestMatchers("/actuator/health", "/actuator/health/**").permitAll();
                    auth.requestMatchers("/actuator/prometheus", "/actuator/metrics", "/actuator/metrics/**")
                            .permitAll();
                    auth.anyRequest().authenticated();
                })
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(subscriptionAccessFilter, JwtAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
