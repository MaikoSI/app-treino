import Dexie, { type EntityTable } from 'dexie';
import { EXERCICIOS_INICIAIS } from './exerciciosIniciais';
import { migrarConfig, migrarExercicio, migrarSerie } from './migracoes';
import {
  CONFIG_PADRAO,
  type Config,
  type Exercicio,
  type Programa,
  type ProgramaDia,
  type ProgramaExercicio,
  type RegistroPeso,
  type Sessao,
  type SessaoSerie,
} from './tipos';

export class TreinoDB extends Dexie {
  exercicios!: EntityTable<Exercicio, 'id'>;
  programas!: EntityTable<Programa, 'id'>;
  programaDias!: EntityTable<ProgramaDia, 'id'>;
  programaExercicios!: EntityTable<ProgramaExercicio, 'id'>;
  sessoes!: EntityTable<Sessao, 'id'>;
  sessaoSeries!: EntityTable<SessaoSerie, 'id'>;
  pesos!: EntityTable<RegistroPeso, 'id'>;
  config!: EntityTable<Config, 'chave'>;

  constructor(nome = 'app-treino') {
    super(nome);
    // Booleanos não podem ser índices no IndexedDB: "ativo" e "concluida"
    // são filtrados em memória.
    this.version(1).stores({
      exercicios: '++id, nome, grupoMuscular',
      programas: '++id',
      programaDias: '++id, programaId',
      programaExercicios: '++id, diaId, exercicioId',
      sessoes: '++id, inicio, programaDiaId',
      sessaoSeries: '++id, sessaoId, exercicioId',
      config: 'chave',
    });

    // v2 (regras do guia): tipo/secundários nos exercícios, RIR no lugar de RPE,
    // descanso por tipo de exercício e registro de peso corporal.
    this.version(2)
      .stores({ pesos: '++id, data' })
      .upgrade(async (tx) => {
        await tx.table('exercicios').toCollection().modify(migrarExercicio);
        await tx.table('sessaoSeries').toCollection().modify(migrarSerie);
        await tx.table('config').toCollection().modify(migrarConfig);
      });

    this.on('populate', (tx) => {
      tx.table('exercicios').bulkAdd(EXERCICIOS_INICIAIS);
      tx.table('config').add(CONFIG_PADRAO);
    });
  }
}

export const db = new TreinoDB();

/** Nomes das tabelas, na ordem usada pelo backup. */
export const TABELAS = [
  'exercicios',
  'programas',
  'programaDias',
  'programaExercicios',
  'sessoes',
  'sessaoSeries',
  'pesos',
  'config',
] as const;
export type NomeTabela = (typeof TABELAS)[number];
