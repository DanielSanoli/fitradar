package com.sanoli.fitradar.service;

import com.sanoli.fitradar.domain.DigestFrequency;
import com.sanoli.fitradar.domain.UserSettings;
import com.sanoli.fitradar.dto.UserSettingsUpdateRequest;
import com.sanoli.fitradar.repository.UserSettingsRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserSettingsServiceTest {

    @Mock
    private UserSettingsRepository repository;

    @InjectMocks
    private UserSettingsService service;

    @Test
    void get_returnsWeeklyDefaultWhenMissing() {
        UUID userId = UUID.randomUUID();
        when(repository.findById(userId)).thenReturn(Optional.empty());

        var response = service.get(userId);

        assertThat(response.digestFrequency()).isEqualTo(DigestFrequency.WEEKLY);
    }

    @Test
    void update_persistsDigestFrequency() {
        UUID userId = UUID.randomUUID();
        when(repository.findById(userId)).thenReturn(Optional.empty());
        when(repository.save(any(UserSettings.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = service.update(userId, new UserSettingsUpdateRequest(DigestFrequency.DAILY));

        assertThat(response.digestFrequency()).isEqualTo(DigestFrequency.DAILY);
        ArgumentCaptor<UserSettings> captor = ArgumentCaptor.forClass(UserSettings.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getDigestFrequency()).isEqualTo(DigestFrequency.DAILY);
    }

    @Test
    void digestFrequencyFor_defaultsToWeekly() {
        UUID userId = UUID.randomUUID();
        when(repository.findById(userId)).thenReturn(Optional.empty());

        assertThat(service.digestFrequencyFor(userId)).isEqualTo(DigestFrequency.WEEKLY);
    }
}
