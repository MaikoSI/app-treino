import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconeVoltar, IconeX } from './Icones';

type Variante = 'primario' | 'secundario' | 'fantasma' | 'perigo';

const estilos: Record<Variante, string> = {
  primario: 'bg-primaria text-sobre-primaria font-semibold active:bg-primaria-ativo',
  secundario: 'bg-cartao-2 text-texto active:bg-borda',
  fantasma: 'bg-transparent text-secundario active:bg-cartao-2',
  perigo: 'bg-alerta/10 text-alerta-texto active:bg-alerta/20',
};

export function Botao({
  variante = 'secundario',
  grande,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; grande?: boolean }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 transition-colors select-none disabled:opacity-40 ${
        grande ? 'min-h-14 text-lg' : 'min-h-12 text-base'
      } ${estilos[variante]} ${className}`}
      {...props}
    />
  );
}

export function Cartao({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl bg-cartao p-4 ${className}`}>{children}</div>;
}

/** Cabeçalho de página. Com `voltar`, mostra a seta de voltar. */
export function Cabecalho({ titulo, voltar, acao }: { titulo: string; voltar?: boolean; acao?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <header className="pt-seguro sticky top-0 z-20 bg-fundo/95 backdrop-blur">
      <div className="flex min-h-14 items-center gap-2 px-4">
        {voltar && (
          <button
            type="button"
            aria-label="Voltar"
            onClick={() => navigate(-1)}
            className="-ml-2 flex size-12 items-center justify-center rounded-xl active:bg-cartao-2"
          >
            <IconeVoltar />
          </button>
        )}
        <h1 className="flex-1 truncate text-xl font-bold">{titulo}</h1>
        {acao}
      </div>
    </header>
  );
}

/** Painel que sobe de baixo (bottom sheet). */
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={aoFechar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="pb-seguro flex max-h-[90dvh] w-full max-w-lg flex-col rounded-t-3xl bg-cartao"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-borda px-4 py-2">
          <h2 className="flex-1 text-lg font-bold">{titulo}</h2>
          <button
            type="button"
            aria-label="Fechar"
            onClick={aoFechar}
            className="flex size-12 items-center justify-center rounded-xl active:bg-cartao-2"
          >
            <IconeX />
          </button>
        </div>
        <div className="overflow-y-auto p-4">{children}</div>
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
  const btn = 'flex size-12 items-center justify-center rounded-xl bg-cartao-2 text-2xl active:bg-borda disabled:opacity-30';
  return (
    <div className="flex items-center gap-2">
      <button type="button" aria-label={`Diminuir ${rotulo}`} className={btn} disabled={valor <= min} onClick={() => aoMudar(Math.max(min, valor - passo))}>
        −
      </button>
      <span className="min-w-14 text-center text-lg font-semibold tabular-nums" aria-label={rotulo}>
        {formatar(valor)}
      </span>
      <button type="button" aria-label={`Aumentar ${rotulo}`} className={btn} disabled={valor >= max} onClick={() => aoMudar(Math.min(max, valor + passo))}>
        +
      </button>
    </div>
  );
}

export function Vazio({ children }: { children: ReactNode }) {
  return <p className="px-4 py-10 text-center text-secundario">{children}</p>;
}

export function Carregando() {
  return <div className="p-10 text-center text-secundario">Carregando…</div>;
}
