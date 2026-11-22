import { type ButtonHTMLAttributes, type MouseEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconeCarregando, IconeVoltar, IconeX } from './Icones';
import { usePresenca } from './usePresenca';

/**
 * Componentes base no estilo iOS (Human Interface Guidelines). Cores, raios, sombras e
 * curvas vêm dos tokens em index.css; aqui só se combinam as classes semânticas.
 */

type Variante = 'primario' | 'secundario' | 'fantasma' | 'perigo';

const estilos: Record<Variante, string> = {
  /** Ação principal: azul sólido, texto branco. */
  primario: 'bg-primaria text-sobre-primaria font-semibold',
  /** Secundária: cinza translúcido, texto azul. */
  secundario: 'bg-cartao-2 text-primaria-texto font-medium',
  /** Texto/link: só o texto azul, sem fundo. */
  fantasma: 'bg-transparent text-primaria-texto',
  /** Destrutiva: vermelho. */
  perigo: 'bg-cartao-2 text-alerta-texto font-medium',
};

/** Indicador de atividade (gira; parado com "reduzir movimento"). */
export function Girando({ className = '' }: { className?: string }) {
  return <IconeCarregando width={20} height={20} className={`shrink-0 animate-spin ${className}`} />;
}

/** Só mostra o indicador se a ação passar disso (evita piscar em ações rápidas). */
const ATRASO_INDICADOR_MS = 150;

/**
 * Botão iOS. Se `onClick` devolver uma Promise (função async), o botão fica ocupado até
 * ela terminar: desabilitado (sem clique duplo), aria-busy e, depois de 150 ms, com o
 * indicador de atividade.
 */
export function Botao({
  variante = 'secundario',
  grande,
  pequeno,
  className = '',
  onClick,
  disabled,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; grande?: boolean; pequeno?: boolean }) {
  const [ocupado, setOcupado] = useState(false);
  const [mostrarIndicador, setMostrarIndicador] = useState(false);
  const montado = useRef(true);
  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  function clicar(e: MouseEvent<HTMLButtonElement>) {
    const r: unknown = onClick?.(e);
    if (!(r instanceof Promise)) return;
    setOcupado(true);
    const t = setTimeout(() => montado.current && setMostrarIndicador(true), ATRASO_INDICADOR_MS);
    void r.finally(() => {
      clearTimeout(t);
      if (!montado.current) return;
      setOcupado(false);
      setMostrarIndicador(false);
    });
  }

  const tamanho = grande
    ? 'min-h-14 rounded-controle px-5 text-[1.0625rem]'
    : pequeno
      ? 'min-h-11 rounded-full px-4 text-[0.9375rem]'
      : 'min-h-12 rounded-controle px-4 text-[1.0625rem]';
  return (
    <button
      type="button"
      className={`pressionavel inline-flex items-center justify-center gap-2 select-none disabled:opacity-40 ${tamanho} ${estilos[variante]} ${className}`}
      onClick={clicar}
      disabled={disabled || ocupado}
      aria-busy={ocupado || undefined}
      {...props}
    >
      {mostrarIndicador && <Girando />}
      {children}
    </button>
  );
}

