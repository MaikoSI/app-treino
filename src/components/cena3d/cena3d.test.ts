import { Mesh, type MeshStandardMaterial, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { POSE_NEUTRA, type Pose, posicoes, type Vec3 } from '../../lib/esqueleto';
import { montarEquipamento } from './equipamentos';
import { type CoresCena, criarManequim } from './manequim';

const CORES: CoresCena = { corpo: '#d8d2cc', destaque: '#ff9500', estofado: '#3a3a3c', metal: '#aeaeb2', peso: '#2c2c2e', chao: '#e5e5ea' };

const perto = (a: Vector3, b: Vec3) => expect(a.distanceTo(new Vector3(...b))).toBeLessThan(1e-3);

const POSES: Pose[] = [
  POSE_NEUTRA,
  {
    raiz: { pos: [0.1, 0.6, -0.2], rot: [-90, 10, 5] },
    rot: { ombroE: [-60, 20, 40], cotoveloE: [-90, 0, 0], quadrilD: [-80, 10, -15], joelhoD: [70, 0, 0], coluna: [20, 5, 0] },
  },
];

describe('criarManequim', () => {
  it.each(POSES.map((p, i) => [i, p] as const))('pose %i: articulações do 3D batem com a cinemática de lib/esqueleto', (_, pose) => {
    const m = criarManequim(CORES);
    m.aplicarPose(pose);
    m.raiz.updateMatrixWorld(true);
    const esperado = posicoes(pose);
    for (const art of ['quadril', 'ombroE', 'cotoveloE', 'punhoE', 'joelhoD', 'tornozeloD'] as const) {
      perto(m.ossos[art].getWorldPosition(new Vector3()), esperado[art]);
    }
    perto(m.ponto('maoE'), esperado.maoE);
    perto(m.ponto('peD'), esperado.peD);
  });

  it('destaca o grupo muscular e troca as cores com o tema', () => {
    const m = criarManequim(CORES);
    m.destacar('Peito');
    const peitoral = m.raiz.getObjectByName('regiao-Peito') as Mesh;
    expect((peitoral.material as MeshStandardMaterial).color.getHexString()).toBe('ff9500');
    m.definirCores({ ...CORES, destaque: '#ff0000', corpo: '#00ff00' });
    expect((peitoral.material as MeshStandardMaterial).color.getHexString()).toBe('ff0000');
    const cabeca = m.raiz.getObjectByName('cabeca') as Mesh;
    expect((cabeca.material as MeshStandardMaterial).color.getHexString()).toBe('00ff00');
  });
});

describe('montarEquipamento', () => {
  it('barra nas mãos fica no meio delas e acompanha o movimento', () => {
    const m = criarManequim(CORES);
    const barra = montarEquipamento({ tipo: 'barra', em: 'maos' }, m);
    const pose: Pose = { ...POSE_NEUTRA, rot: { cotoveloE: [-90, 0, 0], cotoveloD: [-90, 0, 0] } };
    m.aplicarPose(pose);
    m.raiz.updateMatrixWorld(true);
    barra.atualizar(pose);
    const p = posicoes(pose);
    perto(barra.objeto.position, [(p.maoE[0] + p.maoD[0]) / 2, (p.maoE[1] + p.maoD[1]) / 2, (p.maoE[2] + p.maoD[2]) / 2]);
  });

  it('cabo liga a roldana ao ponto preso', () => {
    const m = criarManequim(CORES);
    const cabo = montarEquipamento({ tipo: 'cabo', de: [0, 2.3, 0.3], ate: 'maoD', acessorio: 'puxador' }, m);
    m.aplicarPose(POSE_NEUTRA);
    m.raiz.updateMatrixWorld(true);
    cabo.atualizar(POSE_NEUTRA);
    const fio = cabo.objeto.getObjectByName('fio') as Mesh;
    const fim = posicoes(POSE_NEUTRA).maoD;
    expect(fio.scale.y).toBeCloseTo(Math.hypot(fim[0], fim[1] - 2.3, fim[2] - 0.3), 3);
  });

  it('cores do equipamento seguem o tema', () => {
    const m = criarManequim(CORES);
    const h = montarEquipamento({ tipo: 'halter', em: 'maoE' }, m);
    h.definirCores({ ...CORES, peso: '#123456' });
    let achou = false;
    h.objeto.traverse((o) => {
      if (o instanceof Mesh && (o.material as MeshStandardMaterial).color.getHexString() === '123456') achou = true;
    });
    expect(achou).toBe(true);
  });
});
