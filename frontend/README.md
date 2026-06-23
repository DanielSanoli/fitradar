# FitRadar — Frontend React

Único frontend do FitRadar. Em produção é servido pelo Spring Boot na porta **8080**; em desenvolvimento usa Vite na **5173** com proxy para a API.

## Rotas

| Papel | Caminho |
|-------|---------|
| Landing / login / registro | `/`, `/login`, `/register` |
| **Criador** | `/app`, `/app/students`, `/app/programs`, `/app/space`, … |
| **Aluno** (PWA) | `/student`, `/student/progress` |

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

## Variáveis

| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | Base da API (sem barra final). Dev: `http://localhost:8080`. **Build de produção:** deixe vazio para mesma origem (`/api/v1/**`). |

Push (backend):

```env
PUSH_ENABLED=true
VAPID_PUBLIC_KEY=<base64url>
VAPID_PRIVATE_KEY=<base64url>
VAPID_SUBJECT=mailto:support@fitradar.app
PUSH_FRONTEND_BASE_URL=http://localhost:8080
```

## Build e deploy

O Docker (`docker compose up --build`) roda `npm run build` e embute `dist/` no JAR.

Build local:

```bash
# Mesma origem — API no mesmo host que o SPA
VITE_API_URL= npm run build
```

Ou via Maven na raiz do repo:

```bash
mvn package -Dskip.frontend.build=false -DskipTests
```

## PWA & push

- Manifest + service worker via `vite-plugin-pwa` (Workbox).
- `start_url`: `/student` — instalável na área do aluno.
- Push: `public/push-sw.js` importado pelo Workbox; opt-in após check-in.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server (:5173) |
| `npm run build` | Build de produção + SW |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |
| `npm run preview` | Preview do build local |

## Auth

- JWT em `localStorage`
- Refresh automático em 401; 402 → `/billing-required`
- CORS só necessário em dev (5173 → 8080); produção é mesma origem