/** Superfície em camada: branca sobre o fundo cinza (no escuro, cinza sobre preto). */
export function Cartao({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-cartao bg-cartao p-4 shadow-cartao ${className}`}>{children}</div>;
}

/** Cabeçalho de página com vidro. Com `voltar`, mostra a seta de voltar. */
export function Cabecalho({ titulo, voltar, acao }: { titulo: string; voltar?: boolean; acao?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <header className="pt-seguro vidro sticky top-0 z-20">
      <div className="flex min-h-14 items-center gap-1 px-4">
        {voltar && (
          <button
            type="button"
            aria-label="Voltar"
            onClick={() => navigate(-1)}
            className="pressionavel -ml-3 flex size-11 items-center justify-center rounded-full text-tinta"
          >
            <IconeVoltar width={28} height={28} />
          </button>
        )}
        <h1 className="flex-1 truncate text-[1.75rem] leading-tight font-semibold tracking-tight">{titulo}</h1>
        {acao}
      </div>
    </header>
  );
}

/** Sheet: sobe de baixo, com alça, fundo de vidro e curva de mola. */
export function Painel({
  aberto,
  aoFechar,
  titulo,
  children,
}: {
  aberto: boolean;
  aoFechar: () => void;
  titulo: string;
  children: ReactNode;
}) {
  const { montado, saindo } = usePresenca(aberto);
  // Durante a saída, mostra o último conteúdo (quem chama costuma limpar o estado ao fechar).
  const ultimo = useRef({ titulo, children });
  if (aberto) ultimo.current = { titulo, children };

  useEffect(() => {
    if (!aberto) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [aberto, aoFechar]);

  if (!montado) return null;
  const visivel = ultimo.current;
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: tocar fora da sheet fecha (atalho de mouse/toque); pelo teclado fecha com Esc ou o botão Fechar
    // biome-ignore lint/a11y/useKeyWithClickEvents: idem, Esc é tratado no useEffect acima
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/40 ${saindo ? 'fundo-sai pointer-events-none' : 'fundo-entra'}`}
      onClick={aoFechar}
    >
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: só impede que o toque dentro da sheet a feche */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={visivel.titulo}
        className={`pb-seguro vidro flex max-h-[90dvh] w-full max-w-lg flex-col rounded-t-[20px] shadow-flutuante ${saindo ? 'sheet-sai' : 'sheet-entra'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div aria-hidden="true" className="mx-auto mt-2 h-1.5 w-9 rounded-full bg-secundario/40" />
        <div className="flex items-center gap-2 px-4 pt-1 pb-2">
          <h2 className="flex-1 text-lg font-semibold tracking-tight">{visivel.titulo}</h2>
          <button
            type="button"
            aria-label="Fechar"
            onClick={aoFechar}
            className="pressionavel flex size-11 items-center justify-center rounded-full"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-cartao-2 text-secundario">
              <IconeX width={18} height={18} strokeWidth={2.25} />
            </span>
          </button>
        </div>
        <div className="overflow-y-auto px-4 pb-4">{visivel.children}</div>
      </div>
    </div>
  );
}

/** Campo numérico com botões − e + grandes. */
export function Contador({
  valor,
  aoMudar,
  min = 0,
  max = 999,
  passo = 1,
  rotulo,
  formatar = String,
}: {
  valor: number;
  aoMudar: (v: number) => void;
  min?: number;
  max?: number;
  passo?: number;
  rotulo: string;
  formatar?: (v: number) => string;
}) {
  const btn =
    'pressionavel flex size-11 items-center justify-center rounded-full bg-cartao-2 text-2xl text-primaria-texto disabled:opacity-30';
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={`Diminuir ${rotulo}`}
        className={btn}
        disabled={valor <= min}
        onClick={() => aoMudar(Math.max(min, valor - passo))}
      >
        −
      </button>
      <output className="min-w-14 text-center text-xl font-semibold tabular-nums" aria-label={rotulo}>
        {formatar(valor)}
      </output>
      <button
        type="button"
        aria-label={`Aumentar ${rotulo}`}
        className={btn}
        disabled={valor >= max}
        onClick={() => aoMudar(Math.min(max, valor + passo))}
      >
        +
      </button>
    </div>
  );
}

/** Switch no estilo iOS (verde quando ligado). */
export function Interruptor({ rotulo, ligado, aoMudar }: { rotulo: string; ligado: boolean; aoMudar: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={rotulo}
      onClick={() => aoMudar(!ligado)}
      className="flex min-h-11 min-w-16 shrink-0 items-center justify-center rounded-full"
    >
      <span className={`relative h-[31px] w-[51px] rounded-full transition-colors duration-300 ${ligado ? 'bg-concluido' : 'bg-trilho'}`}>
        <span
          className={`absolute top-0.5 left-0.5 size-[27px] rounded-full bg-white shadow-flutuante transition-transform duration-300 ease-mola ${
            ligado ? 'translate-x-5' : ''
          }`}
        />
      </span>
    </button>
  );
}

/** Controle segmentado no estilo iOS: o "polegar" desliza até a opção escolhida. */
export function Segmentado<T extends string | number>({
  opcoes,
  valor,
  aoMudar,
  rotulo,
}: {
  opcoes: readonly { valor: T; rotulo: ReactNode }[];
  valor: T;
  aoMudar: (v: T) => void;
  rotulo: string;
}) {
  const i = Math.max(
    0,
    opcoes.findIndex((o) => o.valor === valor),
  );
  return (
    <div
      role="radiogroup"
      aria-label={rotulo}
      className="relative grid rounded-[10px] bg-cartao-2 p-0.5"
      style={{ gridTemplateColumns: `repeat(${opcoes.length}, 1fr)` }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0.5 left-0.5 rounded-[8px] bg-polegar shadow-flutuante transition-transform duration-300 ease-mola"
        style={{ width: `calc((100% - 4px) / ${opcoes.length})`, transform: `translateX(${i * 100}%)` }}
      />
      {opcoes.map((o) => (
        // biome-ignore lint/a11y/useSemanticElements: controle segmentado no padrão ARIA radiogroup (botões estilizados, não inputs nativos)
        <button
          key={String(o.valor)}
          type="button"
          role="radio"
          aria-checked={o.valor === valor}
          onClick={() => aoMudar(o.valor)}
          className={`relative min-h-11 rounded-[8px] px-2 text-[0.9375rem] transition-colors ${o.valor === valor ? 'font-semibold text-texto' : 'text-texto/80'}`}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}

export function Vazio({ children }: { children: ReactNode }) {
  return <p className="px-4 py-10 text-center text-secundario">{children}</p>;
}

/** Bloco de skeleton: um retângulo que pulsa no lugar do conteúdo (parado com "reduzir movimento"). */
export function Esqueleto({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-controle bg-cartao-2 ${className}`} />;
}

