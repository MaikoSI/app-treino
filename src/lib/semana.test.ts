import { describe, expect, it } from 'vitest';
import { inicioDaSemana, sequenciaSemanas, treinosNaSemana } from './semana';

// Datas no horário local. 2026-11-18 é uma quarta-feira.
const d = (dia: string, hora = 10) => new Date(`${dia}T${String(hora).padStart(2, '0')}:00:00`).getTime();
const agora = d('2026-11-18');

describe('inicioDaSemana', () => {
  it('volta para a segunda-feira 00:00', () => {
    const ini = inicioDaSemana(agora);
    expect(ini.getDay()).toBe(1);
    expect(ini.getDate()).toBe(16);
    expect(ini.getHours()).toBe(0);
  });
  it('domingo pertence à semana que começou na segunda anterior', () => {
    expect(inicioDaSemana(d('2026-11-22')).getDate()).toBe(16);
  });
});

describe('treinosNaSemana', () => {
  it('conta só os treinos da semana atual (seg a dom)', () => {
    const datas = [d('2026-11-15'), d('2026-11-16', 6), d('2026-11-18'), d('2026-11-22', 23), d('2026-11-23')];
    expect(treinosNaSemana(datas, agora)).toBe(3);
  });
  it('zero quando não há treinos', () => {
    expect(treinosNaSemana([], agora)).toBe(0);
  });
});

describe('sequenciaSemanas', () => {
  const semanasAnteriores = [
    d('2026-11-09'), d('2026-11-11'), // semana passada: 2
    d('2026-11-03'), d('2026-11-05'), // retrasada: 2
    d('2026-10-27'), // 3 semanas atrás: só 1
    d('2026-10-20'), d('2026-10-21'),
  ];

  it('conta semanas seguidas que bateram a meta', () => {
    expect(sequenciaSemanas(semanasAnteriores, 2, agora)).toBe(2);
  });
  it('semana atual incompleta não quebra a sequência', () => {
    expect(sequenciaSemanas([...semanasAnteriores, d('2026-11-16')], 2, agora)).toBe(2);
  });
  it('semana atual soma quando a meta já foi batida', () => {
    expect(sequenciaSemanas([...semanasAnteriores, d('2026-11-16'), d('2026-11-17')], 2, agora)).toBe(3);
  });
  it('zero se a semana passada não bateu a meta', () => {
    expect(sequenciaSemanas([d('2026-11-03'), d('2026-11-05')], 2, agora)).toBe(0);
  });
  it('meta maior faz a sequência cair', () => {
    expect(sequenciaSemanas(semanasAnteriores, 3, agora)).toBe(0);
  });
});
