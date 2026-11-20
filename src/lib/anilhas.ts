export const ANILHAS_PADRAO = [25, 20, 15, 10, 5, 2.5, 1.25];

export interface ResultadoAnilhas {
  /** Anilhas de UM lado da barra, da maior para a menor. */
  porLado: number[];
  /** Quanto faltou para chegar na carga pedida (0 = exato). */
  resto: number;
  /** false quando a carga é menor que a barra. */
  valido: boolean;
}

/**
 * Calcula as anilhas de cada lado para chegar na carga total.
 * Algoritmo guloso: funciona para os pesos comerciais padrão.
 */
export function calcularAnilhas(
  total: number,
  barra = 20,
  disponiveis: number[] = ANILHAS_PADRAO,
): ResultadoAnilhas {
  if (!Number.isFinite(total) || total < barra) {
    return { porLado: [], resto: 0, valido: false };
  }
  // Trabalha em centésimos para evitar erro de ponto flutuante (1,25 kg).
  let lado = Math.round(((total - barra) / 2) * 100);
  const porLado: number[] = [];
  for (const anilha of [...disponiveis].sort((a, b) => b - a)) {
    const c = Math.round(anilha * 100);
    while (c > 0 && lado >= c) {
      porLado.push(anilha);
      lado -= c;
    }
  }
  return { porLado, resto: (lado * 2) / 100, valido: true };
}
