package com.sanoli.fitradar.integration;

import com.sanoli.fitradar.domain.RiskLevel;
import com.sanoli.fitradar.retention.engine.RetentionEngineService;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Garante que funções críticas do motor não disparam 1 query por aluno (N+1).
 */
class RetentionEngineNPlusOneIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    IntegrationTestSupport support;

    @Autowired
    RetentionEngineService engine;

    @Autowired
    EntityManagerFactory entityManagerFactory;

    @Test
    void studentsAtRiskQueryCountDoesNotGrowLinearlyWithStudentCount() throws Exception {
        Statistics stats = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        stats.setStatisticsEnabled(true);

        String suffix = UUID.randomUUID().toString().substring(0, 8);
        IntegrationTestSupport.AuthContext creator =
                support.registerCreator("nplus1-creator-" + suffix + "@test.local");
        IntegrationTestSupport.ProgramContext program =
                support.createProgramWithWorkout(creator.token(), "Programa N+1");

        IntegrationTestSupport.StudentContext first =
                support.inviteStudent(creator.token(), "Aluno 1", "nplus1-s1-" + suffix + "@test.local");
        support.enrollStudent(creator.token(), first.studentId(), program.programId());

        UUID creatorId = UUID.fromString(creator.userId());

        stats.clear();
        engine.studentsAtRisk(creatorId, RiskLevel.LOW);
        long queriesForOne = stats.getPrepareStatementCount();

        for (int i = 2; i <= 12; i++) {
            IntegrationTestSupport.StudentContext student = support.inviteStudent(
                    creator.token(), "Aluno " + i, "nplus1-s" + i + "-" + suffix + "@test.local");
            support.enrollStudent(creator.token(), student.studentId(), program.programId());
        }

        stats.clear();
        engine.studentsAtRisk(creatorId, RiskLevel.LOW);
        long queriesForMany = stats.getPrepareStatementCount();

        assertThat(queriesForMany).isLessThanOrEqualTo(queriesForOne + 5);
    }
}
