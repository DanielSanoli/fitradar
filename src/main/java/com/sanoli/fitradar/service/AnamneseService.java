package com.sanoli.fitradar.service;

import com.sanoli.fitradar.domain.Anamnese;
import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.dto.AnamneseRequest;
import com.sanoli.fitradar.dto.AnamneseResponse;
import com.sanoli.fitradar.exception.BusinessException;
import com.sanoli.fitradar.exception.ResourceNotFoundException;
import com.sanoli.fitradar.repository.AnamneseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Service
public class AnamneseService {

    private final AnamneseRepository anamneseRepository;
    private final StudentService studentService;

    public AnamneseService(AnamneseRepository anamneseRepository, StudentService studentService) {
        this.anamneseRepository = anamneseRepository;
        this.studentService = studentService;
    }

    @Transactional(readOnly = true)
    public boolean isCompleted(UUID studentId) {
        return anamneseRepository.existsByStudentId(studentId);
    }

    @Transactional(readOnly = true)
    public AnamneseResponse getMine(AppUser student) {
        return anamneseRepository.findByStudentId(student.getId())
                .map(AnamneseResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Anamnese não encontrada"));
    }

    @Transactional
    public AnamneseResponse create(AppUser student, AnamneseRequest request) {
        if (student.getCreatorId() == null) {
            throw new BusinessException("Aluno sem criador associado");
        }
        if (anamneseRepository.existsByStudentId(student.getId())) {
            throw new BusinessException("Anamnese já preenchida");
        }
        if (request.consentimentoDadosSaude() == null || !request.consentimentoDadosSaude()) {
            throw new BusinessException("É necessário consentir o uso dos dados de saúde");
        }

        Anamnese anamnese = new Anamnese();
        anamnese.setStudentId(student.getId());
        anamnese.setCreatorId(student.getCreatorId());
        anamnese.setObjetivoPrincipal(request.objetivoPrincipal());
        anamnese.setExperienciaTreino(request.experienciaTreino());
        anamnese.setDiasDisponiveisSemana(request.diasDisponiveisSemana());
        anamnese.setNivelAtividadeRotina(request.nivelAtividadeRotina());
        anamnese.setAlturaCm(request.alturaCm());
        anamnese.setPesoAtualKg(scaleWeight(request.pesoAtualKg()));
        anamnese.setPesoObjetivoKg(request.pesoObjetivoKg() != null ? scaleWeight(request.pesoObjetivoKg()) : null);
        anamnese.setHistoricoLesoes(trimToNull(request.historicoLesoes()));
        anamnese.setCondicoesSaude(trimToNull(request.condicoesSaude()));
        anamnese.setMedicacoes(trimToNull(request.medicacoes()));
        anamnese.setRestricoesAlimentares(trimToNull(request.restricoesAlimentares()));
        anamnese.setObservacoes(trimToNull(request.observacoes()));
        anamnese.setConsentimentoDadosSaude(true);

        return AnamneseResponse.fromEntity(anamneseRepository.save(anamnese));
    }

    @Transactional(readOnly = true)
    public AnamneseResponse getForCreator(AppUser creator, UUID studentId) {
        studentService.requireStudent(creator.getId(), studentId);
        return anamneseRepository.findByStudentIdAndCreatorId(studentId, creator.getId())
                .map(AnamneseResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Anamnese não encontrada"));
    }

    private BigDecimal scaleWeight(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_EVEN);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
