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

/**
 * Grupos que recebem alertas de volume (10–20 séries) e frequência (2x/semana).
 * Panturrilha, abdômen e antebraço são complementares: aparecem na contagem, sem alerta.
 */
export const GRUPOS_PRINCIPAIS: readonly GrupoMuscular[] = [
  'Peito',
  'Costas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Quadríceps',
  'Posteriores',
  'Glúteos',
];

/** Grupos que recebem incremento de +5 kg na sugestão de progressão. */
export const GRUPOS_PERNA: readonly GrupoMuscular[] = ['Quadríceps', 'Posteriores', 'Glúteos', 'Panturrilha'];

export const EQUIPAMENTOS = ['Barra', 'Halteres', 'Máquina', 'Polia', 'Smith', 'Peso corporal', 'Outro'] as const;
export type Equipamento = (typeof EQUIPAMENTOS)[number];

/** Composto: vários músculos e cargas altas. Isolado: um músculo principal. */
export type TipoExercicio = 'composto' | 'isolado';

export interface Exercicio {
  id: number;
  nome: string;
  grupoMuscular: GrupoMuscular;
  /** Músculos que o exercício também trabalha (contam meia série no volume). */
  secundarios: GrupoMuscular[];
  tipo: TipoExercicio;
  equipamento: Equipamento;
  personalizado: boolean;
  /** Anotações de execução escritas pelo usuário (exercícios criados por ele). */
  comoFazer?: string;
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

/**
 * Como o treino foi feito:
 * - normal;
 * - sono: depois de uma noite ruim, uma série a menos nos exercícios com 3 ou mais;
 * - deload: semana leve, metade das séries.
 */
export type AjusteTreino = 'normal' | 'sono' | 'deload';

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
  /** Ausente em treinos antigos (= normal). */
  ajuste?: AjusteTreino;
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
  /** Repetições em reserva (0 = falha … 5 = "5 ou mais"). Opcional. */
  rir: number | null;
  concluida: boolean;
  repsMin: number;
  repsMax: number;
  descansoSeg: number;
}

/** Registro de peso corporal (no máximo um por dia). */
export interface RegistroPeso {
  id: number;
  /** Data do registro (meio-dia local, para não mudar de dia com fuso). */
  data: number;
  kg: number;
}

export type Objetivo = 'hipertrofia' | 'forca';
export type ObjetivoPeso = 'ganhar' | 'manter' | 'perder';
/** 'sistema' segue o modo claro/escuro do aparelho. */
export type Tema = 'sistema' | 'claro' | 'escuro';

export interface Config {
  chave: 'app';
  metaSemanal: number;
  /** Descanso padrão de exercícios compostos e isolados (guia: 2–3 min e ~1,5 min). */
  descansoCompostoSeg: number;
  descansoIsoladoSeg: number;
  /** Hipertrofia: compostos 6–10 reps. Força: compostos 3–6 reps e mais descanso. */
  objetivo: Objetivo;
  unidade: 'kg';
  /** Mostra o campo RIR (repetições em reserva) nas séries do treino. */
  mostrarRir: boolean;
  /** Pergunta como foi o sono antes de começar o treino. */
  checkinSono: boolean;
  /** Fim da semana leve (deload) ativa, ou null. */
  semanaLeveAte: number | null;
  objetivoPeso: ObjetivoPeso;
  tema: Tema;
  onboardingConcluido: boolean;
}

export const CONFIG_PADRAO: Config = {
  chave: 'app',
  metaSemanal: 3,
  descansoCompostoSeg: 150,
  descansoIsoladoSeg: 90,
  objetivo: 'hipertrofia',
  unidade: 'kg',
  mostrarRir: false,
  checkinSono: true,
  semanaLeveAte: null,
  objetivoPeso: 'manter',
  tema: 'sistema',
  onboardingConcluido: false,
};
