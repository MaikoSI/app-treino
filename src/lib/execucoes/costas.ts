import { type Pose, pontoLocal, posicoes, type Vec3 } from '../esqueleto';
import type { Contato, Equipamento3D } from '../execucao';
import { bancoReto, torrePolia } from './cenas';
import { ciclo, emPeFirme, IK_PERNAS, ik, lerp, lerpV, mais, maosEm, misturarRot, pesNoChao, sentado } from './construir';
import type { Catalogo } from './tipos';

const PES: Contato[] = [
  { tipo: 'apoio', ponto: 'peE', eixo: 'xyz' },
  { tipo: 'apoio', ponto: 'peD', eixo: 'xyz' },
];
const SENTADO: Contato[] = [{ tipo: 'apoio', ponto: 'quadril', eixo: 'xyz' }, ...PES, { tipo: 'simetria' }];
const BARRA: Contato = { tipo: 'distanciaFixa', a: 'maoE', b: 'maoD' };
const suave = (u: number) => (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, u)))) / 2;

/** Tronco inclinado à frente `graus`, joelhos levemente dobrados, pés no chão (remadas curvadas). */
function curvado(graus: number, largura = 0.15): Pose {
  const a = (graus * Math.PI) / 180;
  return ik(
    {
      raiz: { pos: [0, 0.86, -0.06 - 0.12 * Math.sin(a)], rot: [graus, 0, 0] },
      rot: { quadrilE: [-graus - 15, 0, 4], quadrilD: [-graus - 15, 0, -4], joelhoE: [25, 0, 0], joelhoD: [25, 0, 0] },
    },
    pesNoChao(largura, 0, 8),
    IK_PERNAS,
  );
}

/** Puxadas na polia alta (barra aberta ou triângulo). */
function puxada(o: { largura: number; acessorio: 'barra' | 'triangulo'; inclinacao: number }) {
  const base = sentado(o.inclinacao);
  const ombro = posicoes(base).ombroE;
  const cima: Vec3 = [o.largura, ombro[1] + Math.sqrt(0.62 ** 2 - (o.largura - ombro[0]) ** 2), ombro[2] + 0.06];
  const baixo: Vec3 = pontoLocal(base, 'coluna', [o.largura, 0.3, 0.22]);
  const aberto = o.largura > 0.3;
  return {
    cena: [
      { tipo: 'caixa', pos: [0, 0.46, 0.05], tam: [0.4, 0.08, 0.4], material: 'estofado' },
      { tipo: 'caixa', pos: [0, 0.22, 0.05], tam: [0.08, 0.44, 0.3], material: 'metal' },
      { tipo: 'caixa', pos: [0, 0.74, 0.36], tam: [0.4, 0.08, 0.1], material: 'estofado' },
      ...torrePolia([0, 2.3, 0.1], [0, 0.75]),
      { tipo: 'cabo', de: [0, 2.3, 0.1], ate: 'maos', acessorio: o.acessorio },
    ] as Equipamento3D[],
    quadros: ciclo({
      primeira: 'concentrica',
      pose: (t) =>
        maosEm(
          base,
          lerpV(cima, baixo, t),
          misturarRot(
            { ombroE: [-160, 0, aberto ? 25 : 2], ombroD: [-160, 0, aberto ? -25 : -2], cotoveloE: [-10, 0, 0], cotoveloD: [-10, 0, 0] },
            {
              ombroE: [aberto ? -20 : 10, 0, aberto ? 70 : 20],
              ombroD: [aberto ? -20 : 10, 0, aberto ? -70 : -20],
              cotoveloE: [-110, 0, 0],
              cotoveloD: [-110, 0, 0],
            },
            t,
          ),
        ),
    }),
    camera: { azimute: 75, elevacao: 12 },
    contatos: [...SENTADO, BARRA],
  };
}

