import { POSE_NEUTRA, type Pose, pontoLocal, posicoes, type Vec3 } from '../esqueleto';
import type { Contato, Equipamento3D } from '../execucao';
import { torrePolia } from './cenas';
import { apoiar, bracosEm, ciclo, IK_PERNAS, ik, lerp, maosEm, pesNoChao } from './construir';
import type { Catalogo } from './tipos';

const SIMETRIA: Contato = { tipo: 'simetria' };
const QUADRIL: Contato = { tipo: 'apoio', ponto: 'quadril', eixo: 'xyz' };
const COLCHONETE: Equipamento3D = { tipo: 'caixa', pos: [0, 0.01, 0.05], tam: [0.62, 0.02, 1.8], material: 'estofado' };

/** Deitado de costas no chão (cabeça para −Z). */
const DEITADO: Pose['raiz'] = { pos: [0, 0.11, 0], rot: [-90, 0, 0] };

export const ABDOMEN: Catalogo = {
  'Abdominal supra': () => {
    const pernas = ik(
      { raiz: DEITADO, rot: { quadrilE: [-45, 0, 5], quadrilD: [-45, 0, -5], joelhoE: [95, 0, 0], joelhoD: [95, 0, 0] } },
      pesNoChao(0.12, 0.42, 5),
      IK_PERNAS,
    );
    return {
      receita: {
        cena: [COLCHONETE],
        quadros: ciclo({
          primeira: 'concentrica',
          pausaFim: 500,
          pose: (t) => {
            const p: Pose = { ...pernas, rot: { ...pernas.rot, coluna: [lerp(0, 32, t), 0, 0], pescoco: [lerp(0, 12, t), 0, 0] } };
            return maosEm(p, pontoLocal(p, 'coluna', [0.07, 0.3, 0.13]), {
              ombroE: [-40, 0, 20],
              ombroD: [-40, 0, -20],
              cotoveloE: [-130, 0, 0],
              cotoveloD: [-130, 0, 0],
            });
          },
        }),
        camera: { azimute: 80, elevacao: 15 },
        contatos: [QUADRIL, { tipo: 'apoio', ponto: 'peE', eixo: 'xyz' }, { tipo: 'apoio', ponto: 'peD', eixo: 'xyz' }, SIMETRIA],
      },
      descricao: 'Deitado de costas com os joelhos dobrados, os ombros sobem do chão enrolando a parte de cima do tronco e descem devagar.',
      explicacao: {
        posicao: [
          'Deite de costas no colchonete, joelhos dobrados e pés apoiados no chão.',
          'Mãos apoiadas no peito (ou levemente encostadas nas têmporas, sem puxar a cabeça).',
        ],
        execucao: [
          'Suba os ombros do chão enrolando a parte de cima do tronco, como se aproximasse as costelas do quadril.',
          'A lombar continua encostada no chão; o queixo fica um pouco afastado do peito.',
          'Desça devagar (cerca de 2 segundos) até as escápulas encostarem no chão.',
        ],
        respiracao: 'Solte o ar ao subir e puxe o ar na descida.',
        erros: ['Puxar a cabeça com as mãos.', 'Subir o tronco inteiro e tirar a lombar do chão.', 'Fazer rápido, usando impulso.'],
      },
    };
  },

  'Abdominal na polia': () => {
    const raiz: Pose['raiz'] = { pos: [0, 0.52, 0], rot: [10, 0, 0] };
    const pernas = ik(
      {
        raiz,
        rot: {
          quadrilE: [-10, 0, 4],
          quadrilD: [-10, 0, -4],
          joelhoE: [90, 0, 0],
          joelhoD: [90, 0, 0],
          tornozeloE: [30, 0, 0],
          tornozeloD: [30, 0, 0],
        },
      },
      [
        { ponto: 'joelhoE', pos: [0.12, 0.06, 0.04] },
        { ponto: 'joelhoD', pos: [-0.12, 0.06, 0.04] },
        { ponto: 'tornozeloE', pos: [0.12, 0.07, -0.36] },
        { ponto: 'tornozeloD', pos: [-0.12, 0.07, -0.36] },
      ],
      IK_PERNAS,
    );
    const roldana: Vec3 = [0, 2.2, 0.55];
    return {
      receita: {
        cena: [
          COLCHONETE,
          ...torrePolia(roldana, [0, 0.75]),
          { tipo: 'cabo', de: roldana, ate: 'maos', acessorio: 'corda', comprimento: 0.3 },
        ],
        quadros: ciclo({
          primeira: 'concentrica',
          pose: (t) => {
            const p: Pose = {
              ...pernas,
              raiz: { ...pernas.raiz, rot: [lerp(10, 28, t), 0, 0] },
              rot: {
                ...pernas.rot,
                quadrilE: [lerp(-10, -28, t), 0, 4],
                quadrilD: [lerp(-10, -28, t), 0, -4],
                coluna: [lerp(0, 45, t), 0, 0],
                pescoco: [lerp(0, 10, t), 0, 0],
              },
            };
            return maosEm(p, pontoLocal(p, 'pescoco', [0.1, 0.06, 0.1]), {
              ombroE: [-150, 0, 30],
              ombroD: [-150, 0, -30],
              cotoveloE: [-140, 0, 0],
              cotoveloD: [-140, 0, 0],
            });
          },
        }),
        camera: { azimute: 80, elevacao: 10 },
        contatos: [{ tipo: 'apoio', ponto: 'joelhoE', eixo: 'xyz' }, { tipo: 'apoio', ponto: 'joelhoD', eixo: 'xyz' }, SIMETRIA],
      },
      descricao:
        'Ajoelhado de frente para a polia alta, segurando a corda ao lado da cabeça, o tronco enrola para baixo levando os cotovelos em direção às coxas.',
      explicacao: {
        posicao: [
          'Prenda a corda na polia alta e ajoelhe de frente para ela, um pouco afastado.',
          'Segure as pontas da corda ao lado da cabeça, com os cotovelos apontando para a frente.',
        ],
        execucao: [
          'Leve os cotovelos para baixo, em direção às coxas, enrolando o tronco e aproximando as costelas do quadril.',
          'O quadril fica parado: quem se move é o tronco, não os braços.',
          'Volte devagar (cerca de 2 segundos) até o tronco ficar quase reto.',
        ],
        respiracao: 'Solte o ar ao enrolar o tronco e puxe o ar na volta.',
        erros: [
          'Sentar nos calcanhares em vez de enrolar o tronco.',
          'Puxar a corda com os braços.',
          'Usar peso demais e perder o controle na volta.',
        ],
      },
    };
  },

  'Elevação de pernas': () => {
    const bracos: Pose['rot'] = { ombroE: [0, 0, 8], ombroD: [0, 0, -8], cotoveloE: [-5, 0, 0], cotoveloD: [-5, 0, 0] };
    return {
      receita: {
        cena: [COLCHONETE],
        quadros: ciclo({
          primeira: 'concentrica',
          pose: (t) => {
            const q = lerp(-10, -85, t);
            return {
              raiz: DEITADO,
              rot: {
                ...bracos,
                quadrilE: [q, 0, 3],
                quadrilD: [q, 0, -3],
                joelhoE: [10, 0, 0],
                joelhoD: [10, 0, 0],
                tornozeloE: [15, 0, 0],
                tornozeloD: [15, 0, 0],
              },
            };
          },
        }),
        camera: { azimute: 80, elevacao: 15 },
        contatos: [QUADRIL, { tipo: 'apoio', ponto: 'maoE', eixo: 'xyz' }, { tipo: 'apoio', ponto: 'maoD', eixo: 'xyz' }, SIMETRIA],
      },
      descricao:
        'Deitado de costas com as pernas quase esticadas, as pernas sobem juntas até apontar para o teto e descem devagar sem encostar no chão.',
      explicacao: {
        posicao: [
          'Deite de costas no colchonete, braços ao lado do corpo com as palmas para baixo.',
          'Pernas juntas e quase esticadas, um pouco acima do chão.',
        ],
        execucao: [
          'Levante as pernas juntas até elas apontarem para o teto.',
          'Desça devagar (cerca de 2 segundos) até quase encostar os pés no chão, sem deixar a lombar sair do colchonete.',
        ],
        respiracao: 'Solte o ar ao subir as pernas e puxe o ar na descida.',
        erros: ['Arquear a lombar na descida.', 'Jogar as pernas com impulso.', 'Empurrar o chão com as mãos para ajudar.'],
        dica: 'Se a lombar sair do chão, dobre mais os joelhos ou desça menos as pernas.',
      },
    };
  },

  'Prancha (segundos)': () => {
    const neutra = posicoes(POSE_NEUTRA);
    const braco = neutra.ombroE[1] - neutra.cotoveloE[1];
    const alturaOmbro = 0.05 + braco;
    // Corpo reto nas pontas dos pés; acha a inclinação que põe os ombros na altura dos antebraços apoiados.
    let lo = 0;
    let hi = 45;
    let corpo: Pose = { raiz: { pos: [0, 0, 0], rot: [90, 0, 0] }, rot: {} };
    for (let i = 0; i < 30; i++) {
      const a = (lo + hi) / 2;
      corpo = apoiar(
        { raiz: { pos: [0, 0, 0], rot: [90 - a, 0, 0] }, rot: { tornozeloE: [35, 0, 0], tornozeloD: [35, 0, 0] } },
        'peE',
        [0.09, 0, -0.75],
      );
      if (posicoes(corpo).ombroE[1] > alturaOmbro) hi = a;
      else lo = a;
    }
    const o = posicoes(corpo).ombroE;
    const pose = bracosEm(corpo, [o[0], 0.05, o[2]], [0.07, 0.05, o[2] + 0.27], {
      ombroE: [-80, 0, 0],
      ombroD: [-80, 0, 0],
      cotoveloE: [-90, 0, 0],
      cotoveloD: [-90, 0, 0],
    });
    return {
      receita: {
        cena: [COLCHONETE],
        quadros: [
          { pose, ms: 2500, fase: 'pausa' },
          { pose, ms: 2500, fase: 'pausa' },
        ],
        camera: { azimute: 75, elevacao: 12 },
        contatos: [{ tipo: 'apoio', ponto: 'peE', eixo: 'xyz' }, { tipo: 'apoio', ponto: 'cotoveloE', eixo: 'xyz' }, SIMETRIA],
        isometrica: true,
      },
      descricao:
        'Apoiado nos antebraços e nas pontas dos pés, o corpo fica parado em linha reta da cabeça aos calcanhares pelo tempo marcado.',
      explicacao: {
        posicao: [
          'Apoie os antebraços no chão, com os cotovelos logo abaixo dos ombros.',
          'Estique as pernas para trás e apoie as pontas dos pés, na largura do quadril.',
        ],
        execucao: [
          'Levante o quadril até o corpo formar uma linha reta da cabeça aos calcanhares.',
          'Mantenha o abdômen e os glúteos contraídos, sem deixar o quadril cair nem subir.',
          'Segure parado pelo tempo da série (os segundos que você anota no lugar das repetições).',
        ],
        respiracao: 'Respire normalmente, sem prender o ar.',
        erros: ['Deixar o quadril cair (força a lombar).', 'Empinar o quadril para cima.', 'Olhar para a frente e forçar o pescoço.'],
      },
    };
  },
};
