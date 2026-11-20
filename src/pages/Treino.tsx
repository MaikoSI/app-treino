import { useLiveQuery } from 'dexie-react-hooks';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { CalculadoraAnilhas } from '../components/CalculadoraAnilhas';
import { Comemoracao } from '../components/Comemoracao';
import { BarraDescanso, useDescanso } from '../components/Descanso';
import { IconeCheck, IconeMais, IconeMenu } from '../components/Icones';
import { SeletorExercicio } from '../components/SeletorExercicio';
import { Botao, Carregando, Painel } from '../components/ui';
import { useConfig } from '../db/config';
import { useExerciciosMap } from '../db/hooks';
import {
  adicionarExercicioNoTreino,
  adicionarSerie,
  atualizarSerie,
  excluirSessao,
  finalizarTreino,
  removerExercicioDoTreino,
  removerUltimaSerie,
  seriesAnteriores,
  seriesDaSessao,
  sessaoEmAndamento,
  trocarExercicioNoTreino,
  ultimasSeries,
} from '../db/sessoes';
import type { Exercicio, SessaoSerie } from '../db/tipos';
import { detectarRecordes, sugestaoProgressao, type SerieFeita } from '../lib/forca';
import { duracao, kg, lerNumero, num } from '../lib/formato';
import { agruparPorExercicio, type GrupoExercicio } from '../lib/treino';

type Acao = { tipo: 'menu' | 'trocar' | 'anilhas'; grupo: GrupoExercicio<SessaoSerie> };

