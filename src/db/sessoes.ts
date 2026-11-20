import { db } from './index';
import { lerConfig } from './config';
import { exerciciosDoDia } from './programas';
import type { Sessao, SessaoSerie } from './tipos';
import type { SerieFeita } from '../lib/forca';
import type { SerieComData } from '../lib/progresso';

/** O treino que ainda não foi finalizado (no máximo um). */
export async function sessaoEmAndamento(): Promise<Sessao | undefined> {
  return db.sessoes.filter((s) => !s.concluida).first();
}

export async function sessoesConcluidas(): Promise<Sessao[]> {
  return (await db.sessoes.orderBy('inicio').toArray()).filter((s) => s.concluida);
}

/**
 * Séries do treino concluído mais recente que tem esse exercício,
 * ordenadas por número. Vazio se nunca foi feito.
 */
export async function ultimasSeries(exercicioId: number, ignorarSessaoId?: number): Promise<SessaoSerie[]> {
  const series = await db.sessaoSeries.where('exercicioId').equals(exercicioId).toArray();
  const ids = [...new Set(series.map((s) => s.sessaoId))].filter((id) => id !== ignorarSessaoId);
  if (ids.length === 0) return [];
  const sessoes = (await db.sessoes.bulkGet(ids)).filter((s): s is Sessao => !!s?.concluida);
  if (sessoes.length === 0) return [];
  const ultima = sessoes.reduce((a, b) => (b.inicio > a.inicio ? b : a));
  return series.filter((s) => s.sessaoId === ultima.id).sort((a, b) => a.numero - b.numero);
}

/** Valores para pré-preencher a série `numero` com o que foi feito da última vez. */
export function valoresAnteriores(anteriores: SessaoSerie[], numero: number, repsPadrao: number) {
  if (anteriores.length === 0) return { carga: 0, reps: repsPadrao };
  const ref = anteriores.find((s) => s.numero === numero) ?? anteriores[anteriores.length - 1];
  return { carga: ref.carga, reps: ref.reps };
}

/**
 * Começa um treino a partir de um dia do programa.
 * A sessão é uma CÓPIA do dia: editar o programa depois não muda o histórico.
 * Se já existe um treino em andamento, devolve ele em vez de criar outro.
 */
export async function iniciarTreino(diaId: number | null): Promise<number> {
  return db.transaction('rw', [db.sessoes, db.sessaoSeries, db.programaDias, db.programaExercicios], async () => {
    const aberta = await sessaoEmAndamento();
    if (aberta) return aberta.id!;

    const dia = diaId != null ? await db.programaDias.get(diaId) : undefined;
    const sessaoId = await db.sessoes.add({
      programaDiaId: dia?.id ?? null,
      programaId: dia?.programaId ?? null,
      nomeDia: dia?.nome ?? 'Treino livre',
      inicio: Date.now(),
      fim: null,
      concluida: false,
      observacao: '',
    });

    if (dia) {
      const itens = await exerciciosDoDia(dia.id!);
      const novas: Omit<SessaoSerie, 'id'>[] = [];
      for (const [ordem, item] of itens.entries()) {
        const anteriores = await ultimasSeries(item.exercicioId);
        for (let numero = 1; numero <= item.series; numero++) {
          novas.push({
            sessaoId,
            exercicioId: item.exercicioId,
            ordem,
            numero,
            ...valoresAnteriores(anteriores, numero, item.repsMin),
            rpe: null,
            concluida: false,
            repsMin: item.repsMin,
            repsMax: item.repsMax,
            descansoSeg: item.descansoSeg,
          });
        }
      }
      await db.sessaoSeries.bulkAdd(novas);
    }
    return sessaoId;
  });
}

// ---------------------------------------------------------------------------
// Durante o treino

export async function seriesDaSessao(sessaoId: number): Promise<SessaoSerie[]> {
  const series = await db.sessaoSeries.where('sessaoId').equals(sessaoId).toArray();
  return series.sort((a, b) => a.ordem - b.ordem || a.numero - b.numero);
}

export async function atualizarSerie(id: number, mudanca: Partial<Pick<SessaoSerie, 'carga' | 'reps' | 'rpe' | 'concluida'>>) {
  await db.sessaoSeries.update(id, mudanca);
}

/** Adiciona uma série ao exercício, copiando os valores da última. */
export async function adicionarSerie(sessaoId: number, ordem: number): Promise<void> {
  const doExercicio = (await seriesDaSessao(sessaoId)).filter((s) => s.ordem === ordem);
  const ultima = doExercicio.at(-1);
  if (!ultima) return;
  const { id: _id, ...base } = ultima;
  await db.sessaoSeries.add({ ...base, numero: ultima.numero + 1, concluida: false, rpe: null });
}

