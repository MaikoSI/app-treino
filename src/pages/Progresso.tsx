import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarrasVolume, type LinhaVolume } from '../components/BarrasVolume';
import { IconeTrofeu, IconeVoltar } from '../components/Icones';
import { Cabecalho, Carregando, Vazio } from '../components/ui';
import { useExerciciosMap } from '../db/hooks';
import { historicoDeSeries } from '../db/sessoes';
import { dataCurta, kg, num } from '../lib/formato';
import { GRUPOS_MUSCULARES, GRUPOS_PRINCIPAIS } from '../db/tipos';
import { recordesPessoais } from '../lib/progresso';
import { volumePorMusculo } from '../lib/volume';
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
        <div className="px-4">
          <Link to="/corpo" className="flex min-h-14 items-center justify-between rounded-xl bg-cartao px-4 active:bg-cartao-2">
            <span className="font-semibold">Peso corporal e nutrição</span>
            <IconeVoltar className="rotate-180 text-secundario" />
          </Link>
        </div>
      </>
    );

  // Semana selecionada
  const ini = inicioDaSemana(Date.now());
  ini.setDate(ini.getDate() - 7 * semanasAtras);
  const fim = new Date(ini);
  fim.setDate(fim.getDate() + 7);
  const daSemana = series.filter((s) => s.inicio >= ini.getTime() && s.inicio < fim.getTime());
  const volume = volumePorMusculo(daSemana, (id) => exercicios.get(id));
  // Músculos principais sempre aparecem (um zero também é informação); complementares só se treinados.
  const linhas: LinhaVolume[] = GRUPOS_MUSCULARES.filter((g) => GRUPOS_PRINCIPAIS.includes(g) || (volume.get(g) ?? 0) > 0).map((g) => ({
    grupo: g,
    series: volume.get(g) ?? 0,
    complementar: !GRUPOS_PRINCIPAIS.includes(g),
  }));
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
        <Link to="/corpo" className="flex min-h-14 items-center justify-between rounded-xl bg-cartao px-4 active:bg-cartao-2">
          <span className="font-semibold">Peso corporal e nutrição</span>
          <IconeVoltar className="rotate-180 text-secundario" />
        </Link>
        <section className="rounded-xl bg-cartao p-4">
          <h2 className="font-semibold">Séries por grupo muscular</h2>
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Semana anterior"
              onClick={() => setSemanasAtras((n) => n + 1)}
              className="flex size-12 items-center justify-center rounded-xl active:bg-cartao-2"
            >
              <IconeVoltar />
            </button>
            <p className="text-sm text-secundario">{rotuloSemana}</p>
            <button
              type="button"
              aria-label="Próxima semana"
              disabled={semanasAtras === 0}
              onClick={() => setSemanasAtras((n) => n - 1)}
              className="flex size-12 items-center justify-center rounded-xl active:bg-cartao-2 disabled:opacity-25"
            >
              <IconeVoltar className="rotate-180" />
            </button>
          </div>
          {daSemana.length === 0 ? (
            <p className="py-4 text-center text-sm text-secundario">Nenhuma série nesta semana.</p>
          ) : (
            <BarrasVolume linhas={linhas} />
          )}
        </section>

        <section>
          <h2 className="mb-2 flex items-center gap-2 font-semibold">
            <IconeTrofeu width={20} height={20} className="text-destaque-texto" /> Recordes pessoais
          </h2>
          <p className="mb-3 text-sm text-secundario">Toque num exercício para ver o gráfico.</p>
          <ul className="flex flex-col gap-2">
            {recordes.map((r) => (
              <li key={r.exercicioId}>
                <Link
                  to={`/progresso/${r.exercicioId}`}
                  className="flex min-h-16 items-center gap-3 rounded-xl bg-cartao p-4 active:bg-cartao-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{r.ex?.nome ?? 'Exercício removido'}</p>
                    <p className="text-sm text-secundario">{r.ex?.grupoMuscular}</p>
                  </div>
                  <div className="text-right tabular-nums">
                    {r.cargaMax > 0 ? (
                      <>
                        <p className="font-semibold">
                          {kg(r.cargaMax)} × {r.repsNaCargaMax}
                        </p>
                        <p className="text-sm text-secundario">1RM {num(r.umRm)} kg</p>
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
