import { describe, expect, it } from 'vitest';
import { foraDosLimites, POSE_NEUTRA, posicoes, type Vec3 } from './esqueleto';
import { resolverIK } from './ik';

const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

describe('resolverIK', () => {
  it('leva a mão direita até um ponto alcançável à frente do ombro', () => {
    const alvo: Vec3 = [-0.19, 1.3, 0.45];
    const p = resolverIK(POSE_NEUTRA, [{ ponto: 'maoD', pos: alvo }], ['ombroD', 'cotoveloD']);
    expect(dist(posicoes(p).maoD, alvo)).toBeLessThan(0.005);
    expect(foraDosLimites(p)).toEqual([]);
  });

  it('não mexe em articulações fora da lista', () => {
    const p = resolverIK(POSE_NEUTRA, [{ ponto: 'maoD', pos: [-0.19, 1.3, 0.45] }], ['ombroD', 'cotoveloD']);
    expect(p.rot.ombroE).toBeUndefined();
    expect(p.raiz).toEqual(POSE_NEUTRA.raiz);
  });

  it('mantém os pés no lugar quando o quadril desce (agachamento)', () => {
    const base = posicoes(POSE_NEUTRA);
    const seed = {
      raiz: { pos: [0, 0.6, -0.15] as Vec3, rot: [0, 0, 0] as Vec3 },
      rot: { quadrilE: [-80, 0, 0] as Vec3, quadrilD: [-80, 0, 0] as Vec3, joelhoE: [90, 0, 0] as Vec3, joelhoD: [90, 0, 0] as Vec3 },
    };
    const p = resolverIK(
      seed,
      [
        { ponto: 'peE', pos: base.peE },
        { ponto: 'peD', pos: base.peD },
        { ponto: 'tornozeloE', pos: base.tornozeloE },
        { ponto: 'tornozeloD', pos: base.tornozeloD },
      ],
      ['quadrilE', 'quadrilD', 'joelhoE', 'joelhoD', 'tornozeloE', 'tornozeloD'],
    );
    const q = posicoes(p);
    expect(dist(q.peE, base.peE)).toBeLessThan(0.01);
    expect(dist(q.tornozeloD, base.tornozeloD)).toBeLessThan(0.01);
    expect(foraDosLimites(p)).toEqual([]);
  });

  it('alvo inalcançável: chega o mais perto possível sem sair dos limites', () => {
    const p = resolverIK(POSE_NEUTRA, [{ ponto: 'maoD', pos: [-0.19, 1.42, 3] }], ['ombroD', 'cotoveloD']);
    expect(foraDosLimites(p)).toEqual([]);
    expect(posicoes(p).maoD[2]).toBeGreaterThan(0.55);
  });
});
