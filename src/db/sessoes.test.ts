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
  trocarExercicioNoTreino,
} from './sessoes';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

async function novoTreino() {
  const p = await criarProgramaDeDivisao(DIVISOES.find((d) => d.chave === 'abc3')!);
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
    const rosca = await db.exercicios.where('nome').equals('Rosca direta').first();
    await adicionarExercicioNoTreino(s, rosca!.id);
    const series = await seriesDaSessao(s);
    const novas = series.filter((x) => x.exercicioId === rosca!.id);
    expect(novas).toHaveLength(3);
    expect(novas[0].ordem).toBe(Math.max(...series.map((x) => x.ordem)));
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
