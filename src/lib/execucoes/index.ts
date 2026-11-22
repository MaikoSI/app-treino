/** Demonstrações de todos os exercícios prontos, indexadas pelo nome do exercício. */
import { ABDOMEN } from './abdomen';
import { BRACOS } from './bracos';
import { COSTAS } from './costas';
import { OMBROS } from './ombros';
import { PEITO } from './peito';
import { PERNAS } from './pernas';
import type { Catalogo, Execucao } from './tipos';

export type { Execucao, Explicacao } from './tipos';

const CATALOGO: Catalogo = { ...PEITO, ...COSTAS, ...OMBROS, ...BRACOS, ...PERNAS, ...ABDOMEN };

export const NOMES_COM_EXECUCAO = Object.keys(CATALOGO);

const prontas = new Map<string, Execucao>();

/** Demonstração do exercício (montada na primeira vez e guardada), ou undefined se não houver. */
export function execucaoDe(nome: string): Execucao | undefined {
  const montar = CATALOGO[nome];
  if (!montar) return undefined;
  if (!prontas.has(nome)) prontas.set(nome, montar());
  return prontas.get(nome);
}
