# Boneco 3D e explicação da execução — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Todos os 63 exercícios prontos mostram um manequim 3D animado executando o movimento, com equipamento, e uma explicação "Como fazer"; tocar no nome do exercício leva a isso.

**Architecture:** Regras puras em `src/lib/` (esqueleto com cinemática direta, receitas de pose por quadros-chave, interpolação, validação de contatos/limites) e as 63 receitas + explicações em `src/lib/execucoes/` por grupo. Um componente lazy `Boneco3D` (three.js puro) monta manequim + equipamento e anima `poseNoTempo`. `ExercicioDetalhe` e um painel no `Treino` exibem boneco + texto.

**Tech Stack:** React 19, TypeScript 7, three.js (versão exata, ≥2 semanas de publicada), Vitest, Playwright, Tailwind v4 tokens.

**Spec:** `docs/superpowers/specs/2026-11-22-boneco-3d-execucao-design.md`

## Global Constraints

- Identificadores e textos em português do Brasil; textos para leigo, frases curtas.
- `src/lib/**` puro: sem React/Dexie/three.js; do banco só `db/tipos`. three.js só em `src/components/Boneco3D*.tsx` / `src/components/cena3d/`.
- three.js nunca no pacote inicial: só via `lazy()`/`import()` dinâmico.
- Cores do 3D lidas dos tokens CSS em tempo de execução (`corDoTema` em `lib/tema.ts`), recalculadas quando `temaEfetivo(config.tema, useSistemaEscuro())` muda. Nada de hex em componentes.
- Ritmo: descida/fase excêntrica ≈ 2000 ms, subida/concêntrica ≈ 1000 ms, pausa 300–500 ms nos extremos.
- `prefers-reduced-motion`: sem loop; pose inicial e final lado a lado, rotuladas "Início" e "Fim".
- Animação pausa fora da tela (`IntersectionObserver`) e com `document.hidden`.
- Sem WebGL: só o texto, com aviso "Animação indisponível neste aparelho".
- Chave exercício → execução = `exercicio.nome` (exercícios prontos nunca são renomeados).
- Fluxo GitHub do `AGENTS.md`: Issue `feature` → branch `feat/boneco-3d` → commits Conventional (assunto em pt-BR) → PR `Closes #N` → CI verde → merge.

## Review Focus

1. **Barra com as duas mãos entortando/esticando durante o loop** (supino, agachamento, rosca direta, remada): distância entre punhos deve ser constante e a barra nivelada → contato `distanciaFixa` + `simetria` validados por receita (Task 3).
2. **Pés flutuando ou afundando no chão em exercícios em pé** (agachamento, stiff, elevação lateral): altura mínima dos tornozelos constante → contato `apoio` validado (Task 3).
3. **Corpo atravessando o banco/máquina em exercícios deitados/sentados**: quadril e tronco presos ao assento/encosto → contato `apoio` aplicado a `quadril` (e `coluna` quando deitado) (Task 3).
4. **Painel aberto no meio do treino perdendo o treino ou recarregando a página**: abrir/fechar a explicação no Treino mantém séries marcadas → e2e (Task 6).
5. **Troca de tema com o boneco aberto deixando cores antigas**: cores recalculadas → teste de componente que muda `data-theme` e confere o material atualizado (Task 5).

---

### Task 1: Issue, branch e esqueleto com cinemática direta

**Files:**
- Create: `src/lib/esqueleto.ts`, `src/lib/esqueleto.test.ts`

