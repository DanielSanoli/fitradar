# FitRadar — Banco de ideias de produto

> Ideias de evolução guardadas para priorização futura. Não são compromissos — são apostas a avaliar. Base: análise de concorrentes (PrimeCoaching, Kiwify, Hotmart) + arquitetura atual do FitRadar.

Princípio norteador: toda ideia deve respeitar a **Regra de Ouro** — o motor determinístico calcula valores/métricas; a IA apenas explica ou ajuda na entrada de dados, nunca calcula.

---

## 1. Benchmark de retenção entre criadores (aposta principal)

**O que é:** o Radar hoje olha o churn de um criador. Com escala, o FitRadar vê o padrão de retenção de centenas de coaches e passa a dar **contexto competitivo**:

> "Sua retenção em 30 dias é 62%. Coaches de crossfit no topo do FitRadar ficam em 78%. A diferença: eles enviam o primeiro nudge no dia 3 de inatividade; você, no dia 9."

**Por que é forte:** nenhum concorrente pode copiar fácil — exige a rede de dados de retenção. É um **moat com efeito de rede**: cada coach novo melhora o benchmark para todos. Evolução natural do Radar, de "copiloto individual" para "inteligência coletiva do mercado fitness".

**Ressalvas:** dados anonimizados e agregados por nicho/faixa (LGPD). Nunca expor aluno ou coach individual. Precisa de consentimento.

**Encaixe:** extensão direta do retention.engine. Motor agrega, IA explica.

---

## 2. Detecção de overtraining / risco a partir dos check-ins

**O que é:** o aluno já reporta "como se sentiu" (1–5) no check-in. Cruzando fadiga reportada + queda de aderência + carga, o motor levanta uma bandeira: "Aluno X reportou fadiga alta 4 dias seguidos e caiu aderência — possível overtraining."

**Por que é forte:** ângulo de **saúde/segurança** que nenhum concorrente tem. Coach não quer perder atleta por lesão evitável.

**Ressalvas:** é **sinal**, não diagnóstico. Nada de linguagem médica/prescritiva. Motor sinaliza, IA explica, coach decide.

**Encaixe:** perfeito na Regra de Ouro (motor calcula o sinal, IA contextualiza).

---

## 3. Transformação verificada (selo de resultado)

**O que é:** o FitRadar tem o registro real (check-ins com data, medidas, evolução). Vira um **selo** — "Progresso verificado pelo FitRadar" — que o aluno exporta e o coach usa como prova social (com consentimento).

**Por que é forte:** ataca o problema nº 1 da venda de consultoria online — **confiança** (fitness é cheio de antes/depois falso). É um **loop de crescimento**: cada transformação verificada que o coach divulga faz marketing do FitRadar.

**Ressalvas:** consentimento explícito do aluno para uso de dados/imagem.

---

## 4. Check-in por áudio

**O que é:** em vez de formulário, o aluno manda um áudio de ~20s ("como foi a semana"); a IA transcreve, resume para o coach e detecta o tom/sentimento.

**Por que é forte:** menos atrito que preencher formulário, mais sinal para o Radar. Mecanismo de coleta que nenhum concorrente usa.

**Encaixe:** IA na transcrição/resumo (entrada de dados), não no cálculo.

---

## 5. Plano alimentar com calorias e macros

**O que é:** o criador insere alimentos no plano alimentar e o sistema mostra as kcal (e macros) corretas para aquela porção. Aluno e criador visualizam calorias por refeição e total diário/semanal. Inclui as melhorias vistas na PrimeCoaching (refeições, horários, trocas).

**Como implementar (Regra de Ouro):**
- **Fonte de dados:** tabela de composição de alimentos **TACO** (Unicamp — pública, gratuita, ~600 alimentos com kcal + proteína/carbo/gordura por 100g). Complemento: **USDA FoodData Central** (API gratuita) para o que faltar. Seed via Flyway.
- **Cálculo (determinístico, BigDecimal):** `kcal = (porção_g / 100) × kcal_por_100g`. Soma por refeição → dia → semana.
- **Papel da IA (entrada, não cálculo):**
  - Casar alimento por texto livre ("arroz integral cozido" → item da TACO).
  - Interpretar porção em linguagem natural ("2 colheres de sopa" → gramas).
- **NÃO** usar IA para estimar calorias (viola a Regra de Ouro + risco de imprecisão em produto de nutrição).

**Escopo recomendado (evitar inchaço):** começar com **kcal + 3 macros** (proteína, carbo, gordura). Deixar micronutrientes, índice glicêmico etc. para depois.

**Trabalho:** moderado — a área de nutrição já existe. Extensão: tabela `foods` (seed TACO), item de refeição com `food_id` + `quantidade_g` + valores calculados, agregação diária/semanal, exibição no app (aluno + criador).

**Ressalva regulatória:** prescrição de dieta é privativa de nutricionista (CFN). Quem insere é o **criador**; a plataforma só exibe dados de tabela oficial. Não deixar a plataforma "prescrever" sozinha.

---

_Documento vivo. Atualizar conforme as ideias forem validadas ou descartadas._
