import { ALTURA_QUADRIL, type Pose, pontoLocal, posicoes, type Vec3 } from '../esqueleto';
import type { Contato, Equipamento3D } from '../execucao';
import { bancoReto, suporte, torrePolia } from './cenas';
import { apoiar, ciclo, emPeFirme, IK_BRACOS, IK_PERNAS, ik, lerp, mais, maosEm, misturarRot, pesNoChao } from './construir';
import type { Catalogo } from './tipos';

const PES: Contato[] = [
  { tipo: 'apoio', ponto: 'peE', eixo: 'xyz' },
  { tipo: 'apoio', ponto: 'peD', eixo: 'xyz' },
];
const BARRA: Contato = { tipo: 'distanciaFixa', a: 'maoE', b: 'maoD' };
const SIMETRIA: Contato = { tipo: 'simetria' };
const QUADRIL: Contato = { tipo: 'apoio', ponto: 'quadril', eixo: 'xyz' };
const RAD = Math.PI / 180;

interface OpcoesAgachar {
  fundo: number;
  recuo: number;
  inclinacao: number;
  largura: number;
  abertura: number;
  /** Pés à frente do quadril (Smith, hack). */
  peZ?: number;
  /** Altura do quadril em pé (base larga fica mais baixa). */
  topo?: number;
  /** Mantém a barra (ombros) numa vertical: o quadril recua o quanto o tronco inclina (Smith). */
  barraVertical?: boolean;
}