export default function Treino() {
  const config = useConfig();
  const exercicios = useExerciciosMap();
  const sessao = useLiveQuery(async () => (await sessaoEmAndamento()) ?? null, []);
  const sessaoId = sessao?.id;
  const series = useLiveQuery(async () => (sessaoId ? seriesDaSessao(sessaoId) : []), [sessaoId]);

  // Histórico dos exercícios deste treino: última vez (pré-preenchimento/dica) e melhores marcas.
  const chaveIds = [...new Set((series ?? []).map((s) => s.exercicioId))].sort().join(',');
  const historico = useLiveQuery(async () => {
    if (!sessao || !chaveIds) return { ultimas: new Map<number, SessaoSerie[]>(), anteriores: [] as SerieFeita[] };
    const ids = chaveIds.split(',').map(Number);
    const ultimas = new Map(await Promise.all(ids.map(async (id) => [id, await ultimasSeries(id, sessao.id)] as const)));
    return { ultimas, anteriores: await seriesAnteriores(sessao.inicio, ids) };
  }, [sessaoId, chaveIds]);

  const descanso = useDescanso();
  const [acao, setAcao] = useState<Acao | null>(null);
  const [adicionando, setAdicionando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [festa, setFesta] = useState<string | null>(null);
  const [finalizadoId, setFinalizadoId] = useState<number | null>(null);
  const acabarFesta = useCallback(() => setFesta(null), []);

  useManterTelaLigada();

  // Ref para o callback de marcar não mudar a cada render (linhas memoizadas).
  const estadoRef = useRef({ series, historico, descanso });
  estadoRef.current = { series, historico, descanso };

  const marcar = useCallback(async (s: SessaoSerie) => {
    const { series, historico, descanso } = estadoRef.current;
    const concluida = !s.concluida;
    await atualizarSerie(s.id, { concluida });
    if (!concluida) return;
    descanso.iniciar(s.descansoSeg);

    // Recorde? Só conta se já existe histórico do exercício.
    const anteriores = historico?.anteriores.filter((a) => a.exercicioId === s.exercicioId) ?? [];
    if (anteriores.length === 0 || s.carga <= 0) return;
    const desteTreino = (series ?? []).filter((x) => x.concluida && x.id !== s.id && x.exercicioId === s.exercicioId);
    const rec = detectarRecordes([s], [...anteriores, ...desteTreino]);
    if (rec.some((r) => r.tipo === 'carga')) setFesta(`Recorde: ${kg(s.carga)}!`);
    else if (rec.length) setFesta('Recorde de 1RM estimado!');
  }, []);

  if (finalizadoId) return <Navigate to={`/resumo/${finalizadoId}`} replace />;
  if (sessao === null) return <Navigate to="/" replace />;
  if (!sessao || !series || !config || !exercicios) return <Carregando />;

  const grupos = agruparPorExercicio(series);
  const feitas = series.filter((s) => s.concluida).length;

  return (
    <div className={descanso.estado ? 'pb-36' : 'pb-10'}>
      <header className="pt-seguro sticky top-0 z-20 border-b border-borda bg-fundo/95 backdrop-blur">
        <div className="flex min-h-16 items-center gap-3 px-4">
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{sessao.nomeDia}</p>
            <p className="text-sm text-suave tabular-nums">
              <Relogio desde={sessao.inicio} /> · {feitas}/{series.length} séries
            </p>
          </div>
          <Botao variante="primario" onClick={() => setFinalizando(true)}>
            Finalizar
          </Botao>
        </div>
      </header>

      <div className="flex flex-col gap-4 px-4 pt-4">
        {grupos.map((g) => (
          <CartaoExercicio
            key={g.ordem}
            grupo={g}
            exercicio={exercicios.get(g.exercicioId)}
            ultimas={historico?.ultimas.get(g.exercicioId) ?? []}
            mostrarRpe={config.mostrarRpe}
            aoMarcar={marcar}
            aoMenu={() => setAcao({ tipo: 'menu', grupo: g })}
            aoAddSerie={() => adicionarSerie(sessao.id, g.ordem)}
            aoRemoverSerie={() => removerUltimaSerie(sessao.id, g.ordem)}
          />
        ))}

        {grupos.length === 0 && <p className="py-6 text-center text-suave">Adicione o primeiro exercício.</p>}

        <Botao grande onClick={() => setAdicionando(true)}>
          <IconeMais /> Adicionar exercício
        </Botao>
      </div>

      {/* Menu do exercício */}
      <Painel aberto={acao?.tipo === 'menu'} aoFechar={() => setAcao(null)} titulo={acao ? exercicios.get(acao.grupo.exercicioId)?.nome ?? '' : ''}>
        {acao && (
          <div className="flex flex-col gap-2">
            <Botao onClick={() => setAcao({ ...acao, tipo: 'anilhas' })}>Calculadora de anilhas</Botao>
            <Botao onClick={() => setAcao({ ...acao, tipo: 'trocar' })}>Trocar exercício</Botao>
            <Botao
              variante="perigo"
              onClick={async () => {
                if (!confirm('Remover este exercício do treino?')) return;
                await removerExercicioDoTreino(sessao.id, acao.grupo.ordem);
                setAcao(null);
              }}
            >
              Remover exercício
            </Botao>
          </div>
        )}
      </Painel>

      <Painel aberto={acao?.tipo === 'anilhas'} aoFechar={() => setAcao(null)} titulo="Calculadora de anilhas">
        {acao && <CalculadoraAnilhas cargaInicial={Math.max(...acao.grupo.series.map((s) => s.carga), 20)} />}
      </Painel>

      <SeletorExercicio
        aberto={acao?.tipo === 'trocar'}
        titulo="Trocar por"
        aoFechar={() => setAcao(null)}
        aoEscolher={async (ex) => {
          if (acao) await trocarExercicioNoTreino(sessao.id, acao.grupo.ordem, ex.id);
          setAcao(null);
        }}
      />

      <SeletorExercicio
        aberto={adicionando}
        titulo="Adicionar exercício"
        aoFechar={() => setAdicionando(false)}
        aoEscolher={async (ex) => {
          await adicionarExercicioNoTreino(sessao.id, ex.id);
          setAdicionando(false);
          setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
        }}
      />

      <PainelFinalizar
        aberto={finalizando}
        aoFechar={() => setFinalizando(false)}
        feitas={feitas}
        total={series.length}
        aoFinalizar={async (obs) => {
          if (await finalizarTreino(sessao.id, obs)) {
            descanso.pular();
            setFinalizadoId(sessao.id);
          }
        }}
        aoDescartar={async () => {
          if (!confirm('Descartar este treino? Nada dele será salvo.')) return;
          descanso.pular();
          await excluirSessao(sessao.id);
        }}
      />

      <BarraDescanso estado={descanso.estado} aoAjustar={descanso.ajustar} aoPular={descanso.pular} aoTerminar={descanso.terminou} />
      {festa && <Comemoracao texto={festa} aoAcabar={acabarFesta} />}
    </div>
  );
}

function Relogio({ desde }: { desde: number }) {
  const [agora, setAgora] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return <>{duracao(agora - desde)}</>;
}

/** Pede para a tela não apagar durante o treino (onde o navegador suporta). */
function useManterTelaLigada() {
  useEffect(() => {
    let trava: WakeLockSentinel | null = null;
    const pedir = async () => {
      try {
        if (document.visibilityState === 'visible') trava = await navigator.wakeLock?.request('screen');
      } catch {
        /* sem suporte ou negado */
      }
    };
    void pedir();
    document.addEventListener('visibilitychange', pedir);
    return () => {
      document.removeEventListener('visibilitychange', pedir);
      void trava?.release().catch(() => {});
    };
  }, []);
}

const CartaoExercicio = memo(function CartaoExercicio({
  grupo,
  exercicio,
  ultimas,
  mostrarRpe,
  aoMarcar,
  aoMenu,
  aoAddSerie,
  aoRemoverSerie,
}: {
  grupo: GrupoExercicio<SessaoSerie>;
  exercicio: Exercicio | undefined;
  ultimas: SessaoSerie[];
  mostrarRpe: boolean;
  aoMarcar: (s: SessaoSerie) => void;
  aoMenu: () => void;
  aoAddSerie: () => void;
  aoRemoverSerie: () => void;
}) {
  const { series } = grupo;
  const meta = series[0];
  const dica = exercicio ? sugestaoProgressao(ultimas, exercicio.grupoMuscular) : null;
  const pendentes = series.filter((s) => !s.concluida);
  const dicaAplicavel = dica && pendentes.some((s) => s.carga < dica.novaCarga);
  const todasFeitas = pendentes.length === 0;

  return (
    <section className={`rounded-2xl bg-superficie p-4 ${todasFeitas ? 'ring-1 ring-acento/40' : ''}`}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold leading-tight">{exercicio?.nome ?? 'Exercício removido'}</h2>
          <p className="text-sm text-suave">
            Meta: {meta.repsMin === meta.repsMax ? meta.repsMax : `${meta.repsMin}–${meta.repsMax}`} reps · descanso {meta.descansoSeg}s
          </p>
          {ultimas.length > 0 && (
            <p className="mt-0.5 text-sm text-suave tabular-nums">
              Última vez: {ultimas.map((s) => `${num(s.carga)}×${s.reps}`).join(' · ')}
            </p>
          )}
        </div>
        <button
          type="button"
          aria-label="Opções do exercício"
          onClick={aoMenu}
          className="-mr-2 flex size-12 shrink-0 items-center justify-center rounded-xl active:bg-superficie-2"
        >
          <IconeMenu />
        </button>
      </div>

      {dica && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-acento/10 px-3 py-2">
          <p className="flex-1 text-sm text-acento">
            <strong>Tente +{num(dica.incremento)} kg</strong> — você bateu {meta.repsMax} reps em todas as séries.
          </p>
          {dicaAplicavel && (
            <button
              type="button"
              className="min-h-10 rounded-lg bg-acento px-3 text-sm font-semibold text-black"
              onClick={() => pendentes.forEach((s) => atualizarSerie(s.id, { carga: dica.novaCarga }))}
            >
              Usar {num(dica.novaCarga)}
            </button>
          )}
        </div>
      )}

      <div className={`mt-3 grid items-center gap-2 text-xs text-suave ${mostrarRpe ? 'grid-cols-[2rem_1fr_1fr_3.5rem_3.5rem]' : 'grid-cols-[2rem_1fr_1fr_3.5rem]'}`}>
        <span className="text-center">Série</span>
        <span className="text-center">kg</span>
        <span className="text-center">Reps</span>
        {mostrarRpe && <span className="text-center">RPE</span>}
        <span className="text-center">Feita</span>
      </div>
      <ol className="mt-1 flex flex-col gap-1.5">
        {series.map((s, i) => (
          <LinhaSerie key={s.id} serie={s} indice={i + 1} mostrarRpe={mostrarRpe} aoMarcar={aoMarcar} />
        ))}
      </ol>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Botao variante="fantasma" onClick={aoRemoverSerie} disabled={series.length <= 1}>
          − Série
        </Botao>
        <Botao variante="fantasma" onClick={aoAddSerie}>
          + Série
        </Botao>
      </div>
    </section>
  );
});