export async function removerUltimaSerie(sessaoId: number, ordem: number): Promise<void> {
  const doExercicio = (await seriesDaSessao(sessaoId)).filter((s) => s.ordem === ordem);
  if (doExercicio.length <= 1) return; // para tirar tudo, remove o exercício
  await db.sessaoSeries.delete(doExercicio.at(-1)!.id);
}

/** Adiciona um exercício no fim do treino, com 3 séries pré-preenchidas. */
export async function adicionarExercicioNoTreino(sessaoId: number, exercicioId: number): Promise<void> {
  const { descansoPadraoSeg } = await lerConfig();
  const series = await seriesDaSessao(sessaoId);
  const ordem = series.length ? Math.max(...series.map((s) => s.ordem)) + 1 : 0;
  const anteriores = await ultimasSeries(exercicioId, sessaoId);
  const repsMin = anteriores[0]?.repsMin ?? 8;
  const repsMax = anteriores[0]?.repsMax ?? 12;
  const qtd = Math.max(3, anteriores.length);
  const novas: Omit<SessaoSerie, 'id'>[] = [];
  for (let numero = 1; numero <= qtd; numero++) {
    novas.push({
      sessaoId,
      exercicioId,
      ordem,
      numero,
      ...valoresAnteriores(anteriores, numero, repsMin),
      rpe: null,
      concluida: false,
      repsMin,
      repsMax,
      descansoSeg: anteriores[0]?.descansoSeg ?? descansoPadraoSeg,
    });
  }
  await db.sessaoSeries.bulkAdd(novas);
}

/** Troca o exercício de uma posição, mantendo séries e metas, com valores do histórico do novo. */
export async function trocarExercicioNoTreino(sessaoId: number, ordem: number, novoExercicioId: number): Promise<void> {
  const anteriores = await ultimasSeries(novoExercicioId, sessaoId);
  const doExercicio = (await seriesDaSessao(sessaoId)).filter((s) => s.ordem === ordem);
  await db.transaction('rw', db.sessaoSeries, async () => {
    for (const s of doExercicio) {
      await db.sessaoSeries.update(s.id, {
        exercicioId: novoExercicioId,
        ...valoresAnteriores(anteriores, s.numero, s.repsMin),
        concluida: false,
        rpe: null,
      });
    }
  });
}

export async function removerExercicioDoTreino(sessaoId: number, ordem: number): Promise<void> {
  const ids = (await seriesDaSessao(sessaoId)).filter((s) => s.ordem === ordem).map((s) => s.id);
  await db.sessaoSeries.bulkDelete(ids);
}

/**
 * Finaliza o treino: descarta séries não marcadas e grava o horário de fim.
 * Devolve false (e não finaliza) se nenhuma série foi feita.
 */
export async function finalizarTreino(sessaoId: number, observacao = ''): Promise<boolean> {
  return db.transaction('rw', [db.sessoes, db.sessaoSeries], async () => {
    const series = await seriesDaSessao(sessaoId);
    if (!series.some((s) => s.concluida)) return false;
    await db.sessaoSeries.bulkDelete(series.filter((s) => !s.concluida).map((s) => s.id));
    await db.sessoes.update(sessaoId, { concluida: true, fim: Date.now(), observacao });
    return true;
  });
}

export async function excluirSessao(sessaoId: number): Promise<void> {
  await db.transaction('rw', [db.sessoes, db.sessaoSeries], async () => {
    await db.sessaoSeries.where('sessaoId').equals(sessaoId).delete();
    await db.sessoes.delete(sessaoId);
  });
}

/**
 * Séries concluídas de treinos concluídos que começaram ANTES de `antesDe`
 * (para comparar recordes). Pode filtrar por exercícios.
 */
export async function seriesAnteriores(antesDe: number, exercicioIds?: number[]): Promise<SerieFeita[]> {
  const sessoes = (await db.sessoes.where('inicio').below(antesDe).toArray()).filter((s) => s.concluida);
  if (sessoes.length === 0) return [];
  const series = await db.sessaoSeries.where('sessaoId').anyOf(sessoes.map((s) => s.id)).toArray();
  const filtro = exercicioIds ? new Set(exercicioIds) : null;
  return series.filter((s) => s.concluida && (!filtro || filtro.has(s.exercicioId)));
}

/** Séries feitas em treinos concluídos, com a data do treino (para gráficos e recordes). */
export async function historicoDeSeries(exercicioId?: number): Promise<SerieComData[]> {
  const sessoes = new Map((await sessoesConcluidas()).map((s) => [s.id, s]));
  const series =
    exercicioId === undefined
      ? await db.sessaoSeries.toArray()
      : await db.sessaoSeries.where('exercicioId').equals(exercicioId).toArray();
  return series.flatMap((s) => {
    const sessao = sessoes.get(s.sessaoId);
    return sessao && s.concluida
      ? [{ exercicioId: s.exercicioId, sessaoId: s.sessaoId, inicio: sessao.inicio, carga: s.carga, reps: s.reps }]
      : [];
  });
}
