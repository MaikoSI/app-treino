import { useLiveQuery } from 'dexie-react-hooks';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { CalculadoraAnilhas } from '../components/CalculadoraAnilhas';
import { Comemoracao } from '../components/Comemoracao';
import { BarraDescanso, useDescanso } from '../components/Descanso';
import { IconeCheck, IconeMais, IconeMenu } from '../components/Icones';
import { MapaMuscular } from '../components/MapaMuscular';
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
  treinosPorExercicio,
  trocarExercicioNoTreino,
  ultimasSeries,
} from '../db/sessoes';
import type { Exercicio, SessaoSerie } from '../db/tipos';
import { detectarRecordes, estagnado, type SerieFeita, sugestaoProgressao, TREINOS_ESTAGNACAO } from '../lib/forca';
import { duracao, kg, lerNumero, num, rotuloRir } from '../lib/formato';
import { ROTULO_AJUSTE } from '../lib/metas';
import { agruparPorExercicio, type GrupoExercicio } from '../lib/treino';

type Acao = { tipo: 'menu' | 'trocar' | 'anilhas' | 'musculos'; grupo: GrupoExercicio<SessaoSerie> };

export default function Treino() {
  const config = useConfig();
  const exercicios = useExerciciosMap();
  const sessao = useLiveQuery(async () => (await sessaoEmAndamento()) ?? null, []);
  const sessaoId = sessao?.id;
  const series = useLiveQuery(async () => (sessaoId ? seriesDaSessao(sessaoId) : []), [sessaoId]);

  // Histórico dos exercícios deste treino: última vez (pré-preenchimento/dica) e melhores marcas.
  const chaveIds = [...new Set((series ?? []).map((s) => s.exercicioId))].sort().join(',');
  const historico = useLiveQuery(async () => {
    if (!sessao || !chaveIds)
      return { ultimas: new Map<number, SessaoSerie[]>(), anteriores: [] as SerieFeita[], estagnados: new Set<number>() };
    const ids = chaveIds.split(',').map(Number);
    const ultimas = new Map(await Promise.all(ids.map(async (id) => [id, await ultimasSeries(id, sessao.id)] as const)));
    const treinos = await treinosPorExercicio(ids, sessao.id);
    const estagnados = new Set(ids.filter((id) => estagnado(treinos.get(id) ?? [])));
    return { ultimas, anteriores: await seriesAnteriores(sessao.inicio, ids), estagnados };
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
  if (!sessao || !series || !config || !exercicios) return <Carregando formato="treino" />;

  const grupos = agruparPorExercicio(series);
  const feitas = series.filter((s) => s.concluida).length;

  return (
    <div className={descanso.estado ? 'pb-40' : 'pb-10'}>
      <header className="pt-seguro sticky top-0 z-20 vidro">
        <div className="flex min-h-16 items-center gap-3 px-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-2xl leading-tight font-semibold">{sessao.nomeDia}</p>
            <p className="text-sm text-secundario">
              <span className="text-base font-semibold text-destaque-texto tabular-nums">
                <Relogio desde={sessao.inicio} />
              </span>
              <span className="mx-1.5" aria-hidden="true">
                ·
              </span>
              <span className="tabular-nums">
                {feitas} de {series.length} séries
              </span>
            </p>
            {sessao.ajuste && sessao.ajuste !== 'normal' && <p className="text-sm text-secundario">{ROTULO_AJUSTE[sessao.ajuste]}</p>}
          </div>
          <Botao variante="primario" onClick={() => setFinalizando(true)}>
            Finalizar
          </Botao>
        </div>
        {/* Progresso do treino: séries feitas / total */}
        <div className="h-1 bg-trilho" aria-hidden="true">
          <div
            className="h-full bg-concluido transition-[width] duration-300"
            style={{ width: `${series.length ? (feitas / series.length) * 100 : 0}%` }}
          />
        </div>
      </header>

      <div className="flex flex-col gap-4 px-4 pt-4">
        {grupos.map((g) => (
          <CartaoExercicio
            key={g.ordem}
            grupo={g}
            exercicio={exercicios.get(g.exercicioId)}
            ultimas={historico?.ultimas.get(g.exercicioId) ?? []}
            mostrarRir={config.mostrarRir}
            estagnado={historico?.estagnados.has(g.exercicioId) ?? false}
            aoMarcar={marcar}
            aoMenu={() => setAcao({ tipo: 'menu', grupo: g })}
            aoTrocar={() => setAcao({ tipo: 'trocar', grupo: g })}
            aoAddSerie={() => adicionarSerie(sessao.id, g.ordem)}
            aoRemoverSerie={() => removerUltimaSerie(sessao.id, g.ordem)}
          />
        ))}

        {grupos.length === 0 && <p className="py-6 text-center text-secundario">Adicione o primeiro exercício.</p>}

        <Botao grande onClick={() => setAdicionando(true)}>
          <IconeMais /> Adicionar exercício
        </Botao>
      </div>

      {/* Menu do exercício */}
      <Painel
        aberto={acao?.tipo === 'menu'}
        aoFechar={() => setAcao(null)}
        titulo={acao ? (exercicios.get(acao.grupo.exercicioId)?.nome ?? '') : ''}
      >
        {acao && (
          <div className="flex flex-col gap-2">
            <Botao onClick={() => setAcao({ ...acao, tipo: 'musculos' })}>Músculos trabalhados</Botao>
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

      <Painel
        aberto={acao?.tipo === 'musculos'}
        aoFechar={() => setAcao(null)}
        titulo={acao ? (exercicios.get(acao.grupo.exercicioId)?.nome ?? '') : ''}
      >
        {acao && exercicios.get(acao.grupo.exercicioId) && <MapaMuscular exercicio={exercicios.get(acao.grupo.exercicioId)!} />}
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
  mostrarRir,
  estagnado,
  aoMarcar,
  aoMenu,
  aoTrocar,
  aoAddSerie,
  aoRemoverSerie,
}: {
  grupo: GrupoExercicio<SessaoSerie>;
  exercicio: Exercicio | undefined;
  ultimas: SessaoSerie[];
  mostrarRir: boolean;
  estagnado: boolean;
  aoMarcar: (s: SessaoSerie) => void;
  aoMenu: () => void;
  aoTrocar: () => void;
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
    <section className={`rounded-cartao vidro-fino p-4 ${todasFeitas ? 'ring-1 ring-concluido/40' : ''}`}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl leading-tight font-semibold">{exercicio?.nome ?? 'Exercício removido'}</h2>
          <p className="text-sm text-secundario">
            Meta: {meta.repsMin === meta.repsMax ? meta.repsMax : `${meta.repsMin}–${meta.repsMax}`} reps · descanso{' '}
            {duracao(meta.descansoSeg * 1000)}
          </p>
          {ultimas.length > 0 && (
            <p className="mt-0.5 text-sm text-secundario tabular-nums">
              Última vez: {ultimas.map((s) => `${num(s.carga)}×${s.reps}`).join(' · ')}
            </p>
          )}
        </div>
        <button
          type="button"
          aria-label="Opções do exercício"
          onClick={aoMenu}
          className="-mr-2 flex size-12 shrink-0 items-center justify-center rounded-xl active:bg-cartao-2"
        >
          <IconeMenu />
        </button>
      </div>

      {dica && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-primaria/10 px-3 py-2">
          <p className="flex-1 text-sm text-primaria-texto">
            <strong>Tente +{num(dica.incremento)} kg</strong> — você bateu {meta.repsMax} reps em todas as séries.
          </p>
          {dicaAplicavel && (
            <button
              type="button"
              className="min-h-12 rounded-lg bg-primaria px-3 text-sm font-semibold text-sobre-primaria"
              onClick={() => {
                for (const s of pendentes) void atualizarSerie(s.id, { carga: dica.novaCarga });
              }}
            >
              Usar {num(dica.novaCarga)}
            </button>
          )}
        </div>
      )}

      {estagnado && !dica && (
        <div className="mt-3 rounded-xl bg-cartao-2 px-3 py-2 text-sm">
          <p>
            <strong>Sem progresso nos últimos {TREINOS_ESTAGNACAO} treinos.</strong>{' '}
            <span className="text-secundario">
              Confira sono, alimentação e fadiga. Se continuar, troque por uma variação ou faça uma semana leve (na tela Início).
            </span>
          </p>
          <button type="button" onClick={aoTrocar} className="mt-1 min-h-12 font-semibold text-primaria-texto">
            Trocar por uma variação
          </button>
        </div>
      )}

      <div
        className={`mt-3 grid items-center gap-2 text-xs text-secundario ${mostrarRir ? 'grid-cols-[2rem_1fr_1fr_3.5rem_3.5rem]' : 'grid-cols-[2rem_1fr_1fr_3.5rem]'}`}
      >
        <span className="text-center">Série</span>
        <span className="text-center">kg</span>
        <span className="text-center">Reps</span>
        {mostrarRir && (
          <span className="text-center" title="Repetições em reserva">
            RIR
          </span>
        )}
        <span className="text-center">Feita</span>
      </div>
      <ol className="mt-1 flex flex-col gap-1.5">
        {series.map((s, i) => (
          <LinhaSerie key={s.id} serie={s} indice={i + 1} mostrarRir={mostrarRir} aoMarcar={aoMarcar} />
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
  mostrarRir,
  aoMarcar,
}: {
  serie: SessaoSerie;
  indice: number;
  mostrarRir: boolean;
  aoMarcar: (s: SessaoSerie) => void;
}) {
  const feita = serie.concluida;
  return (
    <li
      className={`grid items-center gap-2 rounded-xl px-1 py-1 ${feita ? 'bg-concluido/15' : ''} ${
        mostrarRir ? 'grid-cols-[2rem_1fr_1fr_3.5rem_3.5rem]' : 'grid-cols-[2rem_1fr_1fr_3.5rem]'
      }`}
    >
      <span className={`text-center text-xl font-semibold ${feita ? 'text-texto' : 'text-secundario'}`}>{indice}</span>
      <CampoNumero
        valor={serie.carga}
        decimal
        rotulo={`Carga da série ${indice}`}
        aoMudar={(carga) => atualizarSerie(serie.id, { carga })}
      />
      <CampoNumero
        valor={serie.reps}
        rotulo={`Repetições da série ${indice}`}
        aoMudar={(reps) => atualizarSerie(serie.id, { reps: Math.round(reps) })}
      />
      {mostrarRir && (
        <select
          aria-label={`Repetições em reserva da série ${indice}`}
          value={serie.rir ?? ''}
          onChange={(e) => atualizarSerie(serie.id, { rir: e.target.value === '' ? null : Number(e.target.value) })}
          className="h-12 w-full min-w-0 appearance-none rounded-xl bg-cartao-2 text-center text-2xl font-semibold tabular-nums outline-none focus:ring-2 focus:ring-primaria"
        >
          <option value="">–</option>
          {[0, 1, 2, 3, 4, 5].map((r) => (
            <option key={r} value={r}>
              {rotuloRir(r)}
            </option>
          ))}
        </select>
      )}
      {/* biome-ignore lint/a11y/useSemanticElements: botão grande de marcar série no padrão ARIA checkbox (alvo de toque de 48px) */}
      <button
        type="button"
        role="checkbox"
        aria-checked={feita}
        aria-label={`Série ${indice} feita`}
        onClick={() => aoMarcar(serie)}
        className={`pressionavel flex h-12 w-full items-center justify-center rounded-controle ${feita ? 'bg-concluido text-sobre-concluido' : 'bg-cartao-2 text-secundario'}`}
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: só ressincroniza quando o valor salvo muda (formatar é recriado a cada render)
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
      className="h-12 w-full min-w-0 rounded-xl bg-cartao-2 text-center text-2xl font-semibold tabular-nums outline-none focus:ring-2 focus:ring-primaria"
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
          <p className="text-secundario">Nenhuma série foi marcada como feita. Marque as séries ou descarte o treino.</p>
        ) : (
          <>
            <p>
              <strong>{feitas}</strong> {feitas === 1 ? 'série feita' : 'séries feitas'}.
              {faltam > 0 && <span className="text-secundario"> As {faltam} não marcadas serão descartadas.</span>}
            </p>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-secundario">Observação (opcional)</span>
              <textarea
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                rows={2}
                className="rounded-xl bg-cartao-2 p-3 text-base outline-none focus:ring-2 focus:ring-primaria"
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
