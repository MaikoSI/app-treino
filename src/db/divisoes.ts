/**
 * Divisões prontas, alinhadas ao guia da tela Sobre:
 * - cada músculo principal treinado pelo menos 2x por semana (Schoenfeld 2016);
 * - 10 a 20 séries semanais por músculo, contando meia série para os auxiliares
 *   (Schoenfeld 2017; ACSM 2026). Na de 2 dias, o mínimo é 8 (faixa de iniciante);
 * - compostos e isolados combinados.
 * `divisoes.test.ts` confere essas regras com `analisarPrograma`.
 *
 * Os exercícios são referenciados pelo NOME (veja exerciciosIniciais.ts) e só dizem
 * quantas séries: repetições e descanso vêm de `metaPadrao` (tipo do exercício + objetivo).
 */

export interface ItemDivisao {
  nome: string;
  series: number;
}

export interface DiaDivisao {
  nome: string;
  exercicios: ItemDivisao[];
}

export interface Divisao {
  chave: string;
  nome: string;
  descricao: string;
  diasPorSemana: number;
  dias: DiaDivisao[];
}

/** Volume mínimo exigido das divisões prontas (2 dias: faixa de iniciante). */
export const volumeMinimoDivisao = (dias: number) => (dias <= 2 ? 8 : 10);

const e = (nome: string, series: number): ItemDivisao => ({ nome, series });
const dia = (nome: string, ...exercicios: ItemDivisao[]): DiaDivisao => ({ nome, exercicios });

// ---------------------------------------------------------------------------
// Full Body

const fb2A = dia(
  'Full Body A',
  e('Agachamento livre', 3),
  e('Supino reto', 4),
  e('Remada curvada', 4),
  e('Stiff', 3),
  e('Desenvolvimento com halteres', 2),
  e('Elevação pélvica', 2),
  e('Rosca direta', 2),
  e('Tríceps corda', 2),
);
const fb2B = dia(
  'Full Body B',
  e('Leg press 45°', 4),
  e('Agachamento búlgaro', 2),
  e('Supino inclinado com halteres', 4),
  e('Puxada alta', 4),
  e('Mesa flexora', 4),
  e('Elevação lateral', 2),
  e('Rosca alternada', 2),
  e('Tríceps francês', 2),
);

const fb3A = dia(
  'Full Body A',
  e('Agachamento livre', 3),
  e('Supino reto', 3),
  e('Remada curvada', 3),
  e('Stiff', 4),
  e('Elevação lateral', 2),
  e('Rosca direta', 2),
  e('Tríceps corda', 2),
  e('Panturrilha em pé', 3),
);
const fb3B = dia(
  'Full Body B',
  e('Leg press 45°', 3),
  e('Supino inclinado com halteres', 4),
  e('Puxada alta', 4),
  e('Elevação pélvica', 3),
  e('Cadeira flexora', 2),
  e('Desenvolvimento com halteres', 2),
  e('Rosca alternada', 2),
  e('Abdominal na polia', 3),
);
const fb3C = dia(
  'Full Body C',
  e('Agachamento búlgaro', 2),
  e('Cadeira extensora', 2),
  e('Supino reto com halteres', 3),
  e('Remada baixa', 3),
  e('Stiff', 3),
  e('Elevação lateral', 2),
  e('Rosca martelo', 2),
  e('Tríceps francês', 3),
);

// ---------------------------------------------------------------------------
// Superiores / Inferiores

