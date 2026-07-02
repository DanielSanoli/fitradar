package com.sanoli.fitradar.service;

import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.ProgressPhoto;
import com.sanoli.fitradar.domain.ProgressPhotoConsent;
import com.sanoli.fitradar.dto.ProgressPhotoConsentResponse;
import com.sanoli.fitradar.dto.ProgressPhotoResponse;
import com.sanoli.fitradar.dto.ProgressPhotoSharingRequest;
import com.sanoli.fitradar.exception.BusinessException;
import com.sanoli.fitradar.exception.ForbiddenException;
import com.sanoli.fitradar.exception.ResourceNotFoundException;
import com.sanoli.fitradar.repository.ProgressPhotoConsentRepository;
import com.sanoli.fitradar.repository.ProgressPhotoRepository;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class ProgressPhotoService {

    private final ProgressPhotoRepository photoRepository;
    private final ProgressPhotoConsentRepository consentRepository;
    private final ProgressPhotoStorageService storageService;
    private final StudentService studentService;

    public ProgressPhotoService(
            ProgressPhotoRepository photoRepository,
            ProgressPhotoConsentRepository consentRepository,
            ProgressPhotoStorageService storageService,
            StudentService studentService
    ) {
        this.photoRepository = photoRepository;
        this.consentRepository = consentRepository;
        this.storageService = storageService;
        this.studentService = studentService;
    }

    @Transactional(readOnly = true)
    public ProgressPhotoConsentResponse consentStatus(AppUser student) {
        return consentRepository.findById(student.getId())
                .map(c -> new ProgressPhotoConsentResponse(true, c.getConsentedAt()))
                .orElse(new ProgressPhotoConsentResponse(false, null));
    }

    @Transactional
    public ProgressPhotoConsentResponse grantConsent(AppUser student, boolean consented) {
        if (!consented) {
            throw new BusinessException("É necessário consentir o uso de fotos de progresso corporal");
        }
        if (consentRepository.existsById(student.getId())) {
            return consentStatus(student);
        }
        ProgressPhotoConsent consent = new ProgressPhotoConsent();
        consent.setStudentId(student.getId());
        consentRepository.save(consent);
        return consentStatus(student);
    }

    @Transactional
    public ProgressPhotoResponse upload(
            AppUser student,
            LocalDate date,
            String note,
            BigDecimal weight,
            MultipartFile file
    ) {
        requireConsent(student.getId());
        if (student.getCreatorId() == null) {
            throw new BusinessException("Aluno sem criador associado");
        }
        if (date == null) {
            throw new BusinessException("Data da foto é obrigatória");
        }

        String storagePath = storageService.store(student.getId(), file);
        ProgressPhoto photo = new ProgressPhoto();
        photo.setStudentId(student.getId());
        photo.setCreatorId(student.getCreatorId());
        photo.setPhotoDate(date);
        photo.setStoragePath(storagePath);
        photo.setNote(trimToNull(note));
        photo.setWeight(weight != null ? scaleWeight(weight) : null);
        photo.setSharedWithCoach(false);

        return ProgressPhotoResponse.fromEntity(photoRepository.save(photo));
    }

    @Transactional(readOnly = true)
    public List<ProgressPhotoResponse> listMine(AppUser student) {
        return photoRepository.findByStudentIdOrderByPhotoDateAscCreatedAtAsc(student.getId()).stream()
                .map(ProgressPhotoResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProgressPhotoResponse> listSharedForCreator(AppUser creator, UUID studentId) {
        studentService.requireStudent(creator.getId(), studentId);
        return photoRepository.findByStudentIdAndSharedWithCoachTrueOrderByPhotoDateAscCreatedAtAsc(studentId).stream()
                .map(ProgressPhotoResponse::fromEntity)
                .toList();
    }

    @Transactional
    public ProgressPhotoResponse updateSharing(AppUser student, UUID photoId, ProgressPhotoSharingRequest request) {
        ProgressPhoto photo = requireOwnedPhoto(student.getId(), photoId);
        photo.setSharedWithCoach(request.sharedWithCoach());
        return ProgressPhotoResponse.fromEntity(photoRepository.save(photo));
    }

    @Transactional
    public void delete(AppUser student, UUID photoId) {
        ProgressPhoto photo = requireOwnedPhoto(student.getId(), photoId);
        storageService.delete(photo.getStoragePath());
        photoRepository.delete(photo);
    }

    @Transactional(readOnly = true)
    public PhotoContent loadForStudent(AppUser student, UUID photoId) {
        ProgressPhoto photo = requireOwnedPhoto(student.getId(), photoId);
        return toContent(photo);
    }

    @Transactional(readOnly = true)
    public PhotoContent loadForCreator(AppUser creator, UUID studentId, UUID photoId) {
        studentService.requireStudent(creator.getId(), studentId);
        ProgressPhoto photo = photoRepository.findById(photoId)
                .filter(p -> p.getStudentId().equals(studentId))
                .orElseThrow(() -> new ResourceNotFoundException("Foto não encontrada"));
        if (!photo.isSharedWithCoach()) {
            throw new ForbiddenException("Foto não compartilhada com o coach");
        }
        return toContent(photo);
    }

    @Transactional
    public void purgeStudentData(UUID studentId) {
        photoRepository.findByStudentIdOrderByPhotoDateAscCreatedAtAsc(studentId)
                .forEach(photo -> storageService.delete(photo.getStoragePath()));
        photoRepository.deleteAll(photoRepository.findByStudentIdOrderByPhotoDateAscCreatedAtAsc(studentId));
        consentRepository.findById(studentId).ifPresent(consentRepository::delete);
        storageService.deleteAllForStudent(studentId);
    }

    private PhotoContent toContent(ProgressPhoto photo) {
        Resource resource = storageService.loadAsResource(photo.getStoragePath());
        MediaType mediaType = storageService.mediaTypeFor(photo.getStoragePath());
        return new PhotoContent(resource, mediaType);
    }

    private ProgressPhoto requireOwnedPhoto(UUID studentId, UUID photoId) {
        return photoRepository.findById(photoId)
                .filter(photo -> photo.getStudentId().equals(studentId))
                .orElseThrow(() -> new ResourceNotFoundException("Foto não encontrada"));
    }

    private void requireConsent(UUID studentId) {
        if (!consentRepository.existsById(studentId)) {
            throw new BusinessException("É necessário consentir o uso de fotos de progresso corporal");
        }
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

    public record PhotoContent(Resource resource, MediaType mediaType) {
    }
}
