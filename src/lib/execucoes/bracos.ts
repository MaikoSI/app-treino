import { type Pose, pontoLocal, posicoes, type Vec3 } from '../esqueleto';
import type { Contato, Equipamento3D } from '../execucao';
import { bancoReto, maquinaSentado, torrePolia } from './cenas';
import {
  alternado,
  bracosEm,
  ciclo,
  deitadoNoBanco,
  emPeFirme,
  IK_PERNAS,
  ik,
  lerp,
  lerpV,
  mais,
  maosEm,
  misturarRot,
  pesNoChao,
  sentado,
  sentadoComEncosto,
} from './construir';
import type { Catalogo } from './tipos';

const PES: Contato[] = [
  { tipo: 'apoio', ponto: 'peE', eixo: 'xyz' },
  { tipo: 'apoio', ponto: 'peD', eixo: 'xyz' },
];
const BARRA: Contato = { tipo: 'distanciaFixa', a: 'maoE', b: 'maoD' };
const OMBROS_PARADOS: Contato[] = [
  { tipo: 'apoio', ponto: 'cotoveloE', eixo: 'xyz' },
  { tipo: 'apoio', ponto: 'cotoveloD', eixo: 'xyz' },
];

/** Rosca em pé (barra, halteres ou polia): só o cotovelo dobra. */
function roscaEmPe(cena: Equipamento3D[], contatos: Contato[]) {
  const base = emPeFirme();
  return {
    cena,
    quadros: ciclo({
      primeira: 'concentrica',
      pose: (t: number): Pose => {
        const c = lerp(-8, -135, t);
        const o = lerp(-4, -12, t);
        return { ...base, rot: { ...base.rot, ombroE: [o, 0, 0], ombroD: [o, 0, 0], cotoveloE: [c, 0, 0], cotoveloD: [c, 0, 0] } };
      },
    }),
    camera: { azimute: 75, elevacao: 8 },
    contatos: [...PES, ...contatos, { tipo: 'simetria' } as Contato],
  };
}

const ROSCA = {
  respiracao: 'Solte o ar ao subir e puxe o ar na descida.',
  erros: ['Balançar o tronco para ajudar a subir.', 'Levar os cotovelos para a frente no fim da subida.', 'Descer rápido demais.'],
};

/** Tríceps na polia alta: cotovelos colados na lateral do corpo, só o antebraço se move. */
function tricepsNaPolia(acessorio: 'corda' | 'barra') {
  const base = ik(
    {
      raiz: { pos: [0, 0.95, -0.02], rot: [10, 0, 0] },
      rot: { quadrilE: [-12, 0, 3], quadrilD: [-12, 0, -3], joelhoE: [8, 0, 0], joelhoD: [8, 0, 0] },
    },
    pesNoChao(0.14, 0, 8),
    IK_PERNAS,
  );
  const cot = pontoLocal(base, 'coluna', [0.2, 0.1, 0.04]);
  const roldana: Vec3 = [0, 2.1, 0.45];
  return {
    cena: [...torrePolia(roldana, [0, 0.6]), { tipo: 'cabo', de: roldana, ate: 'maos', acessorio, comprimento: 0.5 }] as Equipamento3D[],
    quadros: ciclo({
      primeira: 'concentrica',
      pose: (t: number) => {
        const b = (lerp(105, 5, t) * Math.PI) / 180;
        const abre = acessorio === 'corda' ? lerp(0.12, 0.2, t) : 0.15;
        // Mão a um antebraço de distância do cotovelo, que fica parado.
        const l = Math.sqrt(0.335 ** 2 - (abre - cot[0]) ** 2);
        const mao: Vec3 = [abre, cot[1] - l * Math.cos(b), cot[2] + l * Math.sin(b)];
        return bracosEm(base, [cot[0], cot[1], cot[2]], mao, {
          ombroE: [5, 0, 5],
          ombroD: [5, 0, -5],
          cotoveloE: [-100, 0, 0],
          cotoveloD: [-100, 0, 0],
        });
      },
    }),
    camera: { azimute: 75, elevacao: 10 },
    contatos: [...PES, ...OMBROS_PARADOS, { tipo: 'simetria' } as Contato, ...(acessorio === 'barra' ? [BARRA] : [])],
  };
}

const TRICEPS_POLIA = {
  respiracao: 'Solte o ar ao empurrar para baixo e puxe o ar na volta.',
  erros: ['Afastar os cotovelos do corpo.', 'Jogar o peso do corpo para empurrar.', 'Subir as mãos acima do peito na volta.'],
};

