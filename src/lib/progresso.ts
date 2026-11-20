import { umRmEpley } from './forca';

export interface SerieComData {
  exercicioId: number;
  sessaoId: number;
  inicio: number;
  carga: number;
  reps: number;
}

export interface PontoProgresso {
  sessaoId: number;
  data: number;
  cargaMax: number;
  umRm: number;
}

/** Um ponto por treino: maior carga e maior 1RM estimado daquele dia. */
export function serieTemporal(series: SerieComData[]): PontoProgresso[] {
  const porSessao = new Map<number, PontoProgresso>();
  for (const s of series) {
    if (s.carga <= 0 || s.reps <= 0) continue;
    const p = porSessao.get(s.sessaoId) ?? { sessaoId: s.sessaoId, data: s.inicio, cargaMax: 0, umRm: 0 };
    p.cargaMax = Math.max(p.cargaMax, s.carga);
    p.umRm = Math.max(p.umRm, umRmEpley(s.carga, s.reps));
    porSessao.set(s.sessaoId, p);
  }
  return [...porSessao.values()].sort((a, b) => a.data - b.data);
}

export interface RecordePessoal {
  exercicioId: number;
  cargaMax: number;
  repsNaCargaMax: number;
  dataCarga: number;
  umRm: number;
  data1rm: number;
  /** Mais repetições feitas numa série (útil para peso corporal). */
  maxReps: number;
}

/** Melhores marcas de cada exercício. Em empate, vale a mais antiga (quando foi conquistada). */
export function recordesPessoais(series: SerieComData[]): RecordePessoal[] {
  const mapa = new Map<number, RecordePessoal>();
  for (const s of [...series].sort((a, b) => a.inicio - b.inicio)) {
    if (s.reps <= 0) continue;
    const r = mapa.get(s.exercicioId) ?? {
      exercicioId: s.exercicioId,
      cargaMax: 0,
      repsNaCargaMax: 0,
      dataCarga: s.inicio,
      umRm: 0,
      data1rm: s.inicio,
      maxReps: 0,
    };
    if (s.carga > r.cargaMax || (s.carga === r.cargaMax && s.reps > r.repsNaCargaMax)) {
      r.cargaMax = s.carga;
      r.repsNaCargaMax = s.reps;
      r.dataCarga = s.inicio;
    }
    const rm = umRmEpley(s.carga, s.reps);
    if (rm > r.umRm) {
      r.umRm = rm;
      r.data1rm = s.inicio;
    }
    r.maxReps = Math.max(r.maxReps, s.reps);
    mapa.set(s.exercicioId, r);
  }
  return [...mapa.values()];
}

/** Quantidade de séries feitas por grupo muscular, da maior para a menor. */
export function seriesPorGrupo<G extends string>(
  series: { exercicioId: number }[],
  grupoDe: (exercicioId: number) => G | undefined,
): { grupo: G; series: number }[] {
  const contagem = new Map<G, number>();
  for (const s of series) {
    const g = grupoDe(s.exercicioId);
    if (g) contagem.set(g, (contagem.get(g) ?? 0) + 1);
  }
  return [...contagem.entries()]
    .map(([grupo, n]) => ({ grupo, series: n }))
    .sort((a, b) => b.series - a.series || a.grupo.localeCompare(b.grupo));
}

/**
 * Células do calendário de um mês (semana começando na segunda).
 * `null` são os espaços antes do dia 1.
 */
export function celulasDoMes(ano: number, mes: number): (number | null)[] {
  const primeiro = new Date(ano, mes, 1);
  const vazios = (primeiro.getDay() + 6) % 7;
  const totalDias = new Date(ano, mes + 1, 0).getDate();
  return [...Array<null>(vazios).fill(null), ...Array.from({ length: totalDias }, (_, i) => i + 1)];
}
