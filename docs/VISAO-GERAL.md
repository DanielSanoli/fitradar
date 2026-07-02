# FitRadar — Visão geral do projeto

> Documento explicativo para avaliação externa. Descreve o produto, a arquitetura, as funcionalidades implementadas, os diferenciais/inovações e o estado atual.

## 1. O que é

FitRadar é um **SaaS white-label para criadores fitness** (personais, coaches, nutricionistas) montarem a própria área de membros/comunidade e gerirem seus alunos. O criador é um **tenant** (multi-tenancy): tem seu espaço com marca própria, seus programas/treinos, seus planos alimentares e seus alunos.

O diferencial central **não** é "mais uma área de membros" — é o **Radar**: um copiloto que **prevê quais alunos vão desistir (churn) e sugere a ação certa** para retê-los. O produto é construído em torno de retenção, não só de entrega de conteúdo.

**Público:** personais, coaches e nutricionistas que fazem consultoria online. **Concorrentes diretos/adjacentes:** PrimeCoaching (direto), Kiwify e Hotmart (infoprodutos/área de membros).

## 2. Princípio de arquitetura — "Regra de Ouro"

A IA **nunca** calcula valores monetários ou métricas. Um **motor determinístico** (`retention.engine`, `nutrition.engine`) calcula tudo com `BigDecimal` (HALF_EVEN, nunca `double`); a IA apenas **explica** os resultados (via function calling / `@Tool`) ou **ajuda na entrada de dados** (ex.: casar alimento por texto). Isso garante precisão, auditabilidade e confiança — crítico num produto que lida com dinheiro (cobrança/split) e saúde (nutrição).

## 3. Stack e infraestrutura

