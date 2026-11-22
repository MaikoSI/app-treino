import { describe, expect, it } from 'vitest';
import { ALTURA_QUADRIL, type Pose } from './esqueleto';
import { duracaoCiclo, espelhar, poseNoTempo, posesExtremas, type Quadro, type ReceitaExecucao, validarReceita } from './execucao';

const emPe = (rot: Pose['rot'] = {}): Pose => ({ raiz: { pos: [0, ALTURA_QUADRIL, 0], rot: [0, 0, 0] }, rot });
const embaixo = emPe({ ombroE: [-10, 0, 0], ombroD: [-10, 0, 0], cotoveloE: [-10, 0, 0], cotoveloD: [-10, 0, 0] });
const emCima = emPe({ ombroE: [-10, 0, 0], ombroD: [-10, 0, 0], cotoveloE: [-140, 0, 0], cotoveloD: [-140, 0, 0] });

const quadros = (a: Pose, b: Pose): Quadro[] => [
  { pose: a, ms: 1000, fase: 'concentrica' },
  { pose: b, ms: 400, fase: 'pausa' },
  { pose: b, ms: 2000, fase: 'excentrica' },
  { pose: a, ms: 400, fase: 'pausa' },
];

const rosca = (q: Quadro[] = quadros(embaixo, emCima)): ReceitaExecucao => ({
  cena: [{ tipo: 'barra', em: 'maos' }],
  quadros: q,
  camera: { azimute: 60, elevacao: 10 },
  contatos: [
    { tipo: 'apoio', ponto: 'peE', eixo: 'y' },
    { tipo: 'apoio', ponto: 'peD', eixo: 'y' },
    { tipo: 'distanciaFixa', a: 'maoE', b: 'maoD' },
    { tipo: 'simetria' },
  ],
});

describe('poseNoTempo', () => {
  const r = rosca();
  it('em 0 ms é o primeiro quadro', () => {
    expect(poseNoTempo(r, 0)).toEqual(r.quadros[0].pose);
  });
  it('no meio da subida o cotovelo está entre os extremos', () => {
    const c = poseNoTempo(r, 500).rot.cotoveloD![0];
    expect(c).toBeLessThan(-10);
    expect(c).toBeGreaterThan(-140);
  });
  it('é cíclico: no fim do ciclo volta ao começo, e tempo negativo funciona', () => {
    expect(duracaoCiclo(r)).toBe(3800);
    const fim = poseNoTempo(r, 3800).rot.cotoveloD![0];
    expect(fim).toBeCloseTo(-10, 6);
    expect(poseNoTempo(r, -100).rot.cotoveloD![0]).toBeCloseTo(poseNoTempo(r, 3700).rot.cotoveloD![0], 6);
  });
  it('quadro linear interpola sem suavizar', () => {
    const q = quadros(embaixo, emCima).map((x, i) => (i === 0 ? { ...x, linear: true } : x));
    expect(poseNoTempo(rosca(q), 250).rot.cotoveloD![0]).toBeCloseTo(-10 + (-130 * 250) / 1000, 6);
  });
  it('rotação ausente num quadro conta como 0', () => {
    const a = emPe();
    const b = emPe({ joelhoE: [40, 0, 0] });
    const p = poseNoTempo(rosca(quadros(a, b)), 500);
    expect(p.rot.joelhoE![0]).toBeGreaterThan(0);
    expect(p.rot.joelhoE![0]).toBeLessThan(40);
  });
});

describe('espelhar', () => {
  it('troca os lados e inverte Y e Z; espelhar duas vezes volta ao original', () => {
    const p: Pose = { raiz: { pos: [0.1, 1, 0], rot: [0, 20, 5] }, rot: { ombroE: [-30, 10, 40], joelhoD: [20, 0, 0] } };
    const e = espelhar(p);
    expect(e.rot.ombroD).toEqual([-30, -10, -40]);
    expect(e.rot.joelhoE).toEqual([20, -0, -0]);
    expect(e.raiz.pos[0]).toBe(-0.1);
    expect(espelhar(e)).toEqual(p);
  });
});

describe('posesExtremas', () => {
  it('fim é o quadro mais distante do início', () => {
    const { inicio, fim } = posesExtremas(rosca());
    expect(inicio).toEqual(embaixo);
    expect(fim).toEqual(emCima);
  });
});

describe('validarReceita', () => {
  it('receita correta não tem erros', () => {
    expect(validarReceita(rosca())).toEqual([]);
  });
  it('acusa menos de 2 quadros e duração inválida', () => {
    expect(validarReceita(rosca([{ pose: embaixo, ms: 0, fase: 'pausa' }])).join()).toMatch(/2 quadros/);
    expect(validarReceita(rosca([{ pose: embaixo, ms: 0, fase: 'pausa' }])).join()).toMatch(/duração/);
  });
  it('acusa articulação fora do limite', () => {
    const ruim = emPe({ joelhoE: [-20, 0, 0] });
    expect(validarReceita(rosca(quadros(embaixo, ruim))).join()).toMatch(/joelhoE eixo x/);
  });
  it('acusa pé saindo do chão (apoio y)', () => {
    const pulando = { ...emCima, raiz: { pos: [0, ALTURA_QUADRIL + 0.1, 0] as const, rot: [0, 0, 0] as const } } as unknown as Pose;
    expect(validarReceita(rosca(quadros(embaixo, pulando))).join()).toMatch(/apoio peE/);
  });
  it('acusa ponto que deveria ficar parado (apoio xyz)', () => {
    const r = { ...rosca(), contatos: [{ tipo: 'apoio' as const, ponto: 'maoD' as const, eixo: 'xyz' as const }] };
    expect(validarReceita(r).join()).toMatch(/apoio maoD/);
  });
  it('acusa barra esticando entre as mãos (distância fixa)', () => {
    const aberto = emPe({ ombroE: [-10, 0, 30], ombroD: [-10, 0, 0], cotoveloE: [-10, 0, 0], cotoveloD: [-10, 0, 0] });
    expect(validarReceita(rosca(quadros(embaixo, aberto))).join()).toMatch(/distância maoE–maoD/);
  });
  it('acusa assimetria quando a receita declara simetria', () => {
    const torto = emPe({ ombroE: [-10, 0, 0], ombroD: [-10, 0, 0], cotoveloE: [-140, 0, 0], cotoveloD: [-10, 0, 0] });
    const r = { ...rosca(quadros(embaixo, torto)), contatos: [{ tipo: 'simetria' as const }] };
    expect(validarReceita(r).join()).toMatch(/simetria/);
  });
  it('acusa ritmo rápido demais', () => {
    const q = quadros(embaixo, emCima).map((x) => ({ ...x, ms: 200 }));
    const erros = validarReceita(rosca(q)).join();
    expect(erros).toMatch(/excêntrica/);
    expect(erros).toMatch(/concêntrica/);
  });
  it('isométrica dispensa a regra de ritmo', () => {
    const q: Quadro[] = [
      { pose: embaixo, ms: 1000, fase: 'pausa' },
      { pose: embaixo, ms: 1000, fase: 'pausa' },
    ];
    expect(validarReceita({ ...rosca(q), isometrica: true })).toEqual([]);
  });
});
