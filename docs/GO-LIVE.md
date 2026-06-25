# FitRadar — Plano de Go-Live (H6)

Guia passo a passo para colocar o FitRadar em produção. O código já está pronto para deploy (Dockerfile multi-stage que builda o React no JAR, Flyway com `ddl-auto: validate`, `.env.example`, CI). O H6 é, na prática, **configuração + ops + smoke test**.

> Recomendação: faça **Asaas em sandbox primeiro**, valide o fluxo, e só depois troque para produção.

---

## 0. Arquitetura de deploy

Um **único serviço**: o Spring Boot serve a API **e** o build do React na porta **8080**. Mais um **PostgreSQL gerenciado**. Plataforma recomendada: **Railway** (o projeto já tem suporte a Railway no código).

```
[ Railway ]
  ├── Serviço App (Docker)  → :8080  (API + frontend React)
  └── PostgreSQL gerenciado
```

## 1. Pré-requisitos

- **Domínio próprio** (ex.: `app.fitradar.app`). É necessário antes de quase tudo: `PUBLIC_BASE_URL`, CORS, verificação de domínio no Resend e a URL do webhook do Asaas.
- Contas: **Railway**, **Resend**, **Asaas (produção)** e **OpenAI** (se for ligar o copiloto).

## 2. Banco de dados

- Crie um **PostgreSQL gerenciado** no Railway.
- O **Flyway** aplica as migrations (`V1`, `V2`) no startup; `ddl-auto: validate` apenas valida (não altera schema) — seguro para produção.
- Configure `DATABASE_URL` (formato `jdbc:postgresql://...`), `DATABASE_USERNAME`, `DATABASE_PASSWORD` (ou referencie o serviço Postgres do Railway). Ative **backups**.

## 3. Variáveis de ambiente (lista completa)

| Variável | Produção | Observação |
|---|---|---|
| `DATABASE_URL` / `_USERNAME` / `_PASSWORD` | do Postgres gerenciado | formato JDBC |
| `SERVER_PORT` | `8080` (ou a porta injetada pelo Railway) | |
| `PUBLIC_BASE_URL` | `https://app.seudominio.com` | seu domínio real |
| `APP_PRODUCTION` | `true` | ativa o `application-prod.yml` (Swagger fechado etc.) |
| `JWT_SECRET` | segredo forte (≥ 32 caracteres) | **obrigatório** trocar |
| `CORS_ALLOWED_ORIGINS` | `https://app.seudominio.com` | sem localhost em prod |
| `ASAAS_ENABLED` | `true` | |
| `ASAAS_BASE_URL` | `https://api.asaas.com/v3` | **produção** (não sandbox) |
| `ASAAS_API_KEY` | chave de produção | começa com `$aact_prod_` |
| `ASAAS_WEBHOOK_TOKEN` | token forte | igual ao cadastrado no painel |
| `ASAAS_MONTHLY_PRICE` | ex.: `49.90` | preço do plano Pro |
| `MARKETPLACE_PLATFORM_FEE_PERCENT` | ex.: `10.00` | sua taxa sobre vendas de programas |
| `RESEND_API_KEY` | chave do Resend | sem ela, e-mail só cai em log |
| `EMAIL_FROM` | `FitRadar <no-reply@seudominio.com>` | endereço do **domínio verificado** |
| `COPILOT_AI_ENABLED` | `true`/`false` | copiloto em linguagem natural |
| `OPENAI_API_KEY` | chave | obrigatório se copiloto on |
| `OPENAI_CHAT_MODEL` | `gpt-4o-mini` | modelo barato |
| `RETENTION_TIMEZONE` | `America/Sao_Paulo` | |
| `DIGEST_ENABLED` | `true` | resumo semanal por e-mail |
| `DEMO_SEED_ENABLED` | `false` em prod (sugestão) | dados de exemplo no onboarding |
| `PUSH_ENABLED` | `true` | notificações do aluno |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | par gerado | ver §6 |
| `VAPID_SUBJECT` | `mailto:support@seudominio.com` | |
| `PUSH_FRONTEND_BASE_URL` | `https://app.seudominio.com` | |
| `SENTRY_DSN` (opc.) | DSN | rastreio de erros 5xx |
| `METRICS_ENABLED` + `MANAGEMENT_TOKEN` (opc.) | `true` + token | expõe métricas protegidas |
| `SWAGGER_ENABLED` | `false` em prod | |

## 4. Resend (e-mail) — passo a passo

O FitRadar envia: convite de aluno (com link + senha temporária), reset de senha, verificação de e-mail, digest e nudge. Sem o Resend configurado, tudo isso **só vai para o log** (`LoggingEmailService`).

