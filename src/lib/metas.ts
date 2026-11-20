import type { AjusteTreino, Config, Objetivo, TipoExercicio } from '../db/tipos';

export interface Meta {
  repsMin: number;
  repsMax: number;
  descansoSeg: number;
}

/** Faixas de repetição do guia (Schoenfeld 2017). */
export const FAIXAS: Record<Objetivo, Record<TipoExercicio, [number, number]>> = {
  hipertrofia: { composto: [6, 10], isolado: [10, 15] },
  forca: { composto: [3, 6], isolado: [10, 15] },
};

/** No modo força, compostos descansam pelo menos 3 min (cargas ≥80% de 1RM). */
export const DESCANSO_MIN_FORCA = 180;

/**
 * Meta padrão de um exercício segundo o guia:
 * compostos 6–10 reps (3–6 no modo força) e 2–3 min de descanso;
 * isolados 10–15 reps e ~1,5 min.
 */
export function metaPadrao(
  tipo: TipoExercicio,
  config: Pick<Config, 'objetivo' | 'descansoCompostoSeg' | 'descansoIsoladoSeg'>,
): Meta {
  const [repsMin, repsMax] = FAIXAS[config.objetivo][tipo];
  let descansoSeg = tipo === 'composto' ? config.descansoCompostoSeg : config.descansoIsoladoSeg;
  if (config.objetivo === 'forca' && tipo === 'composto') descansoSeg = Math.max(descansoSeg, DESCANSO_MIN_FORCA);
  return { repsMin, repsMax, descansoSeg };
}

/**
 * Quantas séries fazer de um exercício planejado com `series` séries:
 * - deload (semana leve): metade, arredondando para cima (Coleman 2024);
 * - sono ruim: uma a menos nos exercícios com 3 ou mais (Lamon 2021);
 * - normal: o planejado.
 */
export function seriesComAjuste(series: number, ajuste: AjusteTreino): number {
  if (ajuste === 'deload') return Math.max(1, Math.ceil(series / 2));
  if (ajuste === 'sono') return series >= 3 ? series - 1 : series;
  return series;
}

export const ROTULO_AJUSTE: Record<AjusteTreino, string> = {
  normal: '',
  sono: 'Treino mais leve (noite ruim)',
  deload: 'Semana leve',
};

/** Duração da semana leve. */
export const DIAS_SEMANA_LEVE = 7;

/** Fim da semana leve começando agora: fim do dia, daqui a 7 dias. */
export function fimSemanaLeve(agora = Date.now()): number {
  const d = new Date(agora);
  d.setDate(d.getDate() + DIAS_SEMANA_LEVE - 1);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export const semanaLeveAtiva = (ate: number | null, agora = Date.now()) => ate != null && agora <= ate;
