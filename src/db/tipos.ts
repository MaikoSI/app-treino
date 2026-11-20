export const GRUPOS_MUSCULARES = [
  'Peito',
  'Costas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Antebraço',
  'Quadríceps',
  'Posteriores',
  'Glúteos',
  'Panturrilha',
  'Abdômen',
] as const;
export type GrupoMuscular = (typeof GRUPOS_MUSCULARES)[number];

/** Grupos que recebem incremento de +5 kg na sugestão de progressão. */
export const GRUPOS_PERNA: readonly GrupoMuscular[] = ['Quadríceps', 'Posteriores', 'Glúteos', 'Panturrilha'];

export const EQUIPAMENTOS = ['Barra', 'Halteres', 'Máquina', 'Polia', 'Smith', 'Peso corporal', 'Outro'] as const;
export type Equipamento = (typeof EQUIPAMENTOS)[number];

export interface Exercicio {
  id: number;
  nome: string;
  grupoMuscular: GrupoMuscular;
  equipamento: Equipamento;
  personalizado: boolean;
}

export interface Programa {
  id: number;
  nome: string;
  diasPorSemana: number;
  ativo: boolean;
  criadoEm: number;
}

export interface ProgramaDia {
  id: number;
  programaId: number;
  ordem: number;
  nome: string;
}

export interface ProgramaExercicio {
  id: number;
  diaId: number;
  exercicioId: number;
  ordem: number;
  series: number;
  repsMin: number;
  repsMax: number;
  descansoSeg: number;
}

export interface Sessao {
  id: number;
  /** Dia do programa que originou a sessão (pode não existir mais). */
  programaDiaId: number | null;
  programaId: number | null;
  /** Cópia do nome do dia no momento em que o treino começou. */
  nomeDia: string;
  inicio: number;
  fim: number | null;
  concluida: boolean;
  observacao: string;
}

/**
 * Uma série da sessão. Guarda a meta (repsMin/repsMax/descanso) copiada do
 * programa quando o treino começou, para o histórico não mudar depois.
 */
export interface SessaoSerie {
  id: number;
  sessaoId: number;
  exercicioId: number;
  /** Posição do exercício dentro da sessão. */
  ordem: number;
  /** Número da série dentro do exercício (1, 2, 3...). */
  numero: number;
  carga: number;
  reps: number;
  rpe: number | null;
  concluida: boolean;
  repsMin: number;
  repsMax: number;
  descansoSeg: number;
}

export interface Config {
  chave: 'app';
  metaSemanal: number;
  descansoPadraoSeg: number;
  unidade: 'kg';
  /** Mostra o campo RPE (esforço percebido, 1–10) nas séries do treino. */
  mostrarRpe: boolean;
  tema: Tema;
  onboardingConcluido: boolean;
}

export type Tema = 'escuro' | 'claro';

export const CONFIG_PADRAO: Config = {
  chave: 'app',
  metaSemanal: 3,
  descansoPadraoSeg: 90,
  unidade: 'kg',
  mostrarRpe: false,
  tema: 'escuro',
  onboardingConcluido: false,
};
