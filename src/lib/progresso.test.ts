import { describe, expect, it } from 'vitest';
import { celulasDoMes, faixaVolume, recordesPessoais, serieTemporal, seriesPorGrupo } from './progresso';

const s = (sessaoId: number, inicio: number, carga: number, reps: number, exercicioId = 1) => ({
  exercicioId,
  sessaoId,
  inicio,
  carga,
  reps,
});

describe('serieTemporal', () => {
  it('um ponto por treino com carga máxima e melhor 1RM, em ordem de data', () => {
    const pts = serieTemporal([s(2, 200, 80, 5), s(1, 100, 60, 10), s(1, 100, 70, 3), s(2, 200, 70, 10)]);
    expect(pts).toEqual([
      { sessaoId: 1, data: 100, cargaMax: 70, umRm: 80 },
      { sessaoId: 2, data: 200, cargaMax: 80, umRm: 93.3 },
    ]);
  });
  it('ignora séries sem carga', () => {
    expect(serieTemporal([s(1, 100, 0, 20)])).toEqual([]);
  });
});

describe('recordesPessoais', () => {
  it('guarda a maior carga e o maior 1RM, com a data em que aconteceram', () => {
    const [r] = recordesPessoais([s(1, 100, 100, 3), s(2, 200, 90, 10), s(3, 300, 100, 2)]);
    expect(r).toMatchObject({ cargaMax: 100, repsNaCargaMax: 3, dataCarga: 100, umRm: 120, data1rm: 200, maxReps: 10 });
  });
  it('mesma carga com mais reps atualiza o recorde de carga', () => {
    const [r] = recordesPessoais([s(1, 100, 100, 3), s(2, 200, 100, 5)]);
    expect(r).toMatchObject({ repsNaCargaMax: 5, dataCarga: 200 });
  });
  it('separa por exercício e conta reps em peso corporal', () => {
    const rs = recordesPessoais([s(1, 100, 0, 15, 7), s(1, 100, 50, 10, 8)]);
    expect(rs.find((r) => r.exercicioId === 7)).toMatchObject({ cargaMax: 0, maxReps: 15 });
    expect(rs).toHaveLength(2);
  });
});

describe('seriesPorGrupo', () => {
  it('conta séries por grupo, do maior para o menor', () => {
    const grupo = (id: number) => ({ 1: 'Peito', 2: 'Costas', 3: 'Peito' } as Record<number, string>)[id];
    expect(seriesPorGrupo([{ exercicioId: 1 }, { exercicioId: 2 }, { exercicioId: 3 }, { exercicioId: 9 }], grupo)).toEqual([
      { grupo: 'Peito', series: 2 },
      { grupo: 'Costas', series: 1 },
    ]);
  });
});

describe('celulasDoMes', () => {
  it('novembro de 2026 começa num domingo: 6 espaços antes do dia 1', () => {
    const c = celulasDoMes(2026, 10);
    expect(c.slice(0, 7)).toEqual([null, null, null, null, null, null, 1]);
    expect(c.filter((x) => x !== null)).toHaveLength(30);
  });
  it('fevereiro de 2028 (bissexto) tem 29 dias', () => {
    expect(celulasDoMes(2028, 1).filter((x) => x !== null)).toHaveLength(29);
  });
});

describe('faixaVolume', () => {
  it('abaixo de 10 é baixo, 10 a 20 é ideal, acima de 20 é alto', () => {
    expect([0, 9, 10, 15, 20, 21].map(faixaVolume)).toEqual(['baixo', 'baixo', 'ideal', 'ideal', 'ideal', 'alto']);
  });
});
