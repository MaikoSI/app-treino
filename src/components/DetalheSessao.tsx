import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useExerciciosMap } from '../db/hooks';
import { seriesAnteriores, seriesDaSessao } from '../db/sessoes';
import { detectarRecordes, type Recorde, volumeTotal } from '../lib/forca';
import { dataLonga, duracaoCurta, kg, num, rotuloRir } from '../lib/formato';
import { agruparPorExercicio } from '../lib/treino';
import { IconeTrofeu } from './Icones';
import { Carregando, Cartao } from './ui';

/** Carrega a sessão, suas séries e os recordes batidos nela (comparando com treinos anteriores). */
export function useDadosSessao(sessaoId: number) {
  return useLiveQuery(async () => {
    const sessao = await db.sessoes.get(sessaoId);
    if (!sessao) return null;
    const series = await seriesDaSessao(sessaoId);
    const ids = [...new Set(series.map((s) => s.exercicioId))];
    const recordes = detectarRecordes(
      series.filter((s) => s.concluida),
      await seriesAnteriores(sessao.inicio, ids),
    );
    return { sessao, series, recordes };
  }, [sessaoId]);
}

export function DetalheSessao({ sessaoId }: { sessaoId: number }) {
  const dados = useDadosSessao(sessaoId);
  const exercicios = useExerciciosMap();

  if (dados === undefined) return <Carregando formato="detalhe" />;
  if (dados === null) return <p className="p-6 text-center text-secundario">Treino não encontrado.</p>;

  const { sessao, series, recordes } = dados;
  const feitas = series.filter((s) => s.concluida);
  const nome = (id: number) => exercicios?.get(id)?.nome ?? 'Exercício removido';
  const recordesPorExercicio = new Map<number, Recorde[]>();
  for (const r of recordes) recordesPorExercicio.set(r.exercicioId, [...(recordesPorExercicio.get(r.exercicioId) ?? []), r]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-secundario">{dataLonga(sessao.inicio)}</p>
        <p className="text-3xl font-semibold">{sessao.nomeDia}</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Numero rotulo="Duração" valor={sessao.fim ? duracaoCurta(sessao.fim - sessao.inicio) : '—'} />
        <Numero rotulo="Volume" valor={kg(volumeTotal(feitas))} />
        <Numero rotulo="Séries" valor={String(feitas.length)} />
      </div>

      {recordes.length > 0 && (
        <Cartao className="ring-2 ring-destaque">
          <p className="flex items-center gap-2 font-semibold text-destaque-texto">
            <IconeTrofeu /> {recordes.length === 1 ? '1 recorde batido' : `${recordes.length} recordes batidos`}
          </p>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {recordes.map((r) => (
              <li key={`${r.exercicioId}-${r.tipo}`}>
                <strong>{nome(r.exercicioId)}</strong>: {r.tipo === 'carga' ? 'carga máxima' : '1RM estimado'} {kg(r.valor)}{' '}
                <span className="text-secundario">(antes {kg(r.anterior)})</span>
              </li>
            ))}
          </ul>
        </Cartao>
      )}

      {agruparPorExercicio(feitas).map((g) => (
        <Cartao key={g.ordem}>
          <p className="flex items-center gap-2 font-semibold">
            {nome(g.exercicioId)}
            {recordesPorExercicio.has(g.exercicioId) && <IconeTrofeu width={18} height={18} className="text-destaque-texto" />}
          </p>
          <ol className="mt-2 flex flex-col gap-1 text-sm tabular-nums">
            {g.series.map((s, i) => (
              <li key={s.id} className="flex gap-3">
                <span className="w-6 text-secundario">{i + 1}</span>
                <span>
                  {num(s.carga)} kg × {s.reps}
                  {s.rir != null && <span className="text-secundario"> · RIR {rotuloRir(s.rir)}</span>}
                </span>
              </li>
            ))}
          </ol>
        </Cartao>
      ))}

      {sessao.observacao && (
        <Cartao>
          <p className="text-sm text-secundario">Observação</p>
          <p className="mt-1 whitespace-pre-wrap">{sessao.observacao}</p>
        </Cartao>
      )}
    </div>
  );
}

function Numero({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-cartao bg-cartao shadow-cartao p-3 text-center">
      <p className="text-xs text-secundario">{rotulo}</p>
      <p className="mt-1 text-2xl leading-none font-semibold tabular-nums">{valor}</p>
    </div>
  );
}
