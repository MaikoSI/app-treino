/**
 * Receitas de execução: as poses-chave de um exercício no tempo, o equipamento da cena
 * e os contatos que precisam se manter (pé no chão, barra rígida entre as mãos…).
 * Tudo puro e testável; quem desenha em 3D é components/Boneco3D.
 */
import { type Articulacao, foraDosLimites, ORDEM, type Ponto, type Pose, posicoes, type Vec3 } from './esqueleto';

/** Onde um objeto móvel fica preso: um ponto do corpo ou o meio entre dois pontos. */
export type Fixacao = Ponto | 'maos' | 'pes' | 'ombros' | { art: Articulacao; desloc: Vec3 };

export type Acessorio = 'corda' | 'barra' | 'triangulo' | 'puxador' | 'tornozeleira';

/** Peças da cena. As fixas usam `pos` no mundo; as móveis seguem uma `Fixacao`. */
export type Equipamento3D =
  /** Bloco fixo: estofado de banco/máquina ou estrutura metálica. */
  | { tipo: 'caixa'; pos: Vec3; tam: Vec3; rot?: Vec3; material?: 'estofado' | 'metal' }
  /** Tubo fixo (barra fixa, paralelas, guias do Smith, colunas). */
  | { tipo: 'tubo'; de: Vec3; ate: Vec3; raio?: number }
  /** Barra olímpica com anilhas; com 'maos' fica alinhada às duas mãos. */
  | { tipo: 'barra'; em: Fixacao; comprimento?: number; anilhas?: boolean; desloc?: Vec3 }
  /** Halter na mão; pegada neutra = cabo apontando para a frente da mão (palma virada para o corpo). */
  | { tipo: 'halter'; em: 'maoE' | 'maoD'; pegada?: 'neutra' | 'pronada' }
  /** Cabo da polia: da roldana até o ponto preso, com o acessório na ponta. */
  | { tipo: 'cabo'; de: Vec3; ate: Fixacao; acessorio: Acessorio }
  /** Alavanca rígida presa num pivô (barra T, landmine): vai do pivô até o ponto preso e passa `alem` m dele, com anilha na ponta. */
  | { tipo: 'alavanca'; de: Vec3; ate: Fixacao; alem?: number; anilha?: boolean }
  /** Peça móvel de máquina (plataforma, rolo, pegador) que acompanha um ponto do corpo. */
  | { tipo: 'placa'; em: Fixacao; tam: Vec3; rot?: Vec3; desloc?: Vec3; material?: 'estofado' | 'metal' };

export type Fase = 'concentrica' | 'excentrica' | 'pausa';

export interface Quadro {
  pose: Pose;
  /** Duração (ms) da transição deste quadro até o próximo (o último volta ao primeiro). */
  ms: number;
  fase: Fase;
  /** Transição linear até o próximo quadro (quadros intermediários de um movimento já suavizado). */
  linear?: boolean;
}

export type Contato =
  | { tipo: 'apoio'; ponto: Ponto; eixo: 'y' | 'xyz' }
  | { tipo: 'distanciaFixa'; a: Ponto; b: Ponto }
  | { tipo: 'simetria' };

export interface ReceitaExecucao {
  cena: Equipamento3D[];
  quadros: Quadro[];
  /** Câmera inicial (graus): azimute 0 = de frente para o boneco em pé, 90 = pela esquerda dele. A distância se ajusta à cena. */
  camera: { azimute: number; elevacao: number };
  contatos: Contato[];
  /** Exercício parado (ex.: prancha): dispensa a regra de ritmo. */
  isometrica?: boolean;
}

const ZERO: Vec3 = [0, 0, 0];

export function duracaoCiclo(r: ReceitaExecucao): number {
  return r.quadros.reduce((s, q) => s + q.ms, 0);
}

const suavizar = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;
const misturar = (a: Vec3, b: Vec3, t: number): Vec3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

function interpolar(a: Pose, b: Pose, t: number): Pose {
  const rot: Pose['rot'] = {};
  for (const art of ORDEM) {
    const ra = a.rot[art];
    const rb = b.rot[art];
    if (ra || rb) rot[art] = misturar(ra ?? ZERO, rb ?? ZERO, t);
  }
  return { raiz: { pos: misturar(a.raiz.pos, b.raiz.pos, t), rot: misturar(a.raiz.rot, b.raiz.rot, t) }, rot };
}

/** Pose no instante `ms` do ciclo (que se repete), com transição suave entre os quadros. */
export function poseNoTempo(r: ReceitaExecucao, ms: number): Pose {
  const total = duracaoCiclo(r);
  if (total <= 0 || r.quadros.length < 2) return r.quadros[0].pose;
  let t = ((ms % total) + total) % total;
  for (let i = 0; i < r.quadros.length; i++) {
    const q = r.quadros[i];
    if (t < q.ms) {
      if (t === 0) return q.pose;
      const u = t / q.ms;
      return interpolar(q.pose, r.quadros[(i + 1) % r.quadros.length].pose, q.linear ? u : suavizar(u));
    }
    t -= q.ms;
  }
  return r.quadros[0].pose;
}

