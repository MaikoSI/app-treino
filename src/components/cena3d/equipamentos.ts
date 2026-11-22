/** Peças de academia em 3D (bancos, barras, halteres, cabos, plataformas) a partir de Equipamento3D. */
import {
  BoxGeometry,
  type BufferGeometry,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
  Quaternion,
  TorusGeometry,
  Vector3,
} from 'three';
import { type Pose, pontoLocal } from '../../lib/esqueleto';
import type { Equipamento3D, Fixacao } from '../../lib/execucao';
import { type CoresCena, euler, type Manequim } from './manequim';

export interface Peca {
  objeto: Object3D;
  /** Reposiciona as peças móveis (chamar depois de aplicarPose + updateMatrixWorld do manequim). */
  atualizar(pose: Pose): void;
  definirCores(c: CoresCena): void;
  descartar(): void;
}

type Tinta = 'estofado' | 'metal' | 'peso';

const CIMA = new Vector3(0, 1, 0);

/** Posição no mundo de uma fixação. */
function resolver(f: Fixacao, m: Manequim, pose: Pose): Vector3 {
  if (typeof f === 'object') return new Vector3(...pontoLocal(pose, f.art, f.desloc));
  const meio = (a: Vector3, b: Vector3) => a.add(b).multiplyScalar(0.5);
  if (f === 'maos') return meio(m.ponto('maoE'), m.ponto('maoD'));
  if (f === 'pes') return meio(m.ponto('peE'), m.ponto('peD'));
  if (f === 'ombros') return meio(m.ponto('ombroE'), m.ponto('ombroD'));
  return m.ponto(f);
}

/** Orienta um objeto cujo eixo é Y para apontar de `a` para `b`, esticando-o até o comprimento. */
function esticar(o: Object3D, a: Vector3, b: Vector3, esticarY = true) {
  const d = new Vector3().subVectors(b, a);
  const comp = d.length();
  o.position.copy(a).add(b).multiplyScalar(0.5);
  if (comp > 1e-6) o.quaternion.setFromUnitVectors(CIMA, d.clone().divideScalar(comp));
  if (esticarY) o.scale.set(1, comp, 1);
}

