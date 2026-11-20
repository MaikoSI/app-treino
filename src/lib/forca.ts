import { GRUPOS_PERNA, type GrupoMuscular } from '../db/tipos';

/** Arredonda para 1 casa decimal. */
const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * 1RM estimado pela fórmula de Epley: carga × (1 + reps / 30).
 * Com 1 repetição, o 1RM é a própria carga.
 */
export function umRmEpley(carga: number, reps: number): number {
  if (carga <= 0 || reps <= 0) return 0;
  if (reps === 1) return r1(carga);
  return r1(carga * (1 + reps / 30));
}

export interface SerieFeita {
  exercicioId: number;
  carga: number;
  reps: number;
}

/** Volume (kg) = soma de carga × reps. */
export function volumeTotal(series: Pick<SerieFeita, 'carga' | 'reps'>[]): number {
  return r1(series.reduce((soma, s) => soma + Math.max(0, s.carga) * Math.max(0, s.reps), 0));
}

export interface SerieParaProgressao {
  carga: number;
  reps: number;
  concluida: boolean;
  repsMax: number;
}

export interface Progressao {
  incremento: number;
  novaCarga: number;
}

/**
 * Se em TODAS as séries do último treino de um exercício a pessoa fez
 * pelo menos repsMax, sugere subir a carga: +5 kg para perna, +2,5 kg para o resto.
 * Exercícios sem carga (peso corporal) não recebem sugestão.
 */
export function sugestaoProgressao(
  series: SerieParaProgressao[],
  grupo: GrupoMuscular,
): Progressao | null {
  if (series.length === 0) return null;
  const todasNoTopo = series.every((s) => s.concluida && s.repsMax > 0 && s.reps >= s.repsMax);
  if (!todasNoTopo) return null;
  const cargaMax = Math.max(...series.map((s) => s.carga));
  if (cargaMax <= 0) return null;
  const incremento = GRUPOS_PERNA.includes(grupo) ? 5 : 2.5;
  return { incremento, novaCarga: r1(cargaMax + incremento) };
}

export interface Recorde {
  exercicioId: number;
  tipo: 'carga' | '1rm';
  valor: number;
  anterior: number;
}

/**
 * Compara as séries de um treino com todo o histórico anterior.
 * Só conta recorde quando já existe histórico daquele exercício
 * (o primeiro treino de um exercício não gera recorde).
 */
export function detectarRecordes(atuais: SerieFeita[], anteriores: SerieFeita[]): Recorde[] {
  const melhores = (lista: SerieFeita[]) => {
    const mapa = new Map<number, { carga: number; rm: number }>();
    for (const s of lista) {
      if (s.carga <= 0 || s.reps <= 0) continue;
      const m = mapa.get(s.exercicioId) ?? { carga: 0, rm: 0 };
      m.carga = Math.max(m.carga, s.carga);
      m.rm = Math.max(m.rm, umRmEpley(s.carga, s.reps));
      mapa.set(s.exercicioId, m);
    }
    return mapa;
  };

  const antes = melhores(anteriores);
  const agora = melhores(atuais);
  const recordes: Recorde[] = [];
  for (const [exercicioId, atual] of agora) {
    const prev = antes.get(exercicioId);
    if (!prev) continue;
    if (atual.carga > prev.carga) {
      recordes.push({ exercicioId, tipo: 'carga', valor: atual.carga, anterior: prev.carga });
    }
    if (atual.rm > prev.rm) {
      recordes.push({ exercicioId, tipo: '1rm', valor: atual.rm, anterior: prev.rm });
    }
  }
  return recordes;
}

export interface TreinoDoExercicio {
  sessaoId: number;
  inicio: number;
  series: Pick<SerieFeita, 'carga' | 'reps'>[];
}

/** Treinos seguidos sem progresso que caracterizam estagnação (guia: 2–3; app usa 3). */
export const TREINOS_ESTAGNACAO = 3;

/**
 * Estagnado = nenhum dos últimos 3 treinos superou o melhor anterior em 1RM estimado
 * NEM em volume (carga × reps; reps puras em peso corporal). Precisa de pelo menos
 * 4 treinos. `treinos` em ordem cronológica, sem semanas leves/treinos de sono ruim.
 */
export function estagnado(treinos: TreinoDoExercicio[], n = TREINOS_ESTAGNACAO): boolean {
  if (treinos.length < n + 1) return false;
  const medir = (t: TreinoDoExercicio) => ({
    rm: Math.max(0, ...t.series.map((s) => umRmEpley(s.carga, s.reps))),
    vol: t.series.reduce((soma, s) => soma + (s.carga > 0 ? s.carga : 1) * Math.max(0, s.reps), 0),
  });
  const medidas = treinos.map(medir);
  const antes = medidas.slice(0, -n);
  const melhorRm = Math.max(...antes.map((m) => m.rm));
  const melhorVol = Math.max(...antes.map((m) => m.vol));
  return medidas.slice(-n).every((m) => m.rm <= melhorRm && m.vol <= melhorVol);
}