1. Crie conta no Resend.
2. **Domains → Add Domain**: informe seu domínio (ex.: `seudominio.com`).
3. O Resend mostra registros **DNS (SPF, DKIM e DMARC)**. Adicione-os no seu provedor de DNS (Cloudflare, GoDaddy, Registro.br…). A propagação leva de minutos a algumas horas.
4. Volte em **Domains → Verify**. Quando ficar verificado, você pode enviar a partir de endereços daquele domínio.
5. **API Keys → criar chave** (nome descritivo, escopo no domínio) e copie.
6. Configure: `RESEND_API_KEY=...` e `EMAIL_FROM=FitRadar <no-reply@seudominio.com>`.
   - ⚠️ O remetente **precisa ser do domínio verificado** — não dá para usar Gmail/Hotmail como `from`.
7. Teste após o deploy: convide um aluno e confirme que o e-mail chega (e o reset de senha).

## 5. Asaas (cobrança) — passo a passo

O FitRadar cobra a **assinatura Pro do criador** (webhook) e tem **marketplace** (criador recebe dos alunos pela venda de programas, com split da sua taxa).

1. Conta **Asaas de produção** (teste antes em sandbox).
2. **Integrações → Gerar nova Chave de API** (produção começa com `$aact_prod_`). Copie.
3. Variáveis: `ASAAS_ENABLED=true`, `ASAAS_BASE_URL=https://api.asaas.com/v3`, `ASAAS_API_KEY=...`, `ASAAS_WEBHOOK_TOKEN=<token forte>`, `ASAAS_MONTHLY_PRICE=49.90`, `MARKETPLACE_PLATFORM_FEE_PERCENT=10.00`.
4. **Integrações → Webhooks → novo**:
   - URL: `https://SEU-DOMINIO/api/v1/billing/webhook`
   - Token de autenticação = **mesmo** valor de `ASAAS_WEBHOOK_TOKEN` (vai no header `asaas-access-token`).
   - Eventos: `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_DELETED`, `SUBSCRIPTION_DELETED`.
5. **Marketplace/split:** o criador conecta a própria conta Asaas (na tela de Marketplace que já existe) para receber dos alunos; a plataforma retém `MARKETPLACE_PLATFORM_FEE_PERCENT`. Valide esse fluxo em sandbox antes.
6. **Sandbox primeiro:** rode todo o fluxo com `ASAAS_BASE_URL=https://api-sandbox.asaas.com/v3` + chave sandbox (`$aact_hmlg_`); depois troque para produção (`https://api.asaas.com/v3`).

### Gotchas validados em sandbox (não repetir na produção)

> **Host da API (sandbox):** use `https://api-sandbox.asaas.com/v3` — **não** `https://sandbox.asaas.com/api/v3` (esse é o painel web; bater nele com a API devolve HTML/erro e o `RestClient` estoura). Produção é `https://api.asaas.com/v3`.

> **CPF/CNPJ obrigatório:** o checkout Pro exige `cpfCnpj` no customer (cobrança `billingType=UNDEFINED`). Sem ele o Asaas retorna `400 "Para criar esta cobrança é necessário preencher o CPF ou CNPJ do cliente."`. O checkout coleta, valida (dígito verificador) e persiste o CPF no perfil. Em sandbox, use um **CPF válido de verdade** (passa no validador do backend e o Asaas aceita).

> **Token do webhook:** o `ASAAS_WEBHOOK_TOKEN` no app tem que ser **idêntico** ao cadastrado no painel (vai no header `asaas-access-token`), senão o app responde erro e o evento é rejeitado.

> **Fila interrompida:** o Asaas **pausa a fila do webhook após 15 falhas** consecutivas (token errado, URL errada, app fora do ar ou 5xx). Sintoma: pagamento fica PAGO no Asaas mas o Pro não ativa, e a Situação do webhook vira **"Interrompido"/"Desativado"**. Correção: ajuste token+URL, **reative a fila** no painel e reenvie/refaça o pagamento. Confirme **200** em *Logs de Webhooks*.

## 6. Push (VAPID)

1. Gere um par de chaves VAPID (ferramenta `web-push`).
2. `PUSH_ENABLED=true`, `VAPID_PUBLIC_KEY=...`, `VAPID_PRIVATE_KEY=...`, `VAPID_SUBJECT=mailto:support@seudominio.com`, `PUSH_FRONTEND_BASE_URL=https://app.seudominio.com`.
3. Push só funciona em **HTTPS** (produção).

## 7. Copiloto IA (opcional)

`COPILOT_AI_ENABLED=true`, `OPENAI_API_KEY=...`, `OPENAI_CHAT_MODEL=gpt-4o-mini`. Sem isso, o copiloto fica em modo limitado. Lembre do controle de custo (rate limit / Pro).