export function montarEquipamento(e: Equipamento3D, m: Manequim, cores?: CoresCena): Peca {
  const materiais: Record<Tinta, MeshStandardMaterial> = {
    estofado: new MeshStandardMaterial({ roughness: 0.8 }),
    metal: new MeshStandardMaterial({ roughness: 0.35, metalness: 0.6 }),
    peso: new MeshStandardMaterial({ roughness: 0.6, metalness: 0.2 }),
  };
  const geos: BufferGeometry[] = [];
  const raiz = new Group();
  const malha = (geo: BufferGeometry, tinta: Tinta, pai: Object3D = raiz, nome = '') => {
    geos.push(geo);
    const x = new Mesh(geo, materiais[tinta]);
    x.name = nome;
    x.castShadow = true;
    x.receiveShadow = true;
    pai.add(x);
    return x;
  };
  /** Barra horizontal ao longo de X (eixo do cilindro girado), com anilhas opcionais. */
  const barraX = (pai: Object3D, comp: number, anilhas: boolean, raio = 0.014) => {
    const b = malha(new CylinderGeometry(raio, raio, comp, 10), 'metal', pai);
    b.rotation.z = Math.PI / 2;
    if (anilhas)
      for (const s of [-1, 1]) {
        const a = malha(new CylinderGeometry(comp >= 1.5 ? 0.17 : 0.11, comp >= 1.5 ? 0.17 : 0.11, 0.045, 28), 'peso', pai);
        a.rotation.z = Math.PI / 2;
        a.position.x = s * (comp / 2 - (comp >= 1.5 ? 0.22 : 0.1));
      }
  };

  let atualizar: (pose: Pose) => void = () => {};

  switch (e.tipo) {
    case 'caixa': {
      const c = malha(new BoxGeometry(...e.tam), e.material ?? 'metal');
      c.position.set(...e.pos);
      c.rotation.copy(euler(e.rot));
      c.castShadow = true;
      break;
    }
    case 'tubo': {
      const t = malha(new CylinderGeometry(e.raio ?? 0.03, e.raio ?? 0.03, 1, 12), 'metal');
      esticar(t, new Vector3(...e.de), new Vector3(...e.ate));
      break;
    }
    case 'barra': {
      const comp = e.comprimento ?? 1.9;
      const g = raiz;
      barraX(g, comp, e.anilhas ?? comp >= 1.5);
      atualizar = (pose) => {
        g.position.copy(resolver(e.em, m, pose));
        if (e.desloc) g.position.add(new Vector3(...e.desloc));
        if (e.em === 'maos') {
          const dir = m.ponto('maoE').sub(m.ponto('maoD')).normalize();
          g.quaternion.setFromUnitVectors(new Vector3(1, 0, 0), dir);
        }
      };
      break;
    }
    case 'halter': {
      // Preso ao punho: acompanha a orientação da mão; o cabo cruza a palma (eixo X do punho).
      const g = raiz;
      g.position.set(0, -0.07, 0);
      m.ossos[e.em === 'maoE' ? 'punhoE' : 'punhoD'].add(g);
      // Pegada neutra: o cabo aponta para a frente da mão (eixo Z do punho); pronada: atravessa a palma (eixo X).
      const eixo = new Group();
      g.add(eixo);
      if ((e.pegada ?? 'neutra') === 'neutra') eixo.rotation.y = Math.PI / 2;
      const cabo = malha(new CylinderGeometry(0.016, 0.016, 0.16, 10), 'metal', eixo);
      cabo.rotation.z = Math.PI / 2;
      for (const s of [-1, 1]) {
        const p = malha(new CylinderGeometry(0.055, 0.055, 0.06, 6), 'peso', eixo);
        p.rotation.z = Math.PI / 2;
        p.position.x = s * 0.1;
      }
      break;
    }
    case 'cabo': {
      const fio = malha(new CylinderGeometry(0.006, 0.006, 1, 6), 'metal', raiz, 'fio');
      const ponta = new Group();
      raiz.add(ponta);
      const de = new Vector3(...e.de);
      if (e.acessorio === 'barra') barraX(ponta, e.comprimento ?? 1.1, false, 0.016);
      else if (e.acessorio === 'triangulo') {
        const t = malha(new TorusGeometry(0.07, 0.012, 6, 3), 'metal', ponta);
        t.rotation.x = Math.PI / 2;
      } else if (e.acessorio === 'puxador') {
        const p = malha(new CylinderGeometry(0.018, 0.018, 0.13, 10), 'estofado', ponta);
        p.rotation.z = Math.PI / 2;
      } else if (e.acessorio === 'tornozeleira') {
        malha(new TorusGeometry(0.065, 0.02, 8, 16), 'estofado', ponta).rotation.x = Math.PI / 2;
      }
      // Corda: duas pontas, uma em cada mão, saindo do ponto do cabo.
      const cordas = e.acessorio === 'corda' ? [0, 1].map(() => malha(new CylinderGeometry(0.014, 0.014, 1, 8), 'estofado', raiz)) : [];
      atualizar = (pose) => {
        const alvo = resolver(e.ate, m, pose);
        if (e.acessorio === 'corda') {
          const maoE = m.ponto('maoE');
          const maoD = m.ponto('maoD');
          // O nó da corda fica um pouco antes das mãos, na direção da roldana.
          const no = alvo.clone().add(de.clone().sub(alvo).normalize().multiplyScalar(0.12));
          esticar(fio, de, no);
          esticar(cordas[0], no, maoE);
          esticar(cordas[1], no, maoD);
          return;
        }
        esticar(fio, de, alvo);
        ponta.position.copy(alvo);
        if (e.acessorio === 'barra' && e.ate === 'maos') {
          const dir = m.ponto('maoE').sub(m.ponto('maoD')).normalize();
          ponta.quaternion.setFromUnitVectors(new Vector3(1, 0, 0), dir);
        } else {
          const d = new Vector3().subVectors(de, alvo).normalize();
          ponta.quaternion.copy(new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), d));
        }
      };
      break;
    }
    case 'alavanca': {
      const haste = malha(new CylinderGeometry(0.022, 0.022, 1, 10), 'metal');
      const anilha = e.anilha === false ? null : malha(new CylinderGeometry(0.17, 0.17, 0.05, 28), 'peso');
      const de = new Vector3(...e.de);
      atualizar = (pose) => {
        const alvo = resolver(e.ate, m, pose);
        const dir = alvo.clone().sub(de).normalize();
        const ponta = alvo.clone().add(dir.clone().multiplyScalar(e.alem ?? 0.25));
        esticar(haste, de, ponta);
        if (anilha) {
          anilha.position.copy(ponta).sub(dir.clone().multiplyScalar(0.05));
          anilha.quaternion.setFromUnitVectors(CIMA, dir);
        }
      };
      break;
    }
    case 'placa': {
      const p = malha(new BoxGeometry(...e.tam), e.material ?? 'metal');
      const rot = euler(e.rot);
      atualizar = (pose) => {
        p.position.copy(resolver(e.em, m, pose));
        if (e.desloc) p.position.add(new Vector3(...e.desloc));
        p.rotation.copy(rot);
      };
      break;
    }
  }

  const peca: Peca = {
    objeto: raiz,
    atualizar,
    definirCores(c) {
      materiais.estofado.color = new Color(c.estofado);
      materiais.metal.color = new Color(c.metal);
      materiais.peso.color = new Color(c.peso);
    },
    descartar() {
      for (const g of geos) g.dispose();
      for (const x of Object.values(materiais)) x.dispose();
      raiz.removeFromParent();
    },
  };
  if (cores) peca.definirCores(cores);
  return peca;
}
