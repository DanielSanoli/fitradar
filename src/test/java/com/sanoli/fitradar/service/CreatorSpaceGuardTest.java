package com.sanoli.fitradar.service;

import com.sanoli.fitradar.exception.BusinessException;
import com.sanoli.fitradar.repository.CreatorSpaceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CreatorSpaceGuardTest {

    @Mock
    CreatorSpaceRepository creatorSpaceRepository;

    @InjectMocks
    CreatorSpaceGuard creatorSpaceGuard;

    @Test
    void requireSpacePassesWhenSpaceExists() {
        UUID creatorId = UUID.randomUUID();
        when(creatorSpaceRepository.findByCreatorId(creatorId)).thenReturn(Optional.of(new com.sanoli.fitradar.domain.CreatorSpace()));

        assertThatCode(() -> creatorSpaceGuard.requireSpace(creatorId)).doesNotThrowAnyException();
    }

    @Test
    void requireSpaceFailsWhenSpaceMissing() {
        UUID creatorId = UUID.randomUUID();
        when(creatorSpaceRepository.findByCreatorId(creatorId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> creatorSpaceGuard.requireSpace(creatorId))
                .isInstanceOf(BusinessException.class)
                .hasMessage(CreatorSpaceGuard.SPACE_REQUIRED_MESSAGE);
    }
}
