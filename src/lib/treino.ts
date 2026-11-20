export interface GrupoExercicio<S> {
  ordem: number;
  exercicioId: number;
  series: S[];
}

/** Agrupa as séries de uma sessão por exercício (posição), na ordem do treino. */
export function agruparPorExercicio<S extends { ordem: number; numero: number; exercicioId: number }>(
  series: S[],
): GrupoExercicio<S>[] {
  const mapa = new Map<number, GrupoExercicio<S>>();
  for (const s of [...series].sort((a, b) => a.ordem - b.ordem || a.numero - b.numero)) {
    const g = mapa.get(s.ordem) ?? { ordem: s.ordem, exercicioId: s.exercicioId, series: [] };
    g.series.push(s);
    mapa.set(s.ordem, g);
  }
  return [...mapa.values()];
}
