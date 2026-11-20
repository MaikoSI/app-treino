import { db, TABELAS, type NomeTabela } from './index';
import { migrarConfig, migrarExercicio, migrarSerie } from './migracoes';
import { CONFIG_PADRAO } from './tipos';

export const APP_BACKUP = 'app-treino';
export const VERSAO_BACKUP = 2;

export interface Backup {
  app: typeof APP_BACKUP;
  versao: number;
  exportadoEm: string;
  dados: Record<NomeTabela, unknown[]>;
}

export async function gerarBackup(): Promise<Backup> {
  const dados = {} as Record<NomeTabela, unknown[]>;
  await db.transaction('r', TABELAS.map((t) => db[t]), async () => {
    for (const t of TABELAS) dados[t] = await db[t].toArray();
  });
  return { app: APP_BACKUP, versao: VERSAO_BACKUP, exportadoEm: new Date().toISOString(), dados };
}

export function nomeArquivoBackup(data = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `treino-backup-${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}.json`;
}

export interface ResumoBackup {
  exportadoEm: string;
  sessoes: number;
  programas: number;
  exercicios: number;
}

// Campos obrigatórios de cada tabela, para recusar arquivos estranhos antes de apagar algo.
const CAMPOS: Record<NomeTabela, string[]> = {
  exercicios: ['id', 'nome', 'grupoMuscular'],
  programas: ['id', 'nome'],
  programaDias: ['id', 'programaId', 'ordem', 'nome'],
  programaExercicios: ['id', 'diaId', 'exercicioId', 'series', 'repsMin', 'repsMax'],
  sessoes: ['id', 'inicio', 'concluida'],
  sessaoSeries: ['id', 'sessaoId', 'exercicioId', 'carga', 'reps', 'concluida'],
  pesos: ['id', 'data', 'kg'],
  config: ['chave'],
};

/**
 * Lê e valida o conteúdo de um arquivo de backup.
 * Lança Error com mensagem em português se o arquivo não servir.
 */
export function validarBackup(texto: string): { backup: Backup; resumo: ResumoBackup } {
  let json: unknown;
  try {
    json = JSON.parse(texto);
  } catch {
    throw new Error('O arquivo não é um JSON válido.');
  }
  const b = json as Partial<Backup>;
  if (!b || typeof b !== 'object' || b.app !== APP_BACKUP || !b.dados || typeof b.dados !== 'object') {
    throw new Error('Este arquivo não é um backup deste app.');
  }
  if (typeof b.versao !== 'number' || b.versao > VERSAO_BACKUP) {
    throw new Error('Backup feito por uma versão mais nova do app. Atualize o app e tente de novo.');
  }
  for (const t of TABELAS) {
    const linhas = (b.dados as Record<string, unknown>)[t];
    if (linhas === undefined) continue; // tabela ausente vira vazia
    if (!Array.isArray(linhas)) throw new Error(`Backup corrompido (${t}).`);
    for (const linha of linhas) {
      if (!linha || typeof linha !== 'object' || CAMPOS[t].some((c) => !(c in linha))) {
        throw new Error(`Backup corrompido: registro inválido em "${t}".`);
      }
    }
  }
  // Backup da versão 1: converte para o formato atual antes de restaurar.
  if (b.versao < 2) {
    const d = b.dados as Record<string, Record<string, unknown>[] | undefined>;
    d.exercicios?.forEach(migrarExercicio);
    d.sessaoSeries?.forEach(migrarSerie);
    d.config?.forEach(migrarConfig);
  }
  const qtd = (t: NomeTabela) => ((b.dados as Record<string, unknown[]>)[t] ?? []).length;
  return {
    backup: b as Backup,
    resumo: {
      exportadoEm: b.exportadoEm ?? '',
      sessoes: ((b.dados as Record<string, { concluida?: boolean }[]>).sessoes ?? []).filter((s) => s.concluida).length,
      programas: qtd('programas'),
      exercicios: qtd('exercicios'),
    },
  };
}

/** Substitui TODOS os dados do aparelho pelos do backup (tudo ou nada). */
export async function restaurarBackup(backup: Backup): Promise<void> {
  await db.transaction('rw', TABELAS.map((t) => db[t]), async () => {
    for (const t of TABELAS) {
      // Tabela genérica: as linhas já foram validadas em validarBackup.
      const tabela = db.table(t);
      await tabela.clear();
      const linhas = backup.dados[t] ?? [];
      if (linhas.length) await tabela.bulkAdd(linhas);
    }
    // Garante uma config válida (e não mostra a boas-vindas de novo).
    const cfg = await db.config.get('app');
    await db.config.put({ ...CONFIG_PADRAO, ...cfg, chave: 'app', onboardingConcluido: true });
  });
}

/** Apaga tudo e volta ao estado do primeiro acesso. */
export async function apagarTudo(): Promise<void> {
  await db.delete();
  await db.open(); // recria e roda o "populate" (exercícios iniciais + config padrão)
}
