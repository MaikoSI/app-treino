import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { TreinoDB } from './index';

let banco: TreinoDB;
afterEach(async () => {
  await banco?.delete();
});

describe('banco local', () => {
  it('no primeiro acesso carrega os exercícios iniciais e a config padrão', async () => {
    banco = new TreinoDB('teste-populate');
    expect(await banco.exercicios.count()).toBeGreaterThanOrEqual(60);
    const cfg = await banco.config.get('app');
    expect(cfg?.onboardingConcluido).toBe(false);
    expect(cfg?.metaSemanal).toBe(3);
  });

  it('migra da versão 1: tipo/secundários, RPE vira RIR e descanso por tipo', async () => {
    const v1 = new Dexie('teste-migracao');
    v1.version(1).stores({
      exercicios: '++id, nome, grupoMuscular',
      programas: '++id',
      programaDias: '++id, programaId',
      programaExercicios: '++id, diaId, exercicioId',
      sessoes: '++id, inicio, programaDiaId',
      sessaoSeries: '++id, sessaoId, exercicioId',
      config: 'chave',
    });
    await v1.table('exercicios').bulkAdd([
      { nome: 'Supino reto', grupoMuscular: 'Peito', equipamento: 'Barra', personalizado: false },
      { nome: 'Meu exercício', grupoMuscular: 'Costas', equipamento: 'Outro', personalizado: true },
    ]);
    await v1.table('sessaoSeries').bulkAdd([
      { sessaoId: 1, exercicioId: 1, ordem: 0, numero: 1, carga: 50, reps: 8, rpe: 8, concluida: true },
      { sessaoId: 1, exercicioId: 1, ordem: 0, numero: 2, carga: 50, reps: 8, rpe: null, concluida: true },
      { sessaoId: 1, exercicioId: 1, ordem: 0, numero: 3, carga: 50, reps: 8, rpe: 3, concluida: true },
    ]);
    await v1.table('config').add({ chave: 'app', metaSemanal: 4, descansoPadraoSeg: 120, mostrarRpe: true, onboardingConcluido: true });
    v1.close();

    banco = new TreinoDB('teste-migracao');
    const [supino, meu] = await banco.exercicios.toArray();
    expect(supino).toMatchObject({ tipo: 'composto', secundarios: ['Tríceps', 'Ombros'] });
    expect(meu).toMatchObject({ tipo: 'isolado', secundarios: [] });
    const series = await banco.sessaoSeries.toArray();
    expect(series.map((s) => s.rir)).toEqual([2, null, 5]);
    expect(series.every((s) => !('rpe' in s))).toBe(true);
    const cfg = await banco.config.get('app');
    expect(cfg).toMatchObject({ metaSemanal: 4, descansoIsoladoSeg: 120, descansoCompostoSeg: 180, mostrarRir: true });
    expect(cfg).not.toHaveProperty('descansoPadraoSeg');
    expect(await banco.pesos.count()).toBe(0);
  });
});
