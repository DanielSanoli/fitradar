package com.sanoli.fitradar.security;

import com.sanoli.fitradar.config.JwtCookieProperties;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

class RefreshTokenCookieServiceTest {

    private RefreshTokenCookieService cookieService;

    @BeforeEach
    void setUp() {
        JwtCookieProperties properties = new JwtCookieProperties();
        properties.setRefreshCookieName("fitradar_refresh");
        properties.setRefreshCookiePath("/api/v1/auth");
        properties.setRefreshCookieSecure(false);
        properties.setRefreshCookieSameSite("Strict");
        properties.setRefreshTokenTtlDays(30);
        cookieService = new RefreshTokenCookieService(properties);
    }

    @Test
    void writeAndReadRefreshTokenRoundTrip() {
        MockHttpServletResponse response = new MockHttpServletResponse();
        cookieService.writeRefreshToken(response, "raw-refresh-token");

        String setCookie = response.getHeader("Set-Cookie");
        assertThat(setCookie).contains("fitradar_refresh=raw-refresh-token");
        assertThat(setCookie).contains("HttpOnly");
        assertThat(setCookie).contains("Path=/api/v1/auth");
        assertThat(setCookie).contains("SameSite=Strict");

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("fitradar_refresh", "raw-refresh-token"));

        assertThat(cookieService.readRefreshToken(request)).contains("raw-refresh-token");
    }

    @Test
    void clearRefreshTokenExpiresCookie() {
        MockHttpServletResponse response = new MockHttpServletResponse();
        cookieService.clearRefreshToken(response);

        assertThat(response.getHeader("Set-Cookie")).contains("Max-Age=0");
    }
}
