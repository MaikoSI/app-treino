import { useEffect, useState } from 'react';

/** Duração da animação de saída (ms). Igual às classes *-sai em index.css. */
export const SAIDA_MS = 180;

function movimentoReduzido(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Mantém um elemento montado durante a animação de saída.
 * - `montado`: renderizar ou não;
 * - `saindo`: true nos SAIDA_MS finais, para aplicar a classe de saída.
 * Com "reduzir movimento", desmonta na hora.
 */
export function usePresenca(aberto: boolean): { montado: boolean; saindo: boolean } {
  const [montado, setMontado] = useState(aberto);

  useEffect(() => {
    if (aberto) {
      setMontado(true);
      return;
    }
    if (movimentoReduzido()) {
      setMontado(false);
      return;
    }
    const t = setTimeout(() => setMontado(false), SAIDA_MS);
    return () => clearTimeout(t);
  }, [aberto]);

  return { montado: aberto || montado, saindo: !aberto && montado };
}
