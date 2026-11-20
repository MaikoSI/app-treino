import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './index';
import { CONFIG_PADRAO, type Config } from './tipos';

export async function lerConfig(): Promise<Config> {
  return { ...CONFIG_PADRAO, ...(await db.config.get('app')) };
}

export async function salvarConfig(mudancas: Partial<Omit<Config, 'chave'>>): Promise<void> {
  const atual = await lerConfig();
  await db.config.put({ ...atual, ...mudancas, chave: 'app' });
}

/** Config reativa. Retorna undefined enquanto carrega. */
export function useConfig(): Config | undefined {
  return useLiveQuery(lerConfig);
}
