# FitRadar — Dívida técnica planejada

Registro de melhorias conhecidas, fora do escopo imediato de lançamento. Itens concluídos ficam marcados como **Feito**.

## Segurança / auth

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 1 | Hash de tokens no banco | **Feito** | Refresh, reset de senha e verificação de e-mail persistem apenas `SHA-256` (`token_hash`). |
| 2 | Cookie `httpOnly` para refresh token | **Feito** | Refresh em cookie `httpOnly` + `Secure` (prod) + `SameSite=Strict`, path `/api/v1/auth`. Access JWT só em memória no frontend. |
| 3 | TTL curto do access JWT | **Feito** | Default 15 min (`JWT_ACCESS_TTL_MINUTES`), refresh transparente no client (mutex + renovação proativa). |
| 4 | Idempotência de webhooks Asaas | **Feito** | Tabela `webhook_events` + dedupe por `eventId`. |
| 5 | ShedLock nos jobs agendados | **Feito** | Execução única em múltiplas instâncias. |

## Frontend / dados

| # | Item | Status | Descrição |
|---|------|--------|-----------|
| 7 | TanStack Query (React Query) | Planejado | Substituir data-fetch ad hoc (`useEffect` + `useState`) por cache, invalidação, retry e dedupe de requests. Reduz duplicação entre páginas creator/student e facilita refresh após mutações. Escopo grande — fazer por domínio (auth/me, alunos, programas) sem alterar contratos da API. |

## Observações

- **#7** é melhoria de DX/UX/performance; não bloqueia go-live se lint/test/build estiverem verdes.
