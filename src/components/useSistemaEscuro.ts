import { useSyncExternalStore } from 'react';
import { CONSULTA_ESCURO, sistemaEscuro } from '../lib/tema';

function assinar(avisar: () => void): () => void {
  if (typeof matchMedia !== 'function') return () => {};
  const mq = matchMedia(CONSULTA_ESCURO);
  mq.addEventListener('change', avisar);
  return () => mq.removeEventListener('change', avisar);
}

/** true quando o aparelho está no modo escuro; atualiza se o usuário trocar o modo com o app aberto. */
export function useSistemaEscuro(): boolean {
  return useSyncExternalStore(assinar, sistemaEscuro, () => false);
}
