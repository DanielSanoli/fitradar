package com.sanoli.fitradar.service;

import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.ExperienciaTreino;
import com.sanoli.fitradar.domain.NivelAtividadeRotina;
import com.sanoli.fitradar.domain.ObjetivoPrincipal;
import com.sanoli.fitradar.domain.UserRole;
import com.sanoli.fitradar.dto.AnamneseRequest;
import com.sanoli.fitradar.dto.AnamneseResponse;
import com.sanoli.fitradar.exception.BusinessException;
import com.sanoli.fitradar.exception.ResourceNotFoundException;
import com.sanoli.fitradar.repository.AnamneseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AnamneseServiceTest {

    private AnamneseRepository anamneseRepository;
    private StudentService studentService;
    private AnamneseService service;

    private UUID creatorId;
    private UUID studentId;
    private AppUser creator;
    private AppUser student;

    @BeforeEach
    void setUp() {
        anamneseRepository = mock(AnamneseRepository.class);
        studentService = mock(StudentService.class);
        service = new AnamneseService(anamneseRepository, studentService);

        creatorId = UUID.randomUUID();
        studentId = UUID.randomUUID();

        creator = new AppUser();
        creator.setId(creatorId);
        creator.setRole(UserRole.CREATOR);

        student = new AppUser();
        student.setId(studentId);
        student.setRole(UserRole.STUDENT);
        student.setCreatorId(creatorId);
    }

    @Test
    void create_persistsAnamneseWhenConsentGiven() {
        when(anamneseRepository.existsByStudentId(studentId)).thenReturn(false);
        when(anamneseRepository.save(any())).thenAnswer(invocation -> {
            var entity = invocation.getArgument(0, com.sanoli.fitradar.domain.Anamnese.class);
            entity.setId(UUID.randomUUID());
            return entity;
        });

        AnamneseResponse response = service.create(student, validRequest());

        assertThat(response.consentimentoDadosSaude()).isTrue();
        assertThat(response.pesoAtualKg()).isEqualByComparingTo(new BigDecimal("78.50"));
        verify(anamneseRepository).save(any());
    }

    @Test
    void create_blocksWithoutConsent() {
        AnamneseRequest request = new AnamneseRequest(
                ObjetivoPrincipal.SAUDE,
                ExperienciaTreino.INICIANTE,
                3,
                NivelAtividadeRotina.MODERADO,
                175,
                new BigDecimal("78.50"),
                null,
                null,
                null,
                null,
                null,
                null,
                false
        );

        assertThatThrownBy(() -> service.create(student, request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("É necessário consentir o uso dos dados de saúde");
    }

    @Test
    void create_blocksDuplicate() {
        when(anamneseRepository.existsByStudentId(studentId)).thenReturn(true);

        assertThatThrownBy(() -> service.create(student, validRequest()))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Anamnese já preenchida");
    }

    @Test
    void getForCreator_enforcesTenantViaStudentService() {
        UUID otherStudent = UUID.randomUUID();
        when(studentService.requireStudent(creatorId, otherStudent)).thenThrow(ResourceNotFoundException.class);

        assertThatThrownBy(() -> service.getForCreator(creator, otherStudent))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getForCreator_returnsAnamneseForOwnStudent() {
        var entity = new com.sanoli.fitradar.domain.Anamnese();
        entity.setId(UUID.randomUUID());
        entity.setStudentId(studentId);
        entity.setCreatorId(creatorId);
        entity.setObjetivoPrincipal(ObjetivoPrincipal.SAUDE);
        entity.setExperienciaTreino(ExperienciaTreino.INICIANTE);
        entity.setDiasDisponiveisSemana(3);
        entity.setNivelAtividadeRotina(NivelAtividadeRotina.MODERADO);
        entity.setAlturaCm(175);
        entity.setPesoAtualKg(new BigDecimal("78.50"));
        entity.setConsentimentoDadosSaude(true);
        entity.setCreatedAt(java.time.Instant.now());
        entity.setUpdatedAt(java.time.Instant.now());

        when(studentService.requireStudent(creatorId, studentId)).thenReturn(student);
        when(anamneseRepository.findByStudentIdAndCreatorId(studentId, creatorId)).thenReturn(Optional.of(entity));

        AnamneseResponse response = service.getForCreator(creator, studentId);

        assertThat(response.studentId()).isEqualTo(studentId);
        assertThat(response.objetivoPrincipal()).isEqualTo(ObjetivoPrincipal.SAUDE);
    }

    private AnamneseRequest validRequest() {
        return new AnamneseRequest(
                ObjetivoPrincipal.SAUDE,
                ExperienciaTreino.INICIANTE,
                3,
                NivelAtividadeRotina.MODERADO,
                175,
                new BigDecimal("78.50"),
                null,
                null,
                null,
                null,
                null,
                null,
                true
        );
    }
}
