import type { Equipamento, Exercicio, GrupoMuscular, TipoExercicio } from './tipos';

type G = GrupoMuscular;
const C: TipoExercicio = 'composto';
const I: TipoExercicio = 'isolado';

/**
 * [nome, grupo principal, equipamento, tipo, secundários]
 * Secundários contam meia série no volume semanal (ex.: supino → tríceps e ombros).
 */
const lista: [string, G, Equipamento, TipoExercicio, G[]][] = [
  // Peito
  ['Supino reto', 'Peito', 'Barra', C, ['Tríceps', 'Ombros']],
  ['Supino reto com halteres', 'Peito', 'Halteres', C, ['Tríceps', 'Ombros']],
  ['Supino inclinado', 'Peito', 'Barra', C, ['Tríceps', 'Ombros']],
  ['Supino inclinado com halteres', 'Peito', 'Halteres', C, ['Tríceps', 'Ombros']],
  ['Supino declinado', 'Peito', 'Barra', C, ['Tríceps', 'Ombros']],
  ['Supino reto na máquina', 'Peito', 'Máquina', C, ['Tríceps', 'Ombros']],
  ['Crucifixo com halteres', 'Peito', 'Halteres', I, []],
  ['Voador (peck deck)', 'Peito', 'Máquina', I, []],
  ['Crossover', 'Peito', 'Polia', I, []],
  ['Flexão de braço', 'Peito', 'Peso corporal', C, ['Tríceps', 'Ombros']],
  // Costas
  ['Puxada alta', 'Costas', 'Polia', C, ['Bíceps']],
  ['Puxada alta com triângulo', 'Costas', 'Polia', C, ['Bíceps']],
  ['Barra fixa', 'Costas', 'Peso corporal', C, ['Bíceps']],
  ['Remada curvada', 'Costas', 'Barra', C, ['Bíceps']],
  ['Remada unilateral (serrote)', 'Costas', 'Halteres', C, ['Bíceps']],
  ['Remada baixa', 'Costas', 'Polia', C, ['Bíceps']],
  ['Remada cavalinho', 'Costas', 'Barra', C, ['Bíceps']],
  ['Remada articulada', 'Costas', 'Máquina', C, ['Bíceps']],
  ['Pulldown na polia', 'Costas', 'Polia', I, []],
  ['Levantamento terra', 'Costas', 'Barra', C, ['Posteriores', 'Glúteos']],
  ['Encolhimento com halteres', 'Costas', 'Halteres', I, []],
  // Ombros
  ['Desenvolvimento com halteres', 'Ombros', 'Halteres', C, ['Tríceps']],
  ['Desenvolvimento com barra', 'Ombros', 'Barra', C, ['Tríceps']],
  ['Desenvolvimento na máquina', 'Ombros', 'Máquina', C, ['Tríceps']],
  ['Elevação lateral', 'Ombros', 'Halteres', I, []],
  ['Elevação lateral na polia', 'Ombros', 'Polia', I, []],
  ['Elevação frontal', 'Ombros', 'Halteres', I, []],
  ['Crucifixo inverso', 'Ombros', 'Máquina', I, []],
  // Bíceps
  ['Rosca direta', 'Bíceps', 'Barra', I, []],
  ['Rosca alternada', 'Bíceps', 'Halteres', I, []],
  ['Rosca martelo', 'Bíceps', 'Halteres', I, []],
  ['Rosca Scott', 'Bíceps', 'Máquina', I, []],
  ['Rosca na polia', 'Bíceps', 'Polia', I, []],
  ['Rosca concentrada', 'Bíceps', 'Halteres', I, []],
  // Tríceps
  ['Tríceps corda', 'Tríceps', 'Polia', I, []],
  ['Tríceps pulley', 'Tríceps', 'Polia', I, []],
  ['Tríceps testa', 'Tríceps', 'Barra', I, []],
  ['Tríceps francês', 'Tríceps', 'Halteres', I, []],
  ['Tríceps coice na polia', 'Tríceps', 'Polia', I, []],
  ['Mergulho nas paralelas', 'Tríceps', 'Peso corporal', C, ['Peito', 'Ombros']],
  // Antebraço
  ['Rosca punho', 'Antebraço', 'Barra', I, []],
  // Quadríceps
  ['Agachamento livre', 'Quadríceps', 'Barra', C, ['Glúteos']],
  ['Agachamento no Smith', 'Quadríceps', 'Smith', C, ['Glúteos']],
  ['Leg press 45°', 'Quadríceps', 'Máquina', C, ['Glúteos']],
  ['Hack machine', 'Quadríceps', 'Máquina', C, ['Glúteos']],
  ['Cadeira extensora', 'Quadríceps', 'Máquina', I, []],
  ['Agachamento búlgaro', 'Quadríceps', 'Halteres', C, ['Glúteos']],
  ['Afundo', 'Quadríceps', 'Halteres', C, ['Glúteos']],
  // Posteriores
  ['Mesa flexora', 'Posteriores', 'Máquina', I, []],
  ['Cadeira flexora', 'Posteriores', 'Máquina', I, []],
  ['Flexora em pé', 'Posteriores', 'Máquina', I, []],
  ['Stiff', 'Posteriores', 'Barra', C, ['Glúteos']],
  // Glúteos
  ['Elevação pélvica', 'Glúteos', 'Barra', C, ['Posteriores']],
  ['Cadeira abdutora', 'Glúteos', 'Máquina', I, []],
  ['Glúteo na polia', 'Glúteos', 'Polia', I, []],
  ['Agachamento sumô', 'Glúteos', 'Halteres', C, ['Quadríceps']],
  // Panturrilha
  ['Panturrilha em pé', 'Panturrilha', 'Máquina', I, []],
  ['Panturrilha sentado', 'Panturrilha', 'Máquina', I, []],
  ['Panturrilha no leg press', 'Panturrilha', 'Máquina', I, []],
  // Abdômen
  ['Abdominal supra', 'Abdômen', 'Peso corporal', I, []],
  ['Abdominal na polia', 'Abdômen', 'Polia', I, []],
  ['Elevação de pernas', 'Abdômen', 'Peso corporal', I, []],
  ['Prancha (segundos)', 'Abdômen', 'Peso corporal', I, []],
];

export const EXERCICIOS_INICIAIS: Omit<Exercicio, 'id'>[] = lista.map(
  ([nome, grupoMuscular, equipamento, tipo, secundarios]) => ({
    nome,
    grupoMuscular,
    equipamento,
    tipo,
    secundarios,
    personalizado: false,
  }),
);
