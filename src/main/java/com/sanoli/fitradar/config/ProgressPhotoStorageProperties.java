package com.sanoli.fitradar.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.storage.progress-photo")
public class ProgressPhotoStorageProperties {

    private String directory = "data/uploads/progress-photos";

    /** Tamanho máximo do upload em bytes (5 MB). */
    private long maxBytes = 5L * 1024 * 1024;

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
