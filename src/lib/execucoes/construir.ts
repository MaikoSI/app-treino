/** Ferramentas para montar receitas: ciclo suavizado, alternância de lados e alvos de mãos/pés. */
import { ALTURA_QUADRIL, type Articulacao, type Ponto, type Pose, posicoes, type Vec3 } from '../esqueleto';
import { espelhar, type Fase, type Quadro } from '../execucao';
import { type Alvo, type Livre, resolverIK } from '../ik';

const suave = (u: number) => (1 - Math.cos(Math.PI * u)) / 2;

export interface OpcoesCiclo {
  /** Pose em t (0 = início do movimento, 1 = fim). Calculada uma vez por amostra. */
  pose: (t: number) => Pose;
  /** Fase do trecho início → fim: no supino a barra desce primeiro (excêntrica); na rosca, sobe (concêntrica). */
  primeira: 'concentrica' | 'excentrica';
  /** Duração (ms) do trecho concêntrico e do excêntrico. */
  concentrica?: number;
  excentrica?: number;
  pausaFim?: number;
  pausaInicio?: number;
  /** Amostras por trecho (mais = contatos mais precisos entre os quadros). */
  passos?: number;
}

/** Ciclo completo início → pausa → fim → pausa, com velocidade suave em cada trecho. */
export function ciclo(o: OpcoesCiclo): Quadro[] {
  const passos = o.passos ?? 8;
  const memo = new Map<number, Pose>();
  const em = (t: number) => {
    const k = Math.round(t * 1e6) / 1e6;
    if (!memo.has(k)) memo.set(k, o.pose(k));
    return memo.get(k)!;
  };
  const ms: Record<'concentrica' | 'excentrica', number> = { concentrica: o.concentrica ?? 1000, excentrica: o.excentrica ?? 2000 };
  const segunda: Fase = o.primeira === 'concentrica' ? 'excentrica' : 'concentrica';
  const trecho = (de: number, ate: number, fase: 'concentrica' | 'excentrica'): Quadro[] =>
    Array.from({ length: passos }, (_, i) => ({
      pose: em(de + (ate - de) * suave(i / passos)),
      ms: ms[fase] / passos,
      fase,
      linear: true,
    }));
  return [
    ...trecho(0, 1, o.primeira),
    { pose: em(1), ms: o.pausaFim ?? 400, fase: 'pausa' },
    ...trecho(1, 0, segunda as 'concentrica' | 'excentrica'),
    { pose: em(0), ms: o.pausaInicio ?? 500, fase: 'pausa' },
  ];
}

/** Faz o ciclo com um lado e depois com o outro (rosca alternada, afundo…). */
export function alternado(q: Quadro[]): Quadro[] {
  return [...q, ...q.map((x) => ({ ...x, pose: espelhar(x.pose) }))];
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerpV = (a: Vec3, b: Vec3, t: number): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/** Mistura duas sementes de rotação (para a IK partir de algo coerente em cada t). */
export function misturarRot(a: Pose['rot'], b: Pose['rot'], t: number): Pose['rot'] {
  const out: Pose['rot'] = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)]) as Set<Articulacao>)
    out[k] = lerpV(a[k] ?? [0, 0, 0], b[k] ?? [0, 0, 0], t);
  return out;
}

/**
 * Alvos para os dois pés apoiados no chão: tornozelos a `largura` do centro, em `z`,
 * com as pontas viradas para fora em `abertura` graus.
 */
export function pesNoChao(largura: number, z = 0, abertura = 0, altura = 0): Alvo[] {
  const s = Math.sin((abertura * Math.PI) / 180) * 0.1;
  const c = Math.cos((abertura * Math.PI) / 180) * 0.1;
  return [
    { ponto: 'tornozeloE', pos: [largura, altura + 0.07, z] },
    { ponto: 'tornozeloD', pos: [-largura, altura + 0.07, z] },
    { ponto: 'peE', pos: [largura + s, altura, z + c] },
    { ponto: 'peD', pos: [-largura - s, altura, z + c] },
  ];
}

export const IK_PERNAS: Livre[] = ['quadrilE', 'quadrilD', 'joelhoE', 'joelhoD', 'tornozeloE', 'tornozeloD'];
export const IK_BRACOS: Livre[] = ['ombroE', 'ombroD', 'cotoveloE', 'cotoveloD'];

