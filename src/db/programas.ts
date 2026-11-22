import { metaPadrao } from '../lib/metas';
import type { DiaPlanejado } from '../lib/volume';
import { lerConfig } from './config';
import type { Divisao } from './divisoes';
import { db } from './index';
import type { Programa, ProgramaDia, ProgramaExercicio } from './tipos';

/** Cria um programa a partir de uma divisão pronta. Devolve o id. */
export async function criarProgramaDeDivisao(divisao: Divisao, ativar = true): Promise<number> {
  const config = await lerConfig();
  return db.transaction('rw', [db.programas, db.programaDias, db.programaExercicios, db.exercicios], async () => {
    const exercicios = await db.exercicios.toArray();
    const porNome = new Map(exercicios.map((e) => [e.nome, e]));

    if (ativar) await desativarTodos();
    const programaId = await db.programas.add({
      nome: divisao.nome,
      diasPorSemana: divisao.diasPorSemana,
      ativo: ativar,
      criadoEm: Date.now(),
    });

    for (const [ordemDia, dia] of divisao.dias.entries()) {
      const diaId = await db.programaDias.add({ programaId, ordem: ordemDia, nome: dia.nome });
      const itens: Omit<ProgramaExercicio, 'id'>[] = [];
      dia.exercicios.forEach((item, ordem) => {
        const ex = porNome.get(item.nome);
        if (!ex) return; // exercício removido da biblioteca
        itens.push({ diaId, exercicioId: ex.id, ordem, series: item.series, ...metaPadrao(ex.tipo, config) });
      });
      await db.programaExercicios.bulkAdd(itens);
    }
    return programaId;
  });
}

/** Cria um programa vazio, com um dia. */
export async function criarProgramaVazio(nome = 'Meu programa', ativar = false): Promise<number> {
  return db.transaction('rw', [db.programas, db.programaDias], async () => {
    if (ativar) await desativarTodos();
    const programaId = await db.programas.add({ nome, diasPorSemana: 3, ativo: ativar, criadoEm: Date.now() });
    await db.programaDias.add({ programaId, ordem: 0, nome: 'Treino A' });
    return programaId;
  });
}

async function desativarTodos() {
  await db.programas.toCollection().modify({ ativo: false });
}

export async function programaAtivo(): Promise<Programa | undefined> {
  return db.programas.filter((p) => p.ativo).first();
}

export async function definirAtivo(programaId: number): Promise<void> {
  await db.transaction('rw', db.programas, async () => {
    await desativarTodos();
    await db.programas.update(programaId, { ativo: true });
  });
}

export async function diasDoPrograma(programaId: number): Promise<ProgramaDia[]> {
  return db.programaDias.where('programaId').equals(programaId).sortBy('ordem');
}

export async function exerciciosDoDia(diaId: number): Promise<ProgramaExercicio[]> {
  return db.programaExercicios.where('diaId').equals(diaId).sortBy('ordem');
}

export async function duplicarPrograma(programaId: number): Promise<number> {
  return db.transaction('rw', [db.programas, db.programaDias, db.programaExercicios], async () => {
    const original = await db.programas.get(programaId);
    if (!original) throw new Error('Programa não encontrado');
    const { id: _id, ...resto } = original;
    const novoId = await db.programas.add({ ...resto, nome: `${original.nome} (cópia)`, ativo: false, criadoEm: Date.now() });
    for (const dia of await diasDoPrograma(programaId)) {
      const { id: diaIdOriginal, ...d } = dia;
      const novoDiaId = await db.programaDias.add({ ...d, programaId: novoId });
      const itens = (await exerciciosDoDia(diaIdOriginal!)).map(({ id: _x, ...pe }) => ({ ...pe, diaId: novoDiaId }));
      await db.programaExercicios.bulkAdd(itens);
    }
    return novoId;
  });
}

/** Exclui o programa e seus dias. O histórico de treinos é mantido (as sessões são cópias). */
export async function excluirPrograma(programaId: number): Promise<void> {
  await db.transaction('rw', [db.programas, db.programaDias, db.programaExercicios], async () => {
    const dias = await diasDoPrograma(programaId);
    await db.programaExercicios
      .where('diaId')
      .anyOf(dias.map((d) => d.id!))
      .delete();
    await db.programaDias.where('programaId').equals(programaId).delete();
    await db.programas.delete(programaId);
  });
}

export async function adicionarDia(programaId: number): Promise<number> {
  const dias = await diasDoPrograma(programaId);
  const letra = String.fromCharCode(65 + (dias.length % 26));
  return db.programaDias.add({ programaId, ordem: dias.length, nome: `Treino ${letra}` });
}

export async function excluirDia(diaId: number): Promise<void> {
  await db.transaction('rw', [db.programaDias, db.programaExercicios], async () => {
    await db.programaExercicios.where('diaId').equals(diaId).delete();
    await db.programaDias.delete(diaId);
  });
}

/** Grava a nova ordem: o índice na lista vira o campo `ordem`. */
export async function salvarOrdem(tabela: 'programaDias' | 'programaExercicios', ids: number[]): Promise<void> {
  await db.transaction('rw', db[tabela], async () => {
    await Promise.all(ids.map((id, ordem) => db[tabela].update(id, { ordem })));
  });
}

export async function adicionarExercicioAoDia(diaId: number, exercicioId: number): Promise<number> {
  const [config, ex] = await Promise.all([lerConfig(), db.exercicios.get(exercicioId)]);
  const qtd = await db.programaExercicios.where('diaId').equals(diaId).count();
  return db.programaExercicios.add({ diaId, exercicioId, ordem: qtd, series: 3, ...metaPadrao(ex?.tipo ?? 'isolado', config) });
}

/**
 * Reaplica as metas do guia (reps e descanso por tipo de exercício e objetivo)
 * em todos os exercícios do programa. As séries não mudam. Devolve quantos itens mudaram.
 */
export async function aplicarMetasPadrao(programaId: number): Promise<number> {
  const config = await lerConfig();
  return db.transaction('rw', [db.programaDias, db.programaExercicios, db.exercicios], async () => {
    const dias = await diasDoPrograma(programaId);
    const itens = await db.programaExercicios
      .where('diaId')
      .anyOf(dias.map((d) => d.id))
      .toArray();
    const exercicios = new Map((await db.exercicios.toArray()).map((e) => [e.id, e]));
    let mudou = 0;
    for (const it of itens) {
      const meta = metaPadrao(exercicios.get(it.exercicioId)?.tipo ?? 'isolado', config);
      if (it.repsMin !== meta.repsMin || it.repsMax !== meta.repsMax || it.descansoSeg !== meta.descansoSeg) {
        await db.programaExercicios.update(it.id, meta);
        mudou++;
      }
    }
    return mudou;
  });
}

/** Dias do programa com seus exercícios e séries, para a análise de volume e frequência. */
export async function planoDoPrograma(programaId: number): Promise<DiaPlanejado[]> {
  const dias = await diasDoPrograma(programaId);
  return Promise.all(
    dias.map(async (d) => ({ itens: (await exerciciosDoDia(d.id)).map((it) => ({ exercicioId: it.exercicioId, series: it.series })) })),
  );
}
