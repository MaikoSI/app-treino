import type { ComponentType, ReactNode, SVGProps } from 'react';
import { Link } from 'react-router-dom';
import {
  IconeAjustes,
  IconeCalendario,
  IconeCheck,
  IconeGrafico,
  IconeHalter,
  IconeInicio,
  IconeRelogio,
  IconeTrofeu,
} from '../components/Icones';
import { Cabecalho } from '../components/ui';

type Icone = ComponentType<SVGProps<SVGSVGElement>>;

/**
 * "Como usar o app": guia prático de cada função, em linguagem simples.
 * Assim como a página Sobre, deve acompanhar o que o app realmente faz: ao mudar uma função, atualize aqui.
 */
export default function Ajuda() {
  return (
    <>
      <Cabecalho titulo="Como usar o app" voltar />
      <div className="flex flex-col gap-4 px-4 pb-10">
        <header>
          <h2 className="text-3xl font-semibold leading-tight">O app em 4 passos</h2>
          <p className="mt-2 text-secundario">Você não precisa decorar nada: monte o programa uma vez e depois é só abrir e treinar.</p>
        </header>

        <ol className="flex flex-col gap-2">
          <Passo n={1} titulo="Escolha um programa" link={{ para: '/programas/modelos', rotulo: 'Ver modelos prontos' }}>
            Em <strong>Programas</strong>, pegue um modelo pronto para quantos dias você treina por semana, ou monte o seu.
          </Passo>
          <Passo n={2} titulo="Inicie o treino" link={{ para: '/', rotulo: 'Ir para o Início' }}>
            No <strong>Início</strong> aparece o próximo treino do programa. Toque em <strong>Iniciar treino</strong>.
          </Passo>
          <Passo n={3} titulo="Marque cada série">
            Ajuste o peso e as repetições e toque no ✓. O descanso começa sozinho.
          </Passo>
          <Passo n={4} titulo="Veja sua evolução" link={{ para: '/progresso', rotulo: 'Ir para Progresso' }}>
            Ao finalizar, o treino vai para o <strong>Histórico</strong> e os gráficos aparecem em <strong>Progresso</strong>.
          </Passo>
        </ol>

        <nav aria-label="Ir para um assunto" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {SECOES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => abrirSecao(s.id)}
              className="min-h-12 shrink-0 rounded-full bg-cartao-2 px-4 text-sm text-secundario active:bg-borda"
            >
              {s.curto}
            </button>
          ))}
        </nav>

        <Secao id="inicio" titulo="Tela Início" Icone={IconeInicio}>
          <Item titulo="Meta da semana">
            As barrinhas mostram quantos treinos você fez nesta semana (de segunda a domingo). Quando você bate a meta várias semanas
            seguidas, aparece o 🔥 com a sequência. A meta muda em Ajustes.
          </Item>
          <Item titulo="Próximo treino">
            O app segue a ordem dos dias do programa: depois do Treino A vem o B, e assim por diante. Quer fazer outro dia? Toque em{' '}
            <strong>Fazer outro treino</strong> (também dá para fazer um treino livre, sem programa).
          </Item>
          <Item titulo="Treino em andamento">
            Se você fechar o app no meio do treino, nada se perde. Ao abrir de novo, toque em <strong>Continuar treino</strong>.
          </Item>
          <Item titulo="Semana leve">
            Quando o cansaço acumular, toque em <strong>Fazer uma semana leve</strong>: por 7 dias os treinos vêm com metade das séries.
          </Item>
        </Secao>

        <Secao id="programas" titulo="Programas" Icone={IconeHalter}>
          <Item titulo="Modelos prontos">
            Divisões de 2 a 6 dias, já montadas seguindo o guia científico. O modelo escolhido vira o programa ativo.
          </Item>
          <Item titulo="Montar ou editar">
            Toque em <strong>Editar</strong> num programa para mudar o nome, adicionar dias, adicionar exercícios e definir séries,
            repetições e descanso. As setas mudam a ordem.
          </Item>
          <Item titulo="Volume por semana">
            Ao editar, o app mostra quantas séries cada músculo recebe na semana e avisa se algum ficou abaixo de 10, acima de 20 ou
            treinado só 1 vez.
          </Item>
          <Item titulo="Programa ativo">
            É o programa que aparece no Início. Só um fica ativo por vez; troque em <strong>Tornar este o programa ativo</strong>.
          </Item>
          <Item titulo="Pode mexer sem medo">Editar ou apagar um programa não muda os treinos que você já fez.</Item>
        </Secao>

        <Secao id="exercicios" titulo="Exercícios e músculos" Icone={IconeHalter}>
          <Item titulo="Que músculo esse exercício trabalha?">
            Em Ajustes → <strong>Biblioteca de exercícios</strong>, toque num exercício. O desenho do corpo mostra o músculo principal em
            verde forte e os que ajudam em verde claro, de frente e de costas.
          </Item>
          <Item titulo="Na hora de escolher">
            Ao adicionar ou trocar um exercício, toque no <strong>ⓘ</strong> ao lado do nome para ver os músculos antes de escolher.
          </Item>
          <Item titulo="Meta sugerida">
            A página do exercício mostra as repetições e o descanso sugeridos para ele, conforme seu objetivo.
          </Item>
          <Item titulo="Criar o seu">
            Não achou? Use <strong>+ Criar exercício próprio</strong> e escolha o grupo muscular e o equipamento.
          </Item>
        </Secao>

        <Secao id="treino" titulo="Durante o treino" Icone={IconeCheck}>
          <ExemploSerie />
          <Item titulo="Peso e repetições">
            Já vêm preenchidos com o que você fez da última vez. Mude se precisar e toque no ✓ quando terminar a série.
          </Item>
          <Item titulo="Sugestão de carga">
            Quando você chega ao máximo de repetições em todas as séries, aparece <strong>Tente +2,5 kg</strong> (+5 kg em exercícios de
            perna). O botão <strong>Usar</strong> já coloca a carga nova.
          </Item>
          <Item titulo="Mais ou menos séries">
            Use <strong>+ Série</strong> e <strong>− Série</strong> embaixo de cada exercício. Séries não marcadas são descartadas ao
            finalizar.
          </Item>
          <Item titulo="Menu ⋮ do exercício">
            Ver os músculos trabalhados, calculadora de anilhas (quanto colocar de cada lado da barra), trocar por outro exercício ou
            remover.
          </Item>
          <Item titulo="Adicionar exercício">Botão no fim da lista, para incluir algo que não estava no programa.</Item>
          <Item titulo="Recordes">
            Quando você bate seu melhor peso ou seu melhor 1RM estimado, o app comemora na hora. Só conta a partir da segunda vez que você
            faz o exercício.
          </Item>
          <Item titulo="Finalizar">
            Toque em <strong>Finalizar</strong> no topo, escreva uma observação se quiser e veja o resumo. Para jogar o treino fora, use{' '}
            <strong>Descartar treino</strong>.
          </Item>
        </Secao>

        <Secao id="descanso" titulo="Timer de descanso" Icone={IconeRelogio}>
          <Item titulo="Começa sozinho">
            Ao marcar uma série, a barra de descanso aparece embaixo, com o tempo definido para aquele exercício.
          </Item>
          <Item titulo="Ajustar">
            Use <strong>−15s</strong> e <strong>+15s</strong>, ou pule o descanso. No fim, o celular vibra (no iPhone a vibração não
            funciona).
          </Item>
          <Item titulo="Quanto descansar">
            Compostos (supino, agachamento, remada): cerca de 2 a 3 min. Isolados (rosca, elevação lateral): 1 a 1,5 min. Mude o padrão em
            Ajustes.
          </Item>
        </Secao>

        <Secao id="historico" titulo="Histórico" Icone={IconeCalendario}>
          <Item titulo="Calendário">Os dias com treino ficam marcados. Use as setas para mudar de mês.</Item>
          <Item titulo="Detalhes">Toque num treino para ver todas as séries, cargas e a observação que você escreveu.</Item>
        </Secao>

        <Secao id="progresso" titulo="Progresso e recordes" Icone={IconeGrafico}>
          <Item titulo="Séries por músculo">
            Quantas séries cada músculo recebeu na semana. O ideal fica entre 10 e 20. Use as setas para ver outras semanas.
          </Item>
          <Item titulo="Gráfico do exercício">
            Toque num exercício para ver a evolução do peso máximo (linha contínua) e do 1RM estimado (linha tracejada), além dos seus
            recordes.
          </Item>
          <Item titulo="O que é 1RM estimado">
            O peso que você conseguiria levantar uma única vez, calculado a partir do peso e das repetições que você fez. Serve para
            comparar séries diferentes.
          </Item>
        </Secao>

        <Secao id="corpo" titulo="Peso e nutrição" Icone={IconeTrofeu}>
          <Item titulo="Registrar o peso">
            Em Ajustes → <strong>Peso, proteína e suplementos</strong>. Pese-se de manhã, sempre do mesmo jeito. O app compara a média de
            cada semana, porque o peso de um dia só varia muito.
          </Item>
          <Item titulo="Ritmo e proteína">
            Com o objetivo escolhido (ganhar, manter ou perder), o app mostra se o ritmo está dentro da meta e quanta proteína comer por
            dia.
          </Item>
        </Secao>

        <Secao id="ajustes" titulo="Ajustes" Icone={IconeAjustes}>
          <Item titulo="Objetivo">
            Hipertrofia (músculo) ou Força. Muda as repetições e o descanso sugeridos para os exercícios novos. Para aplicar a um programa
            que já existe, toque em <strong>Aplicar ao programa ativo</strong>.
          </Item>
          <Item titulo="RIR (opcional)">
            “Repetições em reserva”: quantas repetições ainda daria para fazer. 0 = não conseguiria mais nenhuma. Ligue para registrar em
            cada série.
          </Item>
          <Item titulo="Pergunta do sono">
            Antes do treino o app pergunta como você dormiu. Se foi mal, tira uma série dos exercícios com 3 ou mais.
          </Item>
          <Item titulo="Aparência">Automático (segue o modo claro ou escuro do aparelho), claro ou escuro.</Item>
          <Item titulo="Biblioteca de exercícios">Todos os exercícios, com os músculos que cada um trabalha.</Item>
        </Secao>

        <Secao id="dados" titulo="Seus dados e backup" Icone={IconeCheck}>
          <p className="rounded-xl bg-alerta/10 px-3 py-2 text-sm text-alerta-texto">
            Tudo fica <strong>só neste aparelho</strong>. Não existe conta nem nuvem.
          </p>
          <Item titulo="Faça backup">
            Em Ajustes → <strong>Exportar backup</strong>. Guarde o arquivo fora do celular (e-mail, Drive, computador).
          </Item>
          <Item titulo="Trocar de celular">
            Exporte no aparelho antigo e use <strong>Importar backup</strong> no novo. A importação substitui os dados do aparelho.
          </Item>
          <Item titulo="Quando os dados se perdem">
            Limpar os dados do navegador, desinstalar o app ou usar aba anônima apaga tudo que não estiver num backup.
          </Item>
        </Secao>

        <Secao id="instalar" titulo="Instalar no celular" Icone={IconeInicio}>
          <Item titulo="Android (Chrome)">
            Menu ⋮ do navegador → <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>.
          </Item>
          <Item titulo="iPhone (Safari)">
            Botão de compartilhar → <strong>Adicionar à Tela de Início</strong>.
          </Item>
          <Item titulo="Por que instalar">
            Abre como um app, funciona sem internet e o navegador tende a guardar seus dados com mais segurança.
          </Item>
          <Item titulo="Nova versão disponível">
            Quando o app for atualizado, aparece um aviso. Atualize quando quiser; ele nunca recarrega no meio do treino.
          </Item>
        </Secao>

        <Link
          to="/sobre"
          className="flex min-h-12 items-center justify-center rounded-cartao vidro-fino px-4 text-center font-semibold text-primaria-texto"
        >
          Por que o app sugere isso? Veja a base científica
        </Link>
      </div>
    </>
  );
}

