package com.sanoli.fitradar.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_users_creator_role", columnList = "creator_id, role"),
        @Index(name = "idx_users_email", columnList = "email")
})
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role = UserRole.CREATOR;

    /**
     * Preenchido apenas para usuários STUDENT: o criador (tenant) a que o aluno pertence.
     * Para CREATOR/ADMIN permanece nulo.
     */
    @Column(name = "creator_id")
    private UUID creatorId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubscriptionPlan plan = SubscriptionPlan.FREE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubscriptionStatus subscriptionStatus = SubscriptionStatus.TRIALING;

    @Column(nullable = false)
    private LocalDateTime trialEndsAt;

    private LocalDateTime subscriptionEndsAt;

    @Column(length = 64)
    private String asaasCustomerId;

    @Column(length = 64)
    private String asaasSubscriptionId;

    /** Carteira Asaas da subconta do criador (split de vendas aluno→criador). */
    @Column(name = "asaas_wallet_id", length = 64)
    private String asaasWalletId;

    /** CPF ou CNPJ (somente dígitos) — obrigatório para checkout Pro do criador. */
    @Column(name = "cpf_cnpj", length = 14)
    private String cpfCnpj;

    @Column(nullable = false)
    private boolean emailVerified = false;

    /** Convite com senha temporária exige troca no primeiro acesso. */
    @Column(name = "must_change_password", nullable = false)
    private boolean mustChangePassword = false;

    @Column(name = "terms_accepted_at")
    private LocalDateTime termsAcceptedAt;

    @Column(name = "terms_version", length = 16)
    private String termsVersion;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (trialEndsAt == null) {
            trialEndsAt = now.plusDays(14);
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public UUID getCreatorId() {
        return creatorId;
    }

    public void setCreatorId(UUID creatorId) {
        this.creatorId = creatorId;
    }

    public SubscriptionPlan getPlan() {
        return plan;
    }

    public void setPlan(SubscriptionPlan plan) {
        this.plan = plan;
    }

    public SubscriptionStatus getSubscriptionStatus() {
        return subscriptionStatus;
    }

    public void setSubscriptionStatus(SubscriptionStatus subscriptionStatus) {
        this.subscriptionStatus = subscriptionStatus;
    }

    public LocalDateTime getTrialEndsAt() {
        return trialEndsAt;
    }

    public void setTrialEndsAt(LocalDateTime trialEndsAt) {
        this.trialEndsAt = trialEndsAt;
    }

    public LocalDateTime getSubscriptionEndsAt() {
        return subscriptionEndsAt;
    }

    public void setSubscriptionEndsAt(LocalDateTime subscriptionEndsAt) {
        this.subscriptionEndsAt = subscriptionEndsAt;
    }

    public String getAsaasCustomerId() {
        return asaasCustomerId;
    }

    public void setAsaasCustomerId(String asaasCustomerId) {
        this.asaasCustomerId = asaasCustomerId;
    }

    public String getAsaasSubscriptionId() {
        return asaasSubscriptionId;
    }

    public void setAsaasSubscriptionId(String asaasSubscriptionId) {
        this.asaasSubscriptionId = asaasSubscriptionId;
    }

    public String getAsaasWalletId() {
        return asaasWalletId;
    }

    public void setAsaasWalletId(String asaasWalletId) {
        this.asaasWalletId = asaasWalletId;
    }

    public String getCpfCnpj() {
        return cpfCnpj;
    }

    public void setCpfCnpj(String cpfCnpj) {
        this.cpfCnpj = cpfCnpj;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public boolean isMustChangePassword() {
        return mustChangePassword;
    }

    public void setMustChangePassword(boolean mustChangePassword) {
        this.mustChangePassword = mustChangePassword;
    }

    public LocalDateTime getTermsAcceptedAt() {
        return termsAcceptedAt;
    }

    public void setTermsAcceptedAt(LocalDateTime termsAcceptedAt) {
        this.termsAcceptedAt = termsAcceptedAt;
    }

    public String getTermsVersion() {
        return termsVersion;
    }

    public void setTermsVersion(String termsVersion) {
        this.termsVersion = termsVersion;
    }

    public boolean hasAcceptedTerms() {
        return termsAcceptedAt != null;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public boolean isCreator() {
        return role == UserRole.CREATOR;
    }

    public boolean isStudent() {
        return role == UserRole.STUDENT;
    }

    public boolean hasActiveAccess() {
        LocalDateTime now = LocalDateTime.now();
        if (subscriptionStatus == SubscriptionStatus.ACTIVE) {
            return subscriptionEndsAt == null || subscriptionEndsAt.isAfter(now);
        }

        if (subscriptionStatus == SubscriptionStatus.TRIALING) {
            return trialEndsAt != null && trialEndsAt.isAfter(now);
        }

        return false;
    }

    /** Recursos premium (Copilot, retenção avançada): Pro ativo ou trial vigente. */
    public boolean hasProFeatures() {
        if (!isCreator()) {
            return false;
        }
        if (plan == SubscriptionPlan.PRO && subscriptionStatus == SubscriptionStatus.ACTIVE) {
            return true;
        }
        if (subscriptionStatus == SubscriptionStatus.TRIALING) {
            return trialEndsAt != null && trialEndsAt.isAfter(LocalDateTime.now());
        }
        return false;
    }

    /** Criadores mantêm acesso básico (alunos, programas) mesmo após o trial. */
    public boolean hasBasicCreatorAccess() {
        if (isStudent()) {
            return true;
        }
        return isCreator();
    }

    public boolean isSubjectToFreeLimits() {
        return isCreator() && !hasProFeatures();
    }

    public long getTrialDaysRemaining() {
        if (trialEndsAt == null || !trialEndsAt.isAfter(LocalDateTime.now())) {
            return 0;
        }
        return ChronoUnit.DAYS.between(LocalDateTime.now(), trialEndsAt);
    }

    public String getAccessMessage() {
        if (hasActiveAccess()) {
            return "Acesso ativo";
        }

        return switch (subscriptionStatus) {
            case PAST_DUE -> "Pagamento pendente";
            case CANCELED -> "Assinatura cancelada";
            case TRIALING -> "Trial expirado";
            case ACTIVE -> "Assinatura expirada";
        };
    }
}