**Interfaces:**
- Produces:
  - `type Articulacao = 'quadril' | 'coluna' | 'pescoco' | 'ombroE' | 'ombroD' | 'cotoveloE' | 'cotoveloD' | 'punhoE' | 'punhoD' | 'quadrilE' | 'quadrilD' | 'joelhoE' | 'joelhoD' | 'tornozeloE' | 'tornozeloD'` (quadril = raiz; `quadrilE/D` = articulação da coxa).
  - `type Vec3 = [number, number, number]` (metros; y para cima, z para frente do boneco, x para a esquerda do boneco).
  - `interface Pose { raiz: { pos: Vec3; rot: Vec3 }; rot: Partial<Record<Articulacao, Vec3>> }` (graus, Euler XYZ, relativos ao pai; ausente = 0).
  - `const PAI: Record<Exclude<Articulacao,'quadril'>, Articulacao>`, `const OSSO: Record<Exclude<Articulacao,'quadril'>, Vec3>` (deslocamento do filho em relação ao pai na pose neutra, em pé, braços estendidos ao lado do corpo; boneco de 1,75 m).
  - `const LIMITES: Partial<Record<Articulacao, { min: Vec3; max: Vec3 }>>`, com flexão de cotovelo 0–150, joelho 0–150 (flexão só para trás), coluna −30–90 em X, ombro −60–180 em X.
  - `posicoes(pose: Pose): Record<Articulacao, Vec3>` — posição mundial de cada articulação + extremidades `maoE/maoD/peE/peD/cabeca` (estender o tipo de retorno como `Record<Articulacao | Extremidade, Vec3>`, `type Extremidade = 'maoE' | 'maoD' | 'peE' | 'peD' | 'cabeca'`).
  - `foraDosLimites(pose: Pose): string[]` — lista de mensagens `"<articulacao> eixo <x|y|z>: <valor>°"`.

- [ ] **Step 1: Criar a Issue e a branch**

```bash
gh issue create --title "Boneco 3D animado e explicação da execução em todos os exercícios" --label feature --body "<problema, o que muda, critérios de aceite resumidos do spec>"
git switch -c feat/boneco-3d
```

- [ ] **Step 2: Escrever os testes**

`esqueleto.test.ts`:
- `posicoes(POSE_NEUTRA)`: cabeça ≈ 1,6–1,75 m de altura; pés em y ≈ 0 quando `raiz.pos = [0, ALTURA_QUADRIL, 0]`; `maoE.x > 0` e `maoD.x < 0` (simetria espelhada: `maoE.x ≈ -maoD.x`).
- Flexionar `cotoveloD` 90° em X leva `maoD` para frente (`z` maior que o cotovelo) e mantém o comprimento antebraço constante (`dist(cotoveloD, maoD)` igual antes/depois, tolerância 1e-6).
- Rodar a raiz 90° em X (deitado de costas) deixa a cabeça com `y ≈ raiz.y` e `z` negativo… ajustar ao sentido escolhido; o teste fixa: deitado de barriga para cima ⇒ `cabeca.y ≈ quadril.y` e `peito` voltado para +y.
- `foraDosLimites` devolve `[]` para a neutra e acusa `joelhoD` com −10°.

- [ ] **Step 3: Rodar e ver falhar** — `npx vitest run src/lib/esqueleto.test.ts` → FAIL (módulo não existe).

- [ ] **Step 4: Implementar `src/lib/esqueleto.ts`** — cinemática direta com matrizes 4×4 próprias (sem three.js), Euler XYZ em graus; exportar também `POSE_NEUTRA` e `ALTURA_QUADRIL`.

- [ ] **Step 5: Rodar e passar** — mesmo comando → PASS. `npm run lint && npm run typecheck`.

- [ ] **Step 6: Commit** — `feat: esqueleto do boneco com cinemática direta`.

### Task 2: Receita, interpolação no tempo

**Files:**
- Create: `src/lib/execucao.ts`, `src/lib/execucao.test.ts`