const SECOES = [
  { id: 'inicio', curto: 'Início' },
  { id: 'programas', curto: 'Programas' },
  { id: 'exercicios', curto: 'Exercícios' },
  { id: 'treino', curto: 'Treino' },
  { id: 'descanso', curto: 'Descanso' },
  { id: 'historico', curto: 'Histórico' },
  { id: 'progresso', curto: 'Progresso' },
  { id: 'corpo', curto: 'Peso' },
  { id: 'ajustes', curto: 'Ajustes' },
  { id: 'dados', curto: 'Backup' },
  { id: 'instalar', curto: 'Instalar' },
];

/** Abre a seção e rola até ela. (Âncoras com # não servem: o HashRouter usa o # para a rota.) */
function abrirSecao(id: string) {
  const el = document.getElementById(`ajuda-${id}`);
  if (!(el instanceof HTMLDetailsElement)) return;
  el.open = true;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function Passo({ n, titulo, link, children }: { n: number; titulo: string; link?: { para: string; rotulo: string }; children: ReactNode }) {
  return (
    <li className="flex gap-3 rounded-cartao vidro-fino p-4">
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primaria font-semibold text-sobre-primaria"
      >
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          <span className="sr-only">Passo {n}: </span>
          {titulo}
        </p>
        <p className="mt-0.5 text-sm text-secundario">{children}</p>
        {link && (
          <Link to={link.para} className="mt-1 inline-flex min-h-12 items-center text-sm font-semibold text-primaria-texto">
            {link.rotulo}
          </Link>
        )}
      </div>
    </li>
  );
}

function Secao({ id, titulo, Icone, children }: { id: string; titulo: string; Icone: Icone; children: ReactNode }) {
  return (
    <details id={`ajuda-${id}`} className="group scroll-mt-20 rounded-cartao vidro-fino">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-cartao-2 text-primaria-texto">
          <Icone width={20} height={20} />
        </span>
        <span className="flex-1">{titulo}</span>
        <span aria-hidden="true" className="text-secundario transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <ul className="flex flex-col gap-3 px-4 pb-4 leading-relaxed">{children}</ul>
    </details>
  );
}

function Item({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <li className="text-sm">
      <p className="font-semibold">{titulo}</p>
      <p className="text-secundario">{children}</p>
    </li>
  );
}

/** Desenho estático de uma linha de série, igual à do treino, para a pessoa reconhecer onde tocar. */
function ExemploSerie() {
  const celula = 'flex min-h-10 items-center justify-center rounded-lg bg-cartao-2 font-semibold tabular-nums';
  return (
    <li aria-hidden="true" className="rounded-xl border border-borda p-3">
      <div className="grid grid-cols-[2rem_1fr_1fr_3rem] items-center gap-2 text-center text-xs text-secundario">
        <span>Série</span>
        <span>kg</span>
        <span>Reps</span>
        <span>Feita</span>
      </div>
      <div className="mt-1 grid grid-cols-[2rem_1fr_1fr_3rem] items-center gap-2 text-center">
        <span className="text-secundario">1</span>
        <span className={celula}>60</span>
        <span className={celula}>10</span>
        <span className="flex min-h-10 items-center justify-center rounded-lg bg-concluido text-sobre-concluido">
          <IconeCheck width={20} height={20} />
        </span>
      </div>
      <p className="mt-2 text-xs text-secundario">Toque no ✓ para marcar a série como feita. O descanso começa na hora.</p>
    </li>
  );
}
