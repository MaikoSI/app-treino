/** Cálculos de contraste WCAG 2.x, para conferir as cores do tema (inclusive sobre vidro translúcido). */

export type Rgba = { r: number; g: number; b: number; a: number };

/** Lê "#rrggbb" ou "rgb(r g b / a)". */
export function lerCor(texto: string): Rgba {
  const t = texto.trim();
  const hex = /^#([0-9a-f]{6})$/i.exec(t);
  if (hex) {
    const n = Number.parseInt(hex[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }
  const rgb = /^rgb\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+))?\s*\)$/i.exec(t);
  if (rgb) return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]), a: rgb[4] === undefined ? 1 : Number(rgb[4]) };
  throw new Error(`Cor não reconhecida: ${texto}`);
}

/** Compõe `cima` (com sua opacidade) sobre `baixo` (opaco). */
export function compor(cima: Rgba, baixo: Rgba): Rgba {
  const m = (c: number, f: number) => c * cima.a + f * (1 - cima.a);
  return { r: m(cima.r, baixo.r), g: m(cima.g, baixo.g), b: m(cima.b, baixo.b), a: 1 };
}

function luminancia({ r, g, b }: Rgba): number {
  const canal = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

/** Razão de contraste entre duas cores opacas (1 a 21). */
export function razaoContraste(a: Rgba, b: Rgba): number {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}
