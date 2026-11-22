/**
 * Cinemática inversa numérica (mínimos quadrados amortecidos): ajusta as articulações escolhidas
 * para levar pontos do corpo até alvos (mãos na barra, pés no chão), sem sair de LIMITES.
 * Usada só para montar as receitas; parte da pose-semente, então o resultado fica perto dela.
 */
import { type Articulacao, LIMITES, type Ponto, type Pose, posicoes, type Vec3 } from './esqueleto';

export interface Alvo {
  ponto: Ponto;
  pos: Vec3;
}

/** Articulação (todos os eixos livres) ou articulação com os eixos escolhidos (0 = x, 1 = y, 2 = z). */
export type Livre = Exclude<Articulacao, 'quadril'> | { art: Exclude<Articulacao, 'quadril'>; eixos: (0 | 1 | 2)[] };

/** Articulações de dobradiça: só giram em X. */
const DOBRADICA = new Set<Articulacao>(['cotoveloE', 'cotoveloD', 'joelhoE', 'joelhoD', 'tornozeloE', 'tornozeloD']);

type Grau = { art: Exclude<Articulacao, 'quadril'>; eixo: 0 | 1 | 2 };

function graus(livres: Livre[]): Grau[] {
  return livres.flatMap((l) => {
    const art = typeof l === 'string' ? l : l.art;
    const eixos = typeof l === 'string' ? (DOBRADICA.has(art) ? [0 as const] : ([0, 1, 2] as const)) : l.eixos;
    return eixos.map((eixo) => ({ art, eixo }));
  });
}

/** Resolve A·x = b (A quadrada pequena) por eliminação de Gauss com pivô parcial. */
function resolver(a: number[][], b: number[]): number[] {
  const n = b.length;
  const m = a.map((linha, i) => [...linha, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let i = c + 1; i < n; i++) if (Math.abs(m[i][c]) > Math.abs(m[p][c])) p = i;
    [m[c], m[p]] = [m[p], m[c]];
    for (let i = c + 1; i < n; i++) {
      const f = m[i][c] / m[c][c];
      for (let j = c; j <= n; j++) m[i][j] -= f * m[c][j];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = m[i][n];
    for (let j = i + 1; j < n; j++) s -= m[i][j] * x[j];
    x[i] = s / m[i][i];
  }
  return x;
}

const AMORTECIMENTO = 2e-5;
const PASSO_MAX = 15; // graus por iteração
const H = 0.25; // graus, para a derivada numérica

export function resolverIK(semente: Pose, alvos: Alvo[], livres: Livre[], iteracoes = 300): Pose {
  const gs = graus(livres);
  const rot: Pose['rot'] = {};
  for (const [a, v] of Object.entries(semente.rot) as [Articulacao, Vec3][]) rot[a] = [...v];
  for (const { art } of gs) rot[art] ??= [0, 0, 0];
  const pose: Pose = { raiz: semente.raiz, rot };

  const erro = (): number[] => {
    const p = posicoes(pose);
    return alvos.flatMap((a) => [a.pos[0] - p[a.ponto][0], a.pos[1] - p[a.ponto][1], a.pos[2] - p[a.ponto][2]]);
  };
  const limitar = (g: Grau, v: number) => Math.min(LIMITES[g.art].max[g.eixo], Math.max(LIMITES[g.art].min[g.eixo], v));

  let melhor = Number.POSITIVE_INFINITY;
  let parado = 0;
  for (let it = 0; it < iteracoes; it++) {
    const e = erro();
    const maior = Math.max(...e.map(Math.abs));
    if (maior < 2e-4) break;
    // Alvo inalcançável (ou preso num limite): para quando deixa de melhorar.
    if (maior > melhor * 0.995) {
      if (++parado >= 10) break;
    } else parado = 0;
    melhor = Math.min(melhor, maior);
    // Jacobiano numérico: J[i][j] = ∂(posição i)/∂(grau j); como e = alvo − posição, ∂e = −J.
    const jac = gs.map((g) => {
      const v = rot[g.art]![g.eixo];
      rot[g.art]![g.eixo] = v + H;
      const e2 = erro();
      rot[g.art]![g.eixo] = v;
      return e.map((x, i) => (x - e2[i]) / H);
    });
    const n = e.length;
    const jjt = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, k) => jac.reduce((s, col) => s + col[i] * col[k], 0) + (i === k ? AMORTECIMENTO : 0)),
    );
    const y = resolver(jjt, e);
    gs.forEach((g, j) => {
      const passo = Math.max(
        -PASSO_MAX,
        Math.min(
          PASSO_MAX,
          jac[j].reduce((s, x, i) => s + x * y[i], 0),
        ),
      );
      rot[g.art]![g.eixo] = limitar(g, rot[g.art]![g.eixo] + passo);
    });
  }
  return pose;
}
