import { describe, expect, it } from 'vitest';
import { DIVISOES, divisoesPara } from './divisoes';
import { EXERCICIOS_INICIAIS } from './exerciciosIniciais';

describe('divisões prontas', () => {
  const nomes = new Set(EXERCICIOS_INICIAIS.map((e) => e.nome));

  it('todo exercício citado existe na biblioteca', () => {
    for (const div of DIVISOES)
      for (const dia of div.dias)
        for (const ex of dia.exercicios) expect(nomes, `${div.nome} / ${dia.nome}`).toContain(ex.nome);
  });

  it('existe divisão para 2 a 6 dias, e duas opções para 3 dias', () => {
    for (const n of [2, 3, 4, 5, 6]) expect(divisoesPara(n).length).toBeGreaterThan(0);
    expect(divisoesPara(3)).toHaveLength(2);
  });

  it('faixas de repetição coerentes', () => {
    for (const div of DIVISOES)
      for (const dia of div.dias)
        for (const ex of dia.exercicios) {
          expect(ex.repsMin).toBeLessThanOrEqual(ex.repsMax);
          expect(ex.series).toBeGreaterThan(0);
        }
  });

  it('biblioteca tem ~60 exercícios com nomes únicos', () => {
    expect(EXERCICIOS_INICIAIS.length).toBeGreaterThanOrEqual(60);
    expect(nomes.size).toBe(EXERCICIOS_INICIAIS.length);
  });
});
