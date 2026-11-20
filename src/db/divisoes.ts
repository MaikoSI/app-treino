/**
 * Divisões prontas sugeridas na tela de boas-vindas.
 * Os exercícios são referenciados pelo NOME (veja exerciciosIniciais.ts);
 * o id é resolvido no momento de criar o programa.
 */

export interface ItemDivisao {
  nome: string;
  series: number;
  repsMin: number;
  repsMax: number;
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

/** Atalho: e('Supino reto', 4, 6, 10) */
const e = (nome: string, series: number, repsMin: number, repsMax: number): ItemDivisao => ({
  nome,
  series,
  repsMin,
  repsMax,
});

const fullBodyA: DiaDivisao = {
  nome: 'Full Body A',
  exercicios: [
    e('Agachamento livre', 3, 6, 10),
    e('Supino reto', 3, 6, 10),
    e('Remada curvada', 3, 8, 12),
    e('Desenvolvimento com halteres', 3, 8, 12),
    e('Mesa flexora', 3, 10, 12),
    e('Rosca direta', 2, 10, 12),
    e('Abdominal supra', 3, 12, 20),
  ],
};

const fullBodyB: DiaDivisao = {
  nome: 'Full Body B',
  exercicios: [
    e('Leg press 45°', 3, 10, 12),
    e('Supino inclinado com halteres', 3, 8, 12),
    e('Puxada alta', 3, 8, 12),
    e('Stiff', 3, 8, 12),
    e('Elevação lateral', 3, 12, 15),
    e('Tríceps corda', 2, 10, 12),
    e('Panturrilha em pé', 3, 12, 15),
  ],
};

const fullBodyC: DiaDivisao = {
  nome: 'Full Body C',
  exercicios: [
    e('Hack machine', 3, 8, 12),
    e('Supino reto com halteres', 3, 8, 12),
    e('Remada baixa', 3, 8, 12),
    e('Elevação pélvica', 3, 8, 12),
    e('Desenvolvimento na máquina', 3, 10, 12),
    e('Rosca martelo', 2, 10, 12),
    e('Tríceps pulley', 2, 10, 12),
  ],
};

export const DIVISOES: Divisao[] = [
  {
    chave: 'fullbody2',
    nome: 'Full Body A / B',
    descricao: 'Corpo inteiro em cada treino, alternando A e B.',
    diasPorSemana: 2,
    dias: [fullBodyA, fullBodyB],
  },
  {
    chave: 'abc3',
    nome: 'ABC',
    descricao: 'A: Peito/Tríceps · B: Costas/Bíceps · C: Pernas/Ombros.',
    diasPorSemana: 3,
    dias: [
      {
        nome: 'Treino A - Peito/Tríceps',
        exercicios: [
          e('Supino reto', 4, 6, 10),
          e('Supino inclinado com halteres', 3, 8, 12),
          e('Crossover', 3, 10, 15),
          e('Tríceps pulley', 3, 10, 12),
          e('Tríceps francês', 3, 10, 12),
        ],
      },
      {
        nome: 'Treino B - Costas/Bíceps',
        exercicios: [
          e('Puxada alta', 4, 8, 12),
          e('Remada curvada', 3, 8, 10),
          e('Remada baixa', 3, 10, 12),
          e('Rosca direta', 3, 8, 12),
          e('Rosca martelo', 3, 10, 12),
        ],
      },
      {
        nome: 'Treino C - Pernas/Ombros',
        exercicios: [
          e('Agachamento livre', 4, 6, 10),
          e('Leg press 45°', 3, 10, 12),
          e('Cadeira extensora', 3, 12, 15),
          e('Mesa flexora', 3, 10, 12),
          e('Desenvolvimento com halteres', 3, 8, 12),
          e('Elevação lateral', 3, 12, 15),
          e('Panturrilha em pé', 3, 12, 15),
        ],
      },
    ],
  },
  {
    chave: 'fullbody3',
    nome: 'Full Body A / B / C',
    descricao: 'Corpo inteiro em cada treino, em três variações.',
    diasPorSemana: 3,
    dias: [fullBodyA, fullBodyB, fullBodyC],
  },
  {
    chave: 'upperlower4',
    nome: 'Superiores / Inferiores',
    descricao: 'Superiores e inferiores, duas vezes por semana cada.',
    diasPorSemana: 4,
    dias: [
      {
        nome: 'Superiores A',
        exercicios: [
          e('Supino reto', 4, 6, 8),
          e('Remada curvada', 4, 6, 10),
          e('Desenvolvimento com halteres', 3, 8, 10),
          e('Puxada alta', 3, 8, 12),
          e('Rosca direta', 2, 10, 12),
          e('Tríceps testa', 2, 10, 12),
        ],
      },
      {
        nome: 'Inferiores A',
        exercicios: [
          e('Agachamento livre', 4, 6, 8),
          e('Stiff', 3, 8, 10),
          e('Leg press 45°', 3, 10, 12),
          e('Mesa flexora', 3, 10, 12),
          e('Panturrilha em pé', 4, 10, 15),
        ],
      },
      {
        nome: 'Superiores B',
        exercicios: [
          e('Supino inclinado com halteres', 4, 8, 10),
          e('Remada baixa', 4, 8, 12),
          e('Barra fixa', 3, 6, 10),
          e('Elevação lateral', 3, 12, 15),
          e('Rosca martelo', 2, 10, 12),
          e('Tríceps corda', 2, 10, 12),
        ],
      },
      {
        nome: 'Inferiores B',
        exercicios: [
          e('Levantamento terra', 3, 5, 8),
          e('Hack machine', 3, 8, 12),
          e('Cadeira extensora', 3, 12, 15),
          e('Cadeira flexora', 3, 10, 12),
          e('Elevação pélvica', 3, 8, 12),
          e('Panturrilha sentado', 3, 12, 15),
        ],
      },
    ],
  },
  {
    chave: 'abcde5',
    nome: 'ABCDE',
    descricao: 'Um grupo muscular por dia: Peito, Costas, Pernas, Ombros, Braços.',
    diasPorSemana: 5,
    dias: [
      {
        nome: 'Treino A - Peito',
        exercicios: [
          e('Supino reto', 4, 6, 10),
          e('Supino inclinado com halteres', 3, 8, 12),
          e('Supino declinado', 3, 8, 12),
          e('Voador (peck deck)', 3, 10, 15),
          e('Crossover', 3, 12, 15),
        ],
      },
      {
        nome: 'Treino B - Costas',
        exercicios: [
          e('Puxada alta', 4, 8, 12),
          e('Remada curvada', 4, 6, 10),
          e('Remada unilateral (serrote)', 3, 8, 12),
          e('Remada baixa', 3, 10, 12),
          e('Pulldown na polia', 3, 12, 15),
          e('Encolhimento com halteres', 3, 10, 15),
        ],
      },
      {
        nome: 'Treino C - Pernas',
        exercicios: [
          e('Agachamento livre', 4, 6, 10),
          e('Leg press 45°', 4, 10, 12),
          e('Cadeira extensora', 3, 12, 15),
          e('Mesa flexora', 4, 10, 12),
          e('Stiff', 3, 8, 12),
          e('Panturrilha em pé', 4, 12, 15),
        ],
      },
      {
        nome: 'Treino D - Ombros',
        exercicios: [
          e('Desenvolvimento com halteres', 4, 8, 10),
          e('Elevação lateral', 4, 12, 15),
          e('Elevação frontal', 3, 10, 12),
          e('Crucifixo inverso', 3, 12, 15),
          e('Abdominal na polia', 3, 12, 15),
        ],
      },
      {
        nome: 'Treino E - Braços',
        exercicios: [
          e('Rosca direta', 4, 8, 12),
          e('Tríceps testa', 4, 8, 12),
          e('Rosca alternada', 3, 10, 12),
          e('Tríceps corda', 3, 10, 12),
          e('Rosca Scott', 3, 10, 12),
          e('Tríceps francês', 3, 10, 12),
        ],
      },
    ],
  },
  {
    chave: 'ppl6',
    nome: 'Push / Pull / Legs',
    descricao: 'Empurrar, puxar e pernas, duas vezes por semana.',
    diasPorSemana: 6,
    dias: [
      {
        nome: 'Push A',
        exercicios: [
          e('Supino reto', 4, 6, 8),
          e('Desenvolvimento com halteres', 3, 8, 10),
          e('Supino inclinado com halteres', 3, 8, 12),
          e('Elevação lateral', 3, 12, 15),
          e('Tríceps pulley', 3, 10, 12),
        ],
      },
      {
        nome: 'Pull A',
        exercicios: [
          e('Remada curvada', 4, 6, 8),
          e('Puxada alta', 3, 8, 12),
          e('Remada baixa', 3, 10, 12),
          e('Crucifixo inverso', 3, 12, 15),
          e('Rosca direta', 3, 8, 12),
        ],
      },
      {
        nome: 'Legs A',
        exercicios: [
          e('Agachamento livre', 4, 6, 8),
          e('Leg press 45°', 3, 10, 12),
          e('Mesa flexora', 3, 10, 12),
          e('Cadeira extensora', 3, 12, 15),
          e('Panturrilha em pé', 4, 10, 15),
        ],
      },
      {
        nome: 'Push B',
        exercicios: [
          e('Desenvolvimento com barra', 4, 6, 8),
          e('Supino inclinado', 3, 8, 10),
          e('Crossover', 3, 12, 15),
          e('Elevação lateral na polia', 3, 12, 15),
          e('Tríceps corda', 3, 10, 12),
          e('Tríceps francês', 2, 10, 12),
        ],
      },
      {
        nome: 'Pull B',
        exercicios: [
          e('Barra fixa', 4, 6, 10),
          e('Remada cavalinho', 3, 8, 10),
          e('Remada unilateral (serrote)', 3, 10, 12),
          e('Rosca martelo', 3, 10, 12),
          e('Rosca Scott', 2, 10, 12),
        ],
      },
      {
        nome: 'Legs B',
        exercicios: [
          e('Stiff', 3, 8, 10),
          e('Hack machine', 4, 8, 12),
          e('Agachamento búlgaro', 3, 8, 12),
          e('Cadeira flexora', 3, 10, 12),
          e('Elevação pélvica', 3, 8, 12),
          e('Panturrilha sentado', 3, 12, 15),
        ],
      },
    ],
  },
];

/** Divisões oferecidas para um número de dias por semana (3 dias tem duas opções). */
export function divisoesPara(dias: number): Divisao[] {
  return DIVISOES.filter((d) => d.diasPorSemana === dias);
}

/** Descanso sugerido: exercícios pesados (poucas reps) descansam um minuto a mais. */
export function descansoSugerido(repsMax: number, padraoSeg: number): number {
  return repsMax <= 8 ? padraoSeg + 60 : padraoSeg;
}
