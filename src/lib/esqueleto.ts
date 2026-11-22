/**
 * Esqueleto do boneco das demonstrações de exercício, com cinemática direta.
 *
 * Eixos (do ponto de vista do boneco em pé): y para cima, z para a frente, x para a esquerda.
 * Ângulos em graus, Euler na ordem XYZ (igual ao padrão do three.js), relativos à articulação-pai.
 * Convenções de sinal: flexão do cotovelo, do quadril e do ombro (braço/coxa para a frente) = X negativo;
 * flexão do joelho = X positivo; coluna inclinando para a frente = X positivo;
 * abdução do lado esquerdo = Z positivo (o direito é o espelho, Z negativo).
 */

export type Vec3 = [number, number, number];

export type Articulacao =
  | 'quadril'
  | 'coluna'
  | 'pescoco'
  | 'ombroE'
  | 'ombroD'
  | 'cotoveloE'
  | 'cotoveloD'
  | 'punhoE'
  | 'punhoD'
  | 'quadrilE'
  | 'quadrilD'
  | 'joelhoE'
  | 'joelhoD'
  | 'tornozeloE'
  | 'tornozeloD';

/** Pontos finais (sem rotação própria): ponta das mãos, ponta dos pés e centro da cabeça. */
export type Extremidade = 'maoE' | 'maoD' | 'peE' | 'peD' | 'cabeca';

export type Ponto = Articulacao | Extremidade;

export interface Pose {
  /** Posição (m) e rotação (graus) do quadril no mundo. */
  raiz: { pos: Vec3; rot: Vec3 };
  /** Rotação de cada articulação; ausente = 0. */
  rot: Partial<Record<Articulacao, Vec3>>;
}

type Filha = Exclude<Articulacao, 'quadril'>;

export const PAI: Record<Filha, Articulacao> = {
  coluna: 'quadril',
  pescoco: 'coluna',
  ombroE: 'coluna',
  ombroD: 'coluna',
  cotoveloE: 'ombroE',
  cotoveloD: 'ombroD',
  punhoE: 'cotoveloE',
  punhoD: 'cotoveloD',
  quadrilE: 'quadril',
  quadrilD: 'quadril',
  joelhoE: 'quadrilE',
  joelhoD: 'quadrilD',
  tornozeloE: 'joelhoE',
  tornozeloD: 'joelhoD',
};

/** Deslocamento de cada articulação em relação ao pai, na pose neutra (boneco de ~1,75 m). */
export const OSSO: Record<Filha, Vec3> = {
  coluna: [0, 0.1, 0],
  pescoco: [0, 0.4, 0],
  ombroE: [0.19, 0.36, 0],
  ombroD: [-0.19, 0.36, 0],
  cotoveloE: [0, -0.29, 0],
  cotoveloD: [0, -0.29, 0],
  punhoE: [0, -0.26, 0],
  punhoD: [0, -0.26, 0],
  quadrilE: [0.09, -0.02, 0],
  quadrilD: [-0.09, -0.02, 0],
  joelhoE: [0, -0.44, 0],
  joelhoD: [0, -0.44, 0],
  tornozeloE: [0, -0.43, 0],
  tornozeloD: [0, -0.43, 0],
};

/** Extremidades: articulação de origem e deslocamento a partir dela. */
export const EXTREMIDADE: Record<Extremidade, { de: Articulacao; desloc: Vec3 }> = {
  maoE: { de: 'punhoE', desloc: [0, -0.08, 0] },
  maoD: { de: 'punhoD', desloc: [0, -0.08, 0] },
  peE: { de: 'tornozeloE', desloc: [0, -0.07, 0.1] },
  peD: { de: 'tornozeloD', desloc: [0, -0.07, 0.1] },
  cabeca: { de: 'pescoco', desloc: [0, 0.15, 0.02] },
};

/** Altura do quadril com o boneco em pé e os pés no chão. */
export const ALTURA_QUADRIL = -(OSSO.quadrilE[1] + OSSO.joelhoE[1] + OSSO.tornozeloE[1] + EXTREMIDADE.peE.desloc[1]);

export const POSE_NEUTRA: Pose = { raiz: { pos: [0, ALTURA_QUADRIL, 0], rot: [0, 0, 0] }, rot: {} };

/** Ordem de cálculo: todo pai antes do filho. */
export const ORDEM: Articulacao[] = [
  'quadril',
  'coluna',
  'pescoco',
  'ombroE',
  'ombroD',
  'cotoveloE',
  'cotoveloD',
  'punhoE',
  'punhoD',
  'quadrilE',
  'quadrilD',
  'joelhoE',
  'joelhoD',
  'tornozeloE',
  'tornozeloD',
];

