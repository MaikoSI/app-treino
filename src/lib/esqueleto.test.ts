import { describe, expect, it } from 'vitest';
import { ALTURA_QUADRIL, foraDosLimites, POSE_NEUTRA, type Pose, posicoes, type Vec3 } from './esqueleto';

const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

describe('posicoes', () => {
  it('em pé, a cabeça fica entre 1,55 e 1,75 m e os pés no chão', () => {
    const p = posicoes(POSE_NEUTRA);
    expect(p.cabeca[1]).toBeGreaterThan(1.55);
    expect(p.cabeca[1]).toBeLessThan(1.75);
    expect(p.peE[1]).toBeCloseTo(0, 6);
    expect(p.peD[1]).toBeCloseTo(0, 6);
    expect(p.quadril[1]).toBeCloseTo(ALTURA_QUADRIL, 6);
  });

  it('é simétrico: lado esquerdo em +x, direito em −x', () => {
    const p = posicoes(POSE_NEUTRA);
    expect(p.maoE[0]).toBeGreaterThan(0);
    expect(p.maoD[0]).toBeLessThan(0);
    expect(p.maoE[0]).toBeCloseTo(-p.maoD[0], 6);
  });

  it('flexionar o cotovelo leva a mão para a frente sem mudar o tamanho do antebraço', () => {
    const antes = posicoes(POSE_NEUTRA);
    const pose: Pose = { ...POSE_NEUTRA, rot: { cotoveloD: [-90, 0, 0] } };
    const depois = posicoes(pose);
    expect(depois.maoD[2]).toBeGreaterThan(depois.cotoveloD[2] + 0.2);
    expect(dist(depois.cotoveloD, depois.maoD)).toBeCloseTo(dist(antes.cotoveloD, antes.maoD), 6);
  });

  it('flexionar o joelho leva o pé para trás', () => {
    const p = posicoes({ ...POSE_NEUTRA, rot: { joelhoE: [90, 0, 0] } });
    expect(p.tornozeloE[2]).toBeLessThan(p.joelhoE[2] - 0.3);
  });

  it('abduzir o ombro esquerdo (+Z) leva o braço para fora', () => {
    const p = posicoes({ ...POSE_NEUTRA, rot: { ombroE: [0, 0, 90] } });
    expect(p.maoE[0]).toBeGreaterThan(p.ombroE[0] + 0.5);
    expect(p.maoE[1]).toBeCloseTo(p.ombroE[1], 6);
  });

  it('deitado de barriga para cima (raiz X −90°): cabeça na altura do quadril, atrás em z', () => {
    const p = posicoes({ raiz: { pos: [0, 0.5, 0], rot: [-90, 0, 0] }, rot: {} });
    expect(p.cabeca[1]).toBeCloseTo(p.quadril[1], 1);
    expect(p.cabeca[2]).toBeLessThan(-0.5);
  });
});

describe('foraDosLimites', () => {
  it('a pose neutra está dentro dos limites', () => {
    expect(foraDosLimites(POSE_NEUTRA)).toEqual([]);
  });
  it('acusa joelho dobrado para a frente', () => {
    expect(foraDosLimites({ ...POSE_NEUTRA, rot: { joelhoD: [-10, 0, 0] } })).toEqual(['joelhoD eixo x: -10°']);
  });
});