function distanciaAngular(a: Pose, b: Pose): number {
  let s = 0;
  for (const art of ORDEM) {
    const ra = a.rot[art] ?? ZERO;
    const rb = b.rot[art] ?? ZERO;
    s += Math.abs(ra[0] - rb[0]) + Math.abs(ra[1] - rb[1]) + Math.abs(ra[2] - rb[2]);
  }
  for (let i = 0; i < 3; i++) s += Math.abs(a.raiz.rot[i] - b.raiz.rot[i]) + 100 * Math.abs(a.raiz.pos[i] - b.raiz.pos[i]);
  return s;
}

/** Pose inicial e a mais distante dela (o "fim" do movimento), para a versão sem animação. */
export function posesExtremas(r: ReceitaExecucao): { inicio: Pose; fim: Pose } {
  const inicio = r.quadros[0].pose;
  let fim = inicio;
  let maior = -1;
  for (const q of r.quadros) {
    const d = distanciaAngular(inicio, q.pose);
    if (d > maior) {
      maior = d;
      fim = q.pose;
    }
  }
  return { inicio, fim };
}

const OPOSTO = (a: Articulacao): Articulacao =>
  (a.endsWith('E') ? `${a.slice(0, -1)}D` : a.endsWith('D') ? `${a.slice(0, -1)}E` : a) as Articulacao;
const espelharRot = (v: Vec3): Vec3 => [v[0], -v[1], -v[2]];

/** A mesma pose feita com o outro lado do corpo (para exercícios unilaterais/alternados). */
export function espelhar(p: Pose): Pose {
  const rot: Pose['rot'] = {};
  for (const [a, v] of Object.entries(p.rot) as [Articulacao, Vec3][]) rot[OPOSTO(a)] = espelharRot(v);
  return { raiz: { pos: [-p.raiz.pos[0], p.raiz.pos[1], p.raiz.pos[2]], rot: espelharRot(p.raiz.rot) }, rot };
}

const TOLERANCIA = 0.02; // 2 cm
const PARES: [Ponto, Ponto][] = [
  ['ombroE', 'ombroD'],
  ['cotoveloE', 'cotoveloD'],
  ['punhoE', 'punhoD'],
  ['maoE', 'maoD'],
  ['quadrilE', 'quadrilD'],
  ['joelhoE', 'joelhoD'],
  ['tornozeloE', 'tornozeloD'],
  ['peE', 'peD'],
];

const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const cm = (m: number) => `${Math.round(m * 100)} cm`;

/**
 * Problemas da receita: estrutura, articulações fora da amplitude, contatos que não se mantêm
 * ao longo do ciclo (amostrado em `amostras` instantes) e ritmo rápido demais para entender.
 */
export function validarReceita(r: ReceitaExecucao, amostras = 60): string[] {
  const erros: string[] = [];
  if (r.quadros.length < 2) erros.push('precisa de pelo menos 2 quadros');
  if (r.quadros.some((q) => !(q.ms > 0))) erros.push('todo quadro precisa de duração > 0');
  if (erros.length) return erros;

  const total = duracaoCiclo(r);
  const instantes = [...r.quadros.map((_, i) => r.quadros.slice(0, i).reduce((s, q) => s + q.ms, 0))];
  for (let i = 0; i < amostras; i++) instantes.push((i * total) / amostras);
  const poses = instantes.map((ms) => ({ ms, pose: poseNoTempo(r, ms) }));
  const pos = poses.map((p) => posicoes(p.pose));

  const vistos = new Set<string>();
  for (const { ms, pose } of poses)
    for (const e of foraDosLimites(pose)) {
      const art = e.split(':')[0];
      if (!vistos.has(art)) erros.push(`t=${Math.round(ms)}: ${e}`);
      vistos.add(art);
    }

  const ref = pos[0];
  for (const c of r.contatos) {
    if (c.tipo === 'apoio') {
      const desvio = Math.max(
        ...pos.map((p) => (c.eixo === 'y' ? Math.abs(p[c.ponto][1] - ref[c.ponto][1]) : dist(p[c.ponto], ref[c.ponto]))),
      );
      if (desvio > TOLERANCIA) erros.push(`apoio ${c.ponto} (${c.eixo}) se move ${cm(desvio)}`);
    } else if (c.tipo === 'distanciaFixa') {
      const d0 = dist(ref[c.a], ref[c.b]);
      const desvio = Math.max(...pos.map((p) => Math.abs(dist(p[c.a], p[c.b]) - d0)));
      if (desvio > TOLERANCIA) erros.push(`distância ${c.a}–${c.b} varia ${cm(desvio)}`);
    } else {
      let pior = 0;
      let par = '';
      pos.forEach((p, i) => {
        const cx = poses[i].pose.raiz.pos[0];
        for (const [e, d] of PARES) {
          const desvio = Math.max(Math.abs(p[e][0] - cx + (p[d][0] - cx)), Math.abs(p[e][1] - p[d][1]), Math.abs(p[e][2] - p[d][2]));
          if (desvio > pior) {
            pior = desvio;
            par = `${e}/${d}`;
          }
        }
      });
      if (pior > TOLERANCIA) erros.push(`simetria quebrada em ${par} (${cm(pior)})`);
    }
  }

  if (!r.isometrica) {
    const soma = (f: Fase) => r.quadros.filter((q) => q.fase === f).reduce((s, q) => s + q.ms, 0);
    if (soma('excentrica') < 1500) erros.push(`fase excêntrica (volta) curta demais: ${soma('excentrica')} ms`);
    if (soma('concentrica') < 700) erros.push(`fase concêntrica (ida) curta demais: ${soma('concentrica')} ms`);
  }
  return erros;
}
