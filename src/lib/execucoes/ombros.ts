import { type Pose, pontoLocal, posicoes, type Vec3 } from '../esqueleto';
import type { Contato } from '../execucao';
import { maquinaSentado, torrePolia } from './cenas';
import { bracosEm, ciclo, emPeFirme, lerp, lerpV, mais, maosEm, misturarRot, sentado, sentadoComEncosto } from './construir';
import type { Catalogo } from './tipos';

const PES: Contato[] = [
  { tipo: 'apoio', ponto: 'peE', eixo: 'xyz' },
  { tipo: 'apoio', ponto: 'peD', eixo: 'xyz' },
];
const SENTADO: Contato[] = [{ tipo: 'apoio', ponto: 'quadril', eixo: 'xyz' }, ...PES, { tipo: 'simetria' }];

/** Desenvolvimento sentado: cotovelos sobem de um pouco abaixo dos ombros até os braços esticados acima da cabeça. */
function desenvolvimento(base: Pose, largura: number) {
  const o = posicoes(base).ombroE;
  const cotBaixo = mais(o, [largura - 0.19, -0.12, 0.06]);
  const maoBaixo = mais(cotBaixo, [0, 0.32, 0.03]);
  const maoCima = mais(o, [largura - 0.22, 0.6, 0.03]);
  const cotCima = lerpV(o, maoCima, 0.47);
  cotCima[0] += 0.03;
  return (t: number) =>
    bracosEm(base, lerpV(cotBaixo, cotCima, t), lerpV(maoBaixo, maoCima, t), {
      ombroE: [-20, -40, 80],
      ombroD: [-20, 40, -80],
      cotoveloE: [-90, 0, 0],
      cotoveloD: [-90, 0, 0],
    });
}

const DESENVOLVIMENTO = {
  respiracao: 'Solte o ar ao empurrar para cima e puxe o ar na descida.',
  erros: [
    'Arquear demais a lombar para empurrar.',
    'Descer os cotovelos muito abaixo da linha dos ombros.',
    'Travar os cotovelos com força no alto.',
  ],
};

