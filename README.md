# FitRadar

Plataforma white-label para criadores fitness (personais, coaches, nutris) montarem sua própria comunidade / área de membros, com um **copiloto de retenção** que avisa quais alunos vão desistir e o que fazer.

O diferencial não é "mais uma área de membros": é a área de membros que **prevê churn e sugere ação** — o padrão "Radar" aplicado à retenção.

## Regra de Ouro

A IA **nunca** calcula métricas nem valores. Aderência, dias de inatividade e risco de churn são produzidos por código Java determinístico e testável (`retention.engine`). A camada de IA apenas interpreta a pergunta, chama a função certa (function calling), recebe o DTO com números + premissas e escreve a resposta em linguagem humana com uma ação sugerida.

## Stack

- Java 21, Spring Boot 3.4, Spring Data JPA, PostgreSQL
- Spring Security (JWT stateless), Spring AI (copiloto)
- Asaas (cobrança), Resend (e-mail)
- **Frontend:** React 19 + Vite + Tailwind + shadcn (`frontend/`), servido pelo Spring na porta **8080**

## Arquitetura

Monólito modular em camadas:

- `controller` · `service` · `repository` · `domain` · `dto` · `security` · `billing` · `config` · `exception`
- `retention.engine` — motor determinístico (aderência, risco de churn, progresso, tendência, ranking)
- `retention.rules` — regras/limiares que geram alertas + agendador
- `retention.ai` — copiloto (Spring AI function calling) e composição de respostas
- `retention.digest` — resumo proativo (e-mail/push) e nudges

Fluxo: `Pergunta → IA(intenção) → Engine(número + premissas) → IA(resposta + ação) → Usuário`.

## Multi-tenancy (2 níveis)

- O **criador** é o tenant (paga o SaaS).
- Cada **aluno** pertence a um criador (`creatorId`).
- Toda query filtra pelo escopo correto. Há testes de isolamento entre criadores e entre alunos.

## Frontend (React)

| Visão | Rotas principais | URL (produção / Docker) |
|-------|------------------|-------------------------|
| Landing + auth | `/`, `/login`, `/register` | `http://localhost:8080/` |
| **Vitrine do espaço** (pública) | `/c/:slug` | `http://localhost:8080/c/meu-slug` |
| **Criador** | `/app/*` | `http://localhost:8080/app` |
| **Aluno** (PWA) | `/student/*` | `http://localhost:8080/student` |
| Privacidade | `/privacy.html` | `http://localhost:8080/privacy.html` |

### Criador (`/app`)

| Rota | Tela |
|------|------|
| `/app` | Visão geral (resumo + Radar + atenção hoje) |
| `/app/retention` | Central de retenção (tendência, lista em risco, filtros) |
| `/app/students` | Alunos (convite, métricas, risco) |
| `/app/students/:id` | Detalhe do aluno |
| `/app/programs` | Programas e treinos |
| `/app/space` | Construtor do espaço (identidade, área/nicho, programa, convite) |
| `/app/ranking` | Ranking da comunidade |
| `/app/settings` | Configurações da conta |

### Aluno (`/student`)

| Rota | Tela |
|------|------|
| `/student` | Home (treino do dia, check-in, streak) |
| `/student/progress` | Progresso (aderência, marcos, gráfico semanal) |

### Espaço do criador

- **Construtor** (`/app/space`): nome, logo, cor, bio, **área/nicho** (Nutrição, Academia, Crossfit, Pilates, Outro) com ícone representativo, programa inicial e link de convite.
- **Link público:** `<base>/c/<slug>` — vitrine com branding do criador e entrada para login do aluno.
- **Base do link:** `VITE_PUBLIC_BASE_URL` no build do frontend (produção: domínio real, ex. `https://fitradar.app`). Sem a variável, usa a origem atual do navegador.

O build do React (`frontend/dist`) é copiado para o JAR em `classpath:/static/` no Docker e em `mvn package -Dskip.frontend.build=false`. Rotas SPA têm fallback para `index.html` (refresh em `/app/students`, `/c/meu-slug`, etc.).

Detalhes do app React: [`frontend/README.md`](frontend/README.md).

## Como rodar

### Produção local / Docker (tudo na :8080)

```powershell
cd C:\Users\Daniel\projetos\fitradar
docker compose up --build
```

Abra **http://localhost:8080** — criador em `/app`, aluno em `/student`, vitrine em `/c/<slug>`.

### Desenvolvimento (API + hot reload)