/** Agachamento genérico: o quadril desce até `fundo` m e o tronco inclina até `inclinacao` graus; pés fixos no chão. */
function agachar(t: number, o: OpcoesAgachar): Pose {
  const incl = lerp(0, o.inclinacao, t);
  const z = o.barraVertical ? -0.46 * Math.sin(incl * RAD) : lerp(0, -o.recuo, t);
  const semente: Pose = {
    raiz: { pos: [0, lerp(o.topo ?? ALTURA_QUADRIL - 0.01, o.fundo, t), z], rot: [incl, 0, 0] },
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
  return ik(semente, pesNoChao(o.largura, o.peZ ?? 0, o.abertura), IK_PERNAS);
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

const comBarraNasCostas = (p: Pose): Pose => ({ ...p, rot: { ...p.rot, ...bracosNaBarraDasCostas() } });

/** Braços soltos ao lado do corpo segurando halteres (verticais no mundo, sigam o tronco ou não). */
function bracosPendurados(p: Pose, afastar = 6): Pose {
  const incl = p.raiz.rot[0] + (p.rot.coluna?.[0] ?? 0);
  return {
    ...p,
    rot: { ...p.rot, ombroE: [-incl, 0, afastar], ombroD: [-incl, 0, -afastar], cotoveloE: [-5, 0, 0], cotoveloD: [-5, 0, 0] },
  };
}

const HALTERES: Equipamento3D[] = [
  { tipo: 'halter', em: 'maoE' },
  { tipo: 'halter', em: 'maoD' },
];

const AGACHAR_RESP = 'Puxe o ar e trave o abdômen antes de descer; solte o ar no fim da subida.';

/** Leg press 45°: assento reclinado, plataforma correndo num trilho a 45°. */
const TRILHO: Vec3 = [0, Math.SQRT1_2, Math.SQRT1_2];
const SUBIR_PLACA: Vec3 = [0, Math.SQRT1_2, -Math.SQRT1_2];
function legPress(dist: number, alturaPes = 0.05): Pose {
  const raiz: Pose['raiz'] = { pos: [0, 0.55, 0], rot: [-45, 0, 0] };
  const quadril = posicoes({ raiz, rot: {} }).quadrilE;
  const alvos = [-1, 1].flatMap((s) => {
    const c = mais(
      mais([s * 0.17, quadril[1] + 0.05, quadril[2] + 0.1], TRILHO.map((v) => v * dist) as Vec3),
      SUBIR_PLACA.map((v) => v * alturaPes) as Vec3,
    );
    const lado = s > 0 ? 'E' : 'D';
    return [
      { ponto: `tornozelo${lado}` as const, pos: mais(c, TRILHO.map((v) => v * -0.07) as Vec3) },
      { ponto: `pe${lado}` as const, pos: mais(c, SUBIR_PLACA.map((v) => v * 0.1) as Vec3) },
    ];
  });
  const semente: Pose = {
    raiz,
    rot: { quadrilE: [-80, 0, 10], quadrilD: [-80, 0, -10], joelhoE: [60, 0, 0], joelhoD: [60, 0, 0] },
  };
  const p = ik(semente, alvos, IK_PERNAS);
  return { ...p, rot: { ...p.rot, ombroE: [-20, 0, 25], ombroD: [-20, 0, -25], cotoveloE: [-30, 0, 0], cotoveloD: [-30, 0, 0] } };
}
const CENA_LEG_PRESS: Equipamento3D[] = [
  { tipo: 'caixa', pos: [0, 0.42, -0.05], tam: [0.5, 0.08, 0.45], material: 'estofado' },
  { tipo: 'caixa', pos: [0, 0.69, -0.36], tam: [0.5, 0.08, 0.7], rot: [45, 0, 0], material: 'estofado' },
  { tipo: 'caixa', pos: [0, 0.2, -0.15], tam: [0.12, 0.4, 0.6], material: 'metal' },
  // Trilhos logo atrás da plataforma, na direção em que ela corre (45°).
  { tipo: 'tubo', de: [0.42, 0.85, 0.17], ate: [0.42, 1.95, 1.27], raio: 0.03 },
  { tipo: 'tubo', de: [-0.42, 0.85, 0.17], ate: [-0.42, 1.95, 1.27], raio: 0.03 },
  { tipo: 'tubo', de: [0.42, 0, 1.27], ate: [0.42, 1.95, 1.27], raio: 0.03 },
  { tipo: 'tubo', de: [-0.42, 0, 1.27], ate: [-0.42, 1.95, 1.27], raio: 0.03 },
  { tipo: 'tubo', de: [0.42, 0, 0.17], ate: [0.42, 0.85, 0.17], raio: 0.03 },
  { tipo: 'tubo', de: [-0.42, 0, 0.17], ate: [-0.42, 0.85, 0.17], raio: 0.03 },
  { tipo: 'placa', em: 'pes', tam: [0.75, 0.04, 0.55], rot: [45, 0, 0], desloc: [0, 0.0, 0.06], material: 'metal' },
];

export const PERNAS: Catalogo = {
  'Agachamento livre': () => ({
    receita: {
      cena: [...suporte(-0.35, 1.4, 0.6), { tipo: 'barra', em: 'maos' }],
      quadros: ciclo({
        primeira: 'excentrica',
        pose: (t) => comBarraNasCostas(agachar(t, { fundo: 0.5, recuo: 0.2, inclinacao: 35, largura: 0.22, abertura: 20 })),
      }),
      camera: { azimute: 60, elevacao: 10 },
      contatos: [...PES, { tipo: 'apoio', ponto: 'tornozeloE', eixo: 'xyz' }, BARRA, SIMETRIA],
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
      respiracao: AGACHAR_RESP,
      erros: ['Deixar os joelhos caírem para dentro.', 'Tirar os calcanhares do chão.', 'Arredondar a lombar no fundo do movimento.'],
      dica: 'Comece só com a barra (ou sem peso) até o movimento ficar natural.',
    },
  }),

  'Agachamento no Smith': () => ({
    receita: {
      cena: [
        { tipo: 'tubo', de: [0.62, 0, -0.12], ate: [0.62, 2.1, -0.12], raio: 0.025 },
        { tipo: 'tubo', de: [-0.62, 0, -0.12], ate: [-0.62, 2.1, -0.12], raio: 0.025 },
        { tipo: 'tubo', de: [0.62, 2.1, -0.12], ate: [-0.62, 2.1, -0.12], raio: 0.025 },
        { tipo: 'barra', em: 'maos', comprimento: 1.5, anilhas: true },
      ],
      quadros: ciclo({
        primeira: 'excentrica',
        pose: (t) =>
          comBarraNasCostas(
            agachar(t, { fundo: 0.52, recuo: 0, inclinacao: 20, largura: 0.2, abertura: 15, peZ: 0.1, barraVertical: true }),
          ),
      }),
      camera: { azimute: 65, elevacao: 10 },
      contatos: [...PES, BARRA, SIMETRIA],
    },
    descricao: 'Com a barra do Smith nas costas e os pés um pouco à frente, o quadril desce até as coxas ficarem paralelas ao chão e sobe.',
    explicacao: {
      posicao: [
        'Apoie a barra do Smith no alto das costas e destrave girando os punhos.',
        'Pés na largura dos ombros e um pouco à frente da linha da barra, pontas levemente para fora.',
      ],
      execucao: [
        'Desça dobrando joelhos e quadril, com o tronco mais em pé que no agachamento livre.',
        'Pare quando as coxas ficarem paralelas ao chão.',
        'Empurre o chão e suba até ficar em pé; trave a barra no fim da série.',
      ],
      respiracao: AGACHAR_RESP,
      erros: ['Pés embaixo da barra (sobrecarrega o joelho).', 'Joelhos fechando para dentro.', 'Esquecer de travar a barra no fim.'],
    },
  }),

  'Leg press 45°': () => ({
    receita: {
      cena: CENA_LEG_PRESS,
      quadros: ciclo({ primeira: 'excentrica', pose: (t) => legPress(lerp(0.78, 0.46, t)) }),
      camera: { azimute: 80, elevacao: 12 },
      contatos: [QUADRIL, { tipo: 'distanciaFixa', a: 'peE', b: 'peD' }, SIMETRIA],
    },
    descricao:
      'Sentado no leg press com os pés na plataforma, os joelhos dobram trazendo a plataforma até uns 90 graus e empurram de volta.',
    explicacao: {
      posicao: [
        'Sente com as costas e o quadril bem apoiados no encosto.',
        'Pés no meio da plataforma, na largura dos ombros, pontas levemente para fora.',
        'Solte as travas segurando os pegadores laterais.',
      ],
      execucao: [
        'Dobre os joelhos e desça a plataforma devagar (cerca de 2 segundos) até os joelhos chegarem em uns 90 graus.',
        'Empurre com o pé inteiro até quase esticar as pernas, sem travar os joelhos.',
      ],
      respiracao: 'Puxe o ar na descida e solte ao empurrar.',
      erros: ['Tirar o quadril do banco no fundo.', 'Travar os joelhos esticados.', 'Deixar os joelhos fecharem para dentro.'],
    },
  }),

  'Hack machine': () => ({
    receita: {
      cena: [
        { tipo: 'placa', em: { art: 'coluna', desloc: [0, 0.22, -0.15] }, tam: [0.42, 0.7, 0.06], rot: [-20, 0, 0], material: 'estofado' },
        { tipo: 'placa', em: 'ombros', tam: [0.5, 0.06, 0.12], desloc: [0, 0.06, -0.02], material: 'estofado' },
        { tipo: 'tubo', de: [0.3, 0.1, 0.0], ate: [0.3, 2.0, -0.7], raio: 0.03 },
        { tipo: 'tubo', de: [-0.3, 0.1, 0.0], ate: [-0.3, 2.0, -0.7], raio: 0.03 },
        { tipo: 'caixa', pos: [0, 0.03, 0.35], tam: [0.7, 0.06, 0.55], rot: [-10, 0, 0], material: 'metal' },
      ],
      quadros: ciclo({
        primeira: 'excentrica',
        pose: (t) => {
          const s = lerp(0, 1, t);
          const p = ik(
            {
              raiz: { pos: [0, lerp(0.88, 0.5, s), lerp(-0.02, -0.16, s)], rot: [-15, 0, 0] },
              rot: misturarRot(
                { quadrilE: [-10, 0, 8], quadrilD: [-10, 0, -8], joelhoE: [15, 0, 0], joelhoD: [15, 0, 0] },
                {
                  quadrilE: [-95, 0, 18],
                  quadrilD: [-95, 0, -18],
                  joelhoE: [110, 0, 0],
                  joelhoD: [110, 0, 0],
                  tornozeloE: [-25, 0, 0],
                  tornozeloD: [-25, 0, 0],
                },
                t,
              ),
            },
            pesNoChao(0.17, 0.32, 15, 0.06),
            IK_PERNAS,
          );
          return { ...p, rot: { ...p.rot, ombroE: [-30, 0, 30], ombroD: [-30, 0, -30], cotoveloE: [-130, 0, 0], cotoveloD: [-130, 0, 0] } };
        },
      }),
      camera: { azimute: 75, elevacao: 10 },
      contatos: [...PES, SIMETRIA],
    },
    descricao: 'Com as costas no encosto do hack e os ombros sob as almofadas, o corpo desce dobrando os joelhos até uns 90 graus e sobe.',
    explicacao: {
      posicao: [
        'Encoste as costas no apoio e encaixe os ombros embaixo das almofadas.',
        'Pés no meio da plataforma, na largura dos ombros, pontas levemente para fora.',
      ],
      execucao: [
        'Solte a trava e desça devagar (cerca de 2 segundos) dobrando os joelhos até uns 90 graus.',
        'Empurre a plataforma com o pé inteiro até quase esticar as pernas.',
      ],
      respiracao: AGACHAR_RESP,
      erros: ['Tirar as costas do apoio.', 'Subir na ponta dos pés.', 'Travar os joelhos no alto.'],
    },
  }),

  'Cadeira extensora': () => {
    const pose = (t: number): Pose => ({
      raiz: { pos: [0, 0.64, -0.02], rot: [-8, 0, 0] },
      rot: {
        quadrilE: [-82, 0, 4],
        quadrilD: [-82, 0, -4],
        joelhoE: [lerp(90, 5, t), 0, 0],
        joelhoD: [lerp(90, 5, t), 0, 0],
        tornozeloE: [-10, 0, 0],
        tornozeloD: [-10, 0, 0],
        ombroE: [-15, 0, 18],
        ombroD: [-15, 0, -18],
        cotoveloE: [-30, 0, 0],
        cotoveloD: [-30, 0, 0],
      },
    });
    return {
      receita: {
        cena: [
          { tipo: 'caixa', pos: [0, 0.5, 0.12], tam: [0.45, 0.08, 0.5], material: 'estofado' },
          { tipo: 'caixa', pos: [0, 0.9, -0.17], tam: [0.45, 0.7, 0.08], rot: [-8, 0, 0], material: 'estofado' },
          { tipo: 'caixa', pos: [0, 0.25, 0.12], tam: [0.12, 0.5, 0.5], material: 'metal' },
          { tipo: 'placa', em: { art: 'joelhoE', desloc: [-0.09, -0.36, 0.07] }, tam: [0.42, 0.09, 0.09], material: 'estofado' },
        ],
        quadros: ciclo({ primeira: 'concentrica', pose }),
        camera: { azimute: 80, elevacao: 10 },
        contatos: [QUADRIL, { tipo: 'apoio', ponto: 'joelhoE', eixo: 'xyz' }, SIMETRIA],
      },
      descricao: 'Sentado na cadeira extensora com o rolo na frente dos tornozelos, as pernas esticam para a frente e descem devagar.',
      explicacao: {
        posicao: [
          'Ajuste o encosto para o joelho ficar alinhado com o eixo de giro da máquina.',
          'O rolo fica na frente da canela, logo acima dos tornozelos. Segure os pegadores do banco.',
        ],
        execucao: [
          'Estique as pernas levantando o rolo até os joelhos ficarem quase retos.',
          'Segure um instante em cima e desça devagar (cerca de 2 segundos).',
        ],
        respiracao: 'Solte o ar ao esticar as pernas e puxe o ar na descida.',
        erros: ['Tirar o quadril do banco para ajudar.', 'Deixar o peso cair na descida.', 'Joelho desalinhado com o eixo da máquina.'],
      },
    };
  },

  'Agachamento búlgaro': () => {
    const alvos = [
      { ponto: 'tornozeloE' as const, pos: [0.13, 0.07, 0.32] as Vec3 },
      { ponto: 'peE' as const, pos: [0.14, 0, 0.42] as Vec3 },
      { ponto: 'tornozeloD' as const, pos: [-0.13, 0.52, -0.62] as Vec3 },
      { ponto: 'peD' as const, pos: [-0.13, 0.47, -0.72] as Vec3 },
    ];
    return {
      receita: {
        cena: [...bancoReto(-0.45, -1.0), ...HALTERES],
        quadros: ciclo({
          primeira: 'excentrica',
          pose: (t) =>
            bracosPendurados(
              ik(
                {
                  raiz: { pos: [0, lerp(0.86, 0.5, t), lerp(-0.06, -0.12, t)], rot: [lerp(5, 15, t), 0, 0] },
                  rot: misturarRot(
                    { quadrilE: [-25, 0, 3], quadrilD: [25, 0, -3], joelhoE: [20, 0, 0], joelhoD: [60, 0, 0], tornozeloD: [40, 0, 0] },
                    {
                      quadrilE: [-95, 0, 3],
                      quadrilD: [10, 0, -3],
                      joelhoE: [100, 0, 0],
                      joelhoD: [110, 0, 0],
                      tornozeloE: [-20, 0, 0],
                      tornozeloD: [45, 0, 0],
                    },
                    t,
                  ),
                },
                alvos,
                IK_PERNAS,
              ),
            ),
        }),
        camera: { azimute: 85, elevacao: 10 },
        contatos: [
          { tipo: 'apoio', ponto: 'peE', eixo: 'xyz' },
          { tipo: 'apoio', ponto: 'tornozeloD', eixo: 'xyz' },
        ],
      },
      descricao:
        'Com o pé de trás apoiado num banco e o da frente no chão, o corpo desce reto até a coxa da frente ficar paralela ao chão e sobe.',
      explicacao: {
        posicao: [
          'Fique de costas para um banco e apoie o peito do pé de trás sobre ele.',
          'O pé da frente fica uns dois passos à frente do banco. Um halter em cada mão, braços esticados.',
        ],
        execucao: [
          'Desça dobrando os dois joelhos, com o tronco quase reto, até a coxa da frente ficar paralela ao chão.',
          'Empurre o chão com o pé da frente e suba. Faça todas as repetições e troque de perna.',
        ],
        respiracao: AGACHAR_RESP,
        erros: [
          'Pé da frente perto demais do banco (calcanhar sai do chão).',
          'Joelho da frente caindo para dentro.',
          'Inclinar demais o tronco.',
        ],
      },
    };
  },

  Afundo: () => {
    const quadros = ciclo({
      primeira: 'excentrica',
      pose: (t) =>
        bracosPendurados(
          ik(
            {
              raiz: { pos: [0, lerp(0.88, 0.52, t), lerp(-0.02, -0.06, t)], rot: [3, 0, 0] },
              rot: misturarRot(
                { quadrilE: [-25, 0, 3], quadrilD: [20, 0, -3], joelhoE: [15, 0, 0], joelhoD: [20, 0, 0], tornozeloD: [30, 0, 0] },
                {
                  quadrilE: [-90, 0, 3],
                  quadrilD: [5, 0, -3],
                  joelhoE: [95, 0, 0],
                  joelhoD: [100, 0, 0],
                  tornozeloE: [-15, 0, 0],
                  tornozeloD: [40, 0, 0],
                },
                t,
              ),
            },
            [
              { ponto: 'tornozeloE', pos: [0.13, 0.07, 0.34] },
              { ponto: 'peE', pos: [0.14, 0, 0.44] },
              { ponto: 'peD', pos: [-0.13, 0, -0.5] },
            ],
            IK_PERNAS,
          ),
        ),
    });
    return {
      receita: {
        cena: HALTERES,
        quadros,
        camera: { azimute: 80, elevacao: 10 },
        contatos: PES,
      },
      descricao:
        'Com um pé à frente e o outro atrás, o corpo desce reto até os dois joelhos ficarem em uns 90 graus e sobe, alternando as pernas.',
      explicacao: {
        posicao: [
          'Fique em pé com um halter em cada mão e dê um passo largo à frente.',
          'O pé de trás fica apoiado só na ponta; tronco reto.',
        ],
        execucao: [
          'Desça o corpo reto, dobrando os dois joelhos até uns 90 graus; o joelho de trás quase encosta no chão.',
          'Empurre com o pé da frente e suba. Faça todas as repetições e troque a perna da frente.',
        ],
        respiracao: 'Puxe o ar na descida e solte ao subir.',
        erros: [
          'Passo curto demais (joelho da frente passa muito da ponta do pé).',
          'Joelho da frente caindo para dentro.',
          'Inclinar o tronco à frente.',
        ],
      },
    };
  },

  'Mesa flexora': () => {
    const pose = (t: number): Pose => ({
      raiz: { pos: [0, 0.82, 0], rot: [85, 0, 0] },
      rot: {
        quadrilE: [-5, 0, 3],
        quadrilD: [-5, 0, -3],
        joelhoE: [lerp(5, 115, t), 0, 0],
        joelhoD: [lerp(5, 115, t), 0, 0],
        ombroE: [-150, 0, 20],
        ombroD: [-150, 0, -20],
        cotoveloE: [-70, 0, 0],
        cotoveloD: [-70, 0, 0],
      },
    });
    return {
      receita: {
        cena: [
          { tipo: 'caixa', pos: [0, 0.68, 0.25], tam: [0.45, 0.08, 1.15], rot: [-5, 0, 0], material: 'estofado' },
          { tipo: 'caixa', pos: [0, 0.34, 0.25], tam: [0.12, 0.64, 0.9], material: 'metal' },
          { tipo: 'placa', em: { art: 'joelhoE', desloc: [-0.09, -0.36, -0.08] }, tam: [0.42, 0.09, 0.09], material: 'estofado' },
        ],
        quadros: ciclo({ primeira: 'concentrica', pose }),
        camera: { azimute: 90, elevacao: 15 },
        contatos: [QUADRIL, { tipo: 'apoio', ponto: 'joelhoE', eixo: 'xyz' }, SIMETRIA],
      },
      descricao:
        'Deitado de bruços na mesa flexora com o rolo atrás dos tornozelos, os calcanhares sobem em direção ao glúteo e descem devagar.',
      explicacao: {
        posicao: [
          'Deite de barriga para baixo com os joelhos logo depois da beirada do banco.',
          'O rolo fica atrás dos tornozelos. Segure os pegadores da frente e encoste o quadril no banco.',
        ],
        execucao: [
          'Dobre os joelhos levando os calcanhares em direção ao glúteo.',
          'Desça devagar (cerca de 2 segundos) até quase esticar as pernas.',
        ],
        respiracao: 'Solte o ar ao dobrar as pernas e puxe o ar na descida.',
        erros: ['Tirar o quadril do banco.', 'Esticar as pernas de uma vez.', 'Rolo em cima da panturrilha, longe do tornozelo.'],
      },
    };
  },

  'Cadeira flexora': () => {
    const pose = (t: number): Pose => ({
      raiz: { pos: [0, 0.62, -0.02], rot: [-12, 0, 0] },
      rot: {
        quadrilE: [-78, 0, 4],
        quadrilD: [-78, 0, -4],
        joelhoE: [lerp(5, 100, t), 0, 0],
        joelhoD: [lerp(5, 100, t), 0, 0],
        ombroE: [-15, 0, 18],
        ombroD: [-15, 0, -18],
        cotoveloE: [-30, 0, 0],
        cotoveloD: [-30, 0, 0],
      },
    });
    const p = posicoes(pose(0));
    return {
      receita: {
        cena: [
          { tipo: 'caixa', pos: [0, 0.5, 0.12], tam: [0.45, 0.08, 0.5], material: 'estofado' },
          { tipo: 'caixa', pos: [0, 0.9, -0.19], tam: [0.45, 0.7, 0.08], rot: [-12, 0, 0], material: 'estofado' },
          { tipo: 'caixa', pos: [0, 0.25, 0.12], tam: [0.12, 0.5, 0.5], material: 'metal' },
          { tipo: 'caixa', pos: [0, p.joelhoE[1] + 0.13, p.joelhoE[2] - 0.1], tam: [0.42, 0.07, 0.12], material: 'estofado' },
          { tipo: 'placa', em: { art: 'joelhoE', desloc: [-0.09, -0.36, -0.08] }, tam: [0.42, 0.09, 0.09], material: 'estofado' },
        ],
        quadros: ciclo({ primeira: 'concentrica', pose }),
        camera: { azimute: 80, elevacao: 12 },
        contatos: [QUADRIL, { tipo: 'apoio', ponto: 'joelhoE', eixo: 'xyz' }, SIMETRIA],
      },
      descricao:
        'Sentado na cadeira flexora com as pernas esticadas sobre o rolo, os joelhos dobram puxando o rolo para baixo e voltam devagar.',
      explicacao: {
        posicao: [
          'Ajuste o encosto para o joelho ficar alinhado com o eixo de giro da máquina.',
          'Pernas esticadas sobre o rolo (atrás dos tornozelos) e o apoio de cima preso sobre as coxas.',
        ],
        execucao: [
          'Dobre os joelhos puxando o rolo para baixo e para trás o máximo que conseguir.',
          'Volte devagar (cerca de 2 segundos) até quase esticar as pernas.',
        ],
        respiracao: 'Solte o ar ao dobrar as pernas e puxe o ar na volta.',
        erros: ['Apoio das coxas solto.', 'Tirar o quadril do banco.', 'Voltar rápido demais.'],
      },
    };
  },

  'Flexora em pé': () => {
    const base = emPeFirme({
      coluna: [8, 0, 0],
      ombroE: [-60, 0, 10],
      ombroD: [-60, 0, -10],
      cotoveloE: [-40, 0, 0],
      cotoveloD: [-40, 0, 0],
    });
    const p = posicoes(base);
    return {
      receita: {
        cena: [
          { tipo: 'caixa', pos: [p.joelhoE[0], p.joelhoE[1] + 0.12, p.joelhoE[2] + 0.13], tam: [0.16, 0.2, 0.08], material: 'estofado' },
          { tipo: 'caixa', pos: [0, 0.6, 0.45], tam: [0.5, 1.2, 0.1], material: 'metal' },
          { tipo: 'caixa', pos: [0, 1.15, 0.36], tam: [0.6, 0.05, 0.1], material: 'estofado' },
          { tipo: 'placa', em: { art: 'joelhoE', desloc: [0, -0.36, -0.08] }, tam: [0.16, 0.09, 0.09], material: 'estofado' },
        ],
        quadros: ciclo({
          primeira: 'concentrica',
          pose: (t) => ({
            ...base,
            rot: { ...base.rot, quadrilE: [-12, 0, 3], joelhoE: [lerp(5, 110, t), 0, 0], tornozeloE: [-10, 0, 0] },
          }),
        }),
        camera: { azimute: 100, elevacao: 10 },
        contatos: [
          { tipo: 'apoio', ponto: 'peD', eixo: 'xyz' },
          { tipo: 'apoio', ponto: 'joelhoE', eixo: 'xyz' },
        ],
      },
      descricao: 'Em pé na flexora, com a coxa apoiada e o rolo atrás do tornozelo, o calcanhar sobe em direção ao glúteo e desce devagar.',
      explicacao: {
        posicao: [
          'Fique de frente para a máquina, apoie a coxa da perna que trabalha na almofada e segure os pegadores.',
          'O rolo fica atrás do tornozelo; a outra perna sustenta o corpo.',
        ],
        execucao: [
          'Dobre o joelho levando o calcanhar em direção ao glúteo, sem mexer a coxa.',
          'Desça devagar (cerca de 2 segundos). Faça todas as repetições e troque de perna.',
        ],
        respiracao: 'Solte o ar ao dobrar a perna e puxe o ar na descida.',
        erros: ['Tirar a coxa do apoio.', 'Girar o quadril para ajudar.', 'Esticar a perna de uma vez.'],
      },
    };
  },

  Stiff: () => ({
    receita: {
      cena: [{ tipo: 'barra', em: 'maos' }],
      quadros: ciclo({
        primeira: 'excentrica',
        pose: (t) => {
          const incl = lerp(0, 75, t);
          const p = ik(
            {
              raiz: { pos: [0, lerp(ALTURA_QUADRIL - 0.02, 0.88, t), lerp(0, -0.2, t)], rot: [incl, 0, 0] },
              rot: { quadrilE: [-incl - 12, 0, 3], quadrilD: [-incl - 12, 0, -3], joelhoE: [15, 0, 0], joelhoD: [15, 0, 0] },
            },
            pesNoChao(0.13, 0, 6),
            IK_PERNAS,
          );
          return { ...p, rot: { ...p.rot, ombroE: [-incl, 0, 4], ombroD: [-incl, 0, -4], cotoveloE: [0, 0, 0], cotoveloD: [0, 0, 0] } };
        },
      }),
      camera: { azimute: 85, elevacao: 8 },
      contatos: [...PES, BARRA, SIMETRIA],
    },
    descricao:
      'Em pé com a barra nas mãos e os joelhos levemente dobrados, o quadril vai para trás e o tronco inclina com a coluna reta até a barra passar dos joelhos.',
    explicacao: {
      posicao: [
        'Fique em pé com os pés na largura do quadril, segurando a barra na frente das coxas.',
        'Joelhos levemente dobrados (eles ficam assim o exercício todo) e coluna reta.',
      ],
      execucao: [
        'Leve o quadril para trás e incline o tronco à frente, deslizando a barra rente às pernas.',
        'Desça até sentir a parte de trás das coxas alongar (a barra costuma passar um pouco dos joelhos).',
        'Suba levando o quadril à frente, apertando os glúteos.',
      ],
      respiracao: 'Puxe o ar na descida e solte ao subir.',
      erros: ['Arredondar as costas.', 'Dobrar e esticar os joelhos (vira terra).', 'Afastar a barra das pernas.'],
    },
  }),

  'Elevação pélvica': () => {
    const encosto: Vec3 = [0, 0.47, -0.3];
    const pose = (t: number): Pose => {
      const a = lerp(38, 2, t);
      const semRaiz: Pose = { raiz: { pos: [0, 0, 0], rot: [-90 + a, 0, 0] }, rot: {} };
      const atual = pontoLocal(semRaiz, 'coluna', [0, 0.3, -0.12]);
      const raiz: Pose['raiz'] = { pos: [encosto[0] - atual[0], encosto[1] - atual[1], encosto[2] - atual[2]], rot: [-90 + a, 0, 0] };
      const pernas = ik(
        {
          raiz,
          rot: {
            quadrilE: [lerp(-60, -90, t) + 90 - a, 0, 8],
            quadrilD: [lerp(-60, -90, t) + 90 - a, 0, -8],
            joelhoE: [90, 0, 0],
            joelhoD: [90, 0, 0],
          },
        },
        pesNoChao(0.18, 0.55, 10),
        IK_PERNAS,
      );
      return maosEm(
        pernas,
        pontoLocal(pernas, 'quadril', [0.36, 0, 0.17]),
        { ombroE: [-40, 0, 25], ombroD: [-40, 0, -25], cotoveloE: [-30, 0, 0], cotoveloD: [-30, 0, 0] },
        pontoLocal(pernas, 'quadril', [-0.36, 0, 0.17]),
      );
    };
    return {
      receita: {
        cena: [...bancoReto(-0.25, -0.9), { tipo: 'barra', em: 'maos' }],
        quadros: ciclo({ primeira: 'concentrica', pose }),
        camera: { azimute: 85, elevacao: 10 },
        contatos: [...PES, BARRA, SIMETRIA],
      },
      descricao:
        'Com a parte de cima das costas apoiada no banco e a barra sobre o quadril, o quadril sobe até o tronco ficar reto como uma mesa e desce.',
      explicacao: {
        posicao: [
          'Sente no chão com a parte de cima das costas (abaixo das escápulas) encostada na lateral de um banco.',
          'Barra sobre a dobra do quadril (use uma almofada), pés no chão na largura dos ombros e joelhos dobrados.',
        ],
        execucao: [
          'Empurre o chão com os calcanhares e suba o quadril até o tronco ficar alinhado com as coxas.',
          'No alto, os joelhos ficam em uns 90 graus; aperte os glúteos por um instante.',
          'Desça o quadril devagar (cerca de 2 segundos) sem encostar no chão.',
        ],
        respiracao: 'Solte o ar ao subir e puxe o ar na descida.',
        erros: [
          'Arquear a lombar no alto em vez de apertar os glúteos.',
          'Pés longe demais (trabalha mais a parte de trás da coxa).',
          'Jogar a cabeça para trás.',
        ],
      },
    };
  },

  'Cadeira abdutora': () => {
    const pose = (t: number): Pose => {
      const z = lerp(4, 38, t);
      return {
        raiz: { pos: [0, 0.6, -0.02], rot: [-10, 0, 0] },
        rot: {
          quadrilE: [-80, 0, z],
          quadrilD: [-80, 0, -z],
          joelhoE: [80, 0, 0],
          joelhoD: [80, 0, 0],
          ombroE: [-15, 0, 18],
          ombroD: [-15, 0, -18],
          cotoveloE: [-30, 0, 0],
          cotoveloD: [-30, 0, 0],
        },
      };
    };
    return {
      receita: {
        cena: [
          { tipo: 'caixa', pos: [0, 0.48, 0.12], tam: [0.45, 0.08, 0.5], material: 'estofado' },
          { tipo: 'caixa', pos: [0, 0.88, -0.19], tam: [0.45, 0.7, 0.08], rot: [-10, 0, 0], material: 'estofado' },
          { tipo: 'caixa', pos: [0, 0.24, 0.12], tam: [0.12, 0.48, 0.5], material: 'metal' },
          { tipo: 'placa', em: { art: 'quadrilE', desloc: [0.09, -0.36, 0] }, tam: [0.05, 0.22, 0.2], material: 'estofado' },
          { tipo: 'placa', em: { art: 'quadrilD', desloc: [-0.09, -0.36, 0] }, tam: [0.05, 0.22, 0.2], material: 'estofado' },
        ],
        quadros: ciclo({ primeira: 'concentrica', pose }),
        camera: { azimute: 20, elevacao: 30 },
        contatos: [QUADRIL, SIMETRIA],
      },
      descricao:
        'Sentado na cadeira abdutora com as almofadas do lado de fora dos joelhos, as pernas abrem para os lados e fecham devagar.',
      explicacao: {
        posicao: [
          'Sente com as costas apoiadas e os pés nos apoios.',
          'As almofadas ficam do lado de fora dos joelhos. Segure os pegadores do banco.',
        ],
        execucao: [
          'Abra as pernas para os lados o máximo que conseguir, sem tirar o quadril do banco.',
          'Feche devagar (cerca de 2 segundos), sem deixar o peso bater.',
        ],
        respiracao: 'Solte o ar ao abrir e puxe o ar ao fechar.',
        erros: ['Inclinar o tronco à frente para ajudar.', 'Fechar as pernas de uma vez.', 'Abertura curta, com peso demais.'],
      },
    };
  },

  'Glúteo na polia': () => {
    const base = ik(
      {
        raiz: { pos: [0, 0.94, -0.04], rot: [25, 0, 0] },
        rot: {
          quadrilD: [-30, 0, -3],
          joelhoD: [10, 0, 0],
          ombroE: [-70, 0, 10],
          ombroD: [-70, 0, -10],
          cotoveloE: [-20, 0, 0],
          cotoveloD: [-20, 0, 0],
        },
      },
      [
        { ponto: 'tornozeloD', pos: [-0.12, 0.07, 0] },
        { ponto: 'peD', pos: [-0.12, 0, 0.1] },
      ],
      ['quadrilD', 'joelhoD', 'tornozeloD'],
    );
    const roldana: Vec3 = [0.12, 0.1, 0.55];
    return {
      receita: {
        cena: [
          ...torrePolia(roldana, [0.12, 0.7]),
          { tipo: 'caixa', pos: [0, 1.1, 0.62], tam: [0.6, 0.05, 0.08], material: 'metal' },
          { tipo: 'cabo', de: roldana, ate: 'tornozeloE', acessorio: 'tornozeleira' },
        ],
        quadros: ciclo({
          primeira: 'concentrica',
          pose: (t) => ({
            ...base,
            rot: { ...base.rot, quadrilE: [lerp(-30, 38, t), 0, 3], joelhoE: [lerp(20, 12, t), 0, 0], tornozeloE: [10, 0, 0] },
          }),
        }),
        camera: { azimute: 95, elevacao: 12 },
        contatos: [{ tipo: 'apoio', ponto: 'peD', eixo: 'xyz' }],
      },
      descricao:
        'Em pé de frente para a polia baixa com a tornozeleira, a perna vai para trás e para cima esticando o quadril e volta devagar.',
      explicacao: {
        posicao: [
          'Prenda a tornozeleira na polia baixa e no tornozelo da perna que trabalha.',
          'Fique de frente para a máquina, segurando-a, com o tronco levemente inclinado à frente.',
        ],
        execucao: [
          'Leve a perna para trás e um pouco para cima, com o joelho quase esticado, apertando o glúteo.',
          'Volte devagar (cerca de 2 segundos) até o pé passar um pouco à frente da outra perna.',
          'Faça todas as repetições e troque de perna.',
        ],
        respiracao: 'Solte o ar ao levar a perna para trás e puxe o ar na volta.',
        erros: ['Arquear a lombar para subir mais a perna.', 'Girar o quadril para o lado.', 'Balançar a perna com impulso.'],
      },
    };
  },

  'Agachamento sumô': () => ({
    receita: {
      cena: [{ tipo: 'barra', em: 'maos', comprimento: 0.36, anilhas: true }],
      quadros: ciclo({
        primeira: 'excentrica',
        pose: (t) => {
          const p = agachar(t, { fundo: 0.58, recuo: 0.08, inclinacao: 15, largura: 0.34, abertura: 35, topo: 0.9 });
          const o = posicoes(p).ombroE;
          return maosEm(p, [0.06, o[1] - 0.6, o[2] + 0.06], {
            ombroE: [-p.raiz.rot[0], 0, -6],
            ombroD: [-p.raiz.rot[0], 0, 6],
            cotoveloE: [-5, 0, 0],
            cotoveloD: [-5, 0, 0],
          });
        },
      }),
      camera: { azimute: 30, elevacao: 10 },
      contatos: [...PES, BARRA, SIMETRIA],
    },
    descricao: 'Com os pés bem afastados e as pontas para fora, segurando um halter entre as pernas, o quadril desce reto e sobe.',
    explicacao: {
      posicao: [
        'Pés bem mais abertos que os ombros, pontas viradas para fora.',
        'Segure um halter com as duas mãos entre as pernas, braços esticados, tronco reto.',
      ],
      execucao: [
        'Desça o quadril reto para baixo, abrindo os joelhos na direção das pontas dos pés.',
        'Desça até as coxas ficarem perto de paralelas ao chão.',
        'Empurre o chão e suba apertando os glúteos.',
      ],
      respiracao: AGACHAR_RESP,
      erros: ['Joelhos fechando para dentro.', 'Inclinar demais o tronco.', 'Tirar os calcanhares do chão.'],
    },
  }),

  'Panturrilha em pé': () => {
    const base = emPeFirme({}, 0.13);
    const degrau = 0.1;
    const pose = (t: number): Pose => {
      const a = lerp(-15, 38, t);
      const p: Pose = {
        ...base,
        rot: {
          ...base.rot,
          tornozeloE: [a, 0, 0],
          tornozeloD: [a, 0, 0],
          ombroE: [-150, 0, 40],
          ombroD: [-150, 0, -40],
          cotoveloE: [-130, 0, 0],
          cotoveloD: [-130, 0, 0],
        },
      };
      const pe = posicoes(base).peE;
      return apoiar(p, 'peE', [pe[0], degrau, pe[2]]);
    };
    return {
      receita: {
        cena: [
          { tipo: 'caixa', pos: [0, degrau / 2, 0.14], tam: [0.6, degrau, 0.16], material: 'metal' },
          { tipo: 'placa', em: 'ombros', tam: [0.55, 0.06, 0.14], desloc: [0, 0.07, -0.02], material: 'estofado' },
          { tipo: 'tubo', de: [0.4, 0, -0.25], ate: [0.4, 2.0, -0.25], raio: 0.03 },
          { tipo: 'tubo', de: [-0.4, 0, -0.25], ate: [-0.4, 2.0, -0.25], raio: 0.03 },
        ],
        quadros: ciclo({ primeira: 'concentrica', pausaFim: 700, pose }),
        camera: { azimute: 80, elevacao: 5 },
        contatos: [...PES, SIMETRIA],
      },
      descricao: 'Em pé com a ponta dos pés num degrau, os calcanhares descem abaixo do degrau e o corpo sobe na ponta dos pés.',
      explicacao: {
        posicao: [
          'Apoie só a ponta dos pés (a parte da frente) na beirada do degrau, com os ombros sob as almofadas.',
          'Joelhos esticados, mas sem travar.',
        ],
        execucao: [
          'Deixe os calcanhares descerem devagar abaixo do degrau, sentindo a panturrilha alongar.',
          'Suba o máximo que conseguir na ponta dos pés e segure um segundo lá em cima.',
        ],
        respiracao: 'Solte o ar ao subir e puxe o ar na descida.',
        erros: ['Movimento curto, só no meio.', 'Dobrar os joelhos para ajudar.', 'Quicar embaixo.'],
      },
    };
  },

  'Panturrilha sentado': () => {
    const base: Pose = {
      raiz: { pos: [0, 0.56, -0.05], rot: [10, 0, 0] },
      rot: { quadrilE: [-100, 0, 6], quadrilD: [-100, 0, -6], joelhoE: [90, 0, 0], joelhoD: [90, 0, 0] },
    };
    const pe0 = posicoes(base);
    const degrau = 0.1;
    const alvos = [
      { ponto: 'peE' as const, pos: [pe0.peE[0], degrau, pe0.peE[2]] as Vec3 },
      { ponto: 'peD' as const, pos: [pe0.peD[0], degrau, pe0.peD[2]] as Vec3 },
    ];
    const pose = (t: number): Pose => {
      const a = lerp(-15, 35, t);
      const p = ik({ ...base, rot: { ...base.rot, tornozeloE: [a, 0, 0], tornozeloD: [a, 0, 0] } }, alvos, [
        'quadrilE',
        'quadrilD',
        'joelhoE',
        'joelhoD',
      ]);
      return { ...p, rot: { ...p.rot, ombroE: [-40, 0, 10], ombroD: [-40, 0, -10], cotoveloE: [-50, 0, 0], cotoveloD: [-50, 0, 0] } };
    };
    return {
      receita: {
        cena: [
          { tipo: 'caixa', pos: [0, 0.42, -0.05], tam: [0.42, 0.08, 0.4], material: 'estofado' },
          { tipo: 'caixa', pos: [0, 0.2, -0.05], tam: [0.1, 0.4, 0.3], material: 'metal' },
          { tipo: 'caixa', pos: [0, degrau / 2, pe0.peE[2] - 0.02], tam: [0.5, degrau, 0.14], material: 'metal' },
          { tipo: 'placa', em: { art: 'quadrilE', desloc: [-0.09, -0.38, 0.1] }, tam: [0.42, 0.07, 0.14], material: 'estofado' },
        ],
        quadros: ciclo({ primeira: 'concentrica', pausaFim: 700, pose }),
        camera: { azimute: 80, elevacao: 8 },
        contatos: [QUADRIL, ...PES, SIMETRIA],
      },
      descricao:
        'Sentado com a almofada sobre os joelhos e a ponta dos pés no degrau, os calcanhares sobem levantando a almofada e descem devagar.',
      explicacao: {
        posicao: [
          'Sente na máquina com a almofada apoiada logo acima dos joelhos.',
          'Apoie só a ponta dos pés na plataforma, com os calcanhares para fora.',
        ],
        execucao: [
          'Desça os calcanhares devagar o máximo que conseguir.',
          'Suba na ponta dos pés levantando a almofada e segure um segundo lá em cima.',
        ],
        respiracao: 'Solte o ar ao subir e puxe o ar na descida.',
        erros: ['Movimento curto.', 'Quicar embaixo.', 'Usar as mãos para empurrar a almofada.'],
      },
    };
  },

  'Panturrilha no leg press': () => ({
    receita: {
      cena: CENA_LEG_PRESS,
      quadros: ciclo({
        primeira: 'concentrica',
        pausaFim: 700,
        pose: (t) => {
          const p = legPress(0.8, -0.05);
          const a = lerp(-15, 35, t);
          // Quadril sem abrir: o pé gira no plano da perna e os dois continuam à mesma distância.
          const q = p.rot.quadrilE?.[0] ?? -80;
          return {
            ...p,
            rot: {
              ...p.rot,
              quadrilE: [q, 0, 0],
              quadrilD: [q, 0, 0],
              joelhoE: [4, 0, 0],
              joelhoD: [4, 0, 0],
              tornozeloE: [a, 0, 0],
              tornozeloD: [a, 0, 0],
            },
          };
        },
      }),
      camera: { azimute: 80, elevacao: 12 },
      contatos: [QUADRIL, { tipo: 'distanciaFixa', a: 'peE', b: 'peD' }, SIMETRIA],
    },
    descricao:
      'No leg press com as pernas esticadas e só a ponta dos pés na plataforma, os pés empurram a plataforma esticando os tornozelos e voltam devagar.',
    explicacao: {
      posicao: [
        'Sente no leg press e apoie só a ponta dos pés na parte de baixo da plataforma.',
        'Pernas esticadas (sem travar os joelhos) e travas de segurança soltas.',
      ],
      execucao: [
        'Empurre a plataforma esticando os tornozelos, como quem fica na ponta dos pés.',
        'Volte devagar até sentir a panturrilha alongar, sem dobrar os joelhos.',
      ],
      respiracao: 'Solte o ar ao empurrar e puxe o ar na volta.',
      erros: ['Dobrar os joelhos (vira leg press).', 'Pés escorregando na plataforma.', 'Movimento curto.'],
      dica: 'Mantenha as travas por perto: se o pé escorregar, a plataforma precisa estar segura.',
    },
  }),
};
