/**
 * Manequim 3D montado com formas simples (cápsulas, esferas, caixas arredondadas), com a mesma
 * hierarquia e as mesmas medidas de lib/esqueleto: aplicar uma Pose aqui coloca cada articulação
 * exatamente onde `posicoes(pose)` calcula (testado em cena3d.test.ts).
 */
import { CapsuleGeometry, Color, Euler, Group, Mesh, MeshStandardMaterial, type Object3D, SphereGeometry, Vector3 } from 'three';
import type { GrupoMuscular } from '../../db/tipos';
import { type Articulacao, EXTREMIDADE, type Extremidade, ORDEM, OSSO, PAI, type Ponto, type Pose, type Vec3 } from '../../lib/esqueleto';

export interface CoresCena {
  corpo: string;
  destaque: string;
  estofado: string;
  metal: string;
  peso: string;
  chao: string;
}

export interface Manequim {
  raiz: Group;
  ossos: Record<Articulacao, Group>;
  aplicarPose(p: Pose): void;
  /** Posição no mundo de uma articulação ou extremidade (depois de aplicarPose + updateMatrixWorld). */
  ponto(p: Ponto): Vector3;
  destacar(grupo: GrupoMuscular | undefined): void;
  definirCores(c: CoresCena): void;
  descartar(): void;
}

const RAD = Math.PI / 180;

/** Partes do corpo que ganham a cor de destaque para cada grupo muscular. */
const REGIOES: Record<GrupoMuscular, string[]> = {
  Peito: ['regiao-Peito'],
  Costas: ['regiao-Costas'],
  Ombros: ['deltoideE', 'deltoideD'],
  Bíceps: ['bracoE', 'bracoD'],
  Tríceps: ['bracoE', 'bracoD'],
  Antebraço: ['antebracoE', 'antebracoD'],
  Quadríceps: ['coxaE', 'coxaD'],
  Posteriores: ['coxaE', 'coxaD'],
  Glúteos: ['pelve'],
  Panturrilha: ['pernaE', 'pernaD'],
  Abdômen: ['regiao-Abdômen'],
};

