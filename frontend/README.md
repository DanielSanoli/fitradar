# FitRadar — Frontend React

Único frontend do FitRadar. Em produção é servido pelo Spring Boot na porta **8080**; em desenvolvimento usa Vite na **5173** com proxy para a API.

Design system: Tailwind + shadcn, tokens mint, componentes compartilhados (`InsightCard`, `RiskBadge`, `CreatorSpaceBrand`, etc.). Protótipos de referência em `design/prototypes/`.

## Rotas

| Papel | Caminho | Descrição |
|-------|---------|-----------|
| Landing / login / registro | `/`, `/login`, `/register` | Marketing e auth |
| **Vitrine pública** | `/c/:slug` | Entrada do espaço do criador (branding + login aluno) |
| **Criador** | `/app` | Visão geral |
| | `/app/retention` | Central de retenção |
| | `/app/students`, `/app/students/:id` | Alunos |
| | `/app/programs`, `/app/programs/:id`, … | Programas e treinos |
| | `/app/space` | Construtor do espaço |
| | `/app/ranking` | Ranking |
| | `/app/settings` | Configurações |
| **Aluno** (PWA) | `/student` | Home (treino, check-in) |
| | `/student/programs` | Programas matriculados |
| | `/student/progress` | Progresso |
| | `/student/history` | Histórico de check-ins |
| | `/student/workouts/:id` | Treino + check-in |
| | `/student/settings` | Perfil, push, sessões e privacidade |
| Privacidade | `/privacy.html` | Política (estático em `public/`) |

## Pré-requisitos

- Node 20+
- API Spring em `http://localhost:8080`

## Desenvolvimento

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173). Requisições `/api/**` são proxy para `:8080`.

## Variáveis (`frontend/.env`)

| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | Base da API (sem barra final). Dev: `http://localhost:8080`. **Build de produção:** deixe vazio para mesma origem (`/api/v1/**`). |
| `VITE_PUBLIC_BASE_URL` | Base pública para links compartilháveis (`/c/<slug>`). Dev opcional: `http://localhost:5173`. Produção: `https://seudominio.com` (sem barra final). Se vazio, usa `window.location.origin` em runtime. |

Utilitário: `src/lib/app/public-url.ts` (`buildCreatorSpaceUrl`, `formatCreatorSpaceLinkDisplay`, `copyTextToClipboard`).

### Espaço do criador

- **Área/nicho** (`SpaceCategory`): `NUTRITION`, `GYM`, `CROSSFIT`, `PILATES`, `OTHER` — mapa ícone + rótulo em `src/lib/creator/space-categories.ts`.
- Seletor no wizard: `SpaceAreaSelector` (grade, `aria-pressed`, teclado).
- Ícone aparece em `CreatorSpaceBrand`, sidebar do criador, vitrine `/c/:slug` e home do aluno.

Push (configurado no **backend**, não no Vite):

```env
PUSH_ENABLED=true
VAPID_PUBLIC_KEY=<base64url>
VAPID_PRIVATE_KEY=<base64url>
VAPID_SUBJECT=mailto:support@fitradar.app
PUSH_FRONTEND_BASE_URL=http://localhost:8080
```

## Build e deploy

O Docker (`docker compose up --build`) roda `npm run build` e embute `dist/` no JAR.

Build local (mesma origem — API no mesmo host que o SPA):

```bash
VITE_API_URL= npm run build
```

Com domínio público para links de convite:

```bash
VITE_API_URL= VITE_PUBLIC_BASE_URL=https://fitradar.app npm run build
```

Ou via Maven na raiz do repo:

```bash
mvn package -Dskip.frontend.build=false -DskipTests
```

## PWA & push

- Manifest + service worker via `vite-plugin-pwa` (Workbox).
- `start_url`: `/student` — PWA abre na área do aluno (treino do dia).
- Banner de instalação: só em `/student/*`, cópia focada em check-in e progresso.
- Cache do shell: estratégia network-first para atualizações; `/api/**` sempre na rede.
- Push: `public/push-sw.js` importado pelo Workbox; opt-in após check-in.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server (:5173) |
| `npm run build` | Build de produção + SW |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |
| `npm run preview` | Preview do build local |
| `npm run openapi:generate` | Gera tipos OpenAPI a partir da API local |

## Auth

- JWT em `localStorage`
- Refresh automático em 401; 402 → `/billing-required`
- CORS só necessário em dev (5173 → 8080); produção é mesma origem

## Estrutura (resumo)

```
src/
  features/     # Páginas por domínio (creator, student, public, auth)
  components/   # UI reutilizável (layout, fitness, radar, creator/space)
  lib/
    api/        # Cliente REST + DTOs
    creator/    # Utilitários criador (space-categories, retention-utils)
    app/        # public-url, etc.
  routes/       # React Router
```
