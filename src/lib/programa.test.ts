import { describe, expect, it } from 'vitest';
import { mover, proximoDia } from './programa';

const dias = [
  { id: 10, ordem: 2, nome: 'C' },
  { id: 11, ordem: 0, nome: 'A' },
  { id: 12, ordem: 1, nome: 'B' },
];

describe('proximoDia', () => {
  it('sem histórico começa pelo primeiro dia', () => {
    expect(proximoDia(dias, null)?.nome).toBe('A');
  });
  it('vai para o dia seguinte na ordem', () => {
    expect(proximoDia(dias, 11)?.nome).toBe('B');
    expect(proximoDia(dias, 12)?.nome).toBe('C');
  });
  it('depois do último volta ao primeiro', () => {
    expect(proximoDia(dias, 10)?.nome).toBe('A');
  });
  it('se o último dia foi apagado, começa pelo primeiro', () => {
    expect(proximoDia(dias, 999)?.nome).toBe('A');
  });
  it('programa sem dias devolve undefined', () => {
    expect(proximoDia([], 1)).toBeUndefined();
  });
});

describe('mover', () => {
  it('move para cima e para baixo', () => {
    expect(mover(['a', 'b', 'c'], 2, -1)).toEqual(['a', 'c', 'b']);
    expect(mover(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
  });
  it('ignora movimento para fora da lista', () => {
    expect(mover(['a', 'b'], 0, -1)).toEqual(['a', 'b']);
  });
});
