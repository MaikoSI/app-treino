import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Cabecalho, Carregando, Cartao, Vazio } from '../components/ui';
import { db } from '../db';
import { historicoDeSeries } from '../db/sessoes';
import { dataCurta, dataLonga, kg, num } from '../lib/formato';
import { recordesPessoais, serieTemporal } from '../lib/progresso';

// Validadas para o fundo escuro (faixa de luminosidade, daltonismo e contraste).
const COR_CARGA = '#3987e5';
const COR_1RM = '#d95926';
const SUPERFICIE = '#161618';

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

  if (exercicio === undefined || !series) return <Carregando />;

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
                <p className="text-xs text-suave">Carga máxima</p>
                <p className="mt-1 text-xl font-bold tabular-nums">{rec.cargaMax > 0 ? `${kg(rec.cargaMax)} × ${rec.repsNaCargaMax}` : '—'}</p>
                <p className="text-xs text-suave">{dataCurta(rec.dataCarga)}</p>
              </Cartao>
              <Cartao>
                <p className="text-xs text-suave">1RM estimado</p>
                <p className="mt-1 text-xl font-bold tabular-nums">{rec.umRm > 0 ? kg(rec.umRm) : '—'}</p>
                <p className="text-xs text-suave">{dataCurta(rec.data1rm)}</p>
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
                    className={`min-h-10 flex-1 rounded-lg text-sm ${periodo === i ? 'bg-superficie-2 font-semibold text-texto' : 'text-suave'}`}
                  >
                    {p.rotulo}
                  </button>
                ))}
              </div>

              {pontos.length < 2 ? (
                <p className="py-10 text-center text-sm text-suave">
                  {pontos.length === 0 ? 'Sem treinos neste período.' : 'Faça pelo menos dois treinos para ver a evolução.'}
                </p>
              ) : (
                <div className="h-64" role="img" aria-label={`Gráfico de carga máxima e 1RM estimado de ${exercicio?.nome}`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pontos} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                      <CartesianGrid vertical={false} stroke="#2c2c30" />
                      <XAxis
                        dataKey="data"
                        type="number"
                        scale="time"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={dataCurta}
                        tick={{ fill: '#a1a1aa', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={24}
                      />
                      <YAxis
                        domain={['auto', 'auto']}
                        tick={{ fill: '#a1a1aa', fontSize: 12 }}
                        tickFormatter={(v: number) => num(v)}
                        axisLine={false}
                        tickLine={false}
                        width={48}
                      />
                      <Tooltip
                        cursor={{ stroke: '#a1a1aa', strokeWidth: 1 }}
                        contentStyle={{ background: '#212124', border: '1px solid #2c2c30', borderRadius: 12, color: '#f4f4f5' }}
                        labelStyle={{ color: '#a1a1aa' }}
                        itemStyle={{ color: '#f4f4f5' }}
                        labelFormatter={(v) => dataLonga(Number(v))}
                        formatter={(v, nome) => [kg(Number(v)), nome]}
                      />
                      <Legend wrapperStyle={{ fontSize: 13, color: '#f4f4f5' }} iconType="circle" />
                      <Line
                        name="Carga máxima"
                        type="linear"
                        dataKey="cargaMax"
                        stroke={COR_CARGA}
                        strokeWidth={2}
                        dot={{ r: 4, fill: COR_CARGA, stroke: SUPERFICIE, strokeWidth: 2 }}
                        activeDot={{ r: 6, stroke: SUPERFICIE, strokeWidth: 2 }}
                        isAnimationActive={false}
                      />
                      <Line
                        name="1RM estimado"
                        type="linear"
                        dataKey="umRm"
                        stroke={COR_1RM}
                        strokeWidth={2}
                        dot={{ r: 4, fill: COR_1RM, stroke: SUPERFICIE, strokeWidth: 2 }}
                        activeDot={{ r: 6, stroke: SUPERFICIE, strokeWidth: 2 }}
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
                <thead className="text-suave">
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
                      <td colSpan={3} className="py-3 text-center text-suave">
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
