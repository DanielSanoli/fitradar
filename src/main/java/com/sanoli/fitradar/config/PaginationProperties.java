package com.sanoli.fitradar.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

@ConfigurationProperties(prefix = "app.pagination")
public class PaginationProperties {

    private int defaultSize = 50;
    private int maxSize = 100;

    public int getDefaultSize() {
        return defaultSize;
    }

    public void setDefaultSize(int defaultSize) {
        this.defaultSize = defaultSize;
    }

    public int getMaxSize() {
        return maxSize;
    }

    public void setMaxSize(int maxSize) {
        this.maxSize = maxSize;
    }

    public Pageable toPageable(Integer page, Integer size, Sort sort) {
        int safePage = page != null && page >= 0 ? page : 0;
        int requestedSize = size != null && size > 0 ? size : defaultSize;
        int safeSize = Math.min(requestedSize, maxSize);
        return PageRequest.of(safePage, safeSize, sort != null ? sort : Sort.unsorted());
    }
}
