import type { Tema } from '../db/tipos';

export type TemaEfetivo = 'claro' | 'escuro';

/** Cor da barra do navegador/sistema em cada tema (= cor de fundo). */
const COR_BARRA: Record<TemaEfetivo, string> = { claro: '#F2F2F7', escuro: '#000000' };

export const CONSULTA_ESCURO = '(prefers-color-scheme: dark)';

/** true quando o aparelho está no modo escuro agora. */
export function sistemaEscuro(): boolean {
  return typeof matchMedia === 'function' && matchMedia(CONSULTA_ESCURO).matches;
}

/** O tema que está valendo: a escolha manual ou, em "sistema", o modo do aparelho. */
export function temaEfetivo(tema: Tema, escuroNoSistema: boolean): TemaEfetivo {
  if (tema === 'sistema') return escuroNoSistema ? 'escuro' : 'claro';
  return tema;
}

/**
 * Aplica o tema na página. Em "sistema" não há data-theme e o CSS segue
 * prefers-color-scheme; nas escolhas manuais, data-theme força claro ou escuro.
 * Guarda uma cópia no aparelho para o index.html aplicar o tema antes do app
 * carregar (evita piscar o tema errado).
 */
export function aplicarTema(tema: Tema): void {
  const raiz = document.documentElement;
  if (tema === 'sistema') delete raiz.dataset.theme;
  else raiz.dataset.theme = tema;
  // Há uma meta theme-color por modo (media=…). Em "sistema" cada uma volta à sua cor; na escolha manual, as duas usam a escolhida.
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    const doModo: TemaEfetivo = meta.getAttribute('media')?.includes('dark') ? 'escuro' : 'claro';
    meta.setAttribute('content', COR_BARRA[tema === 'sistema' ? doModo : tema]);
  });
  try {
    localStorage.setItem('tema', tema);
  } catch {
    /* sem armazenamento: só pisca o tema do sistema ao abrir */
  }
}

/** Lê o valor atual de uma variável de cor do tema (ex.: "--destaque"). */
export function corDoTema(variavel: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(variavel).trim();
}
