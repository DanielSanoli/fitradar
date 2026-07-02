# Análise de Concorrentes — FitRadar vs PrimeCoaching, Kiwify e Hotmart

> Levantamento feito a partir das páginas públicas dos concorrentes (jul/2026) e do código atual do FitRadar. Objetivo: identificar (1) funcionalidades que faltam e (2) diferenciais de front implementáveis.

## Contexto competitivo

- **PrimeCoaching** — concorrente **direto**. Mesma proposta (consultoria online: alunos, treino, dieta, cobrança recorrente), mesmo público (personais, nutris, coaches). É a referência mais relevante.
- **Kiwify / Hotmart** — categoria diferente (infoprodutos/cursos). Só parte das funcionalidades se aplica a um SaaS de consultoria fitness.

**Diferencial que o FitRadar já tem e eles não:** o **Radar de retenção** (prever quem vai desistir + nudge com ação sugerida). PrimeCoaching e Hotmart têm apenas ranking/gamificação de XP — não têm predição de churn. Esse é o foco a preservar.

---

## Parte 1 — Funcionalidades que faltam no FitRadar

### Da PrimeCoaching (prioridade alta — concorrente direto)

| Funcionalidade | O que é | Status no FitRadar |
|---|---|---|
| **Anamnese via formulário** | Questionário estruturado de entrada (histórico, objetivos, restrições) → "visão 360º" do aluno | Não existe (aluno entra direto) |
| **Vídeos de execução ("Biomecânica")** | Cada exercício com vídeo de técnica | Mapeado como melhoria futura (upload de mídia) |
| **Plano alimentar com trocas** | Refeições, horários e substituições de alimentos | Área de nutrição existe, sem trocas/horários |
| **Dashboard financeiro** | Faturamento hoje/semana/mês/ano com % + gráfico 12 meses | Billing funcional, sem camada de BI |
| **IA gera treino/dieta** | IA prescreve treino e dieta; ajuda a importar alunos | FitRadar: IA só explica (Regra de Ouro) — diferença conceitual |
| **Acesso multi-colaborador** | Vários usuários na mesma conta/operação | Single-creator |
| **Módulo de cursos/infoprodutos** | Vender planilhas prontas e cursos além da consultoria | Não existe (só programas/marketplace) |
| **Grupo de desafios** | Desafios entre alunos | Não existe |
| **Chat de dúvidas (WhatsApp)** | Canal de dúvidas integrado no app | Não existe |
| **Suporte à migração de alunos** | Importação de base de outra ferramenta | Não existe |

### Da Kiwify (parcialmente aplicável)

- Certificados automáticos de conclusão
- Streaming de vídeo hospedado grátis
- Domínio personalizado
- Editor de código (HTML/CSS/Liquid) para customização total da área de membros

### Da Hotmart (parcialmente aplicável)

- **Programa de afiliados** (terceiros vendem seu programa por comissão)
- Turmas / cohorts
- Comunidades pagas/exclusivas
- Certificados

---

## Parte 2 — Diferenciais de front da PrimeCoaching

> **Atenção:** os itens abaixo são da **landing page de vendas** da PrimeCoaching, não do app. O FitRadar hoje não tem uma landing de vendas — tem o app. São duas frentes distintas.

Ordenados por impacto:

1. **Tipografia display pesada** — títulos bold condensados e enormes. Maior impacto pelo menor esforço. Casa com o design pass já proposto (sair da fonte de sistema).
2. **Hero "vivo"** — cards de notificação flutuantes animados em volta do mockup ("Novo aluno entrou agora", "Plano alimentar lançado", etiquetas de preço).
3. **Diagrama orbital animado ("Motor de Recorrência")** — círculos concêntricos com número central em count-up. É o "uau" visual.
4. **Dashboard financeiro animado** — números em count-up + gráfico de área suave. Mesmo padrão de microinteração desejado nos insights do Radar.
5. **Carrossel de features guiado por scroll** — lista com barras de progresso sincronizadas com prints do celular.
6. **Tabela comparativa** "O que os outros fazem" vs "O que você faz aqui".
7. **Mural de prova social** — depoimentos + avatares + números de faturamento.
8. **Profundidade com gradientes e glow** — fundo escuro em camadas, brilhos sutis = ar premium.

---

## Recomendação de priorização

**Curto prazo (dentro do app, alto ROI):**
- Design pass (tipografia + insights animados + microinterações) — já há prompt pronto.
- Anamnese via formulário — maior gap funcional vs concorrente direto.

**Médio prazo:**
- Vídeos de execução dos exercícios (upload de mídia).
- Dashboard financeiro para o criador.
- Plano alimentar com trocas/horários.

**Landing page de vendas (frente separada):**
- Criar uma landing inspirada na PrimeCoaching (hero vivo, tipografia display, prova social) — o FitRadar ainda não tem canal de aquisição.

**Preservar como diferencial (não diluir):**
- Radar de retenção (predição de churn + nudge). É o que o FitRadar tem de único frente a todos os concorrentes.

---

_Fontes: primecoaching.com.br/teste-gratuitamente, ajuda.kiwify.com.br, help.hotmart.com. Levantamento jul/2026._
