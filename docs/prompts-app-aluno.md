# Prompts — Diferenciais do app do aluno

> Ordem recomendada de implementação: A → B → C → D → E (esforço crescente; A e B destravam valor rápido, C reaproveita dados de A/B, D e E são maiores).
> Todos respeitam a Regra de Ouro: motor determinístico calcula, IA (se envolvida) apenas explica.

---

## Prompt A — Micro-delight no check-in

```text
[Base]
# Feature: celebração do check-in — momento central do app do aluno
O check-in rápido já existe na StudentHomePage (feeling 1–5) e alimenta GamificationService (currentStreak, totalCheckInsDone em StudentGamificationProfile).
- Ao concluir o check-in com sucesso: animação de celebração (anel de progresso fechando + confete leve em canvas/CSS puro, sem lib pesada) e vibração curta via navigator.vibrate quando suportado.
- Mensagem contextual determinística baseada nos dados que a API já retorna: streak novo recorde ("Novo recorde: X dias!"), múltiplos de 5 no streak, primeiro check-in da semana, marco de total de treinos (10º, 50º, 100º). Sem IA — regras fixas no frontend.
- Respeitar prefers-reduced-motion: com a media query ativa, trocar animação por feedback estático.
- Não bloquear a UI: animação roda após a resposta da API; erro de rede mantém o fluxo atual de erro.
- Testes: componente de celebração (render por cenário de mensagem) e regressão dos testes existentes da StudentHomePage.
Aceite: aluno faz check-in e vê celebração fluida com mensagem contextual correta; com prefers-reduced-motion não há animação; nenhum teste existente quebra.
```

---

## Prompt B — Streak com proteção (escudo)

```text
[Base]
# Feature: proteção de streak — escudo que salva o dia perdido (mecânica Duolingo)
O streak já é calculado em GamificationService sobre StudentGamificationProfile (currentStreak, longestStreak, lastActivityDate). Toda a regra é determinística no motor — nada de IA.
- Migration Flyway (próxima versão livre): coluna streak_shields int not null default 0 em student_gamification_profile (+ shield_earned_progress se necessário para rastrear a semana).
- Regra de ganho: a cada 7 dias consecutivos de streak, aluno ganha 1 escudo (máximo acumulado: 2). Calcular no mesmo fluxo que atualiza o streak no check-in.
- Regra de consumo: no check-in, se o gap desde lastActivityDate for exatamente 1 dia perdido e houver escudo, consumir 1 escudo e preservar o streak (streak continua, não reseta). Gap maior que 1 dia: streak reseta normalmente (escudo não cobre múltiplos dias).
- Expor shields e eventos (escudo ganho / escudo consumido no último check-in) no DTO de progresso do aluno e na resposta do check-in.
- Frontend: exibir escudos (ícone + contador) na StudentHomePage e StudentProgressPage; toast/celebração quando ganhar ou consumir escudo (integrar com a celebração do Prompt A).
- Testes: unit no GamificationService cobrindo ganho, cap, consumo, gap > 1 dia e reset; ajustar testes de integração afetados.
Aceite: aluno com escudo que fura 1 dia mantém o streak e vê que o escudo foi consumido; aluno sem escudo reseta; ganho a cada 7 dias com cap de 2 funciona e aparece na UI.
```

---

## Prompt C — Retrospectiva mensal compartilhável (Wrapped)

```text
[Base]
# Feature: retrospectiva mensal do aluno — card visual compartilhável com marca do coach
Todos os dados já existem: check-ins (CheckInRepository), aderência (RetentionEngineService.adherenceDetail), streak/XP/badges (GamificationService), marca do espaço (CreatorSpace: nome, logo, cor).
- Backend: criar MonthlyRecapService determinístico (BigDecimal HALF_EVEN, Clock injetado) que agrega por mês fechado: treinos feitos, aderência %, maior streak do mês, XP ganho, badge/marco do mês, comparativo com mês anterior. Endpoint GET no padrão dos endpoints do aluno autenticado (ex.: /api/v1/gamification/recap?year=&month=), validando que o mês está fechado.
- Frontend: página/modal "Sua retrospectiva de {mês}" no app do aluno, renderizando um card 1080x1920 (formato story) com a identidade white-label do criador (logo, cor, nome do espaço) + branding discreto FitRadar.
- Compartilhar: gerar PNG do card via canvas nativo (sem lib pesada) e usar Web Share API com arquivo (navigator.canShare); fallback: download do PNG.
- Notificar: no dia 1 do mês, push "Sua retrospectiva de {mês} chegou" reaproveitando PushNotificationService e o padrão dos schedulers existentes (RetentionDigestScheduler como referência).
- Aluno sem dados no mês: estado vazio amigável, sem card compartilhável.
- Testes: unit do MonthlyRecapService (mês com dados, mês vazio, comparativo), teste de integração do endpoint (tenant isolation: aluno só vê o próprio recap), teste do componente do card.
Aceite: aluno abre a retrospectiva do mês anterior, vê números corretos com a marca do coach e compartilha/baixa o PNG; push disparado no dia 1; aluno não acessa recap de outro aluno.
```

