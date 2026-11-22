import { ALTURA_QUADRIL, type Pose, pontoLocal } from '../esqueleto';
import { suporte } from './cenas';
import { ciclo, IK_BRACOS, IK_PERNAS, ik, lerp, misturarRot, pesNoChao } from './construir';
import type { Catalogo } from './tipos';

/** Agachamento genérico: quadril desce até `fundo` m, tronco inclina até `inclinacao` graus. */
function agachar(
  t: number,
  o: { fundo: number; recuo: number; inclinacao: number; largura: number; abertura: number; maosNaBarraDasCostas?: boolean },
): Pose {
  const semente: Pose = {
    raiz: { pos: [0, lerp(ALTURA_QUADRIL - 0.01, o.fundo, t), lerp(0, -o.recuo, t)], rot: [lerp(0, o.inclinacao, t), 0, 0] },
    rot: {
      coluna: [lerp(2, 6, t), 0, 0],
      ...misturarRot(
        { quadrilE: [0, 0, 6], quadrilD: [0, 0, -6], joelhoE: [2, 0, 0], joelhoD: [2, 0, 0] },
        {
          quadrilE: [-120, -10, 20],
          quadrilD: [-120, 10, -20],
          joelhoE: [115, 0, 0],
          joelhoD: [115, 0, 0],
          tornozeloE: [-30, 0, 0],
          tornozeloD: [-30, 0, 0],
        },
        t,
      ),
    },
  };
  const pose = ik(semente, pesNoChao(o.largura, 0, o.abertura), IK_PERNAS);
  return o.maosNaBarraDasCostas ? { ...pose, rot: { ...pose.rot, ...bracosNaBarraDasCostas() } } : pose;
}

let bracosCache: Pose['rot'] | undefined;
/** Braços segurando a barra nas costas. Ficam fixos em relação ao tronco, então são resolvidos uma vez, em pé. */
function bracosNaBarraDasCostas(): Pose['rot'] {
  if (bracosCache) return bracosCache;
  const pe: Pose = {
    raiz: { pos: [0, ALTURA_QUADRIL, 0], rot: [0, 0, 0] },
    rot: { ombroE: [-129, 62, 156], ombroD: [-129, -62, -156], cotoveloE: [-133, 0, 0], cotoveloD: [-133, 0, 0] },
  };
  const r = ik(
    pe,
    [
      { ponto: 'maoE', pos: pontoLocal(pe, 'coluna', [0.42, 0.4, -0.1]) },
      { ponto: 'maoD', pos: pontoLocal(pe, 'coluna', [-0.42, 0.4, -0.1]) },
    ],
    IK_BRACOS,
  ).rot;
  bracosCache = { ombroE: r.ombroE, ombroD: r.ombroD, cotoveloE: r.cotoveloE, cotoveloD: r.cotoveloD };
  return bracosCache;
}

export const PERNAS: Catalogo = {
  'Agachamento livre': () => ({
    receita: {
      cena: [...suporte(-0.35, 1.4, 0.6), { tipo: 'barra', em: 'maos' }],
      quadros: ciclo({
        primeira: 'excentrica',
        pose: (t) => agachar(t, { fundo: 0.5, recuo: 0.2, inclinacao: 35, largura: 0.22, abertura: 20, maosNaBarraDasCostas: true }),
      }),
      camera: { azimute: 60, elevacao: 10 },
      contatos: [
        { tipo: 'apoio', ponto: 'peE', eixo: 'xyz' },
        { tipo: 'apoio', ponto: 'peD', eixo: 'xyz' },
        { tipo: 'apoio', ponto: 'tornozeloE', eixo: 'xyz' },
        { tipo: 'distanciaFixa', a: 'maoE', b: 'maoD' },
        { tipo: 'simetria' },
      ],
    },
    descricao: 'Em pé com a barra nas costas, o quadril desce para trás até as coxas ficarem paralelas ao chão e o corpo sobe de volta.',
    explicacao: {
      posicao: [
        'Apoie a barra no alto das costas (no trapézio, não no pescoço) e segure com as mãos mais abertas que os ombros.',
        'Pés um pouco mais abertos que a largura dos ombros, com as pontas viradas levemente para fora.',
        'Peito aberto, olhar para a frente e abdômen firme.',
      ],
      execucao: [
        'Desça levando o quadril para trás e para baixo, como se fosse sentar numa cadeira, por cerca de 2 segundos.',
        'Os joelhos acompanham a direção das pontas dos pés, sem fechar para dentro.',
        'Desça até as coxas ficarem paralelas ao chão (ou o mais fundo que conseguir com a coluna reta).',
        'Empurre o chão com o pé inteiro e suba até ficar em pé de novo.',
      ],
      respiracao: 'Puxe o ar e trave o abdômen antes de descer; solte o ar no fim da subida.',
      erros: ['Deixar os joelhos caírem para dentro.', 'Tirar os calcanhares do chão.', 'Arredondar a lombar no fundo do movimento.'],
      dica: 'Comece só com a barra (ou sem peso) até o movimento ficar natural.',
    },
  }),
};
