import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconeVoltar, IconeX } from './Icones';

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

export function Botao({
  variante = 'secundario',
  grande,
  pequeno,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; grande?: boolean; pequeno?: boolean }) {
  const tamanho = grande
    ? 'min-h-14 rounded-controle px-5 text-[1.0625rem]'
    : pequeno
      ? 'min-h-11 rounded-full px-4 text-[0.9375rem]'
      : 'min-h-12 rounded-controle px-4 text-[1.0625rem]';
  return (
    <button
      type="button"
      className={`pressionavel inline-flex items-center justify-center gap-2 select-none disabled:opacity-40 ${tamanho} ${estilos[variante]} ${className}`}
      {...props}
    />
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
  useEffect(() => {
    if (!aberto) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [aberto, aoFechar]);

  if (!aberto) return null;
  return (
    <div className="fundo-entra fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={aoFechar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="sheet-entra pb-seguro vidro flex max-h-[90dvh] w-full max-w-lg flex-col rounded-t-[20px] shadow-flutuante"
        onClick={(e) => e.stopPropagation()}
      >
        <div aria-hidden="true" className="mx-auto mt-2 h-1.5 w-9 rounded-full bg-secundario/40" />
        <div className="flex items-center gap-2 px-4 pt-1 pb-2">
          <h2 className="flex-1 text-lg font-semibold tracking-tight">{titulo}</h2>
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
        <div className="overflow-y-auto px-4 pb-4">{children}</div>
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
  const btn = 'pressionavel flex size-11 items-center justify-center rounded-full bg-cartao-2 text-2xl text-primaria-texto disabled:opacity-30';
  return (
    <div className="flex items-center gap-2">
      <button type="button" aria-label={`Diminuir ${rotulo}`} className={btn} disabled={valor <= min} onClick={() => aoMudar(Math.max(min, valor - passo))}>
        −
      </button>
      <span className="min-w-14 text-center text-xl font-semibold tabular-nums" aria-label={rotulo}>
        {formatar(valor)}
      </span>
      <button type="button" aria-label={`Aumentar ${rotulo}`} className={btn} disabled={valor >= max} onClick={() => aoMudar(Math.min(max, valor + passo))}>
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
    <div role="radiogroup" aria-label={rotulo} className="relative grid rounded-[10px] bg-cartao-2 p-0.5" style={{ gridTemplateColumns: `repeat(${opcoes.length}, 1fr)` }}>
      <span
        aria-hidden="true"
        className="absolute inset-y-0.5 left-0.5 rounded-[8px] bg-polegar shadow-flutuante transition-transform duration-300 ease-mola"
        style={{ width: `calc((100% - 4px) / ${opcoes.length})`, transform: `translateX(${i * 100}%)` }}
      />
      {opcoes.map((o) => (
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

export function Carregando() {
  return <div className="p-10 text-center text-secundario">Carregando…</div>;
}
