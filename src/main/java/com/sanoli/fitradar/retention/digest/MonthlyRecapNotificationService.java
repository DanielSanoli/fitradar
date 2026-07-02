package com.sanoli.fitradar.retention.digest;

import com.sanoli.fitradar.config.DigestProperties;
import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.UserRole;
import com.sanoli.fitradar.repository.UserRepository;
import com.sanoli.fitradar.service.MonthlyRecapService;
import com.sanoli.fitradar.service.PushNotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;

@Service
public class MonthlyRecapNotificationService {

    private static final Logger log = LoggerFactory.getLogger(MonthlyRecapNotificationService.class);
    private static final int STUDENT_PAGE_SIZE = 100;

    private final MonthlyRecapService recapService;
    private final UserRepository userRepository;
    private final PushNotificationService pushNotificationService;

    public MonthlyRecapNotificationService(
            MonthlyRecapService recapService,
            UserRepository userRepository,
            PushNotificationService pushNotificationService
    ) {
        this.recapService = recapService;
        this.userRepository = userRepository;
        this.pushNotificationService = pushNotificationService;
    }

    @Transactional(readOnly = true)
    public int sendMonthlyRecapPushes() {
        YearMonth month = recapService.previousClosedMonth();
        String label = recapService.monthLabelFor(month);
        String path = "/student/recap?year=" + month.getYear() + "&month=" + month.getMonthValue();

        int sent = 0;
        int creatorPage = 0;
        Page<AppUser> creators;
        do {
            creators = userRepository.findByRole(UserRole.CREATOR, PageRequest.of(creatorPage++, 50));
            for (AppUser creator : creators) {
                int studentPage = 0;
                Page<AppUser> students;
                do {
                    students = userRepository.findByCreatorIdAndRole(
                            creator.getId(), UserRole.STUDENT, PageRequest.of(studentPage++, STUDENT_PAGE_SIZE));
                    for (AppUser student : students) {
                        try {
                            pushNotificationService.sendToUser(
                                    student.getId(),
                                    "Sua retrospectiva de " + label + " chegou",
                                    "Veja seus números do mês e compartilhe com a comunidade.",
                                    path
                            );
                            sent++;
                        } catch (RuntimeException exception) {
                            log.warn("Falha push retrospectiva aluno {}", student.getId(), exception);
                        }
                    }
                } while (students.hasNext());
            }
        } while (creators.hasNext());
        return sent;
    }
}
