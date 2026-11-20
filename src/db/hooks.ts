import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './index';
import type { Exercicio } from './tipos';

/** Mapa id → exercício, reativo. */
export function useExerciciosMap(): Map<number, Exercicio> | undefined {
  return useLiveQuery(async () => new Map((await db.exercicios.toArray()).map((e) => [e.id!, e])), []);
}