- **Backend:** Java 21, Spring Boot 3, Spring Data JPA, PostgreSQL, Spring Security (JWT stateless + refresh tokens), Flyway (migrations versionadas), Spring AI (copiloto por function calling).
- **Frontend:** React 19 + Vite + TypeScript + Tailwind v4 + shadcn/ui. Tema dark + acento mint (#1ed7a6). PWA (Workbox, Web Push VAPID).
- **Monorepo:** o build do React é embutido no Spring (Docker multi-stage → `classpath:/static/`) e servido na porta 8080. SPA deep-links via `SpaForwardController` (`forward:/index.html`); rotas públicas liberadas no `SecurityConfig`.
- **Deploy:** Railway (serviço Docker único + Postgres gerenciado). Domínio próprio `fitradarapp.com.br`.
- **Integrações:** Asaas (cobrança de assinatura + marketplace/split), Resend (e-mail transacional, domínio verificado), Web Push (VAPID), Cloudflare R2 (planejado, para upload de vídeos).
- **Pacote base:** `com.sanoli.fitradar`.

## 4. Funcionalidades implementadas

### Núcleo — o Radar (retenção)
- Motor determinístico de retenção (`RetentionEngineService`): aderência, alunos em risco, tendência, ranking.
- Regras de risco (`RetentionRuleEngine`) + alertas agendados (`RetentionAlertScheduler`).
- Copiloto de IA (`RetentionCopilotService`, function calling): responde perguntas do criador ("quem vai desistir essa semana?", "quem merece parabéns?") explicando dados que o motor calcula.
- Nudges: sugestão de mensagem + envio real ao aluno (e-mail + push) via `StudentNudgeDeliveryService`.
- Digest periódico de retenção (`RetentionDigestScheduler`).

### Gestão do criador
- **Construtor de espaço white-label** (no-code): nome, slug, logo (upload), cor, bio, categoria; vitrine pública (`/c/{slug}`).
- **Módulos do espaço** (multi-seleção): Treino e/ou Nutrição — suporta criador híbrido (nutri + treinador).
- **Programas e treinos:** CRUD, treinos por dia/ordem, conteúdo. Criação bloqueada até o espaço existir.
- **Alunos:** lista, detalhe (visão 360º), convite por e-mail (com nome + senha temporária, reenvio resiliente), anamnese.
- **Ranking/gamificação:** leaderboard, XP.
- **Retenção:** overview, tendência de aderência, ranking, alunos em risco, inbox de alertas.
- **Configurações:** conta, assinatura, notificações, privacidade, espaço.

### Nutrição (estruturada, com cálculo)
- Planos alimentares com **refeições** (nome, horário) e **itens** por alimento.
- Base **TACO** (composição de alimentos) + alimentos custom; cálculo determinístico de **kcal + macros** por item → refeição → dia → projeção semanal.
- Aviso regulatório (prescrição é do profissional; plataforma só exibe dados de referência).

### App do aluno (mobile-first, PWA)
- Home com treino do dia + **check-in** rápido (como se sentiu 1–5).
- Progresso (aderência, streak), histórico de check-ins.
- Catálogo de programas, matrícula (grátis ou paga), plano alimentar, configurações.
- Notificações push (lembretes de treino).

### Cobrança (dois fluxos independentes)
1. **Assinatura SaaS do criador** (Asaas): trial 14 dias → plano Pro (R$49,90/mês); webhook ativa o Pro; checkout com CPF/CNPJ.
2. **Marketplace aluno→criador com split** (Asaas): aluno compra programa, criador recebe, plataforma retém taxa. **Modelo freemium:** comissão variável por plano (Free paga comissão cheia; Pro paga comissão reduzida/zero) + limites do Free (nº de alunos/programas) e recursos premium gated ao Pro.

### Plataforma
- Auth completa (login, cadastro, verificação de e-mail, recuperação de senha, aceite de termos, troca de senha temporária, revogação de sessão).
- E-mail transacional (Resend, domínio próprio verificado — SPF/DKIM/DMARC).
- LGPD: aceite de termos, consentimento de dados sensíveis (anamnese/saúde).
- Landing page de vendas (rota pública, honesta — sem prova social fabricada).
- CI (GitHub Actions), testes.

## 5. Inovações / diferenciais

1. **Radar de retenção (implementado):** prever churn + sugerir ação. Concorrentes têm ranking/gamificação, mas **não** predição de churn com nudge acionável. É o coração do produto.
2. **Regra de Ouro (motor calcula, IA explica):** arquitetura que garante precisão e confiança; a IA agrega valor sem os riscos de "alucinar" números.
3. **Benchmark de retenção entre criadores (roadmap — aposta principal):** com escala, comparar a retenção de um coach com pares do mesmo nicho/faixa ("sua retenção D30 é 62%; os melhores fazem 78% mandando o 1º nudge no dia 3"). É um **moat com efeito de rede** — cada coach novo melhora o benchmark para todos; nenhum concorrente copia sem a rede de dados. Fase 0 (métricas canônicas persistidas) em desenvolvimento.
4. **Nutrição estruturada com cálculo determinístico** (TACO), não texto livre.
5. **Espaço híbrido por módulos** (treino + nutrição) para profissionais multidisciplinares.

### Ideias no backlog (documentadas, não construídas)
- Detecção de overtraining a partir dos check-ins (sinal de saúde/segurança).
- Transformação verificada (selo de resultado — ataca o problema de confiança na venda de consultoria).
- Check-in por áudio (IA transcreve/resume).

## 6. Estado atual

- **Produto funcional em produção** (Railway): billing testado ponta a ponta (checkout → webhook → Pro), e-mail funcionando (domínio verificado), push ativo, nutrição com cálculo, módulos, anamnese, landing.
- **Validação:** primeiro coach real validou — **amou o Radar** (o diferencial central ressoou) e **quer usar de verdade**.
- **Fase atual:** aterrissar os primeiros coaches reais + polir fluidez do app; fundação do Benchmark (Fase 0) em andamento.

## 7. Modelo de negócio

- Assinatura do criador (Pro R$49,90/mês, trial 14 dias sem cartão) + comissão sobre vendas de programas dos alunos (variável por plano — freemium). Cobrança sempre no **web** (Asaas), evitando a taxa de 15–30% das lojas de app. Distribuição planejada: PWA → TWA (Android) → wrapper iOS.

---

_Documento de visão geral do FitRadar. Para detalhes de deploy ver docs/GO-LIVE.md; ideias de evolução em docs/ideias-produto.md; análise de concorrentes em docs/analise-concorrentes.md._