export const BRACOS: Catalogo = {
  'Rosca direta': () => ({
    receita: roscaEmPe([{ tipo: 'barra', em: 'maos', comprimento: 1.2, anilhas: true }], [BARRA]),
    descricao: 'Em pé, a barra sobe dobrando só os cotovelos até perto dos ombros e desce devagar até esticar os braços.',
    explicacao: {
      posicao: [
        'Fique em pé com os pés na largura do quadril e os joelhos levemente soltos.',
        'Segure a barra na largura dos ombros com as palmas viradas para a frente.',
        'Braços esticados ao lado do corpo, cotovelos encostados na cintura.',
      ],
      execucao: [
        'Dobre os cotovelos e suba a barra em arco até perto dos ombros.',
        'Os cotovelos ficam parados ao lado do corpo: só o antebraço se move.',
        'Desça devagar (cerca de 2 segundos) até esticar quase todo o braço.',
      ],
      ...ROSCA,
    },
  }),

  'Rosca alternada': () => {
    const base = emPeFirme();
    const umLado = ciclo({
      primeira: 'concentrica',
      pose: (t) => ({
        ...base,
        rot: {
          ...base.rot,
          ombroE: [lerp(-4, -12, t), 0, 0],
          cotoveloE: [lerp(-8, -135, t), lerp(0, -80, t), 0],
          ombroD: [-4, 0, 0],
          cotoveloD: [-8, 0, 0],
        },
      }),
    });
    return {
      receita: {
        cena: [
          { tipo: 'halter', em: 'maoE' },
          { tipo: 'halter', em: 'maoD' },
        ],
        quadros: alternado(umLado),
        camera: { azimute: 50, elevacao: 8 },
        contatos: PES,
      },
      descricao: 'Em pé com um halter em cada mão, um braço de cada vez sobe girando a palma para cima e desce devagar.',
      explicacao: {
        posicao: [
          'Fique em pé com um halter em cada mão, braços esticados ao lado do corpo e palmas viradas para o corpo.',
          'Cotovelos encostados na cintura.',
        ],
        execucao: [
          'Suba um halter dobrando o cotovelo e girando a palma para cima durante a subida.',
          'Desça devagar (cerca de 2 segundos) voltando a palma para o corpo.',
          'Repita com o outro braço, alternando.',
        ],
        ...ROSCA,
      },
    };
  },

  'Rosca martelo': () => ({
    receita: roscaEmPe(
      [
        { tipo: 'halter', em: 'maoE' },
        { tipo: 'halter', em: 'maoD' },
      ],
      [],
    ),
    descricao:
      'Em pé com um halter em cada mão e as palmas viradas para o corpo, os halteres sobem dobrando os cotovelos e descem devagar.',
    explicacao: {
      posicao: [
        'Fique em pé com um halter em cada mão, palmas viradas para o corpo (como quem segura um martelo).',
        'Cotovelos encostados na cintura.',
      ],
      execucao: [
        'Dobre os cotovelos e suba os halteres até perto dos ombros, sem girar os punhos.',
        'Desça devagar (cerca de 2 segundos) até esticar os braços.',
      ],
      ...ROSCA,
    },
  }),

  'Rosca Scott': () => {
    const base = sentado(12, 0.55, 0.3);
    const pose = (t: number): Pose => ({
      ...base,
      rot: {
        ...base.rot,
        ombroE: [-55, 0, 0],
        ombroD: [-55, 0, 0],
        cotoveloE: [lerp(-15, -125, t), 0, 0],
        cotoveloD: [lerp(-15, -125, t), 0, 0],
      },
    });
    const p = posicoes(pose(0));
    const d: Vec3 = [0, p.cotoveloE[1] - p.ombroE[1], p.cotoveloE[2] - p.ombroE[2]];
    const ang = (-Math.asin(d[1] / Math.hypot(d[1], d[2])) * 180) / Math.PI;
    const meio = lerpV(p.ombroE, p.cotoveloE, 0.55);
    return {
      receita: {
        cena: [
          { tipo: 'caixa', pos: [0, 0.51, 0.02], tam: [0.36, 0.08, 0.34], material: 'estofado' },
          { tipo: 'caixa', pos: [0, 0.25, 0.1], tam: [0.08, 0.5, 0.5], material: 'metal' },
          { tipo: 'caixa', pos: [0, meio[1] - 0.07, meio[2] + 0.02], tam: [0.6, 0.06, 0.36], rot: [ang, 0, 0], material: 'estofado' },
          { tipo: 'barra', em: 'maos', comprimento: 1.2, anilhas: true },
        ],
        quadros: ciclo({ primeira: 'concentrica', pose }),
        camera: { azimute: 75, elevacao: 12 },
        contatos: [{ tipo: 'apoio', ponto: 'quadril', eixo: 'xyz' }, ...OMBROS_PARADOS, BARRA, { tipo: 'simetria' }],
      },
      descricao: 'Sentado no banco Scott com a parte de trás dos braços apoiada, a barra sobe dobrando os cotovelos e desce devagar.',
      explicacao: {
        posicao: [
          'Ajuste o banco para as axilas encostarem no alto do apoio inclinado.',
          'Apoie a parte de trás dos braços no apoio e segure a barra com as palmas para cima.',
        ],
        execucao: [
          'Dobre os cotovelos e suba a barra até perto dos ombros.',
          'Desça devagar (cerca de 2 segundos) até quase esticar os braços, sem perder o apoio.',
        ],
        respiracao: 'Solte o ar ao subir e puxe o ar na descida.',
        erros: ['Esticar o braço de uma vez no fim da descida.', 'Tirar os braços do apoio.', 'Levantar o quadril do banco.'],
      },
    };
  },

  'Rosca na polia': () => ({
    receita: roscaEmPe(
      [...torrePolia([0, 0.12, 0.55], [0, 0.7]), { tipo: 'cabo', de: [0, 0.12, 0.55], ate: 'maos', acessorio: 'barra', comprimento: 0.5 }],
      [BARRA],
    ),
    descricao: 'Em pé de frente para a polia baixa, a barra sobe dobrando os cotovelos até perto dos ombros e desce devagar.',
    explicacao: {
      posicao: [
        'Prenda a barra reta na polia baixa e fique de frente para ela, a um passo de distância.',
        'Segure a barra com as palmas para cima e os cotovelos encostados na cintura.',
      ],
      execucao: [
        'Dobre os cotovelos e suba a barra até perto dos ombros.',
        'Desça devagar (cerca de 2 segundos) até esticar os braços, sem deixar o peso puxar.',
      ],
      ...ROSCA,
    },
  }),

  'Rosca concentrada': () => {
    const base = ik(
      {
        raiz: { pos: [0, 0.56, 0], rot: [38, 0, 0] },
        rot: { quadrilE: [-128, 0, 20], quadrilD: [-128, 0, -20], joelhoE: [90, 0, 0], joelhoD: [90, 0, 0] },
      },
      pesNoChao(0.33, 0.45, 20),
      IK_PERNAS,
    );
    const p = posicoes(base);
    const cotovelo = mais(p.joelhoE, [-0.1, 0.03, -0.12]);
    const apoiado = ik(
      { ...base, rot: { ...base.rot, ombroE: [-40, 0, -10], cotoveloE: [-10, 0, 0], ombroD: [-60, 0, 0], cotoveloD: [-40, 0, 0] } },
      [
        { ponto: 'cotoveloE', pos: cotovelo },
        { ponto: 'maoD', pos: mais(p.joelhoD, [0.02, 0.06, -0.02]) },
      ],
      ['ombroE', 'ombroD', 'cotoveloD'],
    );
    return {
      receita: {
        cena: [...bancoReto(-0.45, 0.3), { tipo: 'halter', em: 'maoE' }],
        quadros: ciclo({
          primeira: 'concentrica',
          pose: (t) => ({ ...apoiado, rot: { ...apoiado.rot, cotoveloE: [lerp(-10, -135, t), lerp(0, -70, t), 0] } }),
        }),
        camera: { azimute: 30, elevacao: 15 },
        contatos: [{ tipo: 'apoio', ponto: 'quadril', eixo: 'xyz' }, ...PES, { tipo: 'apoio', ponto: 'cotoveloE', eixo: 'xyz' }],
      },
      descricao: 'Sentado com o cotovelo apoiado na parte de dentro da coxa, o halter sobe até perto do ombro e desce devagar.',
      explicacao: {
        posicao: [
          'Sente na ponta do banco com as pernas afastadas e incline o tronco à frente.',
          'Apoie o cotovelo na parte de dentro da coxa, com o braço esticado e o halter perto do chão.',
          'A outra mão fica apoiada na outra coxa.',
        ],
        execucao: [
          'Dobre o cotovelo e suba o halter até perto do ombro, girando a palma para cima.',
          'Desça devagar (cerca de 2 segundos) até esticar o braço. Faça todas as repetições e troque de lado.',
        ],
        respiracao: 'Solte o ar ao subir e puxe o ar na descida.',
        erros: ['Tirar o cotovelo da coxa.', 'Balançar o tronco.', 'Não esticar o braço na descida.'],
      },
    };
  },

  'Tríceps corda': () => ({
    receita: tricepsNaPolia('corda'),
    descricao: 'Em pé de frente para a polia alta, com os cotovelos colados no corpo, a corda desce e abre até esticar os braços.',
    explicacao: {
      posicao: [
        'Prenda a corda na polia alta e fique de frente para ela, tronco levemente inclinado à frente.',
        'Segure as pontas da corda com as palmas viradas uma para a outra e cole os cotovelos na lateral do corpo.',
      ],
      execucao: [
        'Estique os cotovelos levando a corda para baixo e, no fim, abra as pontas para os lados das coxas.',
        'Volte devagar (cerca de 2 segundos) até as mãos ficarem na altura do peito, sem mexer os cotovelos.',
      ],
      ...TRICEPS_POLIA,
    },
  }),

  'Tríceps pulley': () => ({
    receita: tricepsNaPolia('barra'),
    descricao: 'Em pé de frente para a polia alta, com os cotovelos colados no corpo, a barra desce até esticar os braços e sobe devagar.',
    explicacao: {
      posicao: [
        'Prenda a barra na polia alta e fique de frente para ela, tronco levemente inclinado à frente.',
        'Segure a barra com as palmas para baixo, mãos na largura dos ombros, cotovelos colados no corpo.',
      ],
      execucao: [
        'Estique os cotovelos empurrando a barra para baixo até as coxas.',
        'Volte devagar (cerca de 2 segundos) até a barra ficar na altura do peito, sem mexer os cotovelos.',
      ],
      ...TRICEPS_POLIA,
    },
  }),

  'Tríceps testa': () => {
    const base = deitadoNoBanco(0);
    return {
      receita: {
        cena: [...bancoReto(0.3, -0.95), { tipo: 'barra', em: 'maos', comprimento: 1.2, anilhas: true }],
        quadros: ciclo({
          primeira: 'excentrica',
          pose: (t) => {
            const c = lerp(-5, -120, t);
            return {
              ...base,
              rot: { ...base.rot, ombroE: [-100, 0, 0], ombroD: [-100, 0, 0], cotoveloE: [c, 0, 0], cotoveloD: [c, 0, 0] },
            };
          },
        }),
        camera: { azimute: 80, elevacao: 15 },
        contatos: [{ tipo: 'apoio', ponto: 'quadril', eixo: 'xyz' }, ...PES, ...OMBROS_PARADOS, BARRA, { tipo: 'simetria' }],
      },
      descricao:
        'Deitado no banco com os braços apontando para cima, a barra desce até perto da testa dobrando só os cotovelos e sobe de novo.',
      explicacao: {
        posicao: [
          'Deite no banco reto com os pés no chão.',
          'Segure a barra com as mãos na largura dos ombros e estique os braços acima do rosto, um pouco inclinados para trás.',
        ],
        execucao: [
          'Dobre só os cotovelos e desça a barra devagar até perto da testa.',
          'Estique os cotovelos e suba a barra de volta, sem mexer os braços.',
        ],
        respiracao: 'Puxe o ar na descida e solte ao esticar os braços.',
        erros: ['Abrir os cotovelos para os lados.', 'Mexer os ombros junto (vira supino).', 'Descer rápido demais perto do rosto.'],
      },
    };
  },

  'Tríceps francês': () => {
    const base = sentadoComEncosto();
    return {
      receita: {
        cena: [...maquinaSentado(), { tipo: 'barra', em: 'maos', comprimento: 0.36, anilhas: true }],
        quadros: ciclo({
          primeira: 'excentrica',
          pose: (t) => {
            const c = lerp(-8, -130, t);
            return {
              ...base,
              rot: { ...base.rot, ombroE: [-168, 0, -12], ombroD: [-168, 0, 12], cotoveloE: [c, 0, 0], cotoveloD: [c, 0, 0] },
            };
          },
        }),
        camera: { azimute: 70, elevacao: 10 },
        contatos: [{ tipo: 'apoio', ponto: 'quadril', eixo: 'xyz' }, ...PES, ...OMBROS_PARADOS, { tipo: 'simetria' }],
      },
      descricao:
        'Sentado, segurando um halter com as duas mãos acima da cabeça, o halter desce atrás da cabeça dobrando os cotovelos e sobe de novo.',
      explicacao: {
        posicao: [
          'Sente com as costas apoiadas e segure um halter com as duas mãos, braços esticados acima da cabeça.',
          'Cotovelos apontando para cima e perto da cabeça.',
        ],
        execucao: [
          'Dobre os cotovelos e desça o halter devagar atrás da cabeça.',
          'Estique os cotovelos e suba o halter de volta, sem abrir os braços.',
        ],
        respiracao: 'Puxe o ar na descida e solte ao subir.',
        erros: ['Abrir os cotovelos para os lados.', 'Arquear a lombar.', 'Descer o halter rápido demais.'],
      },
    };
  },

  'Tríceps coice na polia': () => {
    const graus = 50;
    const base = ik(
      {
        raiz: { pos: [0, 0.86, -0.1], rot: [graus, 0, 0] },
        rot: {
          quadrilE: [-graus - 15, 0, 4],
          quadrilD: [-graus - 15, 0, -4],
          joelhoE: [25, 0, 0],
          joelhoD: [25, 0, 0],
          ombroD: [-35, 0, -5],
          cotoveloD: [-30, 0, 0],
        },
      },
      pesNoChao(0.15, 0, 8),
      IK_PERNAS,
    );
    const roldana: Vec3 = [0.19, 0.15, 0.75];
    return {
      receita: {
        cena: [...torrePolia(roldana, [0.19, 0.9]), { tipo: 'cabo', de: roldana, ate: 'maoE', acessorio: 'puxador' }],
        quadros: ciclo({
          primeira: 'concentrica',
          pose: (t) => ({ ...base, rot: { ...base.rot, ombroE: [20, 0, 4], cotoveloE: [lerp(-95, -5, t), 0, 0] } }),
        }),
        camera: { azimute: 90, elevacao: 10 },
        contatos: [...PES, { tipo: 'apoio', ponto: 'cotoveloE', eixo: 'xyz' }],
      },
      descricao: 'Com o tronco inclinado e o braço colado ao corpo, o antebraço estica para trás puxando o cabo e volta devagar.',
      explicacao: {
        posicao: [
          'Fique de frente para a polia baixa, segure o pegador e incline o tronco à frente com a coluna reta.',
          'Cole o braço na lateral do corpo, com o cotovelo dobrado e a mão perto do peito.',
        ],
        execucao: [
          'Estique o cotovelo levando a mão para trás, até o braço ficar todo reto.',
          'Volte devagar (cerca de 2 segundos) dobrando só o cotovelo. Faça todas as repetições e troque de lado.',
        ],
        respiracao: 'Solte o ar ao esticar o braço e puxe o ar na volta.',
        erros: ['Balançar o braço inteiro.', 'Deixar o cotovelo cair.', 'Girar o tronco.'],
      },
    };
  },

  'Mergulho nas paralelas': () => {
    const altura = 1.25;
    const maoE: Vec3 = [0.26, altura, 0];
    return {
      receita: {
        cena: [
          { tipo: 'tubo', de: [0.28, altura - 0.03, -0.45], ate: [0.28, altura - 0.03, 0.45], raio: 0.022 },
          { tipo: 'tubo', de: [-0.28, altura - 0.03, -0.45], ate: [-0.28, altura - 0.03, 0.45], raio: 0.022 },
          { tipo: 'tubo', de: [0.28, 0, 0.4], ate: [0.28, altura - 0.03, 0.4], raio: 0.03 },
          { tipo: 'tubo', de: [-0.28, 0, 0.4], ate: [-0.28, altura - 0.03, 0.4], raio: 0.03 },
          { tipo: 'tubo', de: [0.28, 0, -0.4], ate: [0.28, altura - 0.03, -0.4], raio: 0.03 },
          { tipo: 'tubo', de: [-0.28, 0, -0.4], ate: [-0.28, altura - 0.03, -0.4], raio: 0.03 },
        ],
        quadros: ciclo({
          primeira: 'excentrica',
          pose: (t) =>
            maosEm(
              {
                raiz: { pos: [0, lerp(1.4, 1.08, t), lerp(-0.02, -0.1, t)], rot: [lerp(5, 15, t), 0, 0] },
                rot: { quadrilE: [-15, 0, 2], quadrilD: [-15, 0, -2], joelhoE: [75, 0, 0], joelhoD: [75, 0, 0] },
              },
              maoE,
              misturarRot(
                { ombroE: [-5, 0, 3], ombroD: [-5, 0, -3], cotoveloE: [-5, 0, 0], cotoveloD: [-5, 0, 0] },
                { ombroE: [50, 0, 10], ombroD: [50, 0, -10], cotoveloE: [-95, 0, 0], cotoveloD: [-95, 0, 0] },
                t,
              ),
            ),
        }),
        camera: { azimute: 70, elevacao: 10 },
        contatos: [{ tipo: 'apoio', ponto: 'maoE', eixo: 'xyz' }, { tipo: 'apoio', ponto: 'maoD', eixo: 'xyz' }, { tipo: 'simetria' }],
      },
      descricao:
        'Apoiado nas barras paralelas com os braços esticados, o corpo desce dobrando os cotovelos até uns 90 graus e sobe de novo.',
      explicacao: {
        posicao: [
          'Segure as barras paralelas e suba o corpo até ficar com os braços esticados.',
          'Pernas dobradas e cruzadas atrás, tronco quase reto.',
        ],
        execucao: [
          'Desça o corpo devagar dobrando os cotovelos, que vão para trás, até ficarem em uns 90 graus.',
          'Empurre as barras e suba até esticar os braços.',
        ],
        respiracao: 'Puxe o ar na descida e solte ao subir.',
        erros: ['Descer demais e forçar o ombro.', 'Abrir os cotovelos para os lados.', 'Balançar as pernas para ajudar.'],
        dica: 'Se ainda não consegue o próprio peso, use o gráviton ou faça o mergulho no banco.',
      },
    };
  },

  'Rosca punho': () => {
    const base = ik(
      {
        raiz: { pos: [0, 0.56, 0], rot: [45, 0, 0] },
        rot: { quadrilE: [-135, 0, 8], quadrilD: [-135, 0, -8], joelhoE: [90, 0, 0], joelhoD: [90, 0, 0] },
      },
      pesNoChao(0.2, 0.45, 10),
      IK_PERNAS,
    );
    const p = posicoes(base);
    const apoiado = ik(
      { ...base, rot: { ...base.rot, ombroE: [-30, 0, 0], ombroD: [-30, 0, 0], cotoveloE: [-60, 0, 0], cotoveloD: [-60, 0, 0] } },
      [
        { ponto: 'cotoveloE', pos: mais(lerpV(p.quadrilE, p.joelhoE, 0.35), [0, 0.1, 0]) },
        { ponto: 'punhoE', pos: mais(p.joelhoE, [0, 0.08, 0.06]) },
        { ponto: 'cotoveloD', pos: mais(lerpV(p.quadrilD, p.joelhoD, 0.35), [0, 0.1, 0]) },
        { ponto: 'punhoD', pos: mais(p.joelhoD, [0, 0.08, 0.06]) },
      ],
      ['ombroE', 'ombroD', 'cotoveloE', 'cotoveloD'],
    );
    return {
      receita: {
        cena: [...bancoReto(-0.45, 0.3), { tipo: 'barra', em: 'maos', comprimento: 1.2, anilhas: true }],
        quadros: ciclo({
          primeira: 'concentrica',
          pose: (t) => {
            const w = lerp(45, -45, t);
            return { ...apoiado, rot: { ...apoiado.rot, punhoE: [w, 0, 0], punhoD: [w, 0, 0] } };
          },
        }),
        camera: { azimute: 60, elevacao: 20 },
        contatos: [{ tipo: 'apoio', ponto: 'quadril', eixo: 'xyz' }, ...PES, ...OMBROS_PARADOS, { tipo: 'simetria' }],
      },
      descricao:
        'Sentado com os antebraços apoiados nas coxas e as palmas para cima, a barra sobe só com o movimento dos punhos e desce devagar.',
      explicacao: {
        posicao: [
          'Sente na ponta do banco e apoie os antebraços nas coxas, com os punhos para fora dos joelhos.',
          'Segure a barra com as palmas viradas para cima.',
        ],
        execucao: [
          'Deixe a barra descer dobrando os punhos para baixo, devagar.',
          'Suba a barra dobrando só os punhos para cima, sem tirar os antebraços das coxas.',
        ],
        respiracao: 'Solte o ar ao subir e puxe o ar na descida.',
        erros: ['Levantar os antebraços das coxas.', 'Usar os braços para ajudar.', 'Peso pesado demais, com movimento curto.'],
      },
    };
  },
};
