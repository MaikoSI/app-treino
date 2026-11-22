import type { Pose, Vec3 } from '../esqueleto';
import { bancoReto, suporte } from './cenas';
import { ciclo, IK_BRACOS, IK_PERNAS, ik, lerpV, misturarRot, pesNoChao } from './construir';
import type { Catalogo } from './tipos';

/** Deitado de barriga para cima num banco reto de 45 cm, pés apoiados no chão. */
function deitadoNoBancoReto(): Pose {
  const semente: Pose = {
    raiz: { pos: [0, 0.56, 0], rot: [-90, 0, 0] },
    rot: { quadrilE: [15, 0, 12], quadrilD: [15, 0, -12], joelhoE: [75, 0, 0], joelhoD: [75, 0, 0] },
  };
  return ik(semente, pesNoChao(0.3, 0.5, 15), IK_PERNAS);
}

export const PEITO: Catalogo = {
  'Supino reto': () => {
    const base = deitadoNoBancoReto();
    const cima: Vec3 = [0.36, 1.15, -0.42];
    const peito: Vec3 = [0.36, 0.74, -0.3];
    const semCima: Pose['rot'] = { ombroE: [-80, 0, 15], ombroD: [-80, 0, -15], cotoveloE: [-5, 0, 0], cotoveloD: [-5, 0, 0] };
    const semBaixo: Pose['rot'] = { ombroE: [10, 0, 45], ombroD: [10, 0, -45], cotoveloE: [-100, 0, 0], cotoveloD: [-100, 0, 0] };
    return {
      receita: {
        cena: [...bancoReto(0.3, -0.95), ...suporte(-0.7, 1.05), { tipo: 'barra', em: 'maos' }],
        quadros: ciclo({
          primeira: 'excentrica',
          pose: (t) => {
            const m = lerpV(cima, peito, t);
            return ik(
              { ...base, rot: { ...base.rot, ...misturarRot(semCima, semBaixo, t) } },
              [
                { ponto: 'maoE', pos: m },
                { ponto: 'maoD', pos: [-m[0], m[1], m[2]] },
              ],
              IK_BRACOS,
            );
          },
        }),
        camera: { azimute: 70, elevacao: 20 },
        contatos: [
          { tipo: 'apoio', ponto: 'quadril', eixo: 'xyz' },
          { tipo: 'apoio', ponto: 'peE', eixo: 'xyz' },
          { tipo: 'apoio', ponto: 'peD', eixo: 'xyz' },
          { tipo: 'distanciaFixa', a: 'maoE', b: 'maoD' },
          { tipo: 'simetria' },
        ],
      },
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
        respiracao: 'Puxe o ar na descida e solte enquanto empurra a barra.',
        erros: ['Abrir os cotovelos em 90 graus, forçando o ombro.', 'Quicar a barra no peito.', 'Tirar o quadril do banco para empurrar.'],
        dica: 'No começo, peça para alguém ficar atrás do banco ajudando a tirar e devolver a barra.',
      },
    };
  },
};