export function criarManequim(cores: CoresCena): Manequim {
  const corpo = new MeshStandardMaterial({ color: cores.corpo, roughness: 0.55, metalness: 0.05 });
  const destaque = new MeshStandardMaterial({ color: cores.destaque, roughness: 0.5, metalness: 0.05 });
  const geometrias: { dispose(): void }[] = [];
  const malhas: Mesh[] = [];

  const ossos = {} as Record<Articulacao, Group>;
  for (const a of ORDEM) {
    const g = new Group();
    g.name = `osso-${a}`;
    g.rotation.order = 'XYZ';
    ossos[a] = g;
    if (a !== 'quadril') {
      g.position.set(...OSSO[a]);
      ossos[PAI[a]].add(g);
    }
  }
  const raiz = new Group();
  raiz.add(ossos.quadril);

  const malha = (
    nome: string,
    geo: CapsuleGeometry | SphereGeometry,
    pai: Object3D,
    pos: Vec3,
    escala: Vec3 = [1, 1, 1],
    rot: Vec3 = [0, 0, 0],
  ) => {
    geometrias.push(geo);
    const m = new Mesh(geo, corpo);
    m.name = nome;
    m.position.set(...pos);
    m.scale.set(...escala);
    m.rotation.set(rot[0] * RAD, rot[1] * RAD, rot[2] * RAD);
    m.castShadow = true;
    pai.add(m);
    malhas.push(m);
    return m;
  };
  /** Cápsula ao longo do osso que sai de `a` até `filho` (comprimento = OSSO[filho]). */
  const segmento = (nome: string, a: Articulacao, comp: number, raio: number) =>
    malha(nome, new CapsuleGeometry(raio, Math.max(comp - raio * 2, 0.01), 6, 14), ossos[a], [0, -comp / 2, 0]);

  // Tronco e cabeça
  malha('pelve', new SphereGeometry(1, 20, 14), ossos.quadril, [0, 0.0, -0.005], [0.16, 0.11, 0.11]);
  malha('tronco', new CapsuleGeometry(0.12, 0.2, 8, 18), ossos.coluna, [0, 0.2, 0], [1.25, 1, 0.82]);
  malha('regiao-Peito', new SphereGeometry(1, 18, 12), ossos.coluna, [0, 0.3, 0.05], [0.15, 0.08, 0.06]);
  malha('regiao-Abdômen', new SphereGeometry(1, 16, 12), ossos.coluna, [0, 0.1, 0.055], [0.1, 0.1, 0.05]);
  malha('regiao-Costas', new SphereGeometry(1, 18, 12), ossos.coluna, [0, 0.24, -0.05], [0.16, 0.14, 0.06]);
  malha('pescoco', new CapsuleGeometry(0.045, 0.06, 4, 10), ossos.pescoco, [0, 0.04, 0]);
  malha('cabeca', new SphereGeometry(0.1, 24, 18), ossos.pescoco, [...EXTREMIDADE.cabeca.desloc], [0.92, 1.12, 1]);

  for (const l of ['E', 'D'] as const) {
    malha(`deltoide${l}`, new SphereGeometry(0.062, 16, 12), ossos[`ombro${l}`], [0, -0.01, 0]);
    segmento(`braco${l}`, `ombro${l}`, -OSSO[`cotovelo${l}`][1], 0.047);
    segmento(`antebraco${l}`, `cotovelo${l}`, -OSSO[`punho${l}`][1], 0.038);
    malha(`mao${l}`, new SphereGeometry(1, 12, 10), ossos[`punho${l}`], [0, -0.05, 0], [0.032, 0.055, 0.022]);
    segmento(`coxa${l}`, `quadril${l}`, -OSSO[`joelho${l}`][1], 0.072);
    segmento(`perna${l}`, `joelho${l}`, -OSSO[`tornozelo${l}`][1], 0.052);
    malha(`pe${l}`, new CapsuleGeometry(0.038, 0.14, 4, 10), ossos[`tornozelo${l}`], [0, -0.045, 0.05], [1.05, 0.75, 1], [90, 0, 0]);
  }

  const destacados = new Set<string>();
  return {
    raiz,
    ossos,
    aplicarPose(p) {
      ossos.quadril.position.set(...p.raiz.pos);
      ossos.quadril.rotation.set(p.raiz.rot[0] * RAD, p.raiz.rot[1] * RAD, p.raiz.rot[2] * RAD, 'XYZ');
      for (const a of ORDEM.slice(1)) {
        const r = p.rot[a];
        ossos[a].rotation.set((r?.[0] ?? 0) * RAD, (r?.[1] ?? 0) * RAD, (r?.[2] ?? 0) * RAD, 'XYZ');
      }
    },
    ponto(p) {
      if (p in EXTREMIDADE) {
        const { de, desloc } = EXTREMIDADE[p as Extremidade];
        return ossos[de].localToWorld(new Vector3(...desloc));
      }
      return ossos[p as Articulacao].getWorldPosition(new Vector3());
    },
    destacar(grupo) {
      destacados.clear();
      for (const n of grupo ? REGIOES[grupo] : []) destacados.add(n);
      for (const m of malhas) m.material = destacados.has(m.name) ? destaque : corpo;
    },
    definirCores(c) {
      corpo.color = new Color(c.corpo);
      destaque.color = new Color(c.destaque);
    },
    descartar() {
      for (const g of geometrias) g.dispose();
      corpo.dispose();
      destaque.dispose();
    },
  };
}

/** Rotação Euler (graus) em radianos, para quem monta peças fixas. */
export const euler = (r: Vec3 = [0, 0, 0]) => new Euler(r[0] * RAD, r[1] * RAD, r[2] * RAD, 'XYZ');
