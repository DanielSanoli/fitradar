package com.sanoli.fitradar.controller;

import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.dto.EnrollmentRequest;
import com.sanoli.fitradar.dto.EnrollmentResponse;
import com.sanoli.fitradar.dto.PageResponse;
import com.sanoli.fitradar.dto.StudentInviteRequest;
import com.sanoli.fitradar.dto.StudentInviteResponse;
import com.sanoli.fitradar.dto.StudentResendInviteResponse;
import com.sanoli.fitradar.dto.StudentResponse;
import com.sanoli.fitradar.security.CurrentUserService;
import com.sanoli.fitradar.service.StudentService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/students")
public class StudentController {

    private final StudentService studentService;
    private final CurrentUserService currentUserService;

    public StudentController(StudentService studentService, CurrentUserService currentUserService) {
        this.studentService = studentService;
        this.currentUserService = currentUserService;
    }

    @PostMapping
    @Operation(summary = "Convida/cadastra um aluno na comunidade do criador")
    public ResponseEntity<StudentInviteResponse> invite(@Valid @RequestBody StudentInviteRequest request) {
        AppUser creator = currentUserService.requireCreator();
        return ResponseEntity.status(HttpStatus.CREATED).body(studentService.invite(creator, request));
    }

    @PostMapping("/{id}/resend-invite")
    @Operation(summary = "Reenvia convite com nova senha temporária (aluno ainda não ativou o acesso)")
    public ResponseEntity<StudentResendInviteResponse> resendInvite(@PathVariable UUID id) {
        AppUser creator = currentUserService.requireCreator();
        return ResponseEntity.ok(studentService.resendInvite(creator, id));
    }

    @GetMapping
    @Operation(summary = "Lista os alunos do criador")
    public ResponseEntity<PageResponse<StudentResponse>> list(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        return ResponseEntity.ok(studentService.list(currentUserService.requireCreator().getId(), page, size));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalha um aluno")
    public ResponseEntity<StudentResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(studentService.get(currentUserService.requireCreator().getId(), id));
    }

    @PostMapping("/{id}/enrollments")
    @Operation(summary = "Matricula um aluno em um programa")
    public ResponseEntity<EnrollmentResponse> enroll(@PathVariable UUID id, @Valid @RequestBody EnrollmentRequest request) {
        AppUser creator = currentUserService.requireCreator();
        return ResponseEntity.status(HttpStatus.CREATED).body(studentService.enroll(creator, id, request));
    }

    @GetMapping("/{id}/enrollments")
    @Operation(summary = "Lista as matrículas de um aluno")
    public ResponseEntity<List<EnrollmentResponse>> listEnrollments(@PathVariable UUID id) {
        return ResponseEntity.ok(studentService.listEnrollments(currentUserService.requireCreator().getId(), id));
    }

    @DeleteMapping("/{id}/enrollments/{enrollmentId}")
    @Operation(summary = "Desativa uma matrícula")
    public ResponseEntity<Void> deactivateEnrollment(@PathVariable UUID id, @PathVariable UUID enrollmentId) {
        studentService.deactivateEnrollment(currentUserService.requireCreator().getId(), id, enrollmentId);
        return ResponseEntity.noContent().build();
    }
}
