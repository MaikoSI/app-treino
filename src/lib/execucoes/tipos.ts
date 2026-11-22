import type { ReceitaExecucao } from '../execucao';

/** Passo a passo para leigo, em frases curtas na segunda pessoa. */
export interface Explicacao {
  /** Ajuste do banco/máquina, pegada, pés. */
  posicao: string[];
  /** Trajeto da ida e da volta, com ângulos. */
  execucao: string[];
  respiracao: string;
  erros: string[];
  dica?: string;
}

export interface Execucao {
  receita: ReceitaExecucao;
  explicacao: Explicacao;
  /** Uma frase descrevendo a animação (texto alternativo para leitor de tela). */
  descricao: string;
}

/** Receitas são montadas sob demanda (a IK custa alguns milissegundos). */
export type Catalogo = Record<string, () => Execucao>;