export const OMBROS: Catalogo = {
  'Desenvolvimento com halteres': () => ({
    receita: {
      cena: [...maquinaSentado(), { tipo: 'halter', em: 'maoE', pegada: 'pronada' }, { tipo: 'halter', em: 'maoD', pegada: 'pronada' }],
      quadros: ciclo({ primeira: 'concentrica', pose: desenvolvimento(sentadoComEncosto(), 0.45) }),
      camera: { azimute: 30, elevacao: 10 },
      contatos: SENTADO,
    },
    descricao: 'Sentado com as costas apoiadas, os halteres sobem da altura das orelhas até os braços esticados acima da cabeça.',
    explicacao: {
      posicao: [
        'Sente num banco com encosto quase reto, costas apoiadas e pés no chão.',
        'Halteres na altura das orelhas, palmas viradas para a frente, cotovelos um pouco à frente do corpo.',
      ],
      execucao: [
        'Empurre os halteres para cima até esticar os braços acima da cabeça, aproximando um do outro.',
        'Desça devagar (cerca de 2 segundos) até os halteres voltarem à altura das orelhas.',
      ],
      ...DESENVOLVIMENTO,
    },
  }),

  'Desenvolvimento com barra': () => {
    const base = emPeFirme({}, 0.15);
    const o = posicoes(base).ombroE;
    const baixo = pontoLocal(base, 'coluna', [0.3, 0.33, 0.16]);
    const cima = mais(o, [0.11, 0.6, 0.0]);
    return {
      receita: {
        cena: [{ tipo: 'barra', em: 'maos' }],
        quadros: ciclo({
          primeira: 'concentrica',
          pose: (t) => {
            const m = lerpV(baixo, cima, t);
            m[2] += Math.sin(Math.PI * t) * 0.04;
            return maosEm(
              base,
              m,
              misturarRot(
                { ombroE: [-60, 0, 50], ombroD: [-60, 0, -50], cotoveloE: [-130, 0, 0], cotoveloD: [-130, 0, 0] },
                { ombroE: [-170, 0, 15], ombroD: [-170, 0, -15], cotoveloE: [-5, 0, 0], cotoveloD: [-5, 0, 0] },
                t,
              ),
            );
          },
        }),
        camera: { azimute: 70, elevacao: 8 },
        contatos: [...PES, { tipo: 'distanciaFixa', a: 'maoE', b: 'maoD' }, { tipo: 'simetria' }],
      },
      descricao: 'Em pé, a barra sobe da frente dos ombros até os braços esticados acima da cabeça e desce devagar.',
      explicacao: {
        posicao: [
          'Fique em pé com os pés na largura do quadril, abdômen e glúteos firmes.',
          'Segure a barra um pouco mais aberta que os ombros, apoiada na frente dos ombros, cotovelos à frente da barra.',
        ],
        execucao: [
          'Empurre a barra para cima, passando rente ao rosto (afaste o queixo um pouco).',
          'Termine com os braços esticados e a barra alinhada acima do meio do pé.',
          'Desça devagar (cerca de 2 segundos) até a frente dos ombros.',
        ],
        ...DESENVOLVIMENTO,
      },
    };
  },

  'Desenvolvimento na máquina': () => ({
    receita: {
      cena: [
        ...maquinaSentado(),
        { tipo: 'placa', em: 'maoE', tam: [0.14, 0.04, 0.04], material: 'estofado' },
        { tipo: 'placa', em: 'maoD', tam: [0.14, 0.04, 0.04], material: 'estofado' },
        { tipo: 'placa', em: 'maoE', tam: [0.04, 0.04, 0.45], desloc: [0.07, 0, -0.24], material: 'metal' },
        { tipo: 'placa', em: 'maoD', tam: [0.04, 0.04, 0.45], desloc: [-0.07, 0, -0.24], material: 'metal' },
      ],
      quadros: ciclo({ primeira: 'concentrica', pose: desenvolvimento(sentadoComEncosto(), 0.42) }),
      camera: { azimute: 35, elevacao: 10 },
      contatos: SENTADO,
    },
    descricao: 'Sentado na máquina, os pegadores sobem da altura dos ombros até esticar os braços e descem devagar.',
    explicacao: {
      posicao: [
        'Ajuste o banco para os pegadores ficarem na altura dos ombros.',
        'Sente com as costas apoiadas no encosto e os pés no chão.',
      ],
      execucao: [
        'Empurre os pegadores para cima até esticar os braços, sem travar os cotovelos.',
        'Desça devagar (cerca de 2 segundos) até as mãos voltarem à altura dos ombros.',
      ],
      ...DESENVOLVIMENTO,
    },
  }),

  'Elevação lateral': () => {
    const base = emPeFirme({ coluna: [5, 0, 0] });
    return {
      receita: {
        cena: [
          { tipo: 'halter', em: 'maoE' },
          { tipo: 'halter', em: 'maoD' },
        ],
        quadros: ciclo({
          primeira: 'concentrica',
          pose: (t) => {
            const a = lerp(8, 85, t);
            return {
              ...base,
              rot: { ...base.rot, ombroE: [0, -20, a], ombroD: [0, 20, -a], cotoveloE: [-15, 0, 0], cotoveloD: [-15, 0, 0] },
            };
          },
        }),
        camera: { azimute: 15, elevacao: 8 },
        contatos: [...PES, { tipo: 'simetria' }],
      },
      descricao: 'Em pé com um halter em cada mão, os braços sobem pelos lados até a altura dos ombros e descem devagar.',
      explicacao: {
        posicao: [
          'Fique em pé com os pés na largura do quadril e um halter leve em cada mão.',
          'Braços ao lado do corpo, cotovelos levemente dobrados e tronco um pouco inclinado à frente.',
        ],
        execucao: [
          'Levante os braços pelos lados, um pouco à frente do corpo, até as mãos chegarem na altura dos ombros.',
          'Quem sobe são os cotovelos: imagine despejar uma jarra no topo do movimento.',
          'Desça devagar (cerca de 2 segundos) até os braços voltarem ao lado do corpo.',
        ],
        respiracao: 'Solte o ar ao subir e puxe o ar na descida.',
        erros: [
          'Subir as mãos acima da linha dos ombros.',
          'Encolher os ombros em direção às orelhas.',
          'Usar impulso do corpo com peso pesado demais.',
        ],
      },
    };
  },

  'Elevação lateral na polia': () => {
    const base = emPeFirme({ coluna: [5, 0, 0], ombroD: [-20, 0, -10], cotoveloD: [-90, 0, 0] });
    const roldana: Vec3 = [-0.4, 0.12, 0.05];
    return {
      receita: {
        cena: [...torrePolia(roldana, [-0.55, 0.05]), { tipo: 'cabo', de: roldana, ate: 'maoE', acessorio: 'puxador' }],
        quadros: ciclo({
          primeira: 'concentrica',
          pose: (t) => {
            const a = lerp(-12, 85, t);
            return { ...base, rot: { ...base.rot, ombroE: [0, -20, a], cotoveloE: [-15, 0, 0] } };
          },
        }),
        camera: { azimute: 20, elevacao: 8 },
        contatos: PES,
      },
      descricao: 'Em pé ao lado da polia baixa, o braço do lado de fora sobe pelo lado do corpo até a altura do ombro e desce devagar.',
      explicacao: {
        posicao: [
          'Fique de lado para a polia baixa e segure o pegador com a mão do lado de fora (o cabo passa na frente do corpo).',
          'A outra mão segura a máquina ou a cintura; cotovelo do braço que trabalha levemente dobrado.',
        ],
        execucao: [
          'Levante o braço pelo lado do corpo até a mão chegar na altura do ombro.',
          'Desça devagar (cerca de 2 segundos) até a mão voltar na frente do quadril.',
          'Faça todas as repetições e troque de lado.',
        ],
        respiracao: 'Solte o ar ao subir e puxe o ar na descida.',
        erros: ['Inclinar o tronco para o lado para ajudar.', 'Subir a mão acima do ombro.', 'Encolher o ombro.'],
      },
    };
  },

  'Elevação frontal': () => {
    const base = emPeFirme();
    return {
      receita: {
        cena: [
          { tipo: 'halter', em: 'maoE', pegada: 'pronada' },
          { tipo: 'halter', em: 'maoD', pegada: 'pronada' },
        ],
        quadros: ciclo({
          primeira: 'concentrica',
          pose: (t) => {
            const a = lerp(-8, -88, t);
            return { ...base, rot: { ...base.rot, ombroE: [a, 0, 6], ombroD: [a, 0, -6], cotoveloE: [-10, 0, 0], cotoveloD: [-10, 0, 0] } };
          },
        }),
        camera: { azimute: 70, elevacao: 8 },
        contatos: [...PES, { tipo: 'simetria' }],
      },
      descricao: 'Em pé com um halter em cada mão, os braços sobem pela frente do corpo até a altura dos ombros e descem devagar.',
      explicacao: {
        posicao: [
          'Fique em pé com um halter em cada mão, na frente das coxas, palmas viradas para o corpo.',
          'Cotovelos levemente dobrados e abdômen firme.',
        ],
        execucao: [
          'Levante os braços pela frente até as mãos chegarem na altura dos ombros.',
          'Desça devagar (cerca de 2 segundos) até as coxas.',
        ],
        respiracao: 'Solte o ar ao subir e puxe o ar na descida.',
        erros: ['Balançar o tronco para trás.', 'Subir acima da linha dos ombros.', 'Usar peso pesado demais.'],
      },
    };
  },

  'Crucifixo inverso': () => {
    const base = sentado(10, 0.5, 0.4, -0.02);
    const o = posicoes(base).ombroE;
    const cotovelos: Pose['rot'] = { cotoveloE: [-15, 0, 0], cotoveloD: [-15, 0, 0] };
    return {
      receita: {
        cena: [
          { tipo: 'caixa', pos: [0, 0.46, 0.05], tam: [0.42, 0.08, 0.42], material: 'estofado' },
          { tipo: 'caixa', pos: [0, 0.21, 0.05], tam: [0.1, 0.42, 0.3], material: 'metal' },
          { tipo: 'caixa', pos: [0, 1.0, 0.29], tam: [0.36, 0.42, 0.08], rot: [10, 0, 0], material: 'estofado' },
          { tipo: 'caixa', pos: [0, 0.6, 0.4], tam: [0.08, 1.2, 0.08], material: 'metal' },
          { tipo: 'placa', em: 'maoE', tam: [0.04, 0.16, 0.04], material: 'estofado' },
          { tipo: 'placa', em: 'maoD', tam: [0.04, 0.16, 0.04], material: 'estofado' },
        ],
        quadros: ciclo({
          primeira: 'concentrica',
          pose: (t) => {
            const f = lerp(78, -5, t) * (Math.PI / 180);
            return maosEm(
              { ...base, rot: { ...base.rot, ...cotovelos } },
              mais(o, [0.6 * Math.cos(f), -0.03, 0.6 * Math.sin(f)]),
              misturarRot({ ombroE: [-85, 0, -5], ombroD: [-85, 0, 5] }, { ombroE: [0, 0, 88], ombroD: [0, 0, -88] }, t),
              undefined,
              ['ombroE', 'ombroD'],
            );
          },
        }),
        camera: { azimute: 160, elevacao: 30 },
        contatos: SENTADO,
      },
      descricao: 'Sentado de frente para o voador com o peito apoiado, os braços abrem para trás na altura dos ombros e voltam devagar.',
      explicacao: {
        posicao: [
          'Sente de frente para o encosto do voador, com o peito apoiado nele.',
          'Segure os pegadores com os braços esticados à frente, na altura dos ombros.',
        ],
        execucao: [
          'Abra os braços para os lados e para trás, com os cotovelos levemente dobrados, até ficarem alinhados com o corpo.',
          'Aperte a parte de trás dos ombros por um instante.',
          'Volte devagar (cerca de 2 segundos) até os braços ficarem à frente.',
        ],
        respiracao: 'Solte o ar ao abrir os braços e puxe o ar ao voltar.',
        erros: ['Tirar o peito do apoio.', 'Encolher os ombros.', 'Passar muito da linha do corpo.'],
      },
    };
  },
};
