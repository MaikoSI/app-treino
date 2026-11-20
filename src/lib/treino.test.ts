import { describe, expect, it } from 'vitest';
import { agruparPorExercicio } from './treino';

describe('agruparPorExercicio', () => {
  it('agrupa por posição e ordena séries pelo número', () => {
    const series = [
      { ordem: 1, numero: 2, exercicioId: 9 },
      { ordem: 0, numero: 1, exercicioId: 5 },
      { ordem: 1, numero: 1, exercicioId: 9 },
      { ordem: 0, numero: 2, exercicioId: 5 },
    ];
    const g = agruparPorExercicio(series);
    expect(g.map((x) => x.exercicioId)).toEqual([5, 9]);
    expect(g[1].series.map((s) => s.numero)).toEqual([1, 2]);
  });
  it('o mesmo exercício em duas posições fica separado', () => {
    const g = agruparPorExercicio([
      { ordem: 0, numero: 1, exercicioId: 5 },
      { ordem: 3, numero: 1, exercicioId: 5 },
    ]);
    expect(g).toHaveLength(2);
  });
});
