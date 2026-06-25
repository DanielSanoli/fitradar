package com.sanoli.fitradar.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;

public record AcceptTermsRequest(
        @NotNull(message = "Aceite os Termos de Uso para continuar")
        @AssertTrue(message = "Aceite os Termos de Uso para continuar")
        Boolean acceptedTerms
) {
}
