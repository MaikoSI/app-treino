/** Ferramentas para montar receitas: ciclo suavizado, alternância de lados e alvos de mãos/pés. */
import { ALTURA_QUADRIL, type Articulacao, type Pose, type Vec3 } from '../esqueleto';
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

/** Em pé, ereto, com a raiz na altura padrão. */
export function emPe(rot: Pose['rot'] = {}, pos: Vec3 = [0, ALTURA_QUADRIL, 0], inclinacao: Vec3 = [0, 0, 0]): Pose {
  return { raiz: { pos, rot: inclinacao }, rot };
}
