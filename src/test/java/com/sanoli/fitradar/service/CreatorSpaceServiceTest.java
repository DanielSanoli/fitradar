package com.sanoli.fitradar.service;

import com.sanoli.fitradar.domain.CreatorSpace;
import com.sanoli.fitradar.domain.SpaceCategory;
import com.sanoli.fitradar.dto.CreatorSpaceRequest;
import com.sanoli.fitradar.repository.CreatorSpaceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CreatorSpaceServiceTest {

    @Mock
    CreatorSpaceRepository creatorSpaceRepository;

    CreatorSpaceService service;

    @BeforeEach
    void setUp() {
        service = new CreatorSpaceService(creatorSpaceRepository);
    }

    @Test
    void save_persistsCategory() {
        UUID creatorId = UUID.randomUUID();
        when(creatorSpaceRepository.findByCreatorId(creatorId)).thenReturn(Optional.empty());
        when(creatorSpaceRepository.findBySlug(any())).thenReturn(Optional.empty());
        when(creatorSpaceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CreatorSpace saved = service.save(
                creatorId,
                new CreatorSpaceRequest("Studio Cross", "studio-cross", null, "#1ed7a6", "Bio", SpaceCategory.CROSSFIT));

        assertThat(saved.getCategory()).isEqualTo(SpaceCategory.CROSSFIT);

        ArgumentCaptor<CreatorSpace> captor = ArgumentCaptor.forClass(CreatorSpace.class);
        verify(creatorSpaceRepository).save(captor.capture());
        assertThat(captor.getValue().getCategory()).isEqualTo(SpaceCategory.CROSSFIT);
    }

    @Test
    void save_defaultsCategoryToOtherWhenNull() {
        UUID creatorId = UUID.randomUUID();
        when(creatorSpaceRepository.findByCreatorId(creatorId)).thenReturn(Optional.empty());
        when(creatorSpaceRepository.findBySlug(any())).thenReturn(Optional.empty());
        when(creatorSpaceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CreatorSpace saved = service.save(
                creatorId,
                new CreatorSpaceRequest("Studio", "studio", null, null, null, null));

        assertThat(saved.getCategory()).isEqualTo(SpaceCategory.OTHER);
    }
}
