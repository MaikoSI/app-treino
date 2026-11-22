# Boneco 3D e explicação da execução — design

Data: 2026-11-22

## Por quê

O app vai ser usado por pessoas leigas na academia. Quem lê "Supino inclinado" no treino e não conhece o exercício não tem como executá-lo. Cada exercício precisa mostrar **como se faz**: uma animação clara do movimento e um texto curto com ângulo, pegada e trajeto.

## Objetivos

- **Todos os 63 exercícios prontos** (`src/db/exerciciosIniciais.ts`) têm um boneco 3D animado executando o movimento, com o equipamento, e uma explicação da execução.
- Ao tocar no **nome do exercício** (no treino em andamento, na lista de exercícios, no seletor e no editor de programa), a pessoa chega a essa explicação.
- O movimento é **correto e fácil de entender**: amplitude completa, ritmo didático (subida e descida visíveis, pausa curta nos extremos), câmera inicial escolhida por exercício para mostrar melhor o ângulo e o trajeto.
- A pessoa pode **girar o boneco com o dedo** (e voltar à vista inicial).
- Funciona **offline** (nada vem da internet em tempo de execução).

## Não-objetivos

- Não é um boneco realista com músculos/rosto; é um manequim estilizado (formas arredondadas, luz e sombra).
- Sem áudio, sem vídeo, sem imagens de terceiros.
- Exercícios criados pelo usuário não ganham animação (não há como gerar a pose automaticamente).

## Anti-objetivos (seria fracasso mesmo funcionando)

- Movimento errado ou ambíguo (ex.: cotovelo abrindo 90° no supino, coluna arredondada no terra, joelho passando para dentro no agachamento).
- Deixar o app pesado: a biblioteca 3D não pode entrar no pacote inicial nem atrasar a abertura do treino.
- Travar ou esquentar o celular: a animação para quando sai da tela ou a aba fica oculta.
- Texto técnico demais para leigo.

## Restrições

- Regras do `AGENTS.md`: `lib/` puro e testado, tokens de cor (nada de hex nos componentes; o 3D lê as cores do tema em tempo de execução como `corDoTema` faz nos gráficos), `lazy()` + esqueleto de carregamento, `prefers-reduced-motion`, textos em pt-BR, identificadores em português, atualizar `Ajuda.tsx` e `Sobre.tsx`.
- Exercícios prontos nunca são renomeados nem editados pelo app (só `add` no seletor). O **nome** é a chave estável para ligar exercício → animação/explicação, como `divisoes.ts` já faz.

## Abordagens consideradas

1. **Manequim 3D real (three.js) — escolhida pelo dono.** Volume, luz, sombra, rotação com o dedo, câmera por exercício. Custo: ~150 KB gzip num chunk separado, baixado só ao abrir um exercício.
2. **Desenho 2D sombreado (SVG).** Mais leve, mas vista fixa; esconde parte de movimentos como crucifixo e elevação lateral. Descartada.
3. (Já descartada antes) fotos de domínio público / imagens comerciais: o dono preferiu o boneco; imagens comerciais têm direitos e o repositório é público.

## Design

### Dados (puros, em `src/lib/execucao/`)

- **Esqueleto** fixo do manequim: quadril (raiz), coluna, pescoço/cabeça, ombros, cotovelos, punhos, quadris, joelhos, tornozelos. Proporções humanas médias.
- **Pose** = rotações das articulações (graus, por eixo) + posição/inclinação da raiz.
- **Receita do exercício** (`ReceitaExecucao`):
  - `cena`: equipamento a montar (banco reto/inclinado 30–45°/declinado, barra, halteres, polia com cabo e acessório — corda, barra, triângulo, puxador —, máquinas simplificadas: leg press 45°, extensora, flexoras, hack, Smith, Scott, voador, abdutora, paralelas, barra fixa, panturrilha) e onde o peso fica preso (mão, pé, etc.).
  - `quadros`: poses-chave com tempo (início → fim → início), com pausa curta nos extremos; descida ~2 s, subida ~1 s.
  - `camera`: ângulo e distância iniciais.
  - `lados`: movimento alternado/unilateral quando for o caso (rosca alternada, serrote, búlgaro, afundo).
  - Poses reaproveitáveis (deitado no banco, em pé, sentado na máquina) e receitas parecidas derivam de uma base, para manter coerência.