const superioresA = dia(
  'Superiores A',
  e('Supino reto', 4),
  e('Remada curvada', 3),
  e('Desenvolvimento com halteres', 3),
  e('Puxada alta', 3),
  e('Elevação lateral', 2),
  e('Rosca direta', 3),
  e('Tríceps corda', 3),
);
const inferioresA = dia(
  'Inferiores A',
  e('Agachamento livre', 3),
  e('Stiff', 3),
  e('Leg press 45°', 2),
  e('Mesa flexora', 2),
  e('Elevação pélvica', 2),
  e('Panturrilha em pé', 3),
);
const superioresB = dia(
  'Superiores B',
  e('Supino inclinado com halteres', 4),
  e('Barra fixa', 3),
  e('Remada unilateral (serrote)', 3),
  e('Crucifixo com halteres', 2),
  e('Elevação lateral na polia', 2),
  e('Rosca alternada', 2),
  e('Tríceps francês', 2),
);
const inferioresB = dia(
  'Inferiores B',
  e('Hack machine', 3),
  e('Elevação pélvica', 3),
  e('Agachamento búlgaro', 2),
  e('Cadeira flexora', 3),
  e('Cadeira extensora', 2),
  e('Abdominal na polia', 3),
);

// ---------------------------------------------------------------------------
// Push / Pull / Legs

const pushA = dia(
  'Push A',
  e('Supino reto', 3),
  e('Supino inclinado com halteres', 3),
  e('Desenvolvimento com halteres', 2),
  e('Elevação lateral', 3),
  e('Tríceps corda', 2),
);
const pullA = dia(
  'Pull A',
  e('Puxada alta', 3),
  e('Remada curvada', 3),
  e('Crucifixo inverso', 2),
  e('Rosca direta', 2),
  e('Rosca martelo', 2),
);
const legsA = dia(
  'Legs A',
  e('Agachamento livre', 3),
  e('Stiff', 4),
  e('Leg press 45°', 2),
  e('Mesa flexora', 3),
  e('Panturrilha em pé', 3),
);
const pushB = dia(
  'Push B',
  e('Supino inclinado', 3),
  e('Supino reto na máquina', 2),
  e('Crossover', 2),
  e('Elevação lateral na polia', 3),
  e('Tríceps francês', 2),
);
const pullB = dia(
  'Pull B',
  e('Barra fixa', 3),
  e('Remada baixa', 3),
  e('Pulldown na polia', 2),
  e('Rosca Scott', 2),
  e('Rosca alternada', 2),
);
const legsB = dia(
  'Legs B',
  e('Hack machine', 3),
  e('Elevação pélvica', 4),
  e('Cadeira flexora', 3),
  e('Cadeira extensora', 2),
  e('Abdominal na polia', 3),
);

export const DIVISOES: Divisao[] = [
  {
    chave: 'fullbody2',
    nome: 'Full Body A / B',
    descricao: 'Corpo inteiro em cada treino, alternando A e B. Cada músculo 2x por semana, com volume de iniciante (8+ séries).',
    diasPorSemana: 2,
    dias: [fb2A, fb2B],
  },
  {
    chave: 'fullbody3',
    nome: 'Full Body A / B / C',
    descricao: 'Corpo inteiro em cada treino, em três variações. Cada músculo 3x por semana.',
    diasPorSemana: 3,
    dias: [fb3A, fb3B, fb3C],
  },
  {
    chave: 'upperlower4',
    nome: 'Superiores / Inferiores',
    descricao: 'Superiores e inferiores, duas vezes por semana cada. Cada músculo 2x por semana.',
    diasPorSemana: 4,
    dias: [superioresA, inferioresA, superioresB, inferioresB],
  },
  {
    chave: 'ulppl5',
    nome: 'Superiores / Inferiores + Push / Pull / Legs',
    descricao: 'Um ciclo de superiores e inferiores e outro de empurrar, puxar e pernas. Cada músculo 2x por semana.',
    diasPorSemana: 5,
    dias: [superioresA, inferioresA, pushA, pullA, legsB],
  },
  {
    chave: 'ppl6',
    nome: 'Push / Pull / Legs',
    descricao: 'Empurrar, puxar e pernas, duas vezes por semana. Cada músculo 2x por semana.',
    diasPorSemana: 6,
    dias: [pushA, pullA, legsA, pushB, pullB, legsB],
  },
];

/** Divisões oferecidas para um número de dias por semana. */
export function divisoesPara(dias: number): Divisao[] {
  return DIVISOES.filter((d) => d.diasPorSemana === dias);
}
