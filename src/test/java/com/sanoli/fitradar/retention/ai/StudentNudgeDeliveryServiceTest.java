package com.sanoli.fitradar.retention.ai;

import com.sanoli.fitradar.config.MailProperties;
import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.NudgeDelivery;
import com.sanoli.fitradar.domain.UserRole;
import com.sanoli.fitradar.dto.SendNudgeResponse;
import com.sanoli.fitradar.exception.BusinessException;
import com.sanoli.fitradar.repository.NudgeDeliveryRepository;
import com.sanoli.fitradar.repository.UserRepository;
import com.sanoli.fitradar.service.EmailService;
import com.sanoli.fitradar.service.PushNotificationService;
import com.sanoli.fitradar.service.StudentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentNudgeDeliveryServiceTest {

    @Mock
    private StudentService studentService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private EmailService emailService;
    @Mock
    private MailProperties mailProperties;
    @Mock
    private PushNotificationService pushNotificationService;
    @Mock
    private NudgeDeliveryRepository nudgeDeliveryRepository;

    private StudentNudgeDeliveryService service;

    private final UUID creatorId = UUID.randomUUID();
    private final UUID studentId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new StudentNudgeDeliveryService(
                studentService,
                userRepository,
                emailService,
                mailProperties,
                pushNotificationService,
                nudgeDeliveryRepository,
                "http://localhost:8080"
        );
    }

    @Test
    void send_deliversEmailAndPush_andRecordsDelivery() {
        AppUser student = student("Aluno Teste", "aluno@test.com");
        AppUser creator = creator("Coach Ana");

        when(studentService.requireStudent(creatorId, studentId)).thenReturn(student);
        when(userRepository.findById(creatorId)).thenReturn(Optional.of(creator));
        when(mailProperties.isEnabled()).thenReturn(true);
        when(emailService.sendStudentNudge(eq("aluno@test.com"), anyString(), anyString())).thenReturn(true);
        when(pushNotificationService.isEnabled()).thenReturn(true);
        when(pushNotificationService.hasSubscription(studentId)).thenReturn(true);
        when(nudgeDeliveryRepository.save(any(NudgeDelivery.class))).thenAnswer(inv -> {
            NudgeDelivery d = inv.getArgument(0);
            d.setId(UUID.randomUUID());
            return d;
        });

        SendNudgeResponse response = service.send(creatorId, studentId, "Oi! Bora treinar hoje?");

        assertThat(response.emailSent()).isTrue();
        assertThat(response.pushSent()).isTrue();
        assertThat(response.summary()).contains("e-mail e push");

        ArgumentCaptor<NudgeDelivery> captor = ArgumentCaptor.forClass(NudgeDelivery.class);
        verify(nudgeDeliveryRepository).save(captor.capture());
        assertThat(captor.getValue().getMessage()).isEqualTo("Oi! Bora treinar hoje?");
        verify(pushNotificationService).sendToUser(eq(studentId), anyString(), eq("Oi! Bora treinar hoje?"), eq("/student"));
    }

    @Test
    void send_emailOnly_whenPushUnavailable() {
        AppUser student = student("Aluno", "aluno@test.com");
        AppUser creator = creator("Coach");

        when(studentService.requireStudent(creatorId, studentId)).thenReturn(student);
        when(userRepository.findById(creatorId)).thenReturn(Optional.of(creator));
        when(mailProperties.isEnabled()).thenReturn(false);
        when(emailService.sendStudentNudge(anyString(), anyString(), anyString())).thenReturn(true);
        when(pushNotificationService.isEnabled()).thenReturn(false);
        when(nudgeDeliveryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SendNudgeResponse response = service.send(creatorId, studentId, "Mensagem");

        assertThat(response.emailSent()).isTrue();
        assertThat(response.pushSent()).isFalse();
        verify(pushNotificationService, never()).sendToUser(any(), anyString(), anyString(), anyString());
    }

    @Test
    void send_failsWhenNoChannelAvailable() {
        AppUser student = student("Aluno", null);
        AppUser creator = creator("Coach");

        when(studentService.requireStudent(creatorId, studentId)).thenReturn(student);
        when(userRepository.findById(creatorId)).thenReturn(Optional.of(creator));
        when(pushNotificationService.isEnabled()).thenReturn(true);
        when(pushNotificationService.hasSubscription(studentId)).thenReturn(false);

        assertThatThrownBy(() -> service.send(creatorId, studentId, "Mensagem"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Não foi possível entregar");

        verify(nudgeDeliveryRepository, never()).save(any());
    }

    @Test
    void send_rejectsBlankMessage() {
        assertThatThrownBy(() -> service.send(creatorId, studentId, "   "))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("vazia");
    }

    private AppUser student(String name, String email) {
        AppUser user = new AppUser();
        user.setId(studentId);
        user.setName(name);
        user.setEmail(email);
        user.setRole(UserRole.STUDENT);
        user.setCreatorId(creatorId);
        return user;
    }

    private AppUser creator(String name) {
        AppUser user = new AppUser();
        user.setId(creatorId);
        user.setName(name);
        user.setRole(UserRole.CREATOR);
        return user;
    }
}
