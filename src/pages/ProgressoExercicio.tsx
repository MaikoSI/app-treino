import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Cabecalho, Carregando, Cartao, Vazio } from '../components/ui';
import { db } from '../db';
import { useConfig } from '../db/config';
import { historicoDeSeries } from '../db/sessoes';
import { dataCurta, dataLonga, kg, num } from '../lib/formato';
import { recordesPessoais, serieTemporal } from '../lib/progresso';
import { corDoTema, temaEfetivo, useSistemaEscuro } from '../lib/tema';

/**
 * Cores do gráfico, lidas do tema ativo:
 * - carga máxima: laranja de destaque (recordes), linha sólida;
 * - 1RM estimado: cinza secundário, linha TRACEJADA (estimativa). O tracejado e a
 *   legenda garantem que as linhas não se distinguem só pela cor.
 */
function useCoresGrafico() {
  const tema = temaEfetivo(useConfig()?.tema ?? 'sistema', useSistemaEscuro());
  // useMemo com [tema]: as cores são relidas quando o tema muda (inclusive quando o aparelho troca de modo).
  return useMemo(
    () => ({
      tema,
      carga: corDoTema('--destaque'),
      umRm: corDoTema('--secundario'),
      superficie: corDoTema('--cartao'),
      grade: corDoTema('--borda'),
      textoSec: corDoTema('--secundario'),
      texto: corDoTema('--texto'),
      tooltip: corDoTema('--cartao'),
    }),
    [tema],
  );
}

const PERIODOS = [
  { rotulo: '3 meses', dias: 90 },
  { rotulo: '6 meses', dias: 180 },
  { rotulo: '1 ano', dias: 365 },
  { rotulo: 'Tudo', dias: 0 },
];

export default function ProgressoExercicio() {
  const { id } = useParams();
  const exercicioId = Number(id);
  const exercicio = useLiveQuery(async () => (await db.exercicios.get(exercicioId)) ?? null, [exercicioId]);
  const series = useLiveQuery(() => historicoDeSeries(exercicioId), [exercicioId]);
  const [periodo, setPeriodo] = useState(0);
  const cor = useCoresGrafico();

  if (exercicio === undefined || !series) return <Carregando titulo="Exercício" voltar formato="grafico" />;

  const desde = PERIODOS[periodo].dias ? Date.now() - PERIODOS[periodo].dias * 86_400_000 : 0;
  const pontos = serieTemporal(series).filter((p) => p.data >= desde);
  const [rec] = recordesPessoais(series);

  return (
    <>
      <Cabecalho titulo={exercicio?.nome ?? 'Exercício'} voltar />
      <div className="flex flex-col gap-4 px-4 pb-8">
        {!rec ? (
          <Vazio>Nenhum treino com este exercício ainda.</Vazio>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Cartao>
                <p className="text-xs text-secundario">Carga máxima</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{rec.cargaMax > 0 ? `${kg(rec.cargaMax)} × ${rec.repsNaCargaMax}` : '—'}</p>
                <p className="text-xs text-secundario">{dataCurta(rec.dataCarga)}</p>
              </Cartao>
              <Cartao>
                <p className="text-xs text-secundario">1RM estimado</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{rec.umRm > 0 ? kg(rec.umRm) : '—'}</p>
                <p className="text-xs text-secundario">{dataCurta(rec.data1rm)}</p>
              </Cartao>
            </div>

            <Cartao>
              <div className="-mx-1 mb-3 flex gap-1" role="group" aria-label="Período">
                {PERIODOS.map((p, i) => (
                  <button
                    key={p.rotulo}
                    type="button"
                    aria-pressed={periodo === i}
                    onClick={() => setPeriodo(i)}
                    className={`min-h-12 flex-1 rounded-lg text-sm ${periodo === i ? 'bg-cartao-2 font-semibold text-texto' : 'text-secundario'}`}
                  >
                    {p.rotulo}
                  </button>
                ))}
              </div>

              {pontos.length < 2 ? (
                <p className="py-10 text-center text-sm text-secundario">
                  {pontos.length === 0 ? 'Sem treinos neste período.' : 'Faça pelo menos dois treinos para ver a evolução.'}
                </p>
              ) : (
                <div className="h-64" role="img" aria-label={`Gráfico de carga máxima e 1RM estimado de ${exercicio?.nome}`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pontos} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                      <CartesianGrid vertical={false} stroke={cor.grade} />
                      <XAxis
                        dataKey="data"
                        type="number"
                        scale="time"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={dataCurta}
                        tick={{ fill: cor.textoSec, fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={24}
                      />
                      <YAxis
                        domain={['auto', 'auto']}
                        tick={{ fill: cor.textoSec, fontSize: 12 }}
                        tickFormatter={(v: number) => num(v)}
                        axisLine={false}
                        tickLine={false}
                        width={48}
                      />
                      <Tooltip
                        cursor={{ stroke: cor.textoSec, strokeWidth: 1 }}
                        contentStyle={{ background: cor.tooltip, border: `1px solid ${cor.grade}`, borderRadius: 12, color: cor.texto }}
                        labelStyle={{ color: cor.textoSec }}
                        itemStyle={{ color: cor.texto }}
                        labelFormatter={(v) => dataLonga(Number(v))}
                        formatter={(v, nome) => [kg(Number(v)), nome]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 13 }}
                        formatter={(nome) => <span style={{ color: cor.texto }}>{nome}</span>}
                      />
                      <Line
                        name="Carga máxima"
                        type="linear"
                        dataKey="cargaMax"
                        stroke={cor.carga}
                        strokeWidth={2}
                        legendType="line"
                        dot={{ r: 4, fill: cor.carga, stroke: cor.superficie, strokeWidth: 2 }}
                        activeDot={{ r: 6, stroke: cor.superficie, strokeWidth: 2 }}
                        isAnimationActive={false}
                      />
                      <Line
                        name="1RM estimado"
                        type="linear"
                        dataKey="umRm"
                        stroke={cor.umRm}
                        strokeWidth={2}
                        strokeDasharray="6 4"
                        legendType="plainline"
                        dot={{ r: 4, fill: cor.umRm, stroke: cor.superficie, strokeWidth: 2 }}
                        activeDot={{ r: 6, stroke: cor.superficie, strokeWidth: 2 }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Cartao>

            {/* Tabela: os mesmos dados do gráfico, em texto */}
            <Cartao>
              <h2 className="mb-2 font-semibold">Treinos</h2>
              <table className="w-full text-sm tabular-nums">
                <thead className="text-secundario">
                  <tr>
                    <th className="py-1 text-left font-normal">Data</th>
                    <th className="py-1 text-right font-normal">Carga máx.</th>
                    <th className="py-1 text-right font-normal">1RM est.</th>
                  </tr>
                </thead>
                <tbody>
                  {[...pontos].reverse().map((p) => (
                    <tr key={p.sessaoId} className="border-t border-borda">
                      <td className="py-2">{dataCurta(p.data)}</td>
                      <td className="py-2 text-right">{kg(p.cargaMax)}</td>
                      <td className="py-2 text-right">{kg(p.umRm)}</td>
                    </tr>
                  ))}
                  {pontos.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-3 text-center text-secundario">
                        Sem treinos com carga neste período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Cartao>
          </>
        )}
      </div>
    </>
  );
}
