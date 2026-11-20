import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './index';
import { DIVISOES } from './divisoes';
import { salvarConfig } from './config';
import {
  aplicarMetasPadrao,
  criarProgramaDeDivisao,
  definirAtivo,
  diasDoPrograma,
  duplicarPrograma,
  excluirPrograma,
  exerciciosDoDia,
  programaAtivo,
} from './programas';
import { iniciarTreino, sessaoEmAndamento, ultimasSeries } from './sessoes';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

const abc = DIVISOES.find((d) => d.chave === 'fullbody3')!;
const ppl = DIVISOES.find((d) => d.chave === 'ppl6')!;

describe('programas', () => {
  it('cria programa a partir da divisão pronta, com dias e exercícios', async () => {
    const id = await criarProgramaDeDivisao(abc);
    const dias = await diasDoPrograma(id);
    expect(dias.map((d) => d.nome)).toEqual(abc.dias.map((d) => d.nome));
    const itens = await exerciciosDoDia(dias[0].id);
    expect(itens).toHaveLength(abc.dias[0].exercicios.length);
    // Metas do guia: composto (agachamento) 6–10 reps e 2:30; isolado (elevação lateral) 10–15 e 1:30.
    expect(itens[0]).toMatchObject({ series: 3, repsMin: 6, repsMax: 10, descansoSeg: 150 });
    const lateral = itens.find((i) => i.exercicioId === itens[4].exercicioId)!;
    expect(lateral).toMatchObject({ repsMin: 10, repsMax: 15, descansoSeg: 90 });
    expect((await programaAtivo())?.id).toBe(id);
  });

  it('só um programa fica ativo', async () => {
    const a = await criarProgramaDeDivisao(abc);
    const b = await criarProgramaDeDivisao(ppl);
    expect((await programaAtivo())?.id).toBe(b);
    await definirAtivo(a);
    expect((await db.programas.toArray()).filter((p) => p.ativo).map((p) => p.id)).toEqual([a]);
  });

  it('duplicar copia dias e exercícios sem ativar a cópia', async () => {
    const a = await criarProgramaDeDivisao(abc);
    const copia = await duplicarPrograma(a);
    const p = await db.programas.get(copia);
    expect(p).toMatchObject({ nome: 'Full Body A / B / C (cópia)', ativo: false });
    const dias = await diasDoPrograma(copia);
    expect(dias).toHaveLength(3);
    expect(await exerciciosDoDia(dias[2].id)).toHaveLength(abc.dias[2].exercicios.length);
    // o original continua intacto
    expect(await diasDoPrograma(a)).toHaveLength(3);
  });

  it('excluir remove dias e exercícios, mas mantém o histórico', async () => {
    const a = await criarProgramaDeDivisao(abc);
    const [dia] = await diasDoPrograma(a);
    const sessaoId = await iniciarTreino(dia.id);
    await excluirPrograma(a);
    expect(await db.programaDias.count()).toBe(0);
    expect(await db.programaExercicios.count()).toBe(0);
    expect(await db.sessaoSeries.where('sessaoId').equals(sessaoId).count()).toBeGreaterThan(0);
  });
});

describe('metas do guia', () => {
  it('modo força: compostos 3–6 reps com pelo menos 3 min; isolados não mudam', async () => {
    await salvarConfig({ objetivo: 'forca' });
    const id = await criarProgramaDeDivisao(abc);
    const itens = await exerciciosDoDia((await diasDoPrograma(id))[0].id);
    expect(itens[0]).toMatchObject({ repsMin: 3, repsMax: 6, descansoSeg: 180 });
    expect(itens[4]).toMatchObject({ repsMin: 10, repsMax: 15, descansoSeg: 90 });
  });

  it('aplicar metas padrão reescreve reps e descanso, sem mexer nas séries', async () => {
    const id = await criarProgramaDeDivisao(abc);
    const [dia] = await diasDoPrograma(id);
    const [item] = await exerciciosDoDia(dia.id);
    await db.programaExercicios.update(item.id, { series: 5, repsMin: 1, repsMax: 2, descansoSeg: 30 });
    await salvarConfig({ descansoIsoladoSeg: 75 });
    const mudou = await aplicarMetasPadrao(id);
    expect(mudou).toBeGreaterThan(1); // o item editado + todos os isolados (descanso novo)
    expect(await db.programaExercicios.get(item.id)).toMatchObject({ series: 5, repsMin: 6, repsMax: 10, descansoSeg: 150 });
    expect(await aplicarMetasPadrao(id)).toBe(0);
  });
});

