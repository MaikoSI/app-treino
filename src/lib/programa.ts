/**
 * Próximo dia do programa: o que vem depois do último treinado, na ordem.
 * Sem histórico (ou se o último dia foi apagado), começa do primeiro.
 */
export function proximoDia<T extends { id?: number; ordem: number }>(
  dias: T[],
  ultimoDiaId: number | null | undefined,
): T | undefined {
  if (dias.length === 0) return undefined;
  const ordenados = [...dias].sort((a, b) => a.ordem - b.ordem);
  const idx = ordenados.findIndex((d) => d.id === ultimoDiaId);
  if (idx === -1) return ordenados[0];
  return ordenados[(idx + 1) % ordenados.length];
}

/** Move o item na posição `de` para `de + delta` e devolve a nova lista. */
export function mover<T>(lista: T[], de: number, delta: number): T[] {
  const para = de + delta;
  if (para < 0 || para >= lista.length) return lista;
  const nova = [...lista];
  const [item] = nova.splice(de, 1);
  nova.splice(para, 0, item);
  return nova;
}
