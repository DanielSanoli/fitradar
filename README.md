# FitRadar

Plataforma white-label para criadores fitness (personais, coaches, nutris) montarem sua própria comunidade / área de membros, com um **copiloto de retenção** que avisa quais alunos vão desistir e o que fazer.

O diferencial não é "mais uma área de membros": é a área de membros que **prevê churn e sugere ação** — o padrão "Radar" aplicado à retenção.

## Regra de Ouro

A IA **nunca** calcula métricas nem valores. Aderência, dias de inatividade e risco de churn são produzidos por código Java determinístico e testável (`retention.engine`). A camada de IA apenas interpreta a pergunta, chama a função certa (function calling), recebe o DTO com números + premissas e escreve a resposta em linguagem humana com uma ação sugerida.

## Stack

- Java 21
- Spring Boot 3.4
- Spring Data JPA + PostgreSQL
- Spring Security (JWT stateless)
- Spring AI (copiloto, function calling)
- Asaas (cobrança do criador)
- Resend (e-mail / digest)
- Frontend estático servido pelo Spring (PWA aluno instalável; push pendente)

## Arquitetura

Monólito modular em camadas:

- `controller` · `service` · `repository` · `domain` · `dto` · `security` · `billing` · `config` · `exception`
- `retention.engine` — motor determinístico (aderência, risco de churn, progresso)
- `retention.rules` — regras/limiares que geram alertas + agendador
- `retention.ai` — copiloto (Spring AI function calling) e composição de respostas
- `retention.digest` — resumo proativo (e-mail/push) e nudges

Fluxo: `Pergunta → IA(intenção) → Engine(número + premissas) → IA(resposta + ação) → Usuário`.

## Multi-tenancy (2 níveis)

- O **criador** é o tenant (paga o SaaS).
- Cada **aluno** pertence a um criador (`creatorId`).
- Toda query filtra pelo escopo correto. Há testes de isolamento entre criadores e entre alunos.

## Como rodar localmente

Pré-requisitos: Java 21, Maven e PostgreSQL na porta `5432`.

Crie um banco PostgreSQL com database/user/password `fitradar` (ou ajuste via variáveis de ambiente).

```powershell
cd C:\Users\Daniel\projetos\fitradar
mvn spring-boot:run
```

Aplicação em `http://localhost:8080`.

### Variáveis de ambiente

```powershell
$env:DATABASE_URL="jdbc:postgresql://localhost:5432/fitradar"
$env:DATABASE_USERNAME="fitradar"
$env:DATABASE_PASSWORD="fitradar"
$env:SERVER_PORT="8080"
$env:JWT_SECRET="troque-por-um-segredo-bem-grande-com-no-minimo-32-bytes"
# Opcionais (têm fallback no-op/log quando ausentes)
$env:ASAAS_API_KEY=""
$env:RESEND_API_KEY=""
$env:OPENAI_API_KEY=""
```

## PWA (aluno)

A tela do aluno (`/student.html`) é instalável como app no celular:

1. Abra `http://localhost:8080/student.html` (HTTPS em produção).
2. No Chrome/Edge: menu → **Instalar app** (ou use o banner quando aparecer).
3. No iOS Safari: Compartilhar → **Adicionar à Tela de Início**.

O service worker faz cache do shell (CSS/JS/HTML) para abrir offline com página informativa; chamadas `/api/**` sempre vão à rede.

Push no celular fica para fase posterior.

## Refatoração pendente (API-only)

Ver `docs/phases/R0-api-foundation.md` para migrar o backend a API-only + CORS (frontend separado, ex. Vite na porta 5173).

## Docker Compose

```powershell
cd C:\Users\Daniel\projetos\fitradar
docker compose up --build
```

## Testes

```powershell
mvn test
```

## Swagger / OpenAPI

- UI: `http://localhost:8080/swagger-ui.html`
- JSON: `http://localhost:8080/v3/api-docs`

## Status do MVP

- [x] R0 — Fundação (auth + multi-tenant + billing do criador + esqueleto `retention.*`)
- [x] R1 — Núcleo do domínio (`CreatorSpace`, `Program`, `Workout`, `Enrollment`, `CheckIn`)
- [x] R2 — Motor de retenção + alertas + painel
- [x] R3 (núcleo) — Copiloto IA + digest semanal
- [x] R4 — Engajamento & receita (gamificação + split Asaas aluno→criador)
- [x] R5 — PWA aluno instalável (sem push por enquanto)
- [ ] Refatoração API-only + CORS — ver `docs/phases/R0-api-foundation.md`
