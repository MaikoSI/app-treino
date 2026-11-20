import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './index';
import { DIVISOES } from './divisoes';
import { criarProgramaDeDivisao, diasDoPrograma } from './programas';
import {
  adicionarExercicioNoTreino,
  adicionarSerie,
  finalizarTreino,
  iniciarTreino,
  removerUltimaSerie,
  seriesAnteriores,
  seriesDaSessao,
  sessaoEmAndamento,
  treinosPorExercicio,
  trocarExercicioNoTreino,
} from './sessoes';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

async function novoTreino() {
  const p = await criarProgramaDeDivisao(DIVISOES.find((d) => d.chave === 'fullbody3')!);
  const [dia] = await diasDoPrograma(p);
  return iniciarTreino(dia.id);
}

describe('durante o treino', () => {
  it('adicionar série copia os valores da última; remover não apaga a única', async () => {
    const s = await novoTreino();
    const antes = (await seriesDaSessao(s)).filter((x) => x.ordem === 0);
    await db.sessaoSeries.update(antes.at(-1)!.id, { carga: 70, reps: 7, concluida: true });
    await adicionarSerie(s, 0);
    const depois = (await seriesDaSessao(s)).filter((x) => x.ordem === 0);
    expect(depois).toHaveLength(antes.length + 1);
    expect(depois.at(-1)).toMatchObject({ carga: 70, reps: 7, concluida: false, numero: antes.length + 1 });

    for (let i = 0; i < 10; i++) await removerUltimaSerie(s, 0);
    expect((await seriesDaSessao(s)).filter((x) => x.ordem === 0)).toHaveLength(1);
  });

  it('adicionar exercício entra no fim com 3 séries', async () => {
    const s = await novoTreino();
    const rosca = await db.exercicios.where('nome').equals('Rosca Scott').first(); // não está no Full Body A
    await adicionarExercicioNoTreino(s, rosca!.id);
    const series = await seriesDaSessao(s);
    const novas = series.filter((x) => x.exercicioId === rosca!.id);
    expect(novas).toHaveLength(3);
    expect(novas[0].ordem).toBe(Math.max(...series.map((x) => x.ordem)));
    // sem histórico, usa a meta do guia para isolados
    expect(novas[0]).toMatchObject({ repsMin: 10, repsMax: 15, descansoSeg: 90, reps: 10 });
  });

  it('trocar exercício mantém a quantidade de séries e desmarca', async () => {
    const s = await novoTreino();
    const antes = (await seriesDaSessao(s)).filter((x) => x.ordem === 1);
    await db.sessaoSeries.update(antes[0].id, { concluida: true });
    const crucifixo = await db.exercicios.where('nome').equals('Crucifixo com halteres').first();
    await trocarExercicioNoTreino(s, 1, crucifixo!.id);
    const depois = (await seriesDaSessao(s)).filter((x) => x.ordem === 1);
    expect(depois).toHaveLength(antes.length);
    expect(depois.every((x) => x.exercicioId === crucifixo!.id && !x.concluida)).toBe(true);
  });
});

describe('finalizar treino', () => {
  it('sem séries feitas não finaliza', async () => {
    const s = await novoTreino();
    expect(await finalizarTreino(s)).toBe(false);
    expect((await sessaoEmAndamento())?.id).toBe(s);
  });

  it('descarta séries não marcadas, grava fim e observação', async () => {
    const s = await novoTreino();
    const [a, b] = await seriesDaSessao(s);
    await db.sessaoSeries.bulkUpdate([
      { key: a.id, changes: { concluida: true, carga: 60, reps: 10 } },
      { key: b.id, changes: { concluida: true, carga: 60, reps: 9 } },
    ]);
    expect(await finalizarTreino(s, 'bom treino')).toBe(true);
    expect(await seriesDaSessao(s)).toHaveLength(2);
    const sessao = await db.sessoes.get(s);
    expect(sessao).toMatchObject({ concluida: true, observacao: 'bom treino' });
    expect(sessao?.fim).toBeGreaterThan(0);
    expect(await sessaoEmAndamento()).toBeUndefined();
    // aparece como histórico para treinos que começarem depois
    expect(await seriesAnteriores(Date.now() + 1)).toHaveLength(2);
  });
});

describe('treinosPorExercicio', () => {
  it('agrupa por treino em ordem e ignora semanas leves, sono ruim e o treino atual', async () => {
    const ex = (await db.exercicios.where('nome').equals('Supino reto').first())!.id;
    const sessao = async (inicio: number, ajuste?: 'normal' | 'sono' | 'deload') => {
      const id = await db.sessoes.add({ programaDiaId: null, programaId: null, nomeDia: 'T', inicio, fim: inicio + 1, concluida: true, observacao: '', ajuste });
      await db.sessaoSeries.add({ sessaoId: id, exercicioId: ex, ordem: 0, numero: 1, carga: inicio, reps: 5, rir: null, concluida: true, repsMin: 6, repsMax: 10, descansoSeg: 90 });
      return id;
    };
    await sessao(30);
    await sessao(10); // treino antigo, sem campo "ajuste"
    await sessao(20, 'deload');
    await sessao(25, 'sono');
    const atual = await sessao(40);
    const mapa = await treinosPorExercicio([ex], atual);
    expect(mapa.get(ex)!.map((t) => t.inicio)).toEqual([10, 30]);
  });
});
