# FitRadar — Frontend React (FE-1)

App React consumindo a API Spring em `/api/v1/**`. O backend **não** é alterado nesta fase.

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

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server Vite |
| `npm run build` | Build de produção |
| `npm run test` | Vitest + Testing Library |
| `npm run openapi:generate` | Gera tipos TS a partir do OpenAPI (API no ar) |

## Estrutura

```
src/
  components/   # UI (shadcn) + layout
  features/     # auth e domínios futuros
  hooks/
  lib/api/      # cliente HTTP + tipos
  pages/        # rotas de página
  routes/       # React Router
```

## Auth

- JWT em `localStorage` (mesmas chaves do frontend legado para transição)
- Refresh automático em 401
- 402 redireciona para `/billing-required`
- Rotas: `/app/*` (CREATOR), `/student/*` (STUDENT)

## FE-2

Telas de produto (retenção, alunos, check-in, etc.) serão implementadas na próxima fase.
