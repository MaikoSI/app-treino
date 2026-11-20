import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconeVoltar } from '../components/Icones';
import { Cabecalho, Carregando, Vazio } from '../components/ui';
import { db } from '../db';
import { sessoesConcluidas } from '../db/sessoes';
import { volumeTotal } from '../lib/forca';
import { duracaoCurta, kg } from '../lib/formato';
import { celulasDoMes } from '../lib/progresso';

const DIAS_SEMANA = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

export default function Historico() {
  const hoje = new Date();
  const [mes, setMes] = useState({ ano: hoje.getFullYear(), mes: hoje.getMonth() });

  const dados = useLiveQuery(async () => {
    const sessoes = (await sessoesConcluidas()).reverse();
    const series = await db.sessaoSeries.where('sessaoId').anyOf(sessoes.map((s) => s.id)).toArray();
    return sessoes.map((s) => {
      const doTreino = series.filter((x) => x.sessaoId === s.id);
      return { ...s, qtdSeries: doTreino.length, volume: volumeTotal(doTreino) };
    });
  }, []);

  if (!dados) return <Carregando />;

  const doMes = dados.filter((s) => {
    const d = new Date(s.inicio);
    return d.getFullYear() === mes.ano && d.getMonth() === mes.mes;
  });
  const diasTreinados = new Set(doMes.map((s) => new Date(s.inicio).getDate()));
  const ehHoje = (dia: number) => dia === hoje.getDate() && mes.mes === hoje.getMonth() && mes.ano === hoje.getFullYear();
  const titulo = new Date(mes.ano, mes.mes, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const mudarMes = (delta: number) =>
    setMes(({ ano, mes }) => {
      const d = new Date(ano, mes + delta, 1);
      return { ano: d.getFullYear(), mes: d.getMonth() };
    });
  const noFuturo = mes.ano > hoje.getFullYear() || (mes.ano === hoje.getFullYear() && mes.mes >= hoje.getMonth());

  return (
    <>
      <Cabecalho titulo="Histórico" />
      <div className="flex flex-col gap-4 px-4">
        <section className="rounded-2xl bg-superficie p-4" aria-label="Calendário de treinos">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" aria-label="Mês anterior" onClick={() => mudarMes(-1)} className="flex size-12 items-center justify-center rounded-xl active:bg-superficie-2">
              <IconeVoltar />
            </button>
            <p className="font-semibold first-letter:uppercase">{titulo}</p>
            <button
              type="button"
              aria-label="Próximo mês"
              disabled={noFuturo}
              onClick={() => mudarMes(1)}
              className="flex size-12 items-center justify-center rounded-xl active:bg-superficie-2 disabled:opacity-25"
            >
              <IconeVoltar className="rotate-180" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {DIAS_SEMANA.map((d, i) => (
              <span key={i} className="text-xs text-suave">
                {d}
              </span>
            ))}
            {celulasDoMes(mes.ano, mes.mes).map((dia, i) =>
              dia === null ? (
                <span key={i} />
              ) : (
                <span
                  key={i}
                  aria-label={diasTreinados.has(dia) ? `Dia ${dia}: treinou` : undefined}
                  className={`mx-auto flex size-10 items-center justify-center rounded-full text-sm tabular-nums ${
                    diasTreinados.has(dia) ? 'bg-acento font-bold text-black' : ehHoje(dia) ? 'ring-1 ring-suave' : 'text-suave'
                  }`}
                >
                  {dia}
                </span>
              ),
            )}
          </div>
          <p className="mt-3 text-center text-sm text-suave">
            {doMes.length} {doMes.length === 1 ? 'treino' : 'treinos'} neste mês
          </p>
        </section>

        {dados.length === 0 ? (
          <Vazio>Nenhum treino finalizado ainda.</Vazio>
        ) : (
          <ul className="flex flex-col gap-2">
            {(doMes.length ? doMes : dados).map((s) => (
              <li key={s.id}>
                <Link to={`/historico/${s.id}`} className="flex min-h-16 items-center gap-3 rounded-2xl bg-superficie p-4 active:bg-superficie-2">
                  <div className="w-12 shrink-0 text-center">
                    <p className="text-xl font-bold leading-none">{new Date(s.inicio).getDate()}</p>
                    <p className="text-xs text-suave">{new Date(s.inicio).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{s.nomeDia}</p>
                    <p className="text-sm text-suave tabular-nums">
                      {s.fim ? duracaoCurta(s.fim - s.inicio) : ''} · {s.qtdSeries} séries · {kg(s.volume)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
            {doMes.length === 0 && <p className="text-center text-sm text-suave">Sem treinos neste mês. Mostrando todos.</p>}
          </ul>
        )}
      </div>
    </>
  );
}