export const COSTAS: Catalogo = {
  'Puxada alta': () => ({
    receita: puxada({ largura: 0.42, acessorio: 'barra', inclinacao: -15 }),
    descricao: 'Sentado na máquina, a barra desce da altura dos braços esticados até a parte de cima do peito e volta devagar.',
    explicacao: {
      posicao: [
        'Ajuste o apoio para as coxas ficarem presas embaixo dele, com os pés no chão.',
        'Segure a barra bem aberta, mais larga que os ombros, com as palmas viradas para a frente.',
        'Incline o tronco só um pouco para trás (uns 15 graus) e estufe o peito.',
      ],
      execucao: [
        'Puxe a barra para baixo levando os cotovelos para baixo e para trás, até ela chegar na parte de cima do peito.',
        'No fim, aperte as escápulas (as "asas" das costas) uma contra a outra.',
        'Suba a barra devagar (cerca de 2 segundos) até esticar os braços, sem soltar o peso de uma vez.',
      ],
      respiracao: 'Solte o ar ao puxar a barra e puxe o ar enquanto ela sobe.',
      erros: [
        'Jogar o tronco muito para trás para puxar.',
        'Puxar a barra atrás da nuca.',
        'Deixar os ombros subirem até as orelhas no topo.',
      ],
    },
  }),

  'Puxada alta com triângulo': () => ({
    receita: puxada({ largura: 0.07, acessorio: 'triangulo', inclinacao: -20 }),
    descricao: 'Sentado na máquina com o triângulo, as mãos descem juntas até a parte de cima do peito, cotovelos rentes ao corpo.',
    explicacao: {
      posicao: [
        'Prenda o triângulo no cabo e segure com as palmas viradas uma para a outra.',
        'Coxas presas embaixo do apoio, pés no chão, tronco levemente inclinado para trás (uns 20 graus).',
      ],
      execucao: [
        'Puxe o triângulo até a parte de cima do peito, levando os cotovelos para baixo e rentes ao corpo.',
        'Aperte as costas por um instante no fim.',
        'Suba devagar (cerca de 2 segundos) até esticar os braços.',
      ],
      respiracao: 'Solte o ar ao puxar e puxe o ar enquanto o triângulo sobe.',
      erros: ['Balançar o tronco para ajudar.', 'Abrir os cotovelos para os lados.', 'Encolher os ombros no topo.'],
    },
  }),

  'Barra fixa': () => {
    const altura = 2.25;
    const maoE: Vec3 = [0.42, altura, 0];
    return {
      receita: {
        cena: [
          { tipo: 'tubo', de: [0.75, altura, 0], ate: [-0.75, altura, 0], raio: 0.018 },
          { tipo: 'tubo', de: [0.75, 0, 0], ate: [0.75, altura + 0.05, 0], raio: 0.035 },
          { tipo: 'tubo', de: [-0.75, 0, 0], ate: [-0.75, altura + 0.05, 0], raio: 0.035 },
        ],
        quadros: ciclo({
          primeira: 'concentrica',
          pose: (t) => {
            const s = suave(t);
            const base: Pose = {
              raiz: { pos: [0, lerp(1.2, 1.62, s), lerp(-0.02, -0.1, s)], rot: [lerp(0, -8, s), 0, 0] },
              rot: { joelhoE: [35, 0, 0], joelhoD: [35, 0, 0], quadrilE: [-10, 0, 0], quadrilD: [-10, 0, 0] },
            };
            return maosEm(
              base,
              maoE,
              misturarRot(
                { ombroE: [-170, 0, 25], ombroD: [-170, 0, -25], cotoveloE: [-5, 0, 0], cotoveloD: [-5, 0, 0] },
                { ombroE: [-30, 0, 75], ombroD: [-30, 0, -75], cotoveloE: [-120, 0, 0], cotoveloD: [-120, 0, 0] },
                t,
              ),
            );
          },
        }),
        camera: { azimute: 40, elevacao: 5 },
        contatos: [{ tipo: 'apoio', ponto: 'maoE', eixo: 'xyz' }, { tipo: 'apoio', ponto: 'maoD', eixo: 'xyz' }, { tipo: 'simetria' }],
      },
      descricao: 'Pendurado na barra com as mãos abertas, o corpo sobe até o queixo passar da barra e desce devagar até esticar os braços.',
      explicacao: {
        posicao: [
          'Segure a barra um pouco mais aberta que os ombros, com as palmas viradas para a frente.',
          'Fique pendurado com os braços esticados, pernas juntas (pode dobrar os joelhos) e abdômen firme.',
        ],
        execucao: [
          'Puxe o corpo para cima levando os cotovelos para baixo, em direção às costelas.',
          'Suba até o queixo passar da altura da barra.',
          'Desça devagar (cerca de 2 segundos) até esticar os braços de novo.',
        ],
        respiracao: 'Solte o ar ao subir e puxe o ar na descida.',
        erros: ['Balançar o corpo para pegar impulso.', 'Subir só até a metade.', 'Soltar o corpo de uma vez na descida.'],
        dica: 'Se ainda não consegue, use o gráviton (máquina com apoio) ou um elástico preso na barra.',
      },
    };
  },

  'Remada curvada': () => {
    const base = curvado(45);
    const ombro = posicoes(base).ombroE;
    const baixo = mais(ombro, [0.06, -0.6, 0.06]);
    const cima = pontoLocal(base, 'coluna', [0.25, 0.04, 0.17]);
    return {
      receita: {
        cena: [{ tipo: 'barra', em: 'maos' }],
        quadros: ciclo({
          primeira: 'concentrica',
          pose: (t) =>
            maosEm(
              base,
              lerpV(baixo, cima, t),
              misturarRot(
                { ombroE: [-45, 0, 5], ombroD: [-45, 0, -5], cotoveloE: [-5, 0, 0], cotoveloD: [-5, 0, 0] },
                { ombroE: [30, 0, 25], ombroD: [30, 0, -25], cotoveloE: [-100, 0, 0], cotoveloD: [-100, 0, 0] },
                t,
              ),
            ),
        }),
        camera: { azimute: 80, elevacao: 10 },
        contatos: [...PES, BARRA, { tipo: 'simetria' }],
      },
      descricao: 'Com o tronco inclinado à frente e a coluna reta, a barra sobe dos joelhos até a barriga e desce devagar.',
      explicacao: {
        posicao: [
          'Pés na largura do quadril, joelhos levemente dobrados.',
          'Incline o tronco à frente (uns 45 graus) levando o quadril para trás, com a coluna reta.',
          'Segure a barra na largura dos ombros, braços esticados.',
        ],
        execucao: [
          'Puxe a barra em direção à barriga (perto do umbigo), levando os cotovelos para trás e rentes ao corpo.',
          'Aperte as escápulas uma contra a outra no fim.',
          'Desça a barra devagar (cerca de 2 segundos) até esticar os braços, sem mudar a inclinação do tronco.',
        ],
        respiracao: 'Solte o ar ao puxar e puxe o ar na descida.',
        erros: ['Arredondar as costas.', 'Levantar o tronco a cada repetição.', 'Puxar com os braços, sem mexer as escápulas.'],
      },
    };
  },

  'Remada unilateral (serrote)': () => {
    // Joelho e mão direitos no banco, pé esquerdo no chão; o braço esquerdo rema o halter.
    const semente: Pose = {
      raiz: { pos: [0.14, 0.78, -0.05], rot: [78, 0, 0] },
      rot: { quadrilE: [-70, 0, 12], quadrilD: [-75, 0, 0], joelhoE: [30, 0, 0], joelhoD: [95, 0, 0] },
    };
    const pernas = ik(
      semente,
      [
        { ponto: 'tornozeloE', pos: [0.36, 0.07, 0.05] },
        { ponto: 'peE', pos: [0.38, 0, 0.15] },
        { ponto: 'joelhoD', pos: [0, 0.5, 0.0] },
        { ponto: 'tornozeloD', pos: [0, 0.52, -0.42] },
      ],
      IK_PERNAS,
    );
    const apoio = ik(
      { ...pernas, rot: { ...pernas.rot, ombroD: [-80, 0, 0], cotoveloD: [-5, 0, 0] } },
      [{ ponto: 'maoD', pos: [0, 0.47, 0.62] }],
      ['ombroD', 'cotoveloD'],
    );
    const ombro = posicoes(apoio).ombroE;
    const baixo = mais(ombro, [0.02, -0.6, 0.04]);
    const cima = pontoLocal(apoio, 'coluna', [0.22, 0.1, 0.02]);
    return {
      receita: {
        cena: [...bancoReto(-0.6, 0.75, 0.45, 0.3, 0), { tipo: 'halter', em: 'maoE' }],
        quadros: ciclo({
          primeira: 'concentrica',
          pose: (t) =>
            ik(
              {
                ...apoio,
                rot: {
                  ...apoio.rot,
                  ...misturarRot({ ombroE: [-80, 0, 5], cotoveloE: [-5, 0, 0] }, { ombroE: [20, 0, 15], cotoveloE: [-100, 0, 0] }, t),
                },
              },
              [{ ponto: 'maoE', pos: lerpV(baixo, cima, t) }],
              ['ombroE', 'cotoveloE'],
            ),
        }),
        camera: { azimute: 120, elevacao: 15 },
        contatos: [
          { tipo: 'apoio', ponto: 'peE', eixo: 'xyz' },
          { tipo: 'apoio', ponto: 'joelhoD', eixo: 'xyz' },
          { tipo: 'apoio', ponto: 'maoD', eixo: 'xyz' },
        ],
      },
      descricao: 'Com um joelho e uma mão apoiados no banco, o outro braço puxa o halter do chão até a cintura e desce devagar.',
      explicacao: {
        posicao: [
          'Apoie o joelho e a mão do mesmo lado no banco; o outro pé fica firme no chão.',
          'Tronco quase paralelo ao chão, coluna reta e olhar para baixo.',
          'Segure o halter com o braço esticado, palma virada para o corpo.',
        ],
        execucao: [
          'Puxe o halter em direção à cintura, levando o cotovelo para cima e para trás, rente ao corpo.',
          'Aperte as costas no fim, sem girar o tronco.',
          'Desça devagar (cerca de 2 segundos) até esticar o braço. Faça todas as repetições e troque de lado.',
        ],
        respiracao: 'Solte o ar ao puxar e puxe o ar na descida.',
        erros: ['Girar o tronco para subir o peso.', 'Puxar o halter em direção ao peito.', 'Arredondar as costas.'],
      },
    };
  },

  'Remada baixa': () => {
    const semente: Pose = {
      raiz: { pos: [0, 0.48, 0], rot: [-5, 0, 0] },
      rot: {
        quadrilE: [-75, 0, 6],
        quadrilD: [-75, 0, -6],
        joelhoE: [30, 0, 0],
        joelhoD: [30, 0, 0],
        tornozeloE: [-20, 0, 0],
        tornozeloD: [-20, 0, 0],
      },
    };
    const base = ik(
      semente,
      [
        { ponto: 'tornozeloE', pos: [0.13, 0.36, 0.82] },
        { ponto: 'tornozeloD', pos: [-0.13, 0.36, 0.82] },
        { ponto: 'peE', pos: [0.13, 0.48, 0.88] },
        { ponto: 'peD', pos: [-0.13, 0.48, 0.88] },
      ],
      IK_PERNAS,
    );
    const ombro = posicoes(base).ombroE;
    const frente: Vec3 = [0.06, ombro[1] - 0.12, ombro[2] + 0.58];
    const barriga = pontoLocal(base, 'coluna', [0.06, 0.12, 0.2]);
    return {
      receita: {
        cena: [
          { tipo: 'caixa', pos: [0, 0.34, 0.0], tam: [0.36, 0.08, 0.5], material: 'estofado' },
          { tipo: 'caixa', pos: [0, 0.15, 0.3], tam: [0.12, 0.3, 1.2], material: 'metal' },
          { tipo: 'caixa', pos: [0, 0.45, 0.95], tam: [0.45, 0.3, 0.04], rot: [-20, 0, 0], material: 'metal' },
          ...torrePolia([0, 0.55, 1.25], [0, 1.3]),
          { tipo: 'cabo', de: [0, 0.55, 1.25], ate: 'maos', acessorio: 'triangulo' },
        ],
        quadros: ciclo({
          primeira: 'concentrica',
          pose: (t) =>
            maosEm(
              base,
              lerpV(frente, barriga, t),
              misturarRot(
                { ombroE: [-80, 0, 2], ombroD: [-80, 0, -2], cotoveloE: [-5, 0, 0], cotoveloD: [-5, 0, 0] },
                { ombroE: [30, 0, 15], ombroD: [30, 0, -15], cotoveloE: [-110, 0, 0], cotoveloD: [-110, 0, 0] },
                t,
              ),
            ),
        }),
        camera: { azimute: 80, elevacao: 12 },
        contatos: [
          { tipo: 'apoio', ponto: 'quadril', eixo: 'xyz' },
          { tipo: 'apoio', ponto: 'peE', eixo: 'xyz' },
          { tipo: 'apoio', ponto: 'peD', eixo: 'xyz' },
          BARRA,
          { tipo: 'simetria' },
        ],
      },
      descricao:
        'Sentado com os pés na plataforma, o triângulo vem dos braços esticados até a barriga com o tronco parado e volta devagar.',
      explicacao: {
        posicao: [
          'Sente com os pés apoiados na plataforma e os joelhos levemente dobrados.',
          'Segure o triângulo com os braços esticados e o tronco reto, sem deitar para trás.',
        ],
        execucao: [
          'Puxe o triângulo até a barriga, levando os cotovelos para trás rentes ao corpo.',
          'Aperte as escápulas uma contra a outra e estufe o peito no fim.',
          'Estique os braços devagar (cerca de 2 segundos), deixando os ombros irem um pouco à frente, sem curvar a coluna.',
        ],
        respiracao: 'Solte o ar ao puxar e puxe o ar ao esticar os braços.',
        erros: ['Balançar o tronco para a frente e para trás.', 'Arredondar a lombar.', 'Puxar com os ombros encolhidos.'],
      },
    };
  },

  'Remada cavalinho': () => {
    const base = curvado(40, 0.2);
    const ombro = posicoes(base).ombroE;
    const baixo: Vec3 = [0.07, ombro[1] - 0.6, ombro[2] + 0.08];
    const cima = pontoLocal(base, 'coluna', [0.07, 0.18, 0.2]);
    return {
      receita: {
        cena: [
          { tipo: 'alavanca', de: [0, 0.04, -1.2], ate: 'maos', alem: 0.2 },
          { tipo: 'caixa', pos: [0, 0.03, -1.2], tam: [0.2, 0.06, 0.2], material: 'metal' },
          { tipo: 'cabo', de: [0, 0.6, -0.4], ate: 'maos', acessorio: 'triangulo' },
        ],
        quadros: ciclo({
          primeira: 'concentrica',
          pose: (t) =>
            maosEm(
              base,
              lerpV(baixo, cima, t),
              misturarRot(
                { ombroE: [-40, 0, 2], ombroD: [-40, 0, -2], cotoveloE: [-5, 0, 0], cotoveloD: [-5, 0, 0] },
                { ombroE: [35, 0, 15], ombroD: [35, 0, -15], cotoveloE: [-110, 0, 0], cotoveloD: [-110, 0, 0] },
                t,
              ),
            ),
        }),
        camera: { azimute: 80, elevacao: 10 },
        contatos: [...PES, BARRA, { tipo: 'simetria' }],
      },
      descricao: 'Em pé com a barra entre as pernas e o tronco inclinado, o pegador sobe até o peito e desce devagar.',
      explicacao: {
        posicao: [
          'Fique em pé com a barra entre as pernas, de costas para a ponta presa no chão.',
          'Joelhos levemente dobrados e tronco inclinado à frente (uns 40 graus), coluna reta.',
          'Segure o pegador (ou o triângulo) com os braços esticados.',
        ],
        execucao: [
          'Puxe o pegador até a parte de baixo do peito, levando os cotovelos para trás rentes ao corpo.',
          'Aperte as costas no fim.',
          'Desça devagar (cerca de 2 segundos) até esticar os braços, sem levantar o tronco.',
        ],
        respiracao: 'Solte o ar ao puxar e puxe o ar na descida.',
        erros: ['Arredondar as costas.', 'Levantar o tronco para ajudar a puxar.', 'Dobrar demais os joelhos e virar agachamento.'],
      },
    };
  },

  'Remada articulada': () => {
    const base = sentado(8, 0.5, 0.4, -0.02);
    const ombro = posicoes(base).ombroE;
    const frente = mais(ombro, [0.05, -0.1, 0.6]);
    const lado = pontoLocal(base, 'coluna', [0.26, 0.22, 0.12]);
    return {
      receita: {
        cena: [
          { tipo: 'caixa', pos: [0, 0.46, 0.05], tam: [0.42, 0.08, 0.42], material: 'estofado' },
          { tipo: 'caixa', pos: [0, 0.21, 0.05], tam: [0.1, 0.42, 0.3], material: 'metal' },
          { tipo: 'caixa', pos: [0, 1.0, 0.27], tam: [0.36, 0.4, 0.08], rot: [8, 0, 0], material: 'estofado' },
          { tipo: 'caixa', pos: [0, 0.6, 0.38], tam: [0.08, 1.2, 0.08], material: 'metal' },
          { tipo: 'placa', em: 'maoE', tam: [0.04, 0.17, 0.04], material: 'estofado' },
          { tipo: 'placa', em: 'maoD', tam: [0.04, 0.17, 0.04], material: 'estofado' },
        ],
        quadros: ciclo({
          primeira: 'concentrica',
          pose: (t) =>
            maosEm(
              base,
              lerpV(frente, lado, t),
              misturarRot(
                { ombroE: [-80, 0, 5], ombroD: [-80, 0, -5], cotoveloE: [-5, 0, 0], cotoveloD: [-5, 0, 0] },
                { ombroE: [25, 0, 20], ombroD: [25, 0, -20], cotoveloE: [-105, 0, 0], cotoveloD: [-105, 0, 0] },
                t,
              ),
            ),
        }),
        camera: { azimute: 75, elevacao: 15 },
        contatos: SENTADO,
      },
      descricao: 'Sentado com o peito no apoio, as mãos puxam os pegadores da frente até a lateral do tronco e voltam devagar.',
      explicacao: {
        posicao: [
          'Ajuste o banco para os pegadores ficarem na altura do meio do peito.',
          'Sente com o peito encostado no apoio e os pés no chão.',
          'Segure os pegadores com os braços esticados.',
        ],
        execucao: [
          'Puxe os pegadores para trás até as mãos chegarem na lateral do tronco, cotovelos rentes ao corpo.',
          'Aperte as escápulas uma contra a outra no fim.',
          'Volte devagar (cerca de 2 segundos) até esticar os braços.',
        ],
        respiracao: 'Solte o ar ao puxar e puxe o ar ao voltar.',
        erros: ['Tirar o peito do apoio.', 'Encolher os ombros.', 'Deixar o peso bater na volta.'],
      },
    };
  },

  'Pulldown na polia': () => {
    const base = curvado(20, 0.13);
    return {
      receita: {
        cena: [...torrePolia([0, 2.1, 0.8], [0, 0.95]), { tipo: 'cabo', de: [0, 2.1, 0.8], ate: 'maos', acessorio: 'barra' }],
        quadros: ciclo({
          primeira: 'concentrica',
          pose: (t) => {
            const o = lerp(-125, -15, t);
            return { ...base, rot: { ...base.rot, ombroE: [o, 0, 0], ombroD: [o, 0, 0], cotoveloE: [-12, 0, 0], cotoveloD: [-12, 0, 0] } };
          },
        }),
        camera: { azimute: 80, elevacao: 10 },
        contatos: [...PES, BARRA, { tipo: 'simetria' }],
      },
      descricao: 'Em pé de frente para a polia, com os braços quase esticados, a barra desce em arco da altura da cabeça até as coxas.',
      explicacao: {
        posicao: [
          'Fique de frente para a polia alta, um passo atrás, com a barra reta presa no cabo.',
          'Incline o tronco um pouco à frente e segure a barra na largura dos ombros.',
          'Cotovelos levemente dobrados (eles não mudam durante o exercício).',
        ],
        execucao: [
          'Leve a barra para baixo em arco, com os braços quase esticados, até encostar nas coxas.',
          'Aperte as costas no fim do movimento.',
          'Volte devagar (cerca de 2 segundos) até a barra ficar na altura da cabeça.',
        ],
        respiracao: 'Solte o ar ao descer a barra e puxe o ar ao subir.',
        erros: ['Dobrar os cotovelos (vira tríceps).', 'Balançar o tronco.', 'Deixar a barra subir rápido demais.'],
      },
    };
  },

  'Levantamento terra': () => {
    const barraZ = 0.03;
    return {
      receita: {
        cena: [{ tipo: 'barra', em: 'maos' }],
        quadros: ciclo({
          primeira: 'concentrica',
          concentrica: 1300,
          pose: (t) => {
            // Primeiro os joelhos estendem (tronco quase parado), depois o quadril vem à frente.
            const barraY = lerp(0.21, 0.8, t);
            const graus = lerp(58, 0, suave((t - 0.2) / 0.8));
            const a = (graus * Math.PI) / 180;
            const raiz: Vec3 = [0, barraY + 0.58 - 0.46 * Math.cos(a), barraZ + 0.05 - 0.46 * Math.sin(a)];
            const pernas = ik(
              {
                raiz: { pos: raiz, rot: [graus, 0, 0] },
                rot: misturarRot(
                  {
                    quadrilE: [-125, 0, 10],
                    quadrilD: [-125, 0, -10],
                    joelhoE: [85, 0, 0],
                    joelhoD: [85, 0, 0],
                    tornozeloE: [-25, 0, 0],
                    tornozeloD: [-25, 0, 0],
                  },
                  { quadrilE: [0, 0, 4], quadrilD: [0, 0, -4] },
                  t,
                ),
              },
              pesNoChao(0.14, 0, 8),
              IK_PERNAS,
            );
            return maosEm(pernas, [0.25, barraY, barraZ], {
              ombroE: [-graus, 0, 3],
              ombroD: [-graus, 0, -3],
              cotoveloE: [0, 0, 0],
              cotoveloD: [0, 0, 0],
            });
          },
        }),
        camera: { azimute: 75, elevacao: 8 },
        contatos: [...PES, BARRA, { tipo: 'simetria' }],
      },
      descricao: 'Com a barra no chão perto das canelas, o corpo levanta a barra rente às pernas até ficar em pé e desce devagar.',
      explicacao: {
        posicao: [
          'Pés na largura do quadril, com a barra sobre o meio dos pés, quase encostando nas canelas.',
          'Segure a barra logo do lado de fora das pernas, braços esticados.',
          'Quadril para trás, peito aberto e coluna reta (nem curvada, nem arqueada demais).',
        ],
        execucao: [
          'Empurre o chão com os pés e suba a barra rente às pernas, sem afastá-la do corpo.',
          'Quando a barra passar dos joelhos, leve o quadril à frente até ficar em pé, ereto.',
          'Desça devagar levando o quadril para trás primeiro e dobrando os joelhos depois da barra passar por eles.',
        ],
        respiracao: 'Puxe o ar e trave o abdômen antes de subir; solte o ar em pé.',
        erros: ['Arredondar as costas.', 'Deixar a barra longe das pernas.', 'Jogar o tronco para trás no fim.'],
        dica: 'Aprenda com pouco peso e, se possível, com acompanhamento de um professor.',
      },
    };
  },

  'Encolhimento com halteres': () => {
    const base = emPeFirme({ ombroE: [-2, 0, 6], ombroD: [-2, 0, -6], cotoveloE: [-5, 0, 0], cotoveloD: [-5, 0, 0] });
    return {
      receita: {
        cena: [
          { tipo: 'halter', em: 'maoE' },
          { tipo: 'halter', em: 'maoD' },
        ],
        quadros: ciclo({
          primeira: 'concentrica',
          pausaFim: 700,
          pose: (t) => {
            const e = lerp(0, 22, t);
            return {
              ...base,
              rot: { ...base.rot, claviculaE: [0, 0, e], claviculaD: [0, 0, -e], ombroE: [-2, 0, 6 - e], ombroD: [-2, 0, -6 + e] },
            };
          },
        }),
        camera: { azimute: 30, elevacao: 8 },
        contatos: [...PES, { tipo: 'simetria' }],
      },
      descricao: 'Em pé com um halter em cada mão e os braços esticados, os ombros sobem em direção às orelhas e descem devagar.',
      explicacao: {
        posicao: [
          'Fique em pé com um halter em cada mão, braços esticados ao lado do corpo, palmas viradas para o corpo.',
          'Coluna reta e olhar para a frente.',
        ],
        execucao: [
          'Levante os ombros em direção às orelhas, sem dobrar os cotovelos.',
          'Segure um segundo lá em cima.',
          'Desça os ombros devagar até a posição inicial.',
        ],
        respiracao: 'Solte o ar ao subir os ombros e puxe o ar ao descer.',
        erros: ['Girar os ombros em círculo.', 'Dobrar os cotovelos para puxar.', 'Projetar a cabeça para a frente.'],
      },
    };
  },
};
