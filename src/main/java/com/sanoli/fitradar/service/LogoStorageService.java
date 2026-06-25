package com.sanoli.fitradar.service;

import com.sanoli.fitradar.config.LogoStorageProperties;
import com.sanoli.fitradar.exception.BusinessException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class LogoStorageService {

    public static final String PUBLIC_PREFIX = "/uploads/logos/";

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/svg+xml"
    );

    private final LogoStorageProperties properties;
    private final Path rootDirectory;

    public LogoStorageService(LogoStorageProperties properties) throws IOException {
        this.properties = properties;
        this.rootDirectory = Path.of(properties.getDirectory()).toAbsolutePath().normalize();
        Files.createDirectories(this.rootDirectory);
    }

    public String store(UUID creatorId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Arquivo de logo é obrigatório");
        }
        if (file.getSize() > properties.getMaxBytes()) {
            throw new BusinessException("Logo deve ter no máximo 2 MB");
        }

        String contentType = normalizeContentType(file);
        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new BusinessException("Formato inválido — use PNG, JPG, WebP ou SVG");
        }

        String extension = extensionFor(contentType, file.getOriginalFilename());
        Path creatorDir = rootDirectory.resolve(creatorId.toString());
        try {
            Files.createDirectories(creatorDir);
            String filename = UUID.randomUUID() + extension;
            Path target = creatorDir.resolve(filename).normalize();
            if (!target.startsWith(creatorDir)) {
                throw new BusinessException("Nome de arquivo inválido");
            }
            file.transferTo(target);
            return PUBLIC_PREFIX + creatorId + "/" + filename;
        } catch (IOException e) {
            throw new BusinessException("Não foi possível salvar o logo");
        }
    }

    public void deleteIfManaged(String logoUrl) {
        if (logoUrl == null || !logoUrl.startsWith(PUBLIC_PREFIX)) {
            return;
        }
        String relative = logoUrl.substring(PUBLIC_PREFIX.length());
        Path file = rootDirectory.resolve(relative).normalize();
        if (!file.startsWith(rootDirectory)) {
            return;
        }
        try {
            Files.deleteIfExists(file);
        } catch (IOException ignored) {
            // best-effort cleanup
        }
    }

    private String normalizeContentType(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType != null && !contentType.isBlank()) {
            return contentType.toLowerCase(Locale.ROOT);
        }
        String filename = file.getOriginalFilename();
        if (filename != null && filename.toLowerCase(Locale.ROOT).endsWith(".svg")) {
            return "image/svg+xml";
        }
        return "";
    }

    private String extensionFor(String contentType, String originalFilename) {
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/jpeg" -> ".jpg";
            case "image/webp" -> ".webp";
            case "image/svg+xml" -> ".svg";
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
        if (lower.endsWith(".svg")) return ".svg";
        return ".bin";
    }
}
