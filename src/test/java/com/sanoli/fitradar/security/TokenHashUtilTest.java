package com.sanoli.fitradar.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TokenHashUtilTest {

    @Test
    void sha256Hex_isDeterministic64CharHex() {
        String hash = TokenHashUtil.sha256Hex("sample-token-value");

        assertThat(hash).hasSize(64);
        assertThat(hash).matches("[0-9a-f]{64}");
        assertThat(TokenHashUtil.sha256Hex("sample-token-value")).isEqualTo(hash);
    }

    @Test
    void sha256Hex_rejectsBlankToken() {
        assertThatThrownBy(() -> TokenHashUtil.sha256Hex(" "))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