type Limite = { min: Vec3; max: Vec3 };

/** Amplitude anatômica aceita por articulação (graus, XYZ). */
export const LIMITES: Record<Filha, Limite> = {
  coluna: { min: [-30, -45, -35], max: [90, 45, 35] },
  pescoco: { min: [-50, -70, -35], max: [60, 70, 35] },
  ombroE: { min: [-180, -90, -30], max: [60, 90, 180] },
  ombroD: { min: [-180, -90, -180], max: [60, 90, 30] },
  cotoveloE: { min: [-150, -90, -5], max: [0, 90, 5] },
  cotoveloD: { min: [-150, -90, -5], max: [0, 90, 5] },
  punhoE: { min: [-80, -30, -40], max: [80, 30, 40] },
  punhoD: { min: [-80, -30, -40], max: [80, 30, 40] },
  quadrilE: { min: [-130, -50, -30], max: [40, 50, 60] },
  quadrilD: { min: [-130, -50, -60], max: [40, 50, 30] },
  joelhoE: { min: [0, -10, -5], max: [150, 10, 5] },
  joelhoD: { min: [0, -10, -5], max: [150, 10, 5] },
  tornozeloE: { min: [-30, -20, -20], max: [50, 20, 20] },
  tornozeloD: { min: [-30, -20, -20], max: [50, 20, 20] },
};

// Matriz 3×3 em linhas.
type Mat3 = [number, number, number, number, number, number, number, number, number];
interface Transformacao {
  r: Mat3;
  t: Vec3;
}

const RAD = Math.PI / 180;

function multiplicar(a: Mat3, b: Mat3): Mat3 {
  const m = new Array(9).fill(0) as Mat3;
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) m[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
  return m;
}

function aplicar(m: Mat3, v: Vec3): Vec3 {
  return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
}

/** Matriz de rotação Euler XYZ (R = Rx · Ry · Rz), igual a `Euler(x, y, z, 'XYZ')` do three.js. */
export function matrizEuler([x, y, z]: Vec3): Mat3 {
  const [cx, sx, cy, sy, cz, sz] = [
    Math.cos(x * RAD),
    Math.sin(x * RAD),
    Math.cos(y * RAD),
    Math.sin(y * RAD),
    Math.cos(z * RAD),
    Math.sin(z * RAD),
  ];
  const rx: Mat3 = [1, 0, 0, 0, cx, -sx, 0, sx, cx];
  const ry: Mat3 = [cy, 0, sy, 0, 1, 0, -sy, 0, cy];
  const rz: Mat3 = [cz, -sz, 0, sz, cz, 0, 0, 0, 1];
  return multiplicar(multiplicar(rx, ry), rz);
}

function compor(pai: Transformacao, desloc: Vec3, rot: Vec3): Transformacao {
  const d = aplicar(pai.r, desloc);
  return { r: multiplicar(pai.r, matrizEuler(rot)), t: [pai.t[0] + d[0], pai.t[1] + d[1], pai.t[2] + d[2]] };
}

const ZERO: Vec3 = [0, 0, 0];

/** Posição no mundo de cada articulação e extremidade. */
export function posicoes(pose: Pose): Record<Ponto, Vec3> {
  const tr = {} as Record<Articulacao, Transformacao>;
  tr.quadril = { r: matrizEuler(pose.raiz.rot), t: [...pose.raiz.pos] };
  for (const a of ORDEM.slice(1) as Filha[]) tr[a] = compor(tr[PAI[a]], OSSO[a], pose.rot[a] ?? ZERO);
  const out = {} as Record<Ponto, Vec3>;
  for (const a of ORDEM) out[a] = tr[a].t;
  for (const [e, { de, desloc }] of Object.entries(EXTREMIDADE) as [Extremidade, (typeof EXTREMIDADE)[Extremidade]][]) {
    const d = aplicar(tr[de].r, desloc);
    out[e] = [tr[de].t[0] + d[0], tr[de].t[1] + d[1], tr[de].t[2] + d[2]];
  }
  return out;
}

/** Mensagens das rotações fora da amplitude anatômica, como "joelhoD eixo x: -10°". */
export function foraDosLimites(pose: Pose): string[] {
  const erros: string[] = [];
  for (const a of ORDEM.slice(1) as Filha[]) {
    const r = pose.rot[a];
    if (!r) continue;
    const { min, max } = LIMITES[a];
    r.forEach((v, i) => {
      if (v < min[i] - 1e-6 || v > max[i] + 1e-6) erros.push(`${a} eixo ${'xyz'[i]}: ${Math.round(v * 10) / 10}°`);
    });
  }
  return erros;
}
