import { describe, expect, it } from 'vitest';
import { calcularAnilhas } from './anilhas';

describe('calcularAnilhas', () => {
  it('100 kg na barra de 20: 25 + 15 de cada lado', () => {
    expect(calcularAnilhas(100)).toEqual({ porLado: [25, 15], resto: 0, valido: true });
  });
  it('usa anilhas pequenas (62,5 kg → 20 + 1,25)', () => {
    expect(calcularAnilhas(62.5)).toEqual({ porLado: [20, 1.25], resto: 0, valido: true });
  });
  it('só a barra', () => {
    expect(calcularAnilhas(20)).toEqual({ porLado: [], resto: 0, valido: true });
  });
  it('carga menor que a barra é inválida', () => {
    expect(calcularAnilhas(15).valido).toBe(false);
  });
  it('informa o que sobra quando não fecha exato', () => {
    expect(calcularAnilhas(21)).toEqual({ porLado: [], resto: 1, valido: true });
  });
  it('aceita outra barra e outras anilhas', () => {
    expect(calcularAnilhas(30, 10, [10, 5])).toEqual({ porLado: [10], resto: 0, valido: true });
  });
  it('cargas altas repetem anilhas', () => {
    expect(calcularAnilhas(220).porLado).toEqual([25, 25, 25, 25]);
  });
});
