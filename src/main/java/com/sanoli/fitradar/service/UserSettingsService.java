package com.sanoli.fitradar.service;

import com.sanoli.fitradar.domain.DigestFrequency;
import com.sanoli.fitradar.domain.UserSettings;
import com.sanoli.fitradar.dto.UserSettingsResponse;
import com.sanoli.fitradar.dto.UserSettingsUpdateRequest;
import com.sanoli.fitradar.repository.UserSettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class UserSettingsService {

    private final UserSettingsRepository repository;

    public UserSettingsService(UserSettingsRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public UserSettingsResponse get(UUID userId) {
        return repository.findById(userId)
                .map(UserSettingsResponse::fromEntity)
                .orElseGet(() -> UserSettingsResponse.defaults(userId));
    }

    @Transactional(readOnly = true)
    public DigestFrequency digestFrequencyFor(UUID userId) {
        return repository.findById(userId)
                .map(UserSettings::getDigestFrequency)
                .orElse(DigestFrequency.WEEKLY);
    }

    @Transactional
    public UserSettingsResponse update(UUID userId, UserSettingsUpdateRequest request) {
        UserSettings settings = repository.findById(userId).orElseGet(() -> {
            UserSettings created = new UserSettings();
            created.setUserId(userId);
            return created;
        });
        settings.setDigestFrequency(request.digestFrequency());
        return UserSettingsResponse.fromEntity(repository.save(settings));
    }
}