/** Linhas de lista em skeleton (ex.: exercícios, histórico). */
export function EsqueletoLista({ linhas = 6 }: { linhas?: number }) {
  return (
    <div aria-hidden="true" className="divide-y divide-borda/70 rounded-cartao bg-cartao px-4 shadow-cartao">
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} className="flex min-h-14 flex-col justify-center gap-1.5 py-3">
          <Esqueleto className={`h-4 ${LARGURAS[i % LARGURAS.length]}`} />
          <Esqueleto className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

const LARGURAS = ['w-3/5', 'w-1/2', 'w-2/3', 'w-2/5'];

export type FormatoCarregando = 'cartoes' | 'lista' | 'treino' | 'grafico' | 'detalhe';

/**
 * Tela carregando: o cabeçalho real (se houver título) e um skeleton com o formato do
 * conteúdo, para a página não "pular" quando os dados chegam. Leitores de tela ouvem "Carregando".
 */
export function Carregando({ titulo, voltar, formato = 'cartoes' }: { titulo?: string; voltar?: boolean; formato?: FormatoCarregando }) {
  return (
    <>
      {titulo && <Cabecalho titulo={titulo} voltar={voltar} />}
      <div role="status" aria-busy="true" className="flex flex-col gap-4 px-4 pt-2 pb-8">
        <span className="sr-only">Carregando…</span>
        {formato === 'cartoes' && (
          <>
            <Esqueleto className="h-28 rounded-cartao" />
            <Esqueleto className="h-64 rounded-cartao" />
            <Esqueleto className="h-16 rounded-cartao" />
          </>
        )}
        {formato === 'lista' && (
          <>
            <Esqueleto className="h-12" />
            <EsqueletoLista />
          </>
        )}
        {formato === 'treino' && (
          <>
            <Esqueleto className="h-14" />
            {[0, 1].map((i) => (
              <div key={i} aria-hidden="true" className="flex flex-col gap-2 rounded-cartao bg-cartao p-4 shadow-cartao">
                <Esqueleto className="h-6 w-1/2" />
                <Esqueleto className="h-4 w-2/3" />
                {[0, 1, 2].map((j) => (
                  <Esqueleto key={j} className="h-12" />
                ))}
              </div>
            ))}
          </>
        )}
        {formato === 'grafico' && (
          <>
            <Esqueleto className="h-11" />
            <Esqueleto className="h-64 rounded-cartao" />
            <div className="grid grid-cols-2 gap-2">
              <Esqueleto className="h-20 rounded-cartao" />
              <Esqueleto className="h-20 rounded-cartao" />
            </div>
          </>
        )}
        {formato === 'detalhe' && (
          <>
            <Esqueleto className="h-5 w-1/3" />
            <Esqueleto className="h-8 w-2/3" />
            <div className="grid grid-cols-3 gap-2">
              <Esqueleto className="h-16 rounded-cartao" />
              <Esqueleto className="h-16 rounded-cartao" />
              <Esqueleto className="h-16 rounded-cartao" />
            </div>
            <Esqueleto className="h-40 rounded-cartao" />
          </>
        )}
      </div>
    </>
  );
}
