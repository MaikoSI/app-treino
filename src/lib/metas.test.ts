import { describe, expect, it } from 'vitest';
import { CONFIG_PADRAO } from '../db/tipos';
import { fimSemanaLeve, metaPadrao, semanaLeveAtiva, seriesComAjuste } from './metas';

describe('metaPadrao', () => {
  it('hipertrofia: compostos 6–10 e isolados 10–15, com o descanso de cada tipo', () => {
    expect(metaPadrao('composto', CONFIG_PADRAO)).toEqual({ repsMin: 6, repsMax: 10, descansoSeg: 150 });
    expect(metaPadrao('isolado', CONFIG_PADRAO)).toEqual({ repsMin: 10, repsMax: 15, descansoSeg: 90 });
  });
  it('força: compostos 3–6 com pelo menos 3 min; respeita descanso maior', () => {
    const forca = { ...CONFIG_PADRAO, objetivo: 'forca' as const };
    expect(metaPadrao('composto', forca)).toEqual({ repsMin: 3, repsMax: 6, descansoSeg: 180 });
    expect(metaPadrao('composto', { ...forca, descansoCompostoSeg: 240 }).descansoSeg).toBe(240);
    expect(metaPadrao('isolado', forca)).toEqual({ repsMin: 10, repsMax: 15, descansoSeg: 90 });
  });
});

describe('seriesComAjuste', () => {
  it('deload corta pela metade, arredondando para cima', () => {
    expect([1, 2, 3, 4, 5].map((n) => seriesComAjuste(n, 'deload'))).toEqual([1, 1, 2, 2, 3]);
  });
  it('sono ruim tira uma série só de exercícios com 3 ou mais', () => {
    expect([1, 2, 3, 4].map((n) => seriesComAjuste(n, 'sono'))).toEqual([1, 2, 2, 3]);
    expect(seriesComAjuste(4, 'normal')).toBe(4);
  });
});

describe('semana leve', () => {
  it('dura 7 dias contando hoje, até o fim do 7º dia', () => {
    const inicio = new Date(2026, 10, 20, 10).getTime(); // sexta, 20/11
    const fim = fimSemanaLeve(inicio);
    expect(new Date(fim)).toEqual(new Date(2026, 10, 26, 23, 59, 59, 999));
    expect(semanaLeveAtiva(fim, new Date(2026, 10, 26, 22).getTime())).toBe(true);
    expect(semanaLeveAtiva(fim, new Date(2026, 10, 27, 0).getTime())).toBe(false);
    expect(semanaLeveAtiva(null)).toBe(false);
  });
});
