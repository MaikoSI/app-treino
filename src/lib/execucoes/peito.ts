import { type Pose, pontoLocal, posicoes, type Vec3 } from '../esqueleto';
import type { Contato, Equipamento3D, ReceitaExecucao } from '../execucao';
import { bancoInclinado, bancoReto, maquinaSentado, suporte, torrePolia } from './cenas';
import {
  apoiar,
  bracosEm,
  ciclo,
  deitadoNoBanco,
  IK_PERNAS,
  ik,
  lerp,
  lerpV,
  mais,
  maosEm,
  misturarRot,
  pesNoChao,
  sentadoComEncosto,
} from './construir';
import type { Catalogo } from './tipos';

const PES_E_QUADRIL: Contato[] = [
  { tipo: 'apoio', ponto: 'quadril', eixo: 'xyz' },
  { tipo: 'apoio', ponto: 'peE', eixo: 'xyz' },
  { tipo: 'apoio', ponto: 'peD', eixo: 'xyz' },
  { tipo: 'simetria' },
];
const BARRA: Contato = { tipo: 'distanciaFixa', a: 'maoE', b: 'maoD' };

const SEM_CIMA: Pose['rot'] = { ombroE: [-80, 0, 15], ombroD: [-80, 0, -15], cotoveloE: [-5, 0, 0], cotoveloD: [-5, 0, 0] };
const SEM_BAIXO: Pose['rot'] = { ombroE: [10, 0, 45], ombroD: [10, 0, -45], cotoveloE: [-100, 0, 0], cotoveloD: [-100, 0, 0] };

/** Supino num banco (reto, inclinado ou declinado), com barra ou halteres. */
function supino(base: Pose, o: { alturaNoPeito: number; halteres: boolean; cena: Equipamento3D[]; contatos?: Contato[] }): ReceitaExecucao {
  const ombro = posicoes(base).ombroE;
  // Embaixo: perto do peito (no referencial do tronco, para valer em qualquer inclinação); em cima: na vertical do ombro.
  const baixo = pontoLocal(base, 'coluna', o.halteres ? [0.4, o.alturaNoPeito, 0.13] : [0.36, o.alturaNoPeito, 0.18]);
  const cima = mais(ombro, o.halteres ? [0.04, 0.61, 0.02] : [0.17, 0.59, 0.03]);
  const pesos: Equipamento3D[] = o.halteres
    ? [
        { tipo: 'halter', em: 'maoE', pegada: 'pronada' },
        { tipo: 'halter', em: 'maoD', pegada: 'pronada' },
      ]
    : [{ tipo: 'barra', em: 'maos' }];
  return {
    cena: [...o.cena, ...pesos],
    quadros: ciclo({ primeira: 'excentrica', pose: (t) => maosEm(base, lerpV(cima, baixo, t), misturarRot(SEM_CIMA, SEM_BAIXO, t)) }),
    camera: { azimute: 70, elevacao: 20 },
    contatos: [...(o.contatos ?? PES_E_QUADRIL), ...(o.halteres ? [] : [BARRA])],
  };
}

/** Deitado num banco declinado (cabeça mais baixa), pernas presas embaixo do rolo. */
function deitadoNoDeclinado(): Pose {
  const a = (20 * Math.PI) / 180;
  return {
    raiz: { pos: [0, 0.6 + 0.11 * Math.cos(a), -0.11 * Math.sin(a)], rot: [-110, 0, 0] },
    rot: {
      quadrilE: [-15, 0, 6],
      quadrilD: [-15, 0, -6],
      joelhoE: [95, 0, 0],
      joelhoD: [95, 0, 0],
      tornozeloE: [20, 0, 0],
      tornozeloD: [20, 0, 0],
    },
  };
}

const RESPIRACAO_EMPURRAR = 'Puxe o ar na descida e solte enquanto empurra.';

