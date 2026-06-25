package com.sanoli.fitradar.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CpfCnpjValidatorTest {

    @Test
    void sanitize_removesNonDigits() {
        assertThat(CpfCnpjValidator.sanitize("123.456.789-09")).isEqualTo("12345678909");
        assertThat(CpfCnpjValidator.sanitize("12.345.678/0001-95")).isEqualTo("12345678000195");
    }

    @Test
    void isValid_acceptsKnownValidCpf() {
        assertThat(CpfCnpjValidator.isValid("52998224725")).isTrue();
        assertThat(CpfCnpjValidator.isValid("529.982.247-25")).isTrue();
    }

    @Test
    void isValid_rejectsInvalidCpf() {
        assertThat(CpfCnpjValidator.isValid("11111111111")).isFalse();
        assertThat(CpfCnpjValidator.isValid("12345678900")).isFalse();
        assertThat(CpfCnpjValidator.isValid("123")).isFalse();
    }

    @Test
    void isValid_acceptsKnownValidCnpj() {
        assertThat(CpfCnpjValidator.isValid("11222333000181")).isTrue();
        assertThat(CpfCnpjValidator.isValid("11.222.333/0001-81")).isTrue();
    }

    @Test
    void isValid_rejectsInvalidCnpj() {
        assertThat(CpfCnpjValidator.isValid("00000000000000")).isFalse();
        assertThat(CpfCnpjValidator.isValid("11222333000100")).isFalse();
    }
}
