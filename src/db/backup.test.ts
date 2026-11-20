import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { apagarTudo, gerarBackup, restaurarBackup, validarBackup } from './backup';
import { db } from './index';
import { salvarConfig } from './config';
import { DIVISOES } from './divisoes';
import { criarProgramaDeDivisao, diasDoPrograma } from './programas';
import { finalizarTreino, iniciarTreino, seriesDaSessao } from './sessoes';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

async function popular() {
  await salvarConfig({ metaSemanal: 5, onboardingConcluido: true });
  const p = await criarProgramaDeDivisao(DIVISOES[0]);
  const [dia] = await diasDoPrograma(p);
  const s = await iniciarTreino(dia.id);
  const [serie] = await seriesDaSessao(s);
  await db.sessaoSeries.update(serie.id, { concluida: true, carga: 100, reps: 5 });
  await finalizarTreino(s);
  await db.exercicios.add({ nome: 'Meu exercício', grupoMuscular: 'Peito', equipamento: 'Outro', personalizado: true });
}

describe('backup', () => {
  it('exporta e restaura tudo (ida e volta)', async () => {
    await popular();
    const texto = JSON.stringify(await gerarBackup());

    await apagarTudo();
    expect(await db.sessoes.count()).toBe(0);
    expect((await db.config.get('app'))?.onboardingConcluido).toBe(false);

    const { backup, resumo } = validarBackup(texto);
    expect(resumo).toMatchObject({ sessoes: 1, programas: 1 });
    await restaurarBackup(backup);

    expect(await db.sessoes.count()).toBe(1);
    expect((await db.sessaoSeries.toArray()).find((s) => s.concluida)).toMatchObject({ carga: 100, reps: 5 });
    expect(await db.exercicios.where('nome').equals('Meu exercício').count()).toBe(1);
    expect(await db.config.get('app')).toMatchObject({ metaSemanal: 5, onboardingConcluido: true });
  });

  it('restaurar substitui os dados atuais em vez de misturar', async () => {
    await popular();
    const backup = await gerarBackup();
    await criarProgramaDeDivisao(DIVISOES[1]);
    expect(await db.programas.count()).toBe(2);
    await restaurarBackup(backup);
    expect(await db.programas.count()).toBe(1);
  });

  it('recusa arquivos inválidos sem mexer em nada', () => {
    expect(() => validarBackup('não é json')).toThrow('JSON válido');
    expect(() => validarBackup('{"app":"outro","dados":{}}')).toThrow('não é um backup');
    expect(() => validarBackup('{"app":"app-treino","versao":99,"dados":{}}')).toThrow('versão mais nova');
    expect(() => validarBackup('{"app":"app-treino","versao":1,"dados":{"sessoes":{}}}')).toThrow('corrompido');
    expect(() => validarBackup('{"app":"app-treino","versao":1,"dados":{"sessaoSeries":[{"id":1}]}}')).toThrow('sessaoSeries');
  });
});
