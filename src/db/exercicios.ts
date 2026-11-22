import { db } from './index';

/** Salva as anotações "Como fazer" de um exercício; texto vazio apaga. */
export async function salvarComoFazer(id: number, texto: string): Promise<void> {
  const limpo = texto.trim();
  await db.exercicios.update(id, { comoFazer: limpo || undefined });
}
