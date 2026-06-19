package com.sanoli.fitradar.security;

import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.UserRole;
import com.sanoli.fitradar.exception.ForbiddenException;
import com.sanoli.fitradar.exception.ResourceNotFoundException;
import com.sanoli.fitradar.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class CurrentUserService {

    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public AppUser getCurrentUser() {
        return userRepository.findById(getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário autenticado não encontrado"));
    }

    public UUID getCurrentUserId() {
        return principal().getId();
    }

    /**
     * Retorna o id do criador (tenant) do usuário atual:
     * - se for CREATOR, é o próprio id;
     * - se for STUDENT, é o creatorId ao qual pertence.
     */
    public UUID getTenantCreatorId() {
        UserPrincipal principal = principal();
        if (principal.getRole() == UserRole.STUDENT) {
            if (principal.getCreatorId() == null) {
                throw new ForbiddenException("Aluno sem criador associado");
            }
            return principal.getCreatorId();
        }
        return principal.getId();
    }

    public AppUser requireCreator() {
        AppUser user = getCurrentUser();
        if (user.getRole() != UserRole.CREATOR && user.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Ação permitida apenas para criadores");
        }
        return user;
    }

    public AppUser requireStudent() {
        AppUser user = getCurrentUser();
        if (user.getRole() != UserRole.STUDENT) {
            throw new ForbiddenException("Ação permitida apenas para alunos");
        }
        return user;
    }

    private UserPrincipal principal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new ResourceNotFoundException("Usuário autenticado não encontrado");
        }
        return principal;
    }
}
