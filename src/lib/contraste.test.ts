import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { compor, lerCor, razaoContraste } from './contraste';

/**
 * Garante WCAG AA (4,5:1) para todo token de texto, no PIOR caso do liquid glass:
 * cada mancha de cor no ponto mais forte, atrás da página, do vidro fino e do vidro espesso.
 * Lê os valores direto do index.css, então qualquer mudança de cor passa por aqui.
 */
const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8');

function variaveis(seletor: string): Record<string, string> {
  const inicio = css.indexOf(`${seletor} {`);
  if (inicio < 0) throw new Error(`Bloco ${seletor} não encontrado`);
  const bloco = css.slice(inicio, css.indexOf('}', inicio));
  return Object.fromEntries([...bloco.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

const TEXTOS = ['texto', 'secundario', 'primaria-texto', 'concluido-texto', 'destaque-texto', 'alerta-texto'];
const MANCHAS = ['mancha-1', 'mancha-2', 'mancha-3', 'mancha-4'];

describe.each([
  ['claro', variaveis(':root')],
  ['escuro', variaveis(':root[data-theme="escuro"]')],
])('contraste no tema %s', (_nome, v) => {
  const fundo = lerCor(v.fundo);
  const superficies = (mancha: string) => {
    const pagina = compor(lerCor(v[mancha]), fundo);
    return { pagina, vidro: compor(lerCor(v.vidro), pagina), 'vidro-forte': compor(lerCor(v['vidro-forte']), pagina) };
  };

  it.each(TEXTOS)('%s passa AA sobre página e vidro, com qualquer mancha atrás', (token) => {
    const texto = lerCor(v[token]);
    for (const mancha of MANCHAS) {
      for (const [superficie, cor] of Object.entries(superficies(mancha))) {
        expect(razaoContraste(texto, cor), `${token} sobre ${superficie} (${mancha})`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('texto do botão principal passa AA sobre o azul sólido', () => {
    expect(razaoContraste(lerCor(v['sobre-primaria']), lerCor(v.primaria))).toBeGreaterThanOrEqual(4.5);
  });
});

describe('blocos do tema escuro', () => {
  it('o escuro automático (prefers-color-scheme) e o escolhido em Ajustes têm os mesmos valores', () => {
    expect(variaveis(':root:not([data-theme="claro"])')).toEqual(variaveis(':root[data-theme="escuro"]'));
  });
});

describe('lerCor e razaoContraste', () => {
  it('preto e branco dão 21:1', () => {
    expect(razaoContraste(lerCor('#000000'), lerCor('#ffffff'))).toBeCloseTo(21, 5);
  });
  it('lê rgb com opacidade e compõe sobre o fundo', () => {
    const meio = compor(lerCor('rgb(255 255 255 / 0.5)'), lerCor('#000000'));
    expect(meio.r).toBeCloseTo(127.5);
  });
  it('recusa formatos desconhecidos', () => {
    expect(() => lerCor('azul')).toThrow();
  });
});