describe('iniciar treino', () => {
  it('semana leve: metade das séries (arredondando para cima) e marca a sessão', async () => {
    const a = await criarProgramaDeDivisao(abc);
    const [dia] = await diasDoPrograma(a);
    await salvarConfig({ semanaLeveAte: Date.now() + 86_400_000 });
    const s = await iniciarTreino(dia.id, 'sono'); // semana leve prevalece
    const esperado = abc.dias[0].exercicios.reduce((t, e) => t + Math.ceil(e.series / 2), 0);
    expect(await db.sessaoSeries.where('sessaoId').equals(s).count()).toBe(esperado);
    expect((await db.sessoes.get(s))?.ajuste).toBe('deload');
  });

  it('sono ruim: uma série a menos nos exercícios com 3 ou mais', async () => {
    const a = await criarProgramaDeDivisao(abc);
    const [dia] = await diasDoPrograma(a);
    await salvarConfig({ semanaLeveAte: Date.now() - 1 }); // semana leve já acabou
    const s = await iniciarTreino(dia.id, 'sono');
    const esperado = abc.dias[0].exercicios.reduce((t, e) => t + (e.series >= 3 ? e.series - 1 : e.series), 0);
    expect(await db.sessaoSeries.where('sessaoId').equals(s).count()).toBe(esperado);
    expect((await db.sessoes.get(s))?.ajuste).toBe('sono');
  });

  it('copia o dia para a sessão; editar o programa depois não muda a sessão', async () => {
    const a = await criarProgramaDeDivisao(abc);
    const [dia] = await diasDoPrograma(a);
    const sessaoId = await iniciarTreino(dia.id);
    const series = await db.sessaoSeries.where('sessaoId').equals(sessaoId).toArray();
    const totalSeries = abc.dias[0].exercicios.reduce((s, e) => s + e.series, 0);
    expect(series).toHaveLength(totalSeries);

    const [primeiro] = await exerciciosDoDia(dia.id);
    await db.programaExercicios.update(primeiro.id, { series: 10, repsMax: 99 });
    await db.programaDias.update(dia.id, { nome: 'Outro nome' });

    expect(await db.sessaoSeries.where('sessaoId').equals(sessaoId).count()).toBe(totalSeries);
    expect((await db.sessoes.get(sessaoId))?.nomeDia).toBe(abc.dias[0].nome);
    expect(series.find((s) => s.exercicioId === primeiro.exercicioId)?.repsMax).toBe(10);
  });

  it('não cria dois treinos em andamento', async () => {
    const a = await criarProgramaDeDivisao(abc);
    const [d1, d2] = await diasDoPrograma(a);
    const s1 = await iniciarTreino(d1.id);
    expect(await iniciarTreino(d2.id)).toBe(s1);
    expect((await sessaoEmAndamento())?.id).toBe(s1);
  });

  it('pré-preenche carga e reps com o último treino do exercício', async () => {
    const a = await criarProgramaDeDivisao(abc);
    const [dia] = await diasDoPrograma(a);
    const s1 = await iniciarTreino(dia.id);
    const [item] = await exerciciosDoDia(dia.id);
    const doSupino = await db.sessaoSeries.where({ sessaoId: s1 }).filter((s) => s.exercicioId === item.exercicioId).sortBy('numero');
    // sem histórico: carga 0, reps = repsMin
    expect(doSupino[0]).toMatchObject({ carga: 0, reps: 6 });
    await db.sessaoSeries.update(doSupino[0].id, { carga: 80, reps: 8, concluida: true });
    await db.sessaoSeries.update(doSupino[1].id, { carga: 82.5, reps: 6, concluida: true });
    await db.sessoes.update(s1, { concluida: true, fim: Date.now() });

    expect((await ultimasSeries(item.exercicioId)).map((s) => s.carga).slice(0, 2)).toEqual([80, 82.5]);

    const s2 = await iniciarTreino(dia.id);
    const novas = await db.sessaoSeries.where({ sessaoId: s2 }).filter((s) => s.exercicioId === item.exercicioId).sortBy('numero');
    expect(novas.slice(0, 2).map((s) => [s.carga, s.reps])).toEqual([
      [80, 8],
      [82.5, 6],
    ]);
    expect(novas.every((s) => !s.concluida)).toBe(true);
  });
});
