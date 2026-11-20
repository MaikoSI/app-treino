import type { Equipamento, Exercicio, GrupoMuscular } from './tipos';

const lista: [string, GrupoMuscular, Equipamento][] = [
  // Peito
  ['Supino reto', 'Peito', 'Barra'],
  ['Supino reto com halteres', 'Peito', 'Halteres'],
  ['Supino inclinado', 'Peito', 'Barra'],
  ['Supino inclinado com halteres', 'Peito', 'Halteres'],
  ['Supino declinado', 'Peito', 'Barra'],
  ['Supino reto na máquina', 'Peito', 'Máquina'],
  ['Crucifixo com halteres', 'Peito', 'Halteres'],
  ['Voador (peck deck)', 'Peito', 'Máquina'],
  ['Crossover', 'Peito', 'Polia'],
  ['Flexão de braço', 'Peito', 'Peso corporal'],
  // Costas
  ['Puxada alta', 'Costas', 'Polia'],
  ['Puxada alta com triângulo', 'Costas', 'Polia'],
  ['Barra fixa', 'Costas', 'Peso corporal'],
  ['Remada curvada', 'Costas', 'Barra'],
  ['Remada unilateral (serrote)', 'Costas', 'Halteres'],
  ['Remada baixa', 'Costas', 'Polia'],
  ['Remada cavalinho', 'Costas', 'Barra'],
  ['Remada articulada', 'Costas', 'Máquina'],
  ['Pulldown na polia', 'Costas', 'Polia'],
  ['Levantamento terra', 'Costas', 'Barra'],
  ['Encolhimento com halteres', 'Costas', 'Halteres'],
  // Ombros
  ['Desenvolvimento com halteres', 'Ombros', 'Halteres'],
  ['Desenvolvimento com barra', 'Ombros', 'Barra'],
  ['Desenvolvimento na máquina', 'Ombros', 'Máquina'],
  ['Elevação lateral', 'Ombros', 'Halteres'],
  ['Elevação lateral na polia', 'Ombros', 'Polia'],
  ['Elevação frontal', 'Ombros', 'Halteres'],
  ['Crucifixo inverso', 'Ombros', 'Máquina'],
  // Bíceps
  ['Rosca direta', 'Bíceps', 'Barra'],
  ['Rosca alternada', 'Bíceps', 'Halteres'],
  ['Rosca martelo', 'Bíceps', 'Halteres'],
  ['Rosca Scott', 'Bíceps', 'Máquina'],
  ['Rosca na polia', 'Bíceps', 'Polia'],
  ['Rosca concentrada', 'Bíceps', 'Halteres'],
  // Tríceps
  ['Tríceps corda', 'Tríceps', 'Polia'],
  ['Tríceps pulley', 'Tríceps', 'Polia'],
  ['Tríceps testa', 'Tríceps', 'Barra'],
  ['Tríceps francês', 'Tríceps', 'Halteres'],
  ['Tríceps coice na polia', 'Tríceps', 'Polia'],
  ['Mergulho nas paralelas', 'Tríceps', 'Peso corporal'],
  // Antebraço
  ['Rosca punho', 'Antebraço', 'Barra'],
  // Quadríceps
  ['Agachamento livre', 'Quadríceps', 'Barra'],
  ['Agachamento no Smith', 'Quadríceps', 'Smith'],
  ['Leg press 45°', 'Quadríceps', 'Máquina'],
  ['Hack machine', 'Quadríceps', 'Máquina'],
  ['Cadeira extensora', 'Quadríceps', 'Máquina'],
  ['Agachamento búlgaro', 'Quadríceps', 'Halteres'],
  ['Afundo', 'Quadríceps', 'Halteres'],
  // Posteriores
  ['Mesa flexora', 'Posteriores', 'Máquina'],
  ['Cadeira flexora', 'Posteriores', 'Máquina'],
  ['Flexora em pé', 'Posteriores', 'Máquina'],
  ['Stiff', 'Posteriores', 'Barra'],
  // Glúteos
  ['Elevação pélvica', 'Glúteos', 'Barra'],
  ['Cadeira abdutora', 'Glúteos', 'Máquina'],
  ['Glúteo na polia', 'Glúteos', 'Polia'],
  ['Agachamento sumô', 'Glúteos', 'Halteres'],
  // Panturrilha
  ['Panturrilha em pé', 'Panturrilha', 'Máquina'],
  ['Panturrilha sentado', 'Panturrilha', 'Máquina'],
  ['Panturrilha no leg press', 'Panturrilha', 'Máquina'],
  // Abdômen
  ['Abdominal supra', 'Abdômen', 'Peso corporal'],
  ['Abdominal na polia', 'Abdômen', 'Polia'],
  ['Elevação de pernas', 'Abdômen', 'Peso corporal'],
  ['Prancha (segundos)', 'Abdômen', 'Peso corporal'],
];

export const EXERCICIOS_INICIAIS: Omit<Exercicio, 'id'>[] = lista.map(([nome, grupoMuscular, equipamento]) => ({
  nome,
  grupoMuscular,
  equipamento,
  personalizado: false,
}));
