package com.sanoli.fitradar.service;

import com.sanoli.fitradar.config.LogoStorageProperties;
import com.sanoli.fitradar.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Path;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LogoStorageServiceTest {

    @TempDir
    Path tempDir;

    LogoStorageService service;

    @BeforeEach
    void setUp() throws Exception {
        LogoStorageProperties properties = new LogoStorageProperties();
        properties.setDirectory(tempDir.toString());
        properties.setMaxBytes(1024);
        service = new LogoStorageService(properties);
    }

    @Test
    void store_savesPngUnderCreatorScope() {
        UUID creatorId = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "logo.png",
                "image/png",
                new byte[]{(byte) 137, 80, 78, 71});

        String url = service.store(creatorId, file);

        assertThat(url).startsWith(LogoStorageService.PUBLIC_PREFIX + creatorId + "/");
        assertThat(url).endsWith(".png");
    }

    @Test
    void store_rejectsOversizedFile() {
        UUID creatorId = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "logo.png",
                "image/png",
                new byte[2048]);

        assertThatThrownBy(() -> service.store(creatorId, file))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("2 MB");
    }

    @Test
    void store_rejectsUnsupportedType() {
        UUID creatorId = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "logo.gif",
                "image/gif",
                new byte[]{1, 2, 3});

        assertThatThrownBy(() -> service.store(creatorId, file))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Formato inválido");
    }
}
