package com.sanoli.fitradar.service;

import com.sanoli.fitradar.config.ProgressPhotoStorageProperties;
import com.sanoli.fitradar.exception.BusinessException;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class ProgressPhotoStorageService {

    static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/png",
            "image/jpeg",
            "image/webp"
    );

    private final ProgressPhotoStorageProperties properties;
    private final Path rootDirectory;

    public ProgressPhotoStorageService(ProgressPhotoStorageProperties properties) throws IOException {
        this.properties = properties;
        this.rootDirectory = Path.of(properties.getDirectory()).toAbsolutePath().normalize();
        Files.createDirectories(this.rootDirectory);
    }

    public String store(UUID studentId, MultipartFile file) {
        validateUpload(file);

        String contentType = normalizeContentType(file);
        String extension = extensionFor(contentType, file.getOriginalFilename());
        Path studentDir = rootDirectory.resolve(studentId.toString());
        try {
            Files.createDirectories(studentDir);
            String filename = UUID.randomUUID() + extension;
            Path target = studentDir.resolve(filename).normalize();
            if (!target.startsWith(studentDir)) {
                throw new BusinessException("Nome de arquivo inválido");
            }
            file.transferTo(target);
            return studentId + "/" + filename;
        } catch (IOException e) {
            throw new BusinessException("Não foi possível salvar a foto");
        }
    }

    void validateUpload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Arquivo de foto é obrigatório");
        }
        if (file.getSize() > properties.getMaxBytes()) {
            throw new BusinessException("Foto deve ter no máximo 5 MB");
        }
        String contentType = normalizeContentType(file);
        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new BusinessException("Formato inválido — use PNG, JPG ou WebP");
        }
    }

    public Resource loadAsResource(String storagePath) {
        Path file = resolveStoragePath(storagePath);
        if (!Files.exists(file)) {
            throw new BusinessException("Arquivo não encontrado");
        }
        try {
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new BusinessException("Arquivo não encontrado");
            }
            return resource;
        } catch (MalformedURLException e) {
            throw new BusinessException("Arquivo não encontrado");
        }
    }

    public MediaType mediaTypeFor(String storagePath) {
        String lower = storagePath.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".png")) {
            return MediaType.IMAGE_PNG;
        }
        if (lower.endsWith(".webp")) {
            return MediaType.parseMediaType("image/webp");
        }
        return MediaType.IMAGE_JPEG;
    }

    public void delete(String storagePath) {
        if (storagePath == null || storagePath.isBlank()) {
            return;
        }
        Path file = resolveStoragePath(storagePath);
        try {
            Files.deleteIfExists(file);
        } catch (IOException ignored) {
            // best-effort cleanup
        }
    }

    public void deleteAllForStudent(UUID studentId) {
        Path studentDir = rootDirectory.resolve(studentId.toString()).normalize();
        if (!studentDir.startsWith(rootDirectory) || !Files.isDirectory(studentDir)) {
            return;
        }
        try {
            Files.walk(studentDir)
                    .sorted(java.util.Comparator.reverseOrder())
                    .forEach(path -> {
                        try {
                            Files.deleteIfExists(path);
                        } catch (IOException ignored) {
                            // best-effort
                        }
                    });
        } catch (IOException ignored) {
            // best-effort
        }
    }

    private Path resolveStoragePath(String storagePath) {
        Path file = rootDirectory.resolve(storagePath).normalize();
        if (!file.startsWith(rootDirectory)) {
            throw new BusinessException("Caminho de arquivo inválido");
        }
        return file;
    }

    private String normalizeContentType(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType != null && !contentType.isBlank()) {
            return contentType.toLowerCase(Locale.ROOT);
        }
        return "";
    }

    private String extensionFor(String contentType, String originalFilename) {
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/jpeg" -> ".jpg";
            case "image/webp" -> ".webp";
            default -> extensionFromFilename(originalFilename);
        };
    }

    private String extensionFromFilename(String originalFilename) {
        if (originalFilename == null) {
            return ".bin";
        }
        String lower = originalFilename.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".png")) return ".png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return ".jpg";
        if (lower.endsWith(".webp")) return ".webp";
        return ".bin";
    }
}
