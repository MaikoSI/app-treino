import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { TreinoDB } from './index';

let banco: TreinoDB;
afterEach(async () => {
  await banco?.delete();
});

describe('banco local', () => {
  it('no primeiro acesso carrega os exercícios iniciais e a config padrão', async () => {
    banco = new TreinoDB('teste-populate');
    expect(await banco.exercicios.count()).toBeGreaterThanOrEqual(60);
    const cfg = await banco.config.get('app');
    expect(cfg?.onboardingConcluido).toBe(false);
    expect(cfg?.metaSemanal).toBe(3);
  });
});
