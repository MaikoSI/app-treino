import { db } from './index';
import { exerciciosDoDia } from './programas';
import type { Sessao, SessaoSerie } from './tipos';

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