---

## Prompt D — Timeline de evolução com foto

```text
[Base]
# Feature: fotos de progresso privadas + timeline de evolução
Padrão de upload já existe em LogoStorageService (uploads/logos, validação de mime/tamanho) e o consentimento de dados sensíveis já existe no fluxo de anamnese (LGPD).
- Backend: entidade ProgressPhoto (id, studentId, date, storagePath, note opcional, weight opcional, sharedWithCoach boolean default false) + migration Flyway. Foto corporal é dado sensível: exigir consentimento explícito (reaproveitar o padrão de consentimento da anamnese) antes do primeiro upload.
- Storage: seguir o padrão do LogoStorageService (diretório uploads/progress-photos), com whitelist de mime (jpeg/png/webp), limite de tamanho (ex.: 5MB) e nome de arquivo não adivinhável (UUID). Servir SOMENTE via endpoint autenticado que valida dono (nunca rota pública estática como os logos).
- Endpoints student-scoped: upload, listar (ordem cronológica), deletar, toggle sharedWithCoach. Coach só vê fotos com sharedWithCoach=true, via detalhe do aluno (visão 360º).
- Frontend (aluno): página "Minha evolução" com timeline vertical de fotos + peso/nota; comparador lado a lado (selecionar 2 fotos, ex.: primeira vs. última) com slider. Entrada pelo StudentProgressPage.
- Frontend (coach): seção de evolução no detalhe do aluno exibindo apenas fotos compartilhadas, com aviso de privacidade.
- Exclusão de conta (AccountPrivacyService): incluir remoção das fotos do aluno.
- Testes: integração de upload/list/delete com validação de dono (tenant isolation), consentimento obrigatório, coach sem acesso a foto não compartilhada; unit de validação de arquivo.
Aceite: aluno consente, envia fotos, vê timeline e comparador; foto é privada por padrão e o coach só vê quando compartilhada; URLs não são acessíveis sem auth; deletar conta remove as fotos.
```

---

## Prompt E — Modo treino (player de academia)

```text
[Base]
# Feature: modo treino — player fullscreen para executar o treino na academia
O treino hoje é Workout.contentMarkdown exibido na StudentWorkoutDetailPage. V1 do player é 100% frontend (sem mudança de modelo de dados): parsear o markdown no client. Documentar V2 (exercícios estruturados) como evolução futura.
- Botão "Iniciar treino" na StudentWorkoutDetailPage abre o modo treino fullscreen: parser converte o markdown em passos (headings = blocos, itens de lista = exercícios/séries) e exibe um passo por vez com botões grandes (mobile-first, uso com mão suada).
- Checklist: marcar cada item como feito; barra de progresso do treino no topo; estado da sessão em memória + sessionStorage para sobreviver a refresh acidental (NUNCA perder progresso do treino no meio).
- Timer de descanso: botão de descanso com presets (30s/60s/90s/custom), contagem regressiva visível, vibração + som opcional ao terminar.
- Manter tela acesa durante a sessão via Screen Wake Lock API (com fallback silencioso quando não suportado).
- Offline: garantir que o treino do dia funcione offline — runtime caching (Workbox, já configurado via VitePWA) da resposta do treino do aluno; player não depende de rede durante a sessão.
- Finalizar treino: dispara o fluxo de check-in existente (com feeling 1–5) já pré-preenchido com o workoutId da sessão + celebração do Prompt A. Abandonar treino pede confirmação.
- Testes: unit do parser de markdown→passos (casos: headings, listas aninhadas, markdown sem estrutura), componente do timer, fluxo iniciar→marcar→finalizar→check-in; regressão dos testes da StudentWorkoutDetailPage.
Aceite: aluno inicia o treino, avança passo a passo com timer de descanso, tela não apaga, funciona sem rede, e ao finalizar o check-in é registrado; markdown sem estrutura clara ainda renderiza como passo único sem quebrar.
```
