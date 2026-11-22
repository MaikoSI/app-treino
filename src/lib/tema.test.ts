import { describe, expect, it } from 'vitest';
import { temaEfetivo } from './tema';

describe('temaEfetivo', () => {
  it('em "sistema" segue o modo do aparelho', () => {
    expect(temaEfetivo('sistema', true)).toBe('escuro');
    expect(temaEfetivo('sistema', false)).toBe('claro');
  });

  it('a escolha manual vale mesmo com o aparelho no outro modo', () => {
    expect(temaEfetivo('claro', true)).toBe('claro');
    expect(temaEfetivo('escuro', false)).toBe('escuro');
  });
});
