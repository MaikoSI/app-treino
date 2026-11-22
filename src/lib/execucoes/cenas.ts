/** Peças de cenário reaproveitadas pelas receitas (bancos, suportes, polias). Medidas em metros. */
import type { Vec3 } from '../esqueleto';
import type { Equipamento3D } from '../execucao';

/** Banco reto com o estofado de `zIni` a `zFim` e o topo na altura `topo`. */
export function bancoReto(zIni: number, zFim: number, topo = 0.45, largura = 0.3, x = 0): Equipamento3D[] {
  const zc = (zIni + zFim) / 2;
  const comp = Math.abs(zFim - zIni);
  return [
    { tipo: 'caixa', pos: [x, topo - 0.04, zc], tam: [largura, 0.08, comp], material: 'estofado' },
    { tipo: 'caixa', pos: [x, (topo - 0.08) / 2, zc], tam: [0.08, topo - 0.08, comp * 0.8], material: 'metal' },
    { tipo: 'caixa', pos: [x, 0.02, zIni + Math.sign(zFim - zIni) * 0.1], tam: [0.45, 0.04, 0.06], material: 'metal' },
    { tipo: 'caixa', pos: [x, 0.02, zFim - Math.sign(zFim - zIni) * 0.1], tam: [0.45, 0.04, 0.06], material: 'metal' },
  ];
}

/**
 * Banco com encosto inclinado `graus` (0 = reto, positivo = cabeça mais alta, negativo = declinado).
 * O encosto parte do ponto `dobra` (junção com o assento) em direção a −z.
 */
export function bancoInclinado(graus: number, dobra: Vec3, compEncosto = 0.85, compAssento = 0.4): Equipamento3D[] {
  const a = (graus * Math.PI) / 180;
  const meio: Vec3 = [0, dobra[1] - 0.04 + Math.sin(a) * (compEncosto / 2), dobra[2] - Math.cos(a) * (compEncosto / 2)];
  return [
    { tipo: 'caixa', pos: meio, tam: [0.3, 0.08, compEncosto], rot: [graus, 0, 0], material: 'estofado' },
    { tipo: 'caixa', pos: [0, dobra[1] - 0.04, dobra[2] + compAssento / 2], tam: [0.3, 0.08, compAssento], material: 'estofado' },
    { tipo: 'caixa', pos: [0, (dobra[1] - 0.08) / 2, dobra[2]], tam: [0.08, dobra[1] - 0.08, 0.5], material: 'metal' },
    { tipo: 'caixa', pos: [0, 0.02, dobra[2]], tam: [0.5, 0.04, 0.9], material: 'metal' },
  ];
}

/** Suporte em pé (rack) com dois montantes em x = ±largura, na profundidade z. */
export function suporte(z: number, altura: number, largura = 0.55): Equipamento3D[] {
  return [
    { tipo: 'tubo', de: [largura, 0, z], ate: [largura, altura, z], raio: 0.025 },
    { tipo: 'tubo', de: [-largura, 0, z], ate: [-largura, altura, z], raio: 0.025 },
    { tipo: 'caixa', pos: [largura, altura - 0.05, z + 0.04], tam: [0.05, 0.05, 0.08], material: 'metal' },
    { tipo: 'caixa', pos: [-largura, altura - 0.05, z + 0.04], tam: [0.05, 0.05, 0.08], material: 'metal' },
  ];
}

/** Coluna de polia: torre vertical em `base` (x, z) com um braço até a roldana. */
export function torrePolia(roldana: Vec3, base: [number, number] = [roldana[0], roldana[2]]): Equipamento3D[] {
  const topo = Math.max(roldana[1] + 0.1, 2.2);
  return [
    { tipo: 'caixa', pos: [base[0], topo / 2, base[1]], tam: [0.16, topo, 0.16], material: 'metal' },
    { tipo: 'tubo', de: [base[0], roldana[1], base[1]], ate: roldana, raio: 0.025 },
    { tipo: 'caixa', pos: roldana, tam: [0.05, 0.1, 0.1], material: 'metal' },
  ];
}

/** Banco de máquina com encosto vertical (o corpo de `sentadoComEncosto` encaixa nele). */
export function maquinaSentado(): Equipamento3D[] {
  return [
    { tipo: 'caixa', pos: [0, 0.46, 0.08], tam: [0.42, 0.08, 0.42], material: 'estofado' },
    { tipo: 'caixa', pos: [0, 0.9, -0.2], tam: [0.42, 0.7, 0.08], material: 'estofado' },
    { tipo: 'caixa', pos: [0, 0.21, 0.05], tam: [0.1, 0.42, 0.3], material: 'metal' },
    { tipo: 'caixa', pos: [0, 0.75, -0.29], tam: [0.1, 1.5, 0.1], material: 'metal' },
  ];
}
