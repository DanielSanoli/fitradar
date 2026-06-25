package com.sanoli.fitradar.integration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThatCode;

@Testcontainers(disabledWithoutDocker = true)
class FlywayMigrationTest {

    @Container
    @SuppressWarnings("resource")
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("fitradar")
            .withUsername("fitradar")
            .withPassword("fitradar");

    @Test
    void migrationsApplyOnCleanDatabase() {
        assertThatCode(() -> Flyway.configure()
                .dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
                .locations("classpath:db/migration")
                .load()
                .migrate()).doesNotThrowAnyException();
    }
}