## 8. Segurança de produção

- `JWT_SECRET` forte (≥ 32) e único. `APP_PRODUCTION=true`. `SWAGGER_ENABLED=false`.
- `CORS_ALLOWED_ORIGINS` e `PUBLIC_BASE_URL` = domínio real (sem localhost).
- Opcional: `SENTRY_DSN` (erros) e `METRICS_ENABLED=true` + `MANAGEMENT_TOKEN`.

## 9. Deploy no Railway

1. **New Project → Deploy from GitHub repo** → selecione o repo (o Railway detecta o `Dockerfile`).
2. **Add PostgreSQL** ao projeto.
3. Em **Variables** do serviço App, cole todas as variáveis (§3) — RAW editor ajuda.
4. **Settings → Networking → Generate Domain** (ou conecte um domínio próprio).
5. Com o domínio final em mãos, **atualize**: `PUBLIC_BASE_URL`, `CORS_ALLOWED_ORIGINS`, `PUSH_FRONTEND_BASE_URL`, a verificação do Resend e a **URL do webhook do Asaas**.
6. Deploy. Acompanhe os logs; o Flyway roda as migrations no primeiro start.

## 10. Smoke test pós-deploy (em produção)

- **Criador:** registrar → **verificar e-mail** (link chega) → onboarding → criar espaço/programa → **convidar aluno** (e-mail chega) → abrir a **vitrine `/c/<slug>`** sem login.
- **Aluno:** entrar pelo link → matricular → **check-in** → receber **push**.
- **Billing:** checkout Pro (com **CPF/CNPJ**) → cobrança no Asaas → pagamento de teste → **webhook 200** → Pro **ativa**; **marketplace:** aluno compra um programa → criador recebe (split). Se o Pro não ativar, ver os gotchas do §5 (host da API, token e fila interrompida).
- **Lembrete:** criador clica "enviar lembrete" → aluno **recebe de verdade** (e-mail/push).

## 11. Distribuição: PWA, Play Store e App Store

A área do aluno é um **PWA** — instala direto pelo navegador ("Instalar app" / "Adicionar à Tela de Início"). Isso **não** coloca o app nas lojas automaticamente. Estratégia recomendada, em ordem:

**1) Lançar como PWA + web (agora)**
- É o veículo de lançamento: sem fricção de loja e sem regras de in-app purchase. A cobrança acontece no **web (Asaas)**.

**2) Android — Play Store via TWA (quando quiser presença na loja)**
- Empacotar o PWA com **TWA** (Trusted Web Activity), via PWABuilder/Bubblewrap. Baixo esforço e boa experiência.

**3) iOS — App Store (passo posterior e cuidadoso)**
- A Apple não aceita PWA puro; é preciso empacotar num WebView (Capacitor/PWABuilder).
- Risco de rejeição pela regra **4.2 ("minimum functionality")** se parecer um "site embrulhado" — offline, push e UX nativa ajudam a passar.

**Regra de cobrança nas lojas (importante)**
- A **cobrança fica sempre no web** (Asaas) — evita os **15–30%** das lojas, essencial para o SaaS e para o marketplace.
- Pelas regras da Apple (IAP + anti-steering), o **app iOS deve ser só consumo/engajamento**: ver treino, check-in, progresso, push. **Sem botão de "comprar/assinar" dentro do app** (e, idealmente, sem link de pagamento externo). O aluno **compra/assina no web** e chega ao app **já matriculado** (padrão "reader app", como Hotmart/Kiwify).
- O **Android (Google)** é mais leniente quanto a pagamento externo.
- ⚠️ As políticas das lojas mudam (DMA, decisões judiciais) — **confirme as regras atuais da Apple/Google antes de submeter**.

## 12. Checklist final

- [ ] Domínio + HTTPS no ar
- [ ] Postgres gerenciado + migrations aplicadas (Flyway)
- [ ] Todas as variáveis de produção setadas
- [ ] `APP_PRODUCTION=true`, `SWAGGER_ENABLED=false`, CORS restrito
- [ ] Resend: domínio verificado (SPF/DKIM/DMARC) + `EMAIL_FROM` do domínio
- [ ] Asaas: chave de produção + webhook cadastrado (token igual) — testado em sandbox antes
- [ ] Push VAPID configurado
- [ ] Copiloto IA (se ligado) com chave + controle de custo
- [ ] Smoke test completo passando
- [ ] Canal de lançamento definido (PWA + web)
- [ ] (Opcional) Android empacotado via TWA
- [ ] App iOS (se houver) é **consumo-only**, sem cobrança in-app

---

_Plano de go-live do FitRadar. Faça o Asaas em sandbox antes da produção._
