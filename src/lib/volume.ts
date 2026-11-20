import { GRUPOS_PRINCIPAIS, type GrupoMuscular } from '../db/tipos';

/** Mínimo e máximo de séries semanais por músculo (guia: Schoenfeld 2017; ACSM 2026). */
export const VOLUME_IDEAL_MIN = 10;
export const VOLUME_IDEAL_MAX = 20;
/** Séries com RIR igual ou acima disto não contam no volume efetivo (Robinson 2024). */
export const RIR_NAO_CONTA = 5;
/** Frequência mínima por músculo (Schoenfeld 2016). */
export const FREQUENCIA_MIN = 2;
/** Créditos de série num dia para considerar que o músculo foi treinado naquele dia. */
const CREDITO_MIN_DIA = 2;

export type FaixaVolume = 'baixo' | 'ideal' | 'alto';

export function faixaVolume(series: number): FaixaVolume {
  if (series < VOLUME_IDEAL_MIN) return 'baixo';
  if (series > VOLUME_IDEAL_MAX) return 'alto';
  return 'ideal';
}

export interface InfoMusculo {
  grupoMuscular: GrupoMuscular;
  secundarios: readonly GrupoMuscular[];
}

/** Quanto uma série vale para cada músculo: 1 no principal e 0,5 em cada secundário. */
export function creditos(ex: InfoMusculo): [GrupoMuscular, number][] {
  return [[ex.grupoMuscular, 1], ...ex.secundarios.filter((g) => g !== ex.grupoMuscular).map((g) => [g, 0.5] as [GrupoMuscular, number])];
}

/** Série conta no volume efetivo se o RIR não foi informado ou está abaixo de 5. */
export const serieEfetiva = (rir: number | null | undefined) => rir == null || rir < RIR_NAO_CONTA;

/**
 * Volume semanal de séries de trabalho por músculo, com crédito parcial para os secundários.
 * Ignora séries longe da falha (RIR ≥ 5) e exercícios desconhecidos.
 */
export function volumePorMusculo(
  series: { exercicioId: number; rir?: number | null }[],
  info: (exercicioId: number) => InfoMusculo | undefined,
): Map<GrupoMuscular, number> {
  const total = new Map<GrupoMuscular, number>();
  for (const s of series) {
    const ex = info(s.exercicioId);
    if (!ex || !serieEfetiva(s.rir)) continue;
    for (const [g, c] of creditos(ex)) total.set(g, (total.get(g) ?? 0) + c);
  }
  return total;
}

export interface DiaPlanejado {
  itens: { exercicioId: number; series: number }[];
}

export interface AnaliseMusculo {
  grupo: GrupoMuscular;
  /** Séries por semana (com crédito parcial dos secundários). */
  series: number;
  /** Vezes por semana em que o músculo é treinado. */
  frequencia: number;
  faixa: FaixaVolume;
  frequenciaBaixa: boolean;
}

/**
 * Analisa um programa: quantas séries e quantas vezes por semana cada músculo principal recebe.
 * O ciclo de dias é repetido `diasPorSemana` vezes por semana (ex.: 4 dias de programa feitos
 * 3x/semana → cada dia acontece 0,75x/semana).
 */
export function analisarPrograma(
  dias: DiaPlanejado[],
  diasPorSemana: number,
  info: (exercicioId: number) => InfoMusculo | undefined,
): AnaliseMusculo[] {
  const fator = dias.length ? diasPorSemana / dias.length : 0;
  const series = new Map<GrupoMuscular, number>();
  const diasComMusculo = new Map<GrupoMuscular, number>();
  for (const dia of dias) {
    const doDia = volumePorMusculo(
      dia.itens.flatMap((it) => Array.from({ length: it.series }, () => ({ exercicioId: it.exercicioId }))),
      info,
    );
    for (const [g, v] of doDia) {
      series.set(g, (series.get(g) ?? 0) + v);
      if (v >= CREDITO_MIN_DIA) diasComMusculo.set(g, (diasComMusculo.get(g) ?? 0) + 1);
    }
  }
  return GRUPOS_PRINCIPAIS.map((grupo) => {
    const s = arred((series.get(grupo) ?? 0) * fator);
    const f = arred((diasComMusculo.get(grupo) ?? 0) * fator);
    return { grupo, series: s, frequencia: f, faixa: faixaVolume(s), frequenciaBaixa: f < FREQUENCIA_MIN };
  });
}

const arred = (n: number) => Math.round(n * 10) / 10;