const LinhaSerie = memo(function LinhaSerie({
  serie,
  indice,
  mostrarRpe,
  aoMarcar,
}: {
  serie: SessaoSerie;
  indice: number;
  mostrarRpe: boolean;
  aoMarcar: (s: SessaoSerie) => void;
}) {
  const feita = serie.concluida;
  return (
    <li
      className={`grid items-center gap-2 rounded-xl px-1 py-1 ${feita ? 'bg-acento/15' : ''} ${
        mostrarRpe ? 'grid-cols-[2rem_1fr_1fr_3.5rem_3.5rem]' : 'grid-cols-[2rem_1fr_1fr_3.5rem]'
      }`}
    >
      <span className="text-center font-semibold text-suave">{indice}</span>
      <CampoNumero valor={serie.carga} decimal rotulo={`Carga da série ${indice}`} aoMudar={(carga) => atualizarSerie(serie.id, { carga })} />
      <CampoNumero valor={serie.reps} rotulo={`Repetições da série ${indice}`} aoMudar={(reps) => atualizarSerie(serie.id, { reps: Math.round(reps) })} />
      {mostrarRpe && (
        <CampoNumero
          valor={serie.rpe ?? 0}
          vazioSeZero
          decimal
          rotulo={`RPE da série ${indice}`}
          aoMudar={(rpe) => atualizarSerie(serie.id, { rpe: rpe > 0 ? Math.min(10, rpe) : null })}
        />
      )}
      <button
        type="button"
        role="checkbox"
        aria-checked={feita}
        aria-label={`Série ${indice} feita`}
        onClick={() => aoMarcar(serie)}
        className={`flex h-12 w-full items-center justify-center rounded-xl ${feita ? 'bg-acento text-black' : 'bg-superficie-2 text-suave active:bg-borda'}`}
      >
        <IconeCheck />
      </button>
    </li>
  );
});

