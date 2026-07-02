package com.sanoli.fitradar.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.UUID;

public record ReorderRequest(@NotEmpty List<UUID> orderedIds) {
}
