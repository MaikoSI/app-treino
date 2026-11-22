import type { Pose, Vec3 } from '../esqueleto';
import { torrePolia } from './cenas';
import { ciclo, IK_BRACOS, IK_PERNAS, ik, lerpV, misturarRot, pesNoChao } from './construir';
import type { Catalogo } from './tipos';

/** Sentado num banco de máquina (assento a `assento` m), tronco inclinado `inclinacao` graus (negativo = para trás). */
export function sentado(inclinacao = 0, assento = 0.5, peZ = 0.45): Pose {
  const semente: Pose = {
    raiz: { pos: [0, assento + 0.1, 0], rot: [inclinacao, 0, 0] },
    rot: {
      quadrilE: [-90 - inclinacao, 0, 6],
      quadrilD: [-90 - inclinacao, 0, -6],
      joelhoE: [90, 0, 0],
      joelhoD: [90, 0, 0],
    },
  };
  return ik(semente, pesNoChao(0.16, peZ, 10), IK_PERNAS);
}

export const COSTAS: Catalogo = {
  'Puxada alta': () => {
    const base = sentado(-15);
    const cima: Vec3 = [0.42, 1.6, -0.04];
    const baixo: Vec3 = [0.42, 1.2, 0.1];
    const semCima: Pose['rot'] = { ombroE: [-160, 0, 25], ombroD: [-160, 0, -25], cotoveloE: [-10, 0, 0], cotoveloD: [-10, 0, 0] };
    const semBaixo: Pose['rot'] = { ombroE: [-20, 0, 70], ombroD: [-20, 0, -70], cotoveloE: [-110, 0, 0], cotoveloD: [-110, 0, 0] };
    return {
      receita: {
        cena: [
          { tipo: 'caixa', pos: [0, 0.46, 0.05], tam: [0.4, 0.08, 0.4], material: 'estofado' },
          { tipo: 'caixa', pos: [0, 0.22, 0.05], tam: [0.08, 0.44, 0.3], material: 'metal' },
          { tipo: 'caixa', pos: [0, 0.74, 0.36], tam: [0.4, 0.08, 0.1], material: 'estofado' },
          ...torrePolia([0, 2.3, 0.1], [0, 0.75]),
          { tipo: 'cabo', de: [0, 2.3, 0.1], ate: 'maos', acessorio: 'barra' },
        ],
        quadros: ciclo({
          primeira: 'concentrica',
          pose: (t) => {
            const m = lerpV(cima, baixo, t);
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
        camera: { azimute: 75, elevacao: 12 },
        contatos: [
          { tipo: 'apoio', ponto: 'quadril', eixo: 'xyz' },
          { tipo: 'apoio', ponto: 'peE', eixo: 'xyz' },
          { tipo: 'apoio', ponto: 'peD', eixo: 'xyz' },
          { tipo: 'distanciaFixa', a: 'maoE', b: 'maoD' },
          { tipo: 'simetria' },
        ],
      },
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
    };
  },
};