export const ik = resolverIK;

/** Sentado num banco de máquina (assento a `assento` m), tronco inclinado `inclinacao` graus (negativo = para trás). */
export function sentado(inclinacao = 0, assento = 0.5, peZ = 0.45, z = 0): Pose {
  const semente: Pose = {
    raiz: { pos: [0, assento + 0.1, z], rot: [inclinacao, 0, 0] },
    rot: {
      quadrilE: [-90 - inclinacao, 0, 6],
      quadrilD: [-90 - inclinacao, 0, -6],
      joelhoE: [90, 0, 0],
      joelhoD: [90, 0, 0],
    },
  };
  return ik(semente, pesNoChao(0.16, peZ, 10), IK_PERNAS);
}

/** Sentado ereto com as costas no encosto de uma máquina (ver cenas.maquinaSentado). */
export const sentadoComEncosto = () => sentado(0, 0.5, 0.45, -0.04);

/** Em pé, ereto, com a raiz na altura padrão. */
export function emPe(rot: Pose['rot'] = {}, pos: Vec3 = [0, ALTURA_QUADRIL, 0], inclinacao: Vec3 = [0, 0, 0]): Pose {
  return { raiz: { pos, rot: inclinacao }, rot };
}

export const espelharX = (v: Vec3): Vec3 => [-v[0], v[1], v[2]];

/** Leva as mãos até os alvos (o direito é o espelho do esquerdo, se omitido), partindo das rotações-semente. */
export function maosEm(base: Pose, maoE: Vec3, semente: Pose['rot'], maoD: Vec3 = espelharX(maoE), livres: Livre[] = IK_BRACOS): Pose {
  return ik(
    { ...base, rot: { ...base.rot, ...semente } },
    [
      { ponto: 'maoE', pos: maoE },
      { ponto: 'maoD', pos: maoD },
    ],
    livres,
  );
}

/** Posiciona cotovelos e mãos (determina o braço inteiro, inclusive a rotação do ombro). */
export function bracosEm(base: Pose, cotE: Vec3, maoE: Vec3, semente: Pose['rot'], cotD = espelharX(cotE), maoD = espelharX(maoE)): Pose {
  return ik(
    { ...base, rot: { ...base.rot, ...semente } },
    [
      { ponto: 'cotoveloE', pos: cotE },
      { ponto: 'maoE', pos: maoE },
      { ponto: 'cotoveloD', pos: cotD },
      { ponto: 'maoD', pos: maoD },
    ],
    IK_BRACOS,
  );
}

/** Desloca o corpo inteiro para que `ponto` fique em `alvo`. */
export function apoiar(p: Pose, ponto: Ponto, alvo: Vec3): Pose {
  const atual = posicoes(p)[ponto];
  const d: Vec3 = [alvo[0] - atual[0], alvo[1] - atual[1], alvo[2] - atual[2]];
  return { ...p, raiz: { ...p.raiz, pos: [p.raiz.pos[0] + d[0], p.raiz.pos[1] + d[1], p.raiz.pos[2] + d[2]] } };
}

/** Soma vetores. */
export const mais = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/**
 * Deitado de barriga para cima num banco com encosto inclinado `inclinacao` graus (0 = reto,
 * positivo = cabeça mais alta). O quadril fica sobre a junção assento/encosto em z = 0, a 45 cm do chão,
 * e os pés apoiados no chão.
 */
export function deitadoNoBanco(inclinacao = 0, assento = 0.45): Pose {
  const a = (inclinacao * Math.PI) / 180;
  const semente: Pose = {
    raiz: { pos: [0, assento + 0.11 * Math.cos(a), 0.11 * Math.sin(a)], rot: [-90 + inclinacao, 0, 0] },
    rot: {
      quadrilE: [15 - inclinacao, 0, 12],
      quadrilD: [15 - inclinacao, 0, -12],
      joelhoE: [75, 0, 0],
      joelhoD: [75, 0, 0],
    },
  };
  return ik(semente, pesNoChao(0.3, inclinacao > 20 ? 0.6 : 0.5, 15), IK_PERNAS);
}
