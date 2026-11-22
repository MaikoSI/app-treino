import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { salvarComoFazer } from './exercicios';
import { db } from './index';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('salvarComoFazer', () => {
  it('grava as anotações do exercício e apaga quando o texto fica vazio', async () => {
    const id = await db.exercicios.add({
      nome: 'Meu exercício',
      grupoMuscular: 'Peito',
      secundarios: [],
      tipo: 'isolado',
      equipamento: 'Máquina',
      personalizado: true,
    });
    await salvarComoFazer(id, '  Sentar e empurrar.  ');
    expect((await db.exercicios.get(id))?.comoFazer).toBe('Sentar e empurrar.');
    await salvarComoFazer(id, '   ');
    expect((await db.exercicios.get(id))?.comoFazer).toBeUndefined();
  });
});
