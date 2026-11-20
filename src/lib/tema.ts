import type { Tema } from '../db/tipos';

/** Cor da barra do navegador/sistema em cada tema (= cor de fundo). */
const COR_BARRA: Record<Tema, string> = { escuro: '#0A0A0A', claro: '#F4F6F5' };

/**
 * Aplica o tema na página. O escuro é o padrão do CSS; o claro usa data-theme="claro".
 * Também guarda uma cópia no aparelho para o index.html aplicar o tema antes do app
 * carregar (evita piscar o tema errado).
 */
export function aplicarTema(tema: Tema): void {
  const raiz = document.documentElement;
  if (tema === 'claro') raiz.dataset.theme = 'claro';
  else delete raiz.dataset.theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COR_BARRA[tema]);
  try {
    localStorage.setItem('tema', tema);
  } catch {
    /* sem armazenamento: só pisca o tema padrão ao abrir */
  }
}

/** Lê o valor atual de uma variável de cor do tema (ex.: "--destaque"). */
export function corDoTema(variavel: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(variavel).trim();
}
