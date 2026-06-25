package com.sanoli.fitradar.service;

import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.RefreshToken;
import com.sanoli.fitradar.dto.MessageResponse;
import com.sanoli.fitradar.dto.SessionResponse;
import com.sanoli.fitradar.exception.BusinessException;
import com.sanoli.fitradar.repository.RefreshTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class SessionService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final TokenService tokenService;

    public SessionService(RefreshTokenRepository refreshTokenRepository, TokenService tokenService) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.tokenService = tokenService;
    }

    @Transactional(readOnly = true)
    public List<SessionResponse> listActiveSessions(AppUser user, String currentRefreshToken) {
        List<RefreshToken> sessions = refreshTokenRepository
                .findByUser_IdAndRevokedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
                        user.getId(),
                        LocalDateTime.now()
                );
        return sessions.stream()
                .map(session -> SessionResponse.from(session, isCurrentSession(session, currentRefreshToken)))
                .toList();
    }

    @Transactional
    public MessageResponse logout(String refreshToken) {
        tokenService.revokeRefreshToken(refreshToken);
        return new MessageResponse("Sessão encerrada.");
    }

    @Transactional
    public MessageResponse revokeSession(AppUser user, UUID sessionId, String currentRefreshToken) {
        RefreshToken session = refreshTokenRepository.findByIdAndUser_Id(sessionId, user.getId())
                .orElseThrow(() -> new BusinessException("Sessão não encontrada"));

        if (session.isRevoked() || session.isExpired()) {
            throw new BusinessException("Sessão já encerrada");
        }

        session.setRevoked(true);
        refreshTokenRepository.save(session);

        if (isCurrentSession(session, currentRefreshToken)) {
            return new MessageResponse("Sessão atual encerrada.");
        }
        return new MessageResponse("Sessão encerrada.");
    }

    private boolean isCurrentSession(RefreshToken session, String currentRefreshToken) {
        return currentRefreshToken != null
                && !currentRefreshToken.isBlank()
                && currentRefreshToken.equals(session.getToken());
    }
}
