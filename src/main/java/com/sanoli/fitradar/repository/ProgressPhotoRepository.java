package com.sanoli.fitradar.repository;

import com.sanoli.fitradar.domain.ProgressPhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProgressPhotoRepository extends JpaRepository<ProgressPhoto, UUID> {

    List<ProgressPhoto> findByStudentIdOrderByPhotoDateAscCreatedAtAsc(UUID studentId);

    List<ProgressPhoto> findByStudentIdAndSharedWithCoachTrueOrderByPhotoDateAscCreatedAtAsc(UUID studentId);
}
