import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconeTrofeu, IconeVoltar } from '../components/Icones';
import { Cabecalho, Carregando, Vazio } from '../components/ui';
import { useExerciciosMap } from '../db/hooks';
import { historicoDeSeries } from '../db/sessoes';
import { dataCurta, kg, num } from '../lib/formato';
import { recordesPessoais, seriesPorGrupo } from '../lib/progresso';
import { inicioDaSemana } from '../lib/semana';

export default function Progresso() {
  const exercicios = useExerciciosMap();
  const series = useLiveQuery(() => historicoDeSeries(), []);
  const [semanasAtras, setSemanasAtras] = useState(0);

  if (!series || !exercicios) return <Carregando />;
  if (series.length === 0)
    return (
      <>
        <Cabecalho titulo="Progresso" />
        <Vazio>Finalize seu primeiro treino para ver gráficos e recordes aqui.</Vazio>
      </>
    );

  // Semana selecionada
  const ini = inicioDaSemana(Date.now());
  ini.setDate(ini.getDate() - 7 * semanasAtras);
  const fim = new Date(ini);
  fim.setDate(fim.getDate() + 7);
  const daSemana = series.filter((s) => s.inicio >= ini.getTime() && s.inicio < fim.getTime());
  const porGrupo = seriesPorGrupo(daSemana, (id) => exercicios.get(id)?.grupoMuscular);
  const maior = Math.max(1, ...porGrupo.map((g) => g.series));
  const ultimoDia = new Date(fim.getTime() - 1);
  const rotuloSemana =
    semanasAtras === 0 ? 'Esta semana' : semanasAtras === 1 ? 'Semana passada' : `${dataCurta(ini.getTime())} a ${dataCurta(ultimoDia.getTime())}`;

  const recordes = recordesPessoais(series)
    .map((r) => ({ ...r, ex: exercicios.get(r.exercicioId) }))
    .sort((a, b) => (a.ex?.nome ?? '').localeCompare(b.ex?.nome ?? ''));

  return (
    <>
      <Cabecalho titulo="Progresso" />
      <div className="flex flex-col gap-6 px-4">
        <section className="rounded-2xl bg-superficie p-4">
          <h2 className="font-semibold">Séries por grupo muscular</h2>
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Semana anterior"
              onClick={() => setSemanasAtras((n) => n + 1)}
              className="flex size-12 items-center justify-center rounded-xl active:bg-superficie-2"
            >
              <IconeVoltar />
            </button>
            <p className="text-sm text-suave">{rotuloSemana}</p>
            <button
              type="button"
              aria-label="Próxima semana"
              disabled={semanasAtras === 0}
              onClick={() => setSemanasAtras((n) => n - 1)}
              className="flex size-12 items-center justify-center rounded-xl active:bg-superficie-2 disabled:opacity-25"
            >
              <IconeVoltar className="rotate-180" />
            </button>
          </div>
          {porGrupo.length === 0 ? (
            <p className="py-4 text-center text-sm text-suave">Nenhuma série nesta semana.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {porGrupo.map((g) => (
                <li key={g.grupo} className="grid grid-cols-[6.5rem_1fr_2rem] items-center gap-2 text-sm">
                  <span className="truncate">{g.grupo}</span>
                  <span className="h-3 rounded-full bg-superficie-2">
                    <span className="block h-full rounded-full bg-[#3987e5]" style={{ width: `${(g.series / maior) * 100}%` }} />
                  </span>
                  <span className="text-right font-semibold tabular-nums">{g.series}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-2 flex items-center gap-2 font-semibold">
            <IconeTrofeu width={20} height={20} className="text-ouro" /> Recordes pessoais
          </h2>
          <p className="mb-3 text-sm text-suave">Toque num exercício para ver o gráfico.</p>
          <ul className="flex flex-col gap-2">
            {recordes.map((r) => (
              <li key={r.exercicioId}>
                <Link
                  to={`/progresso/${r.exercicioId}`}
                  className="flex min-h-16 items-center gap-3 rounded-2xl bg-superficie p-4 active:bg-superficie-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{r.ex?.nome ?? 'Exercício removido'}</p>
                    <p className="text-sm text-suave">{r.ex?.grupoMuscular}</p>
                  </div>
                  <div className="text-right tabular-nums">
                    {r.cargaMax > 0 ? (
                      <>
                        <p className="font-semibold">
                          {kg(r.cargaMax)} × {r.repsNaCargaMax}
                        </p>
                        <p className="text-sm text-suave">1RM {num(r.umRm)} kg</p>
                      </>
                    ) : (
                      <p className="font-semibold">{r.maxReps} reps</p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
