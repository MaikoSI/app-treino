import { emPeFirme } from './bracos';
import { ciclo, lerp } from './construir';
import type { Catalogo } from './tipos';

export const OMBROS: Catalogo = {
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
        camera: { azimute: 15, elevacao: 8, distancia: 2.8 },
        contatos: [{ tipo: 'apoio', ponto: 'peE', eixo: 'xyz' }, { tipo: 'apoio', ponto: 'peD', eixo: 'xyz' }, { tipo: 'simetria' }],
        musculoDestaque: ['ombroE', 'ombroD'],
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
};
