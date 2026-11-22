import { describe, expect, it } from 'vitest';
import { GRUPOS_MUSCULARES } from '../db/tipos';
import { COSTAS, FRENTE } from './MapaMuscular';

describe('MapaMuscular', () => {
  it('desenha todos os grupos musculares em alguma vista', () => {
    const desenhados = new Set([...FRENTE, ...COSTAS].map((f) => f.grupo).filter(Boolean));
    for (const g of GRUPOS_MUSCULARES) expect(desenhados, g).toContain(g);
  });
});
