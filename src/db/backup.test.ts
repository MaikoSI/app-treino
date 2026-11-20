import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { apagarTudo, gerarBackup, restaurarBackup, validarBackup } from './backup';
import { db } from './index';
import { salvarConfig } from './config';
import { DIVISOES } from './divisoes';
import { registrarPeso } from './pesos';
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
  await db.exercicios.add({ nome: 'Meu exercício', grupoMuscular: 'Peito', equipamento: 'Outro', tipo: 'isolado', secundarios: [], personalizado: true });
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

  it('restaura backup da versão 1, convertendo para o formato atual', async () => {
    const v1 = {
      app: 'app-treino',
      versao: 1,
      exportadoEm: '2026-01-01T00:00:00.000Z',
      dados: {
        exercicios: [{ id: 1, nome: 'Remada curvada', grupoMuscular: 'Costas', equipamento: 'Barra', personalizado: false }],
        sessoes: [{ id: 1, inicio: 1, fim: 2, concluida: true, nomeDia: 'A', programaDiaId: null, programaId: null, observacao: '' }],
        sessaoSeries: [{ id: 1, sessaoId: 1, exercicioId: 1, ordem: 0, numero: 1, carga: 60, reps: 8, rpe: 9.5, concluida: true }],
        config: [{ chave: 'app', metaSemanal: 2, descansoPadraoSeg: 90, mostrarRpe: false, onboardingConcluido: true }],
      },
    };
    const { backup } = validarBackup(JSON.stringify(v1));
    await restaurarBackup(backup);
    expect(await db.exercicios.get(1)).toMatchObject({ tipo: 'composto', secundarios: ['Bíceps'] });
    expect((await db.sessaoSeries.get(1))?.rir).toBe(1);
    expect(await db.config.get('app')).toMatchObject({ metaSemanal: 2, descansoCompostoSeg: 150, descansoIsoladoSeg: 90, mostrarRir: false });
    expect(await db.pesos.count()).toBe(0);
  });

  it('inclui o registro de peso no backup', async () => {
    await registrarPeso(80.5, new Date(2026, 10, 2, 8));
    await registrarPeso(80.1, new Date(2026, 10, 2, 20)); // mesmo dia: substitui
    const backup = await gerarBackup();
    expect(backup.versao).toBe(2);
    await apagarTudo();
    await restaurarBackup(validarBackup(JSON.stringify(backup)).backup);
    expect((await db.pesos.toArray()).map((p) => p.kg)).toEqual([80.1]);
  });
});
