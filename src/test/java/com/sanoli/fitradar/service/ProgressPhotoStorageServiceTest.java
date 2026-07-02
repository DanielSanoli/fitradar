package com.sanoli.fitradar.service;

import com.sanoli.fitradar.config.ProgressPhotoStorageProperties;
import com.sanoli.fitradar.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Path;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ProgressPhotoStorageServiceTest {

    @TempDir
    Path tempDir;

    ProgressPhotoStorageService service;

    @BeforeEach
    void setUp() throws Exception {
        ProgressPhotoStorageProperties properties = new ProgressPhotoStorageProperties();
        properties.setDirectory(tempDir.toString());
        properties.setMaxBytes(1024);
        service = new ProgressPhotoStorageService(properties);
    }

    @Test
    void store_savesUnderStudentScope() {
        UUID studentId = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "photo.png",
                "image/png",
                new byte[]{(byte) 137, 80, 78, 71});

        String path = service.store(studentId, file);

        assertThat(path).startsWith(studentId + "/");
        assertThat(path).endsWith(".png");
        assertThat(service.loadAsResource(path).exists()).isTrue();
    }

    @Test
    void validateUpload_rejectsOversizedFile() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "photo.png",
                "image/png",
                new byte[2048]);

        assertThatThrownBy(() -> service.validateUpload(file))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("5 MB");
    }

    @Test
    void validateUpload_rejectsUnsupportedType() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "photo.gif",
                "image/gif",
                new byte[]{1, 2, 3});

        assertThatThrownBy(() -> service.validateUpload(file))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Formato inválido");
    }
}
