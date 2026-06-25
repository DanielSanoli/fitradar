package com.sanoli.fitradar.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.storage.logo")
public class LogoStorageProperties {

    /** Diretório base onde os arquivos são gravados (mapeado em /uploads/logos/**). */
    private String directory = "data/uploads/logos";

    /** Tamanho máximo do upload em bytes (2 MB). */
    private long maxBytes = 2L * 1024 * 1024;

    public String getDirectory() {
        return directory;
    }

    public void setDirectory(String directory) {
        this.directory = directory;
    }

    public long getMaxBytes() {
        return maxBytes;
    }

    public void setMaxBytes(long maxBytes) {
        this.maxBytes = maxBytes;
    }
}