Terminal 1 — API:

```powershell
mvn spring-boot:run
```

Terminal 2 — Vite (hot reload):

```powershell
cd frontend
cp .env.example .env   # VITE_API_URL=http://localhost:8080
npm install
npm run dev
```

Abra **http://localhost:5173**. O Vite faz proxy de `/api` para `:8080`. CORS inclui `http://localhost:5173` por padrão.

Para links de espaço no dev com Vite, opcionalmente em `frontend/.env`:

```env
VITE_PUBLIC_BASE_URL=http://localhost:5173
```

### Build manual do frontend no JAR (sem Docker)

```powershell
cd frontend && npm ci && npm run build
cd ..
mvn package -Dskip.frontend.build=false -DskipTests
java -jar target/fitradar-0.0.1-SNAPSHOT.jar
```

Em produção, deixe `VITE_API_URL` vazio no build para a API na mesma origem (`/api/v1/**`).

### Variáveis de ambiente

Copie `.env.example` para `.env` na raiz. Principais:

| Variável | Uso |
|----------|-----|
| `DATABASE_URL` / `DATABASE_USERNAME` / `DATABASE_PASSWORD` | PostgreSQL |
| `JWT_SECRET` | Auth (≥32 caracteres em produção) |
| `PUBLIC_BASE_URL` | URLs em e-mails e callbacks do backend |
| `CORS_ALLOWED_ORIGINS` | Origens permitidas (dev: incluir `:5173`) |
| `VITE_API_URL` | Build frontend — API (vazio = mesma origem) |
| `VITE_PUBLIC_BASE_URL` | Build frontend — links `/c/<slug>` compartilháveis |

Exemplo rápido (PowerShell):

```powershell
$env:DATABASE_URL="jdbc:postgresql://localhost:5432/fitradar"
$env:DATABASE_USERNAME="fitradar"
$env:DATABASE_PASSWORD="fitradar"
$env:JWT_SECRET="troque-por-um-segredo-bem-grande-com-no-minimo-32-bytes"
$env:CORS_ALLOWED_ORIGINS="http://localhost:8080,http://localhost:5173"
$env:PUBLIC_BASE_URL="http://localhost:8080"
```

Ver `.env.example` (raiz) e `frontend/.env.example` para lista completa (Asaas, Resend, OpenAI, push VAPID, etc.).

## PWA (aluno)

A área do aluno (`/student`) é instalável como app no celular:

1. Abra `http://localhost:8080/student` (HTTPS em produção).
2. Chrome/Edge: menu → **Instalar app**.
3. iOS Safari: Compartilhar → **Adicionar à Tela de Início**.

Service worker (Workbox via Vite PWA) faz cache do shell; `/api/**` usa rede primeiro.

## Testes

Backend:

```powershell
mvn test
```

Frontend:

```powershell
cd frontend
npm run lint
npm run test
npm run build
```

Assets PWA (smoke):

```powershell
cd frontend-tests && npm test
```

## Swagger / OpenAPI

- UI: `http://localhost:8080/swagger-ui.html`
- JSON: `http://localhost:8080/v3/api-docs`

## Checklist de go-live

- [ ] `APP_PRODUCTION=true` e `JWT_SECRET` forte (≥32 caracteres)
- [ ] `CORS_ALLOWED_ORIGINS` com domínios de produção (dev: incluir `:5173` se usar Vite separado)
- [ ] `PUBLIC_BASE_URL` e `PUSH_FRONTEND_BASE_URL` apontando para HTTPS de produção
- [ ] `VITE_PUBLIC_BASE_URL` no build do frontend = domínio público dos links `/c/<slug>`
- [ ] PostgreSQL gerenciado com backup
- [ ] Billing / copiloto / e-mail configurados conforme uso
- [ ] `GET /actuator/health` retorna `UP`
- [ ] `mvn test` e `frontend` lint/test/build verdes
- [ ] PWA: `/student` instalável, SW ativo
- [ ] Política de privacidade em `/privacy.html`
- [ ] Vitrine `/c/<slug>` acessível e login do aluno funcional

## Status do MVP

- [x] R0–R5 — domínio, motor, copiloto, gamificação, PWA aluno
- [x] Frontend React único servido na :8080 (Docker / package)
- [x] Construtor do espaço + vitrine pública `/c/:slug` + área/nicho com ícone
- [x] Central de retenção, ranking, configurações do criador
- [x] Home e progresso do aluno com branding do espaço
