import { describe, expect, it } from 'vitest';
import { analisarPrograma, VOLUME_IDEAL_MAX } from '../lib/volume';
import { DIVISOES, divisoesPara, volumeMinimoDivisao } from './divisoes';
import { EXERCICIOS_INICIAIS } from './exerciciosIniciais';

describe('divisões prontas', () => {
  const nomes = new Set(EXERCICIOS_INICIAIS.map((e) => e.nome));

  it('todo exercício citado existe na biblioteca', () => {
    for (const div of DIVISOES)
      for (const dia of div.dias)
        for (const ex of dia.exercicios) expect(nomes, `${div.nome} / ${dia.nome}`).toContain(ex.nome);
  });

  it('uma divisão para cada número de dias, de 2 a 6, com um dia de treino por dia da semana', () => {
    for (const n of [2, 3, 4, 5, 6]) {
      expect(divisoesPara(n)).toHaveLength(1);
      expect(divisoesPara(n)[0].dias).toHaveLength(n);
    }
  });

  it('séries positivas e sessões de duração razoável (até 24 séries)', () => {
    for (const div of DIVISOES)
      for (const dia of div.dias) {
        for (const ex of dia.exercicios) expect(ex.series).toBeGreaterThan(0);
        expect(dia.exercicios.reduce((s, x) => s + x.series, 0), `${div.nome} / ${dia.nome}`).toBeLessThanOrEqual(24);
      }
  });

  it('seguem o guia: cada músculo principal 2x/semana e 10–20 séries (8+ na de 2 dias)', () => {
    const porIndice = new Map(EXERCICIOS_INICIAIS.map((e, i) => [i, e]));
    const indice = new Map(EXERCICIOS_INICIAIS.map((e, i) => [e.nome, i]));
    for (const div of DIVISOES) {
      const dias = div.dias.map((d) => ({ itens: d.exercicios.map((x) => ({ exercicioId: indice.get(x.nome)!, series: x.series })) }));
      for (const m of analisarPrograma(dias, div.diasPorSemana, (i) => porIndice.get(i))) {
        const onde = `${div.nome}: ${m.grupo}`;
        expect(m.frequenciaBaixa, onde).toBe(false);
        expect(m.series, onde).toBeGreaterThanOrEqual(volumeMinimoDivisao(div.diasPorSemana));
        expect(m.series, onde).toBeLessThanOrEqual(VOLUME_IDEAL_MAX);
      }
    }
  });

  it('biblioteca tem ~60 exercícios com nomes únicos', () => {
    expect(EXERCICIOS_INICIAIS.length).toBeGreaterThanOrEqual(60);
    expect(nomes.size).toBe(EXERCICIOS_INICIAIS.length);
  });
});
