import { diaDoRegistro } from '../lib/nutricao';
import { db } from './index';
import type { RegistroPeso } from './tipos';

export async function registrosDePeso(): Promise<RegistroPeso[]> {
  return db.pesos.orderBy('data').toArray();
}

/** Registra o peso de um dia (substitui o registro existente naquele dia). */
export async function registrarPeso(kg: number, quando: number | Date = Date.now()): Promise<void> {
  const data = diaDoRegistro(quando);
  await db.transaction('rw', db.pesos, async () => {
    const existente = await db.pesos.where('data').equals(data).first();
    if (existente) await db.pesos.update(existente.id, { kg });
    else await db.pesos.add({ data, kg });
  });
}

export async function excluirPeso(id: number): Promise<void> {
  await db.pesos.delete(id);
}