**Interfaces:**
- Consumes: `Pose`, `Articulacao`, `Vec3` (Task 1).
- Produces:
  - `type Equipamento3D = { tipo: 'banco'; inclinacao: number } | { tipo: 'barra'; presaEm: 'maos' | 'costas' | 'quadril' } | { tipo: 'halter'; mao: 'E' | 'D' | 'ambas' } | { tipo: 'polia'; origem: Vec3; acessorio: 'corda' | 'barra' | 'triangulo' | 'puxador' | 'tornozeleira'; presaEm: Extremidade | 'maos' } | { tipo: 'maquina'; modelo: 'legPress45' | 'extensora' | 'mesaFlexora' | 'cadeiraFlexora' | 'flexoraEmPe' | 'hack' | 'smith' | 'scott' | 'voador' | 'abdutora' | 'paralelas' | 'barraFixa' | 'panturrilhaEmPe' | 'panturrilhaSentado' | 'supinoMaquina' | 'remadaArticulada' | 'desenvolvimentoMaquina' | 'crucifixoInverso' | 'cavalinho' }`.
  - `type Fase = 'concentrica' | 'excentrica' | 'pausa'`.
  - `interface Quadro { pose: Pose; ms: number; fase: Fase }` — `ms` = duração da transição **até** o próximo quadro.
  - `type Contato = { tipo: 'apoio'; ponto: Articulacao | Extremidade; eixo: 'y' | 'xyz' } | { tipo: 'distanciaFixa'; a: Articulacao | Extremidade; b: Articulacao | Extremidade } | { tipo: 'simetria' }`.
  - `interface ReceitaExecucao { cena: Equipamento3D[]; quadros: Quadro[]; camera: { azimute: number; elevacao: number; distancia: number }; contatos: Contato[]; musculoDestaque: Articulacao[]; isometrica?: boolean }` (`isometrica` = exercício parado, ex. prancha).
  - `duracaoCiclo(r: ReceitaExecucao): number`.
  - `poseNoTempo(r: ReceitaExecucao, ms: number): Pose` — cíclico (`ms % duracaoCiclo`), suavização `easeInOutSine` entre quadros, interpolação linear de cada ângulo/posição (rotações ausentes = 0).
  - `posesExtremas(r: ReceitaExecucao): { inicio: Pose; fim: Pose }` — `inicio = quadros[0].pose`, `fim` = quadro de maior distância angular total em relação ao início.
  - `espelhar(p: Pose): Pose` — troca E↔D e inverte sinais de Y/Z (para receitas unilaterais/alternadas).

