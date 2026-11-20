import { useLiveQuery } from 'dexie-react-hooks';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { IconeTrofeu, IconeVoltar } from '../components/Icones';
import { Cabecalho, Carregando, Vazio } from '../components/ui';
import { useExerciciosMap } from '../db/hooks';
import { historicoDeSeries } from '../db/sessoes';
import { dataCurta, kg, num } from '../lib/formato';
import { faixaVolume, recordesPessoais, seriesPorGrupo, VOLUME_IDEAL_MAX, VOLUME_IDEAL_MIN, type FaixaVolume } from '../lib/progresso';
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
  // Escala fixa até pelo menos 24 séries, para as marcas de 10 e 20 ficarem sempre no mesmo lugar.
  const escala = Math.max(24, ...porGrupo.map((g) => g.series));
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
          {porGrupo.length === 0 ? (
            <p className="py-4 text-center text-sm text-secundario">Nenhuma série nesta semana.</p>
          ) : (
            <>
              <ul className="mt-2 flex flex-col gap-2.5">
                {porGrupo.map((g) => {
                  const faixa = faixaVolume(g.series);
                  return (
                    <li key={g.grupo} className="grid grid-cols-[6rem_1fr_4.5rem] items-center gap-2 text-sm">
                      <span className="truncate">{g.grupo}</span>
                      <span className="relative h-3 rounded-full bg-trilho">
                        <span
                          className={`block h-full rounded-full ${COR_FAIXA[faixa]}`}
                          style={{ width: `${(Math.min(g.series, escala) / escala) * 100}%` }}
                        />
                        {[VOLUME_IDEAL_MIN, VOLUME_IDEAL_MAX].map((m) => (
                          <span key={m} aria-hidden="true" className="absolute -inset-y-1 w-px bg-secundario/60" style={{ left: `${(m / escala) * 100}%` }} />
                        ))}
                      </span>
                      <span className="text-right tabular-nums">
                        <strong>{g.series}</strong> <span className={`text-xs ${TEXTO_FAIXA[faixa]}`}>{ROTULO_FAIXA[faixa]}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-secundario">
                <Legenda cor="bg-volume-baixo">abaixo de {VOLUME_IDEAL_MIN}</Legenda>
                <Legenda cor="bg-volume-ideal">
                  ideal {VOLUME_IDEAL_MIN}–{VOLUME_IDEAL_MAX}
                </Legenda>
                <Legenda cor="bg-volume-alto">alto, acima de {VOLUME_IDEAL_MAX}</Legenda>
              </p>
              <p className="mt-1 text-xs text-secundario">Séries feitas por músculo na semana. As marcas na barra indicam 10 e 20.</p>
            </>
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

const COR_FAIXA: Record<FaixaVolume, string> = { baixo: 'bg-volume-baixo', ideal: 'bg-volume-ideal', alto: 'bg-volume-alto' };
const TEXTO_FAIXA: Record<FaixaVolume, string> = { baixo: 'text-secundario', ideal: 'text-primaria-texto', alto: 'text-alerta-texto' };
const ROTULO_FAIXA: Record<FaixaVolume, string> = { baixo: 'abaixo', ideal: 'ideal', alto: 'alto' };

function Legenda({ cor, children }: { cor: string; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span aria-hidden="true" className={`size-2.5 rounded-full ${cor}`} />
      {children}
    </span>
  );
}
