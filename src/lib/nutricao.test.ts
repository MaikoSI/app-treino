import { describe, expect, it } from 'vitest';
import { avaliarRitmo, cafeinaMg, diaDoRegistro, mediasSemanais, proteinaDiaria, ritmoSemanal } from './nutricao';

const dia = (d: number) => new Date(2026, 10, d, 12).getTime(); // novembro/2026; segunda = 2, 9, 16

describe('proteína e cafeína', () => {
  it('80 kg: 128–176 g de proteína, ~32 g por refeição; 240–480 mg de cafeína', () => {
    expect(proteinaDiaria(80)).toEqual({ minG: 128, maxG: 176, porRefeicaoG: 32, refeicoes: 4 });
    expect(cafeinaMg(80)).toEqual({ minMg: 240, maxMg: 480 });
  });
});

describe('médias semanais e ritmo', () => {
  it('agrupa por semana (segunda a domingo) e calcula a variação semanal em %', () => {
    const m = mediasSemanais([
      { data: dia(2), kg: 80 },
      { data: dia(8), kg: 80.4 }, // domingo: mesma semana
      { data: dia(9), kg: 80.6 },
      { data: dia(11), kg: 80.8 },
    ]);
    expect(m.map((x) => [x.media, x.registros])).toEqual([
      [80.2, 2],
      [80.7, 2],
    ]);
    expect(ritmoSemanal(m)).toBe(0.6);
  });
  it('semana sem registro no meio: divide pelo número de semanas', () => {
    expect(
      ritmoSemanal(
        mediasSemanais([
          { data: dia(2), kg: 100 },
          { data: dia(16), kg: 99 },
        ]),
      ),
    ).toBe(-0.5);
  });
  it('menos de duas semanas: sem ritmo', () => {
    expect(ritmoSemanal(mediasSemanais([{ data: dia(2), kg: 100 }]))).toBeNull();
  });
});

describe('avaliarRitmo', () => {
  it('compara com a faixa de cada objetivo', () => {
    expect(avaliarRitmo(0.3, 'ganhar')).toBe('dentro');
    expect(avaliarRitmo(0.8, 'ganhar')).toBe('rapido');
    expect(avaliarRitmo(0.1, 'ganhar')).toBe('devagar');
    expect(avaliarRitmo(-0.7, 'perder')).toBe('dentro');
    expect(avaliarRitmo(-1.5, 'perder')).toBe('rapido');
    expect(avaliarRitmo(-0.2, 'perder')).toBe('devagar');
    expect(avaliarRitmo(0.1, 'manter')).toBe('dentro');
  });
});

describe('diaDoRegistro', () => {
  it('normaliza para meio-dia local', () => {
    expect(diaDoRegistro(new Date(2026, 10, 2, 7, 30))).toBe(dia(2));
  });
});
