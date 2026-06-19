# FitRadar — Fase R0: fundação do backend (scaffold + reúso)

> **Status:** pendente de implementação. O repo atual evoluiu com domínio, motor, IA, gamificação e frontend estático no Spring. Este documento descreve a refatoração desejada para API-only + CORS (frontend separado).

## Contexto

Leia `FITRADAR_MVP_SPEC.md` por inteiro. Esta é a primeira fase: montar o esqueleto do backend e a fundação reaproveitada do projeto FinanceDash. NÃO implementar domínio fitness, motor de retenção, IA nem frontend — isso são fases R1+.

Stack: Java 21, Spring Boot 3, Spring Data JPA, PostgreSQL, Spring Security (JWT), Asaas (billing), Resend (e-mail). Siga `.cursor/rules/fitradar.mdc`.

## Objetivo

Um backend que sobe, conecta no Postgres, autentica usuários (criador/aluno), cobra o criador (estrutura) e está pronto para receber o domínio nas próximas fases.

## Entregas

### 1) Projeto e infra

- Scaffold Spring Boot 3 / Java 21 / Maven, pacote base `com.sanoli.fitradar`.
- PostgreSQL (`ddl-auto=update` no dev), `application.yml` com config por env vars (`DATABASE_URL`/`USERNAME`/`PASSWORD`, `SERVER_PORT`, `JWT_SECRET`, etc.).
- Dockerfile multi-stage + docker-compose (app + Postgres).
- `GlobalExceptionHandler` + formato de erro padrão (`VALIDATION_ERROR`, `RESOURCE_NOT_FOUND`, `INTERNAL_SERVER_ERROR`).
- Swagger/OpenAPI (springdoc).

### 2) API-only + CORS (diferença em relação ao FinanceDash)

- O backend **NÃO** serve frontend estático. É só API.
- Configure CORS liberando a origem do frontend (ex.: variável `CORS_ALLOWED_ORIGINS`, default `http://localhost:5173`).

### 3) Autenticação (reaproveitar do FinanceDash, renomeando pacote)

- `AppUser` com role `{ CREATOR, STUDENT, ADMIN }` e `creatorId` (nullable; preenchido para `STUDENT`).
- register/login/refresh/forgot-password/reset-password/verify-email, JWT stateless + refresh tokens, BCrypt, rate limit de login.
- Endpoints públicos no `SecurityConfig`: os de auth + Swagger. Demais autenticados.

### 4) Billing do criador (reaproveitar estrutura do FinanceDash)

- Integração Asaas (cliente + assinatura), checkout do criador, webhook, e `SubscriptionAccessFilter` que bloqueia (402) o **CRIADOR** sem assinatura/trial. Alunos **NÃO** são bloqueados por billing.
- Cobrança digital fica no web; não usar in-app purchase.

### 5) E-mail (Resend) — abstração `EmailService` reaproveitada.

### 6) Esqueleto dos pacotes do Radar (vazios, sem lógica)

- `retention.engine`, `retention.rules`, `retention.ai`, `retention.digest`.

## Reúso (ver §13 do spec)

Copie quase literal (renomeando pacote): security, exception handler, config, EmailService, Dockerfile, ajuste de URL do Railway. **NÃO** faça fork do FinanceDash inteiro — comece um repo novo e traga só esses pacotes. Não traga domínio financeiro (Transaction/Category/Goal).

## Restrições

- `BigDecimal` (HALF_EVEN) para qualquer valor; nunca `double`.
- Toda query escopada por usuário (multi-tenant) — preparar `CurrentUserService` com role e `creatorId`.
- Sem segredos no código; `.env` no `.gitignore`; criar `.env.example`.

## Testes

- `AuthServiceTest` (register/login/refresh).
- Teste de que rota protegida sem token retorna 401 e que CORS responde à origem configurada.
- `mvn test` verde.

## Critério de aceite

App sobe, `/swagger-ui` funciona, é possível registrar e logar um CREATOR e um STUDENT (com `creatorId`), o webhook de billing existe e está público, e o backend responde como **API** (sem servir HTML). Domínio, motor e frontend ficam para as próximas fases.

## Fora do escopo (NÃO fazer nesta fase)

Domínio fitness (CreatorSpace/Program/Workout/Enrollment/CheckIn), motor de retenção, copiloto IA, gamificação e frontend.
