import { describe, expect, it } from 'vitest';
import type { GrupoMuscular } from '../db/tipos';
import { analisarPrograma, faixaVolume, volumePorMusculo, type InfoMusculo } from './volume';

const EX: Record<number, InfoMusculo> = {
  1: { grupoMuscular: 'Peito', secundarios: ['Tríceps', 'Ombros'] }, // supino
  2: { grupoMuscular: 'Tríceps', secundarios: [] },
  3: { grupoMuscular: 'Quadríceps', secundarios: ['Glúteos'] },
};
const info = (id: number) => EX[id];

describe('faixaVolume', () => {
  it('abaixo de 10 é baixo, 10 a 20 é ideal, acima de 20 é alto', () => {
    expect([0, 9.5, 10, 15, 20, 20.5].map(faixaVolume)).toEqual(['baixo', 'baixo', 'ideal', 'ideal', 'ideal', 'alto']);
  });
});

describe('volumePorMusculo', () => {
  it('1 série no principal, meia nos secundários; RIR 5+ não conta; exercício desconhecido é ignorado', () => {
    const v = volumePorMusculo(
      [{ exercicioId: 1 }, { exercicioId: 1, rir: 2 }, { exercicioId: 1, rir: 5 }, { exercicioId: 2 }, { exercicioId: 99 }],
      info,
    );
    expect(Object.fromEntries(v)).toEqual({ Peito: 2, Tríceps: 2, Ombros: 1 });
  });
});

describe('analisarPrograma', () => {
  const dia = (...itens: [number, number][]) => ({ itens: itens.map(([exercicioId, series]) => ({ exercicioId, series })) });
  const de = (a: ReturnType<typeof analisarPrograma>, g: GrupoMuscular) => a.find((m) => m.grupo === g)!;

  it('soma séries por semana e conta dias com pelo menos 2 séries do músculo', () => {
    const a = analisarPrograma([dia([1, 4], [3, 4]), dia([1, 4], [2, 3])], 2, info);
    expect(de(a, 'Peito')).toMatchObject({ series: 8, frequencia: 2, faixa: 'baixo', frequenciaBaixa: false });
    expect(de(a, 'Tríceps')).toMatchObject({ series: 7, frequencia: 2 }); // 2 + 2 + 3
    expect(de(a, 'Quadríceps')).toMatchObject({ series: 4, frequencia: 1, frequenciaBaixa: true });
    expect(de(a, 'Costas')).toMatchObject({ series: 0, frequencia: 0, frequenciaBaixa: true });
  });

  it('ciclo maior que a semana é proporcional (3 dias de programa feitos 2x/semana)', () => {
    const a = analisarPrograma([dia([1, 6]), dia([3, 3]), dia([2, 3])], 2, info);
    expect(de(a, 'Peito')).toMatchObject({ series: 4, frequencia: 0.7 });
  });
});
