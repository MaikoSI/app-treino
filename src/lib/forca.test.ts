import { describe, expect, it } from 'vitest';
import { detectarRecordes, estagnado, sugestaoProgressao, umRmEpley, volumeTotal } from './forca';

describe('umRmEpley', () => {
  it('aplica carga × (1 + reps/30)', () => {
    expect(umRmEpley(100, 10)).toBe(133.3);
    expect(umRmEpley(60, 5)).toBe(70);
  });
  it('com 1 repetição devolve a própria carga', () => {
    expect(umRmEpley(140, 1)).toBe(140);
  });
  it('carga ou reps zeradas dão 0', () => {
    expect(umRmEpley(0, 10)).toBe(0);
    expect(umRmEpley(100, 0)).toBe(0);
  });
});

describe('volumeTotal', () => {
  it('soma carga × reps', () => {
    expect(
      volumeTotal([
        { carga: 50, reps: 10 },
        { carga: 52.5, reps: 8 },
      ]),
    ).toBe(920);
  });
});

describe('sugestaoProgressao', () => {
  const s = (carga: number, reps: number, concluida = true, repsMax = 12) => ({ carga, reps, concluida, repsMax });

  it('sugere +2,5 kg quando todas as séries chegaram no repsMax', () => {
    expect(sugestaoProgressao([s(40, 12), s(40, 12), s(40, 13)], 'Peito')).toEqual({ incremento: 2.5, novaCarga: 42.5 });
  });
  it('sugere +5 kg para exercícios de perna', () => {
    expect(sugestaoProgressao([s(100, 12), s(100, 12)], 'Quadríceps')).toEqual({ incremento: 5, novaCarga: 105 });
    expect(sugestaoProgressao([s(30, 12)], 'Posteriores')?.incremento).toBe(5);
    expect(sugestaoProgressao([s(30, 12)], 'Glúteos')?.incremento).toBe(5);
    expect(sugestaoProgressao([s(30, 12)], 'Panturrilha')?.incremento).toBe(5);
  });
  it('não sugere se alguma série ficou abaixo do repsMax', () => {
    expect(sugestaoProgressao([s(40, 12), s(40, 11)], 'Peito')).toBeNull();
  });
  it('não sugere se alguma série não foi concluída', () => {
    expect(sugestaoProgressao([s(40, 12), s(40, 12, false)], 'Peito')).toBeNull();
  });
  it('não sugere sem séries ou sem carga', () => {
    expect(sugestaoProgressao([], 'Peito')).toBeNull();
    expect(sugestaoProgressao([s(0, 15)], 'Abdômen')).toBeNull();
  });
  it('usa a maior carga como base', () => {
    expect(sugestaoProgressao([s(40, 12), s(37.5, 12)], 'Costas')?.novaCarga).toBe(42.5);
  });
});

describe('detectarRecordes', () => {
  const sf = (exercicioId: number, carga: number, reps: number) => ({ exercicioId, carga, reps });

  it('detecta recorde de carga e de 1RM', () => {
    const r = detectarRecordes([sf(1, 105, 5)], [sf(1, 100, 5)]);
    expect(r.map((x) => x.tipo).sort()).toEqual(['1rm', 'carga']);
  });
  it('detecta só 1RM quando a carga é igual mas com mais reps', () => {
    const r = detectarRecordes([sf(1, 100, 8)], [sf(1, 100, 5)]);
    expect(r).toEqual([{ exercicioId: 1, tipo: '1rm', valor: 126.7, anterior: 116.7 }]);
  });
  it('primeiro treino de um exercício não gera recorde', () => {
    expect(detectarRecordes([sf(2, 50, 10)], [sf(1, 100, 5)])).toEqual([]);
  });
  it('não detecta quando não superou', () => {
    expect(detectarRecordes([sf(1, 90, 5)], [sf(1, 100, 5)])).toEqual([]);
  });
});

describe('estagnado', () => {
  const t = (inicio: number, ...series: [number, number][]) => ({
    sessaoId: inicio,
    inicio,
    series: series.map(([carga, reps]) => ({ carga, reps })),
  });

  it('3 treinos seguidos sem bater o melhor anterior (1RM e volume) = estagnado', () => {
    expect(estagnado([t(1, [80, 8], [80, 8]), t(2, [80, 8], [80, 7]), t(3, [80, 7], [80, 7]), t(4, [80, 8], [80, 8])])).toBe(true);
  });
  it('mais repetições ou mais carga em algum dos 3 = progresso', () => {
    expect(estagnado([t(1, [80, 8]), t(2, [80, 8]), t(3, [80, 9]), t(4, [80, 8])])).toBe(false);
    expect(estagnado([t(1, [80, 8]), t(2, [80, 8]), t(3, [80, 8], [80, 4]), t(4, [80, 8])])).toBe(false); // volume
  });
  it('precisa de pelo menos 4 treinos', () => {
    expect(estagnado([t(1, [80, 8]), t(2, [80, 8]), t(3, [80, 8])])).toBe(false);
  });
  it('peso corporal compara repetições', () => {
    expect(estagnado([t(1, [0, 12]), t(2, [0, 10]), t(3, [0, 11]), t(4, [0, 12])])).toBe(true);
    expect(estagnado([t(1, [0, 12]), t(2, [0, 10]), t(3, [0, 13]), t(4, [0, 12])])).toBe(false);
  });
});
