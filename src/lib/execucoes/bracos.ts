import { ciclo, emPeFirme, lerp } from './construir';
import type { Catalogo } from './tipos';

export const BRACOS: Catalogo = {
  'Rosca direta': () => {
    const base = emPeFirme();
    return {
      receita: {
        cena: [{ tipo: 'barra', em: 'maos', comprimento: 1.2, anilhas: true }],
        quadros: ciclo({
          primeira: 'concentrica',
          pose: (t) => {
            const c = lerp(-8, -135, t);
            const o = lerp(-4, -12, t);
            return { ...base, rot: { ...base.rot, ombroE: [o, 0, 0], ombroD: [o, 0, 0], cotoveloE: [c, 0, 0], cotoveloD: [c, 0, 0] } };
          },
        }),
        camera: { azimute: 75, elevacao: 8 },
        contatos: [
          { tipo: 'apoio', ponto: 'peE', eixo: 'xyz' },
          { tipo: 'apoio', ponto: 'peD', eixo: 'xyz' },
          { tipo: 'apoio', ponto: 'ombroE', eixo: 'xyz' },
          { tipo: 'distanciaFixa', a: 'maoE', b: 'maoD' },
          { tipo: 'simetria' },
        ],
      },
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
        respiracao: 'Solte o ar ao subir a barra e puxe o ar na descida.',
        erros: [
          'Balançar o tronco para trás para subir a barra.',
          'Levar os cotovelos para a frente no fim da subida.',
          'Descer rápido demais, deixando a barra cair.',
        ],
      },
    };
  },
};