- **Explicação** (`Explicacao`), em passos curtos para leigo: `posicao` (ajuste do banco/máquina, pegada, pés), `execucao` (trajeto da ida e da volta, ângulos: ex. "cotovelos a ~45° do tronco"), `respiracao`, `erros` (2–3 erros comuns) e `dica` opcional.
- Mapa `EXECUCOES: Record<nomeDoExercicio, { receita, explicacao }>`.
- Função pura de interpolação: `poseNoTempo(receita, t)` (interpolação suave entre quadros; com movimento reduzido, devolve só os quadros extremos).

### Testes (Vitest)

- Todo nome de `EXERCICIOS_INICIAIS` tem receita e explicação, e não há chave sobrando.
- Cada receita tem ≥2 quadros, tempos crescentes, ângulos dentro dos limites anatômicos de cada articulação (ex.: joelho 0–150°, cotovelo 0–150°), e o peso continua preso à mão/pé durante o loop.
- Explicações com todos os campos preenchidos e sem texto vazio.
- `poseNoTempo` interpola corretamente e é contínua no loop.

### Interface

- Componente `components/Boneco3D.tsx` **lazy** (three.js só nele): canvas com o manequim e a cena, cores lidas do tema (pele/corpo neutros, equipamento em cinza, **peso em destaque**, músculo principal com leve tinta de `--destaque`), muda junto com claro/escuro. Arrastar gira; botão "Ver de novo" volta à câmera inicial; botão pausar/reproduzir. Para de animar fora da tela (`IntersectionObserver`) ou com a aba oculta. Sem WebGL: mostra só o texto, com um aviso discreto.
- `ExercicioDetalhe` ganha, no topo, o boneco (área ampla, ~4:3) e logo abaixo o cartão **"Como fazer"** com os passos; mapa muscular e meta seguem abaixo. Enquanto carrega: esqueleto no formato do canvas.
- **Tocar no nome**: no cartão do exercício do treino em andamento, o nome vira um botão que abre a explicação em painel (bottom sheet) sem sair do treino (o treino não pode ser interrompido). Na lista de exercícios e no seletor, o nome leva à página do exercício (o seletor já tem o ⓘ).
- `prefers-reduced-motion`: sem animação contínua; mostra pose inicial e final lado a lado ("início" / "fim").
- Acessibilidade: canvas com `role="img"` e `aria-label` descrevendo o movimento; o texto é a fonte principal para leitor de tela.

### Exercícios criados pelo usuário

- Sem boneco; a página mostra o mapa muscular e um campo opcional **"Como fazer (suas anotações)"**, editável na página do exercício. Novo campo opcional `comoFazer?: string` em `Exercicio` (opcional, não exige migração nem entra em `CAMPOS` obrigatórios do backup; o backup já leva o registro inteiro).

### Documentação e e2e

- `Ajuda.tsx`: explicar "toque no nome do exercício para ver como fazer".
- `Sobre.tsx`, seção "Como o app usa este guia": mencionar as demonstrações.
- e2e: no fluxo de treino, tocar no nome abre o painel com "Como fazer" (sem depender de WebGL no headless).

## Escolhas que ficaram com o construtor (decididas por mim, podem ser corrigidas)

- three.js puro (sem react-three-fiber) para ter o menor chunk e controle direto do loop.
- Manequim feito de cápsulas/esferas geradas em código, sem arquivo de modelo.
- Ordem de entrega: base (esqueleto, cena, renderização, telas) com ~5 exercícios-modelo, revisão visual, depois o restante em lotes por grupo muscular.
- Cada lote é conferido por screenshots dos quadros-chave (Playwright) antes de seguir.