export const PEITO: Catalogo = {
  'Supino reto': () => ({
    receita: supino(deitadoNoBanco(0), { alturaNoPeito: 0.2, halteres: false, cena: [...bancoReto(0.3, -0.95), ...suporte(-0.7, 1.05)] }),
    descricao: 'Deitado no banco reto, a barra desce devagar até o meio do peito e sobe até esticar os braços.',
    explicacao: {
      posicao: [
        'Deite no banco reto com os olhos logo abaixo da barra.',
        'Segure a barra um pouco mais aberta que a largura dos ombros, palmas viradas para os pés.',
        'Pés firmes no chão, glúteos e costas apoiados no banco, ombros encaixados para trás.',
      ],
      execucao: [
        'Tire a barra do suporte e deixe os braços esticados acima dos ombros.',
        'Desça a barra devagar (cerca de 2 segundos) até encostar de leve no meio do peito, na linha dos mamilos.',
        'Na descida, os cotovelos ficam a uns 45 a 60 graus do corpo, nunca abertos em 90 graus.',
        'Empurre a barra para cima e um pouco para trás até esticar os braços, sem travar os cotovelos com força.',
      ],
      respiracao: RESPIRACAO_EMPURRAR,
      erros: ['Abrir os cotovelos em 90 graus, forçando o ombro.', 'Quicar a barra no peito.', 'Tirar o quadril do banco para empurrar.'],
      dica: 'No começo, peça para alguém ficar atrás do banco ajudando a tirar e devolver a barra.',
    },
  }),

  'Supino reto com halteres': () => ({
    receita: supino(deitadoNoBanco(0), { alturaNoPeito: 0.2, halteres: true, cena: bancoReto(0.3, -0.95) }),
    descricao: 'Deitado no banco reto com um halter em cada mão, os halteres descem até a linha do peito e sobem quase se encontrando.',
    explicacao: {
      posicao: [
        'Sente na ponta do banco com os halteres apoiados nas coxas e deite levando-os junto ao peito.',
        'Pés firmes no chão, costas e glúteos apoiados, ombros encaixados para trás.',
        'Palmas viradas para os pés, halteres na altura do peito.',
      ],
      execucao: [
        'Empurre os halteres para cima até esticar os braços, com eles quase se encostando acima dos ombros.',
        'Desça devagar (cerca de 2 segundos) abrindo os cotovelos a uns 45 a 60 graus do corpo.',
        'Pare quando os halteres chegarem na altura do peito, sentindo o peitoral alongar, e suba de novo.',
      ],
      respiracao: RESPIRACAO_EMPURRAR,
      erros: ['Descer demais e forçar o ombro.', 'Bater um halter no outro no alto.', 'Deixar os punhos dobrarem para trás.'],
    },
  }),

  'Supino inclinado': () => ({
    receita: supino(deitadoNoBanco(35), {
      alturaNoPeito: 0.28,
      halteres: false,
      cena: [...bancoInclinado(35, [0, 0.45, 0]), ...suporte(-0.55, 1.45)],
    }),
    descricao: 'No banco inclinado, a barra desce até a parte de cima do peito e sobe na vertical até esticar os braços.',
    explicacao: {
      posicao: [
        'Ajuste o encosto do banco entre 30 e 45 graus.',
        'Deite com as costas apoiadas e segure a barra um pouco mais aberta que os ombros.',
        'Pés firmes no chão e ombros encaixados para trás.',
      ],
      execucao: [
        'Tire a barra do suporte e deixe os braços esticados acima dos ombros.',
        'Desça a barra devagar até a parte de cima do peito, logo abaixo da clavícula.',
        'Cotovelos a uns 45 a 60 graus do corpo durante a descida.',
        'Empurre a barra para cima, em linha reta, até esticar os braços.',
      ],
      respiracao: RESPIRACAO_EMPURRAR,
      erros: ['Encosto alto demais (vira exercício de ombro).', 'Descer a barra no meio da barriga.', 'Arquear muito a lombar.'],
    },
  }),

  'Supino inclinado com halteres': () => ({
    receita: supino(deitadoNoBanco(35), { alturaNoPeito: 0.28, halteres: true, cena: bancoInclinado(35, [0, 0.45, 0]) }),
    descricao:
      'No banco inclinado com um halter em cada mão, os halteres descem até a parte de cima do peito e sobem quase se encontrando.',
    explicacao: {
      posicao: [
        'Ajuste o encosto do banco entre 30 e 45 graus.',
        'Deite com os halteres na altura da parte de cima do peito, palmas viradas para a frente.',
        'Pés firmes no chão e costas apoiadas.',
      ],
      execucao: [
        'Empurre os halteres para cima até esticar os braços, quase se encontrando acima dos ombros.',
        'Desça devagar (cerca de 2 segundos) até os halteres ficarem ao lado da parte de cima do peito.',
        'Mantenha os cotovelos a uns 45 a 60 graus do corpo e suba de novo.',
      ],
      respiracao: RESPIRACAO_EMPURRAR,
      erros: ['Encosto alto demais (vira exercício de ombro).', 'Deixar os halteres caírem para os lados.', 'Tirar as costas do banco.'],
    },
  }),

  'Supino declinado': () => {
    const base = deitadoNoDeclinado();
    const p = posicoes(base);
    const rolo: Vec3 = lerpV(p.joelhoE, p.tornozeloE, 0.7);
    return {
      receita: supino(base, {
        alturaNoPeito: 0.14,
        halteres: false,
        cena: [
          ...bancoInclinado(-20, [0, 0.6, 0], 0.85, 0.3),
          { tipo: 'tubo', de: [0.2, rolo[1], rolo[2] + 0.08], ate: [-0.2, rolo[1], rolo[2] + 0.08], raio: 0.05 },
          { tipo: 'tubo', de: [0, 0, rolo[2] + 0.08], ate: [0, rolo[1], rolo[2] + 0.08], raio: 0.025 },
          ...suporte(-0.85, 1.05),
        ],
        contatos: [
          { tipo: 'apoio', ponto: 'quadril', eixo: 'xyz' },
          { tipo: 'apoio', ponto: 'tornozeloE', eixo: 'xyz' },
          { tipo: 'simetria' },
        ],
      }),
      descricao: 'No banco declinado, com as pernas presas, a barra desce até a parte de baixo do peito e sobe até esticar os braços.',
      explicacao: {
        posicao: [
          'Prenda as pernas embaixo do rolo do banco declinado e deite com a cabeça mais baixa que o quadril.',
          'Segure a barra um pouco mais aberta que os ombros, palmas viradas para os pés.',
        ],
        execucao: [
          'Tire a barra do suporte (de preferência com ajuda) e estique os braços acima dos ombros.',
          'Desça a barra devagar até a parte de baixo do peito.',
          'Empurre a barra para cima até esticar os braços.',
        ],
        respiracao: RESPIRACAO_EMPURRAR,
        erros: ['Fazer sem alguém por perto para ajudar com a barra.', 'Descer a barra no pescoço.', 'Soltar as pernas do rolo.'],
        dica: 'Se ficar tonto com a cabeça para baixo, troque pelo supino reto.',
      },
    };
  },

  'Supino reto na máquina': () => {
    const base = sentadoComEncosto();
    const o = posicoes(base).ombroE;
    const baixo = mais(o, [0.14, -0.08, 0.24]);
    const cima = mais(o, [0.04, -0.04, 0.6]);
    return {
      receita: {
        cena: [
          ...maquinaSentado(),
          { tipo: 'placa', em: 'maoE', tam: [0.04, 0.16, 0.04], material: 'estofado' },
          { tipo: 'placa', em: 'maoD', tam: [0.04, 0.16, 0.04], material: 'estofado' },
          { tipo: 'placa', em: 'maoE', tam: [0.05, 0.05, 0.5], desloc: [0.06, 0, -0.27], material: 'metal' },
          { tipo: 'placa', em: 'maoD', tam: [0.05, 0.05, 0.5], desloc: [-0.06, 0, -0.27], material: 'metal' },
        ],
        quadros: ciclo({
          primeira: 'concentrica',
          pose: (t) =>
            maosEm(
              base,
              lerpV(baixo, cima, t),
              misturarRot(
                { ombroE: [-20, 0, 60], ombroD: [-20, 0, -60], cotoveloE: [-120, 0, 0], cotoveloD: [-120, 0, 0] },
                { ombroE: [-85, 0, 10], ombroD: [-85, 0, -10], cotoveloE: [-5, 0, 0], cotoveloD: [-5, 0, 0] },
                t,
              ),
            ),
        }),
        camera: { azimute: 70, elevacao: 12 },
        contatos: PES_E_QUADRIL,
      },
      descricao: 'Sentado na máquina, as mãos empurram os pegadores para a frente até esticar os braços e voltam devagar até o peito.',
      explicacao: {
        posicao: [
          'Ajuste o banco para os pegadores ficarem na altura do meio do peito.',
          'Sente com as costas inteiras apoiadas no encosto e os pés no chão.',
          'Segure os pegadores com os cotovelos um pouco abaixo da linha dos ombros.',
        ],
        execucao: [
          'Empurre os pegadores para a frente até esticar os braços, sem travar os cotovelos.',
          'Volte devagar (cerca de 2 segundos) até as mãos ficarem perto do peito.',
          'As costas não saem do encosto em nenhum momento.',
        ],
        respiracao: 'Solte o ar ao empurrar e puxe o ar na volta.',
        erros: [
          'Banco baixo ou alto demais (pegador longe do peito).',
          'Tirar as costas do encosto.',
          'Deixar o peso bater no fim da volta.',
        ],
      },
    };
  },

  'Crucifixo com halteres': () => {
    const base = deitadoNoBanco(0);
    const o = posicoes(base).ombroE;
    const cotovelo: Pose['rot'] = { cotoveloE: [-20, 0, 0], cotoveloD: [-20, 0, 0] };
    return {
      receita: {
        cena: [...bancoReto(0.3, -0.95), { tipo: 'halter', em: 'maoE' }, { tipo: 'halter', em: 'maoD' }],
        quadros: ciclo({
          primeira: 'excentrica',
          pose: (t) => {
            // Arco: as mãos descem abrindo para os lados, com os cotovelos sempre levemente dobrados.
            const ang = lerp(80, 5, t) * (Math.PI / 180);
            const alvo: Vec3 = [o[0] - 0.05 + 0.6 * Math.cos(ang), o[1] + 0.06 + 0.54 * Math.sin(ang), o[2] + 0.04];
            return maosEm(
              { ...base, rot: { ...base.rot, ...cotovelo } },
              alvo,
              misturarRot({ ombroE: [-85, 0, 5], ombroD: [-85, 0, -5] }, { ombroE: [-5, 0, 85], ombroD: [-5, 0, -85] }, t),
              undefined,
              ['ombroE', 'ombroD'],
            );
          },
        }),
        camera: { azimute: 20, elevacao: 35 },
        contatos: PES_E_QUADRIL,
      },
      descricao:
        'Deitado no banco reto, os braços abrem em arco para os lados com os cotovelos levemente dobrados e voltam a se encontrar acima do peito.',
      explicacao: {
        posicao: [
          'Deite no banco reto com um halter em cada mão, braços esticados acima do peito.',
          'Palmas viradas uma para a outra e cotovelos levemente dobrados (essa dobra não muda durante o exercício).',
        ],
        execucao: [
          'Abra os braços em arco para os lados, devagar, até as mãos chegarem perto da altura do peito.',
          'Sinta o peitoral alongar e volte pelo mesmo arco, como se fosse abraçar uma árvore.',
          'Pare quando os halteres estiverem quase se encostando acima do peito.',
        ],
        respiracao: 'Puxe o ar ao abrir os braços e solte ao fechar.',
        erros: ['Esticar e dobrar os cotovelos (vira supino).', 'Descer os braços abaixo da linha do banco.', 'Usar peso pesado demais.'],
      },
    };
  },

  'Voador (peck deck)': () => {
    const base = sentadoComEncosto();
    const o = posicoes(base).ombroE;
    return {
      receita: {
        cena: [
          ...maquinaSentado(),
          { tipo: 'placa', em: { art: 'cotoveloE', desloc: [0, -0.14, 0.05] }, tam: [0.06, 0.32, 0.1], material: 'estofado' },
          { tipo: 'placa', em: { art: 'cotoveloD', desloc: [0, -0.14, 0.05] }, tam: [0.06, 0.32, 0.1], material: 'estofado' },
        ],
        quadros: ciclo({
          primeira: 'concentrica',
          pose: (t) => {
            const f = lerp(-10, 72, t) * (Math.PI / 180);
            const cot = mais(o, [0.29 * Math.cos(f), -0.02, 0.29 * Math.sin(f)]);
            return bracosEm(base, cot, mais(cot, [0, 0.33, 0.04]), {
              ombroE: [0, -30, 88],
              ombroD: [0, 30, -88],
              cotoveloE: [-90, 0, 0],
              cotoveloD: [-90, 0, 0],
            });
          },
        }),
        camera: { azimute: 25, elevacao: 30 },
        contatos: PES_E_QUADRIL,
      },
      descricao: 'Sentado no voador, com os antebraços nas almofadas, os braços fecham à frente do peito e abrem devagar.',
      explicacao: {
        posicao: [
          'Ajuste o banco para os cotovelos ficarem na altura dos ombros.',
          'Sente com as costas apoiadas e apoie os antebraços nas almofadas (ou segure os pegadores).',
        ],
        execucao: [
          'Feche os braços à frente do peito, levando os cotovelos um em direção ao outro.',
          'Aperte o peitoral por um instante no fim.',
          'Abra devagar (cerca de 2 segundos) até os cotovelos ficarem alinhados com o corpo, sem passar muito para trás.',
        ],
        respiracao: 'Solte o ar ao fechar e puxe o ar ao abrir.',
        erros: [
          'Banco na altura errada (cotovelo abaixo ou acima do ombro).',
          'Abrir demais e forçar o ombro.',
          'Tirar as costas do encosto.',
        ],
      },
    };
  },

  Crossover: () => {
    const base = ik(
      { raiz: { pos: [0, 0.95, -0.03], rot: [15, 0, 0] }, rot: { quadrilE: [-15, 0, 3], quadrilD: [-15, 0, -3] } },
      pesNoChao(0.15, 0, 8),
      IK_PERNAS,
    );
    const roldana: Vec3 = [0.95, 2.0, -0.2];
    return {
      receita: {
        cena: [
          ...torrePolia(roldana),
          ...torrePolia([-roldana[0], roldana[1], roldana[2]]),
          { tipo: 'cabo', de: roldana, ate: 'maoE', acessorio: 'puxador' },
          { tipo: 'cabo', de: [-roldana[0], roldana[1], roldana[2]], ate: 'maoD', acessorio: 'puxador' },
        ],
        quadros: ciclo({
          primeira: 'concentrica',
          pose: (t) => {
            const m = lerpV([0.72, 1.48, 0.02], [0.07, 1.0, 0.42], t);
            m[2] += Math.sin(Math.PI * t) * 0.12;
            return maosEm(
              { ...base, rot: { ...base.rot, cotoveloE: [-20, 0, 0], cotoveloD: [-20, 0, 0] } },
              m,
              misturarRot({ ombroE: [-20, 0, 80], ombroD: [-20, 0, -80] }, { ombroE: [-50, 0, -10], ombroD: [-50, 0, 10] }, t),
              undefined,
              ['ombroE', 'ombroD'],
            );
          },
        }),
        camera: { azimute: 35, elevacao: 15 },
        contatos: [{ tipo: 'apoio', ponto: 'peE', eixo: 'xyz' }, { tipo: 'apoio', ponto: 'peD', eixo: 'xyz' }, { tipo: 'simetria' }],
      },
      descricao: 'Em pé entre as duas polias altas, as mãos descem em arco de braços abertos até se encontrarem à frente do quadril.',
      explicacao: {
        posicao: [
          'Prenda os pegadores nas polias altas e fique no meio, um passo à frente delas.',
          'Incline o tronco um pouco à frente, com o abdômen firme e os joelhos levemente soltos.',
          'Braços abertos e cotovelos levemente dobrados.',
        ],
        execucao: [
          'Puxe os pegadores para baixo e para a frente em arco, até as mãos se encontrarem à frente do quadril.',
          'Os cotovelos ficam levemente dobrados o tempo todo.',
          'Volte devagar (cerca de 2 segundos) abrindo os braços até sentir o peitoral alongar.',
        ],
        respiracao: 'Solte o ar ao fechar os braços e puxe o ar ao abrir.',
        erros: [
          'Dobrar e esticar os cotovelos (vira tríceps).',
          'Deixar o peso puxar os braços para trás de uma vez.',
          'Encolher os ombros.',
        ],
      },
    };
  },

  'Flexão de braço': () => {
    const corpo = (alt: number): Pose => {
      // Corpo reto apoiado nas pontas dos pés; acha a inclinação que deixa os ombros na altura `alt`.
      let lo = 0;
      let hi = 45;
      let p: Pose = { raiz: { pos: [0, 0, 0], rot: [90, 0, 0] }, rot: {} };
      for (let i = 0; i < 30; i++) {
        const a = (lo + hi) / 2;
        p = apoiar({ raiz: { pos: [0, 0, 0], rot: [90 - a, 0, 0] }, rot: {} }, 'peE', [0.09, 0, -0.8]);
        if (posicoes(p).ombroE[1] > alt) hi = a;
        else lo = a;
      }
      return p;
    };
    return {
      receita: {
        cena: [],
        quadros: ciclo({
          primeira: 'excentrica',
          pose: (t) => {
            const p = corpo(lerp(0.6, 0.2, t));
            const o = posicoes(p).ombroE;
            return maosEm(
              p,
              [0.32, 0, o[2] + 0.02],
              misturarRot(
                { ombroE: [-90, 0, 12], ombroD: [-90, 0, -12], cotoveloE: [-5, 0, 0], cotoveloD: [-5, 0, 0] },
                { ombroE: [-20, 0, 45], ombroD: [-20, 0, -45], cotoveloE: [-110, 0, 0], cotoveloD: [-110, 0, 0] },
                t,
              ),
              [-0.32, 0, o[2] + 0.02],
            );
          },
        }),
        camera: { azimute: 75, elevacao: 15 },
        contatos: [
          { tipo: 'apoio', ponto: 'peE', eixo: 'xyz' },
          { tipo: 'apoio', ponto: 'peD', eixo: 'xyz' },
          { tipo: 'apoio', ponto: 'maoE', eixo: 'y' },
          { tipo: 'apoio', ponto: 'maoD', eixo: 'y' },
          { tipo: 'simetria' },
        ],
      },
      descricao: 'Com as mãos e as pontas dos pés no chão e o corpo reto, o peito desce até perto do chão e sobe esticando os braços.',
      explicacao: {
        posicao: [
          'Apoie as mãos no chão um pouco mais abertas que os ombros e estique as pernas para trás, nas pontas dos pés.',
          'Corpo reto da cabeça aos calcanhares: abdômen e glúteos contraídos.',
        ],
        execucao: [
          'Dobre os cotovelos e desça o peito até quase encostar no chão, cotovelos a uns 45 graus do corpo.',
          'Empurre o chão e suba até esticar os braços, mantendo o corpo reto como uma tábua.',
        ],
        respiracao: 'Puxe o ar na descida e solte ao subir.',
        erros: ['Deixar o quadril cair ou empinar.', 'Abrir os cotovelos em 90 graus.', 'Descer só a cabeça, sem levar o peito.'],
        dica: 'Se estiver difícil, apoie os joelhos no chão ou as mãos num banco.',
      },
    };
  },
};
