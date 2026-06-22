# FitRadar — Frontend React

App React (Vite + React 19) consumindo a API Spring em `/api/v1/**`.

## Pré-requisitos

- Node 20+
- API Spring rodando (ex.: `http://localhost:8080`)
- CORS com `http://localhost:5173` (já configurado no backend)

## Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173).

## Variáveis

| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | Base da API (sem barra final), ex. `http://localhost:8080` |

Push exige VAPID no **backend** (não no Vite):

```env
PUSH_ENABLED=true
VAPID_PUBLIC_KEY=<base64url>
VAPID_PRIVATE_KEY=<base64url>
VAPID_SUBJECT=mailto:support@fitradar.app
PUSH_FRONTEND_BASE_URL=http://localhost:5173
```

Gere chaves com [web-push](https://www.npmjs.com/package/web-push): `npx web-push generate-vapid-keys`.

## PWA & push

- **Manifest + service worker** via `vite-plugin-pwa` (Workbox).
- **Offline:** app shell em cache; API em network-first.
- **Instalação:** banner `beforeinstallprompt` após interação.
- **Push:** opt-in após check-in (`PushOptInBanner`); ativar/desativar/testar em `/student/progress`.
- **SW push:** handlers em `public/push-sw.js` (importado pelo Workbox).

Fluxo manual de teste:

1. Login como aluno → marcar treino → aceitar notificações.
2. Em Meu progresso → **Testar** (chama `POST /api/v1/push/test`).
3. **Desativar** remove subscription local e no backend.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server Vite (PWA habilitado em dev) |
| `npm run build` | Build de produção + SW |
| `npm run test` | Vitest + Testing Library |
| `npm run preview` | Preview do build (HTTPS recomendado para push real) |

## Estrutura

```
src/
  components/pwa/   # InstallBanner, PushOptInBanner, PushSettingsCard
  components/ui/    # shadcn + ToastProvider
  features/         # auth, creator, student
  lib/api/          # cliente HTTP + push-api
  lib/pwa/          # push-utils, storage keys
  routes/           # React Router (lazy routes)
public/
  push-sw.js        # push + notificationclick
  offline.html
  icons/
```

## Auth

- JWT em `localStorage` (mesmas chaves do frontend legado)
- Refresh automático em 401; 402 → `/billing-required`
- Rotas: `/app/*` (CREATOR), `/student/*` (STUDENT)

## Lighthouse

Após `npm run build && npm run preview`, audite `/student` e `/student/progress` (PWA, a11y, performance).