/**
 * Campo numérico que aceita vírgula e salva a cada digitação.
 * Mantém o texto digitado enquanto está em foco (ex.: "2," no meio de "2,5").
 */
function CampoNumero({
  valor,
  aoMudar,
  rotulo,
  decimal,
  vazioSeZero,
}: {
  valor: number;
  aoMudar: (v: number) => void;
  rotulo: string;
  decimal?: boolean;
  vazioSeZero?: boolean;
}) {
  const formatar = (v: number) => (vazioSeZero && v === 0 ? '' : num(v));
  const [texto, setTexto] = useState(formatar(valor));
  const focado = useRef(false);

  useEffect(() => {
    if (!focado.current) setTexto(formatar(valor));
  }, [valor]);

  return (
    <input
      aria-label={rotulo}
      inputMode={decimal ? 'decimal' : 'numeric'}
      value={texto}
      onFocus={(e) => {
        focado.current = true;
        e.target.select();
      }}
      onBlur={() => {
        focado.current = false;
        setTexto(formatar(valor));
      }}
      onChange={(e) => {
        const t = e.target.value.replace(/[^\d.,]/g, '');
        setTexto(t);
        aoMudar(Math.max(0, lerNumero(t)));
      }}
      className="h-12 w-full min-w-0 rounded-xl bg-superficie-2 text-center text-lg font-semibold tabular-nums outline-none focus:ring-2 focus:ring-acento"
    />
  );
}

function PainelFinalizar({
  aberto,
  aoFechar,
  feitas,
  total,
  aoFinalizar,
  aoDescartar,
}: {
  aberto: boolean;
  aoFechar: () => void;
  feitas: number;
  total: number;
  aoFinalizar: (observacao: string) => void;
  aoDescartar: () => void;
}) {
  const [obs, setObs] = useState('');
  const faltam = total - feitas;
  return (
    <Painel aberto={aberto} aoFechar={aoFechar} titulo="Finalizar treino">
      <div className="flex flex-col gap-3">
        {feitas === 0 ? (
          <p className="text-suave">Nenhuma série foi marcada como feita. Marque as séries ou descarte o treino.</p>
        ) : (
          <>
            <p>
              <strong>{feitas}</strong> {feitas === 1 ? 'série feita' : 'séries feitas'}.
              {faltam > 0 && <span className="text-suave"> As {faltam} não marcadas serão descartadas.</span>}
            </p>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-suave">Observação (opcional)</span>
              <textarea
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                rows={2}
                className="rounded-xl bg-superficie-2 p-3 text-base outline-none focus:ring-2 focus:ring-acento"
                placeholder="Como foi o treino?"
              />
            </label>
            <Botao variante="primario" grande onClick={() => aoFinalizar(obs.trim())}>
              Finalizar e ver resumo
            </Botao>
          </>
        )}
        <Botao onClick={aoFechar}>Continuar treinando</Botao>
        <Botao variante="perigo" onClick={aoDescartar}>
          Descartar treino
        </Botao>
      </div>
    </Painel>
  );
}