- [ ] **Step 1: Testes** — `poseNoTempo(r, 0)` igual a `quadros[0].pose`; no meio da 1ª transição o ângulo está estritamente entre os dois; `poseNoTempo(r, duracaoCiclo(r))` igual ao início (loop contínuo); valores negativos de `ms` não quebram; `espelhar(espelhar(p))` igual a `p`; `posesExtremas` acha o quadro mais distante.
- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run src/lib/execucao.test.ts`.
- [ ] **Step 3: Implementar** em `src/lib/execucao.ts`.
- [ ] **Step 4: Rodar e passar**, `npm run lint`.
- [ ] **Step 5: Commit** — `feat: receita de execução e interpolação das poses`.

### Task 3: Validação de receita

**Files:**
- Modify: `src/lib/execucao.ts`, `src/lib/execucao.test.ts`

**Interfaces:**
- Produces: `validarReceita(r: ReceitaExecucao, amostras = 60): string[]` — amostra `poseNoTempo` ao longo do ciclo e acusa:
  - menos de 2 quadros, ou `ms <= 0`;
  - qualquer `foraDosLimites` (prefixo `"t=<ms>: "`);
  - `apoio` eixo `y`: variação da altura do ponto > 0,02 m; eixo `xyz`: deslocamento > 0,02 m;
  - `distanciaFixa`: variação > 0,02 m;
  - `simetria`: `|pos(E).x + pos(D).x| > 0,02` ou diferença de y/z > 0,02 entre pares E/D (receitas alternadas não declaram `simetria`);
  - soma das fases `excentrica` < 1500 ms ou `concentrica` < 700 ms (ritmo didático), exceto quando `isometrica`.

- [ ] **Step 1: Testes** — uma receita válida (rosca simples feita no teste) → `[]`; cada violação acima produz uma mensagem contendo o nome do contato/articulação (um `it` por regra, incluindo os casos do Review Focus 1–3); receita `isometrica` com fases só de `pausa` → `[]`.
- [ ] **Step 2: Falhar → Step 3: Implementar → Step 4: Passar** (`npx vitest run src/lib/execucao.test.ts`).
- [ ] **Step 5: Commit** — `feat: validação de contatos e limites das receitas`.

### Task 4: Cinco exercícios-modelo + tipo da explicação + teste de cobertura

**Files:**
- Create: `src/lib/execucoes/tipos.ts`, `src/lib/execucoes/poses.ts` (poses-base reutilizáveis: `emPe`, `deitadoNoBanco(inclinacao)`, `sentado`, `pendurado`), `src/lib/execucoes/peito.ts`, `costas.ts`, `ombros.ts`, `bracos.ts`, `pernas.ts`, `abdomen.ts`, `src/lib/execucoes/index.ts`
- Test: `src/db/execucoes.test.ts` (em `db/` porque precisa de `EXERCICIOS_INICIAIS`)

**Interfaces:**
- Produces:
  - `interface Explicacao { posicao: string[]; execucao: string[]; respiracao: string; erros: string[]; dica?: string }`.
  - `interface Execucao { receita: ReceitaExecucao; explicacao: Explicacao; descricao: string }` (`descricao` = frase única para `aria-label`).
  - `const EXECUCOES: Record<string, Execucao>` (index junta os arquivos por grupo) e `execucaoDe(nome: string): Execucao | undefined`.

- [ ] **Step 1: Teste de cobertura** em `src/db/execucoes.test.ts`:
  - para cada nome em `EXECUCOES`, `validarReceita(receita)` é `[]` (mensagem do teste inclui o nome);
  - toda chave de `EXECUCOES` existe em `EXERCICIOS_INICIAIS`;
  - `explicacao.posicao`, `execucao`, `erros` têm ≥1 item, nenhum texto vazio; `execucao` cita direção (contém ao menos uma de: "sobe", "desce", "empurre", "puxe", "estenda", "flexione", "leve");
  - `const FALTANDO` = nomes de `EXERCICIOS_INICIAIS` sem execução; `expect(FALTANDO).toEqual(PENDENTES)` com `PENDENTES` listando explicitamente os 58 ainda sem receita (a lista encolhe em cada task de lote e termina `[]` na Task 11).
- [ ] **Step 2: Falhar** — `npx vitest run src/db/execucoes.test.ts`.
- [ ] **Step 3: Escrever as 5 receitas-modelo**: `Supino reto`, `Puxada alta`, `Elevação lateral`, `Rosca direta`, `Agachamento livre`. Regras de autoria (valem para todas as tasks de lote):
  - partir de uma pose-base de `poses.ts`; quadros: início → fim (fase concêntrica) → início (excêntrica), com pausas;
  - contatos obrigatórios: barra com as duas mãos ⇒ `distanciaFixa(maoE, maoD)` + `simetria`; em pé ⇒ `apoio(peE,y)` e `apoio(peD,y)`; deitado/sentado ⇒ `apoio(quadril,xyz)`; máquina guiada de pernas ⇒ `apoio(quadril,xyz)`;
  - técnica: supino com cotovelos ~45–60° do tronco, barra desce até a linha do mamilo; agachamento com joelhos na direção dos pés e coluna neutra (coluna X ≤ 45°); elevação lateral até a altura dos ombros, cotovelos levemente flexionados (~15°); rosca sem mover o ombro (ombro X variação ≤ 10°); puxada até a barra na altura do queixo, tronco levemente inclinado (~15°);
  - explicação: 2–4 frases por lista, segunda pessoa, sem jargão (se usar um termo, explique: "pegada pronada (palmas para baixo)"). Exemplo de referência:

```ts
explicacao: {
  posicao: ['Deite no banco reto com os olhos embaixo da barra.', 'Segure a barra um pouco mais aberta que os ombros, palmas para a frente.', 'Pés firmes no chão e ombros encaixados para trás.'],
  execucao: ['Tire a barra do suporte e deixe os braços esticados sobre o peito.', 'Desça a barra devagar até encostar de leve no meio do peito, cotovelos a uns 45° do corpo.', 'Empurre a barra para cima e um pouco para trás até esticar os braços.'],
  respiracao: 'Puxe o ar na descida e solte ao empurrar.',
  erros: ['Abrir os cotovelos em 90°, forçando o ombro.', 'Quicar a barra no peito.', 'Tirar o quadril do banco.'],
}
```

- [ ] **Step 4: Passar** — `npx vitest run src/db/execucoes.test.ts` + `npm run lint`.
- [ ] **Step 5: Commit** — `feat: execução dos cinco primeiros exercícios`.

### Task 5: Componente Boneco3D (three.js, lazy)

**Files:**
- Create: `src/components/Boneco3D.tsx` (default export, lazy), `src/components/cena3d/manequim.ts`, `src/components/cena3d/equipamentos.ts`, `src/components/Demonstracao.tsx` (wrapper leve, no bundle inicial: decide 3D vs. poses estáticas vs. sem WebGL, faz o `lazy()` e mostra o `Esqueleto` 4:3)
- Modify: `package.json` (add `three` + `@types/three` em versões exatas), `src/lib/tema.ts` se precisar de helper de cor
- Test: `src/components/Boneco3D.test.ts` (funções puras de `cena3d/` sem WebGL: montar a hierarquia de `Object3D`, aplicar pose, cores)

**Interfaces:**
- Consumes: `posicoes`, `Pose` (Task 1); `poseNoTempo`, `posesExtremas`, `ReceitaExecucao` (Task 2); `Execucao` (Task 4); `corDoTema`, `temaEfetivo`, `useSistemaEscuro`.
- Produces:
  - `<Demonstracao execucao={Execucao} />` — único ponto que telas usam.
  - `cena3d/manequim.ts`: `criarManequim(cores: CoresCena): { raiz: Object3D; aplicarPose(p: Pose): void; destacar(arts: Articulacao[]): void }` — cápsulas/esferas com `MeshStandardMaterial`, ossos com os mesmos comprimentos de `OSSO`.
  - `cena3d/equipamentos.ts`: `montarEquipamento(e: Equipamento3D, manequim, cores): { objeto: Object3D; atualizar(pos: Record<string, Vec3>): void }` — halter/barra seguem `maoE/maoD` (barra posicionada no ponto médio e orientada pelo vetor entre as mãos), cabo da polia = linha da `origem` até o ponto preso, carrinhos de máquina seguem o ponto preso.
  - `interface CoresCena { corpo: string; destaque: string; equipamento: string; peso: string; chao: string }` lidas de `--cartao-2`/`--secundario`/`--destaque`/`--tinta` via `corDoTema`.

- [ ] **Step 1: Instalar three** — `npm view three time --json` → escolher a maior versão com ≥14 dias; `npm i -E three@<v>` e `npm i -DE @types/three@<compatível>`.
- [ ] **Step 2: Testes puros** — `criarManequim` + `aplicarPose(POSE_NEUTRA)`: posição mundial da mão (via `getWorldPosition`) bate com `posicoes()` (tolerância 1e-3); barra fica no ponto médio entre as mãos; trocar cores (Review Focus 5) atualiza `material.color` de corpo e destaque.
- [ ] **Step 3: Falhar → implementar `cena3d/*`** → passar.
- [ ] **Step 4: Implementar `Boneco3D.tsx`** — `WebGLRenderer({ antialias: true, alpha: true })`, luz ambiente + direcional com sombra suave no chão, câmera da receita (`azimute/elevacao/distancia`), arrastar = orbitar (implementação própria com pointer events, sem OrbitControls para manter o chunk pequeno; limitar elevação 5–80°), botões `Botao pequeno`: "Pausar"/"Reproduzir" e "Ver de novo" (volta câmera e reinicia ciclo). Loop com `requestAnimationFrame`, parado com `IntersectionObserver` fora da tela e `visibilitychange`. `dispose()` de geometrias/materiais/renderer no unmount. Canvas `role="img"` com `aria-label={execucao.descricao}`. Contêiner `aspect-[4/3] w-full rounded-cartao`.
- [ ] **Step 5: Implementar `Demonstracao.tsx`** — `matchMedia('(prefers-reduced-motion: reduce)')`: duas miniaturas estáticas "Início"/"Fim" (o próprio `Boneco3D` com prop `estatico: 'inicio' | 'fim'`, renderizando 1 quadro sem loop); sem WebGL (`document.createElement('canvas').getContext('webgl2') ?? getContext('webgl')` nulo) ⇒ texto "Animação indisponível neste aparelho". Suspense fallback = `Esqueleto className="aspect-[4/3] w-full"`.
- [ ] **Step 6: Verificar o chunk** — `npm run build`; o chunk de three não pode estar no `index-*.js` (conferir com `ls -la dist/assets` e grep de `WebGLRenderer` só no chunk lazy). `npm run knip`.
- [ ] **Step 7: Commit** — `feat: componente 3D do boneco com carregamento sob demanda`.

### Task 6: Telas — detalhe, painel no treino, nome clicável, anotações próprias

**Files:**
- Modify: `src/pages/ExercicioDetalhe.tsx`, `src/pages/Treino.tsx`, `src/pages/Exercicios.tsx`, `src/components/SeletorExercicio.tsx`, `src/db/tipos.ts` (`comoFazer?: string` em `Exercicio`), `src/components/ui.tsx` (formato `'detalhe'` do `Carregando` ganha o retângulo 4:3 no topo)
- Create: `src/components/ComoFazer.tsx` (lista os passos de `Explicacao`; para exercício personalizado, `textarea` "Como fazer (suas anotações)" salva com `db.exercicios.update(id, { comoFazer })` via nova função `salvarComoFazer(id: number, texto: string): Promise<void>` em `src/db/exercicios.ts` — criar o arquivo se não existir)
- Test: `src/db/exercicios.test.ts` (`salvarComoFazer` grava e apaga com string vazia → `undefined`), `e2e/fluxos.spec.ts`

**Interfaces:**
- Consumes: `<Demonstracao />` (Task 5), `execucaoDe` (Task 4).
- Produces: `<ComoFazer exercicio={Exercicio} />`.

- [ ] **Step 1: Teste unitário de `salvarComoFazer`** → falhar → implementar → passar.
- [ ] **Step 2: `ExercicioDetalhe`** — ordem: chips → `<Demonstracao>` (se `execucaoDe(nome)`) → `<Cartao><h2>Como fazer</h2><ComoFazer/></Cartao>` → mapa muscular → meta.
- [ ] **Step 3: `Treino`** — no `CartaoExercicio`, o `h2` vira `<button type="button" aria-label={`Como fazer ${nome}`}>` com o nome sublinhado discreto (`text-tinta` não; manter cor do título, sublinhado `decoration-dotted`), abre `acao.tipo = 'comoFazer'`; `Acao['tipo']` ganha `'comoFazer'`; novo `Painel` com `<Demonstracao>` + `<ComoFazer>`; o menu ganha o botão "Como fazer" no topo.
- [ ] **Step 4: `Exercicios.tsx` e `SeletorExercicio`** — nome leva a `/exercicios/:id` (na lista) e o ⓘ já existente continua; no seletor tocar no nome continua escolhendo o exercício (não mudar esse comportamento).
- [ ] **Step 5: e2e** em `e2e/fluxos.spec.ts`, teste "explicação do exercício durante o treino" (Review Focus 4): onboarding → iniciar treino → registrar série 1 → tocar `getByRole('button', { name: /^Como fazer / }).first()` → ver `getByRole('heading', { name: 'Como fazer' })` ou o texto da 1ª frase de posição → fechar painel → `Série 1 feita` continua marcada. Não depender do canvas (headless sem GPU).
- [ ] **Step 6: Verificar** — `npm test && npm run lint && npm run typecheck && npm run e2e`.
- [ ] **Step 7: Screenshot manual** dos 5 modelos (Playwright MCP, viewport Pixel 7, claro e escuro, quadros início/fim) e corrigir o que parecer errado antes dos lotes.
- [ ] **Step 8: Commit** — `feat: demonstração e como fazer nas telas de exercício e treino`.

### Tasks 7–11: Lotes de receitas

Cada task segue o passo a passo da Task 4 (regras de autoria idênticas), remove os nomes do lote de `PENDENTES`, roda `npx vitest run src/db/execucoes.test.ts`, tira screenshots início/fim de cada exercício do lote e corrige o que estiver anatomicamente errado, e faz um commit `feat: execução dos exercícios de <grupo>`.

- **Task 7 — Peito** (`peito.ts`, 9 restantes): Supino reto com halteres, Supino inclinado (banco 30–45°), Supino inclinado com halteres, Supino declinado (−15 a −30°), Supino reto na máquina, Crucifixo com halteres (cotovelos fixos ~20°, arco amplo), Voador (peck deck), Crossover (polias altas, mãos se encontram à frente do quadril), Flexão de braço (corpo reto: `apoio` de mãos e pés).
- **Task 8 — Costas** (`costas.ts`, 10 restantes): Puxada alta com triângulo, Barra fixa (`apoio` das mãos `xyz`, corpo sobe), Remada curvada (tronco ~45°, coluna neutra), Remada unilateral (serrote) (joelho e mão no banco), Remada baixa, Remada cavalinho, Remada articulada, Pulldown na polia (braços quase estendidos), Levantamento terra (barra perto das pernas, quadril e joelhos estendem juntos), Encolhimento com halteres (só ombros sobem).
- **Task 9 — Ombros e braços** (`ombros.ts` 6 + `bracos.ts` 12 restantes): Desenvolvimento com halteres / com barra / na máquina, Elevação lateral na polia, Elevação frontal, Crucifixo inverso; Rosca alternada (alternada, sem `simetria`), Rosca martelo (punho neutro), Rosca Scott, Rosca na polia, Rosca concentrada; Tríceps corda (abre a corda no fim), Tríceps pulley, Tríceps testa (só cotovelo move), Tríceps francês, Tríceps coice na polia, Mergulho nas paralelas (tronco levemente inclinado), Rosca punho (só punho move).
- **Task 10 — Pernas** (`pernas.ts` 17 restantes): Agachamento no Smith, Leg press 45° (joelhos até ~90°), Hack machine, Cadeira extensora, Agachamento búlgaro (pé de trás no banco), Afundo (alternado), Mesa flexora, Cadeira flexora, Flexora em pé, Stiff (joelhos semiflexionados fixos, quadril vai para trás), Elevação pélvica (costas apoiadas no banco, quadril sobe até alinhar), Cadeira abdutora, Glúteo na polia, Agachamento sumô (pés afastados, pontas para fora), Panturrilha em pé, Panturrilha sentado, Panturrilha no leg press.
- **Task 11 — Abdômen + fecho** (`abdomen.ts` 4): Abdominal supra (só tira as escápulas do chão), Abdominal na polia (ajoelhado), Elevação de pernas, Prancha (segundos) (pose estática com "respiração" sutil de 2 s, `isometrica: true`). Ao final `PENDENTES` vira `[]` e o teste passa a exigir cobertura total.

### Task 12: Documentação, revisão final e PR

**Files:**
- Modify: `src/pages/Ajuda.tsx` (seção do treino e de exercícios: "Toque no nome do exercício para ver o boneco fazendo o movimento e o passo a passo"), `src/pages/Sobre.tsx` (seção "Como o app usa este guia": demonstrações 3D e texto de execução em todos os exercícios prontos; anotações próprias nos criados por você), `AGENTS.md` (seção nova "Demonstração 3D": onde ficam receitas, regras de autoria, `validarReceita`, three.js só lazy em `components/`)

- [ ] **Step 1: Editar os três arquivos.**
- [ ] **Step 2: Verificação completa** — `npm test && npm run lint && npm run typecheck && npm run knip && npm run build && npm run e2e`; conferir no build que o chunk inicial não cresceu mais que ~5 KB gzip em relação à `main`.
- [ ] **Step 3: Commit** — `docs: explica as demonstrações na ajuda, no sobre e no AGENTS.md`.
- [ ] **Step 4: Push e PR** — `git push -u origin feat/boneco-3d`; `gh pr create` com `Closes #N`, o que mudou, como testar (abrir um exercício, girar, reduzir movimento, tema escuro), screenshots; esperar o `verificar` ficar verde; mesclar.
