import { useLiveQuery } from 'dexie-react-hooks';
import { useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IconeBaixo, IconeCima, IconeLixo, IconeMais } from '../components/Icones';
import { SeletorExercicio } from '../components/SeletorExercicio';
import { Botao, Cabecalho, Carregando, Cartao, Contador, Painel, Vazio } from '../components/ui';
import { db } from '../db';
import { useExerciciosMap } from '../db/hooks';
import {
  adicionarDia,
  adicionarExercicioAoDia,
  definirAtivo,
  diasDoPrograma,
  excluirDia,
  exerciciosDoDia,
  salvarOrdem,
} from '../db/programas';
import type { Exercicio, ProgramaDia, ProgramaExercicio } from '../db/tipos';
import { mover } from '../lib/programa';

const campo = 'min-h-12 w-full rounded-xl bg-cartao-2 px-4 text-base outline-none focus:ring-2 focus:ring-primaria';
const botaoIcone = 'flex size-12 items-center justify-center rounded-xl text-secundario active:bg-cartao-2 disabled:opacity-25';

export default function EditarPrograma() {
  const { id } = useParams();
  const programaId = Number(id);
  const navigate = useNavigate();
  const programa = useLiveQuery(async () => (await db.programas.get(programaId)) ?? null, [programaId]);
  const dias = useLiveQuery(() => diasDoPrograma(programaId), [programaId]);

  if (programa === undefined || dias === undefined) return <Carregando />;
  if (programa === null) return <Vazio>Programa não encontrado.</Vazio>;

  async function moverDia(i: number, delta: number) {
    await salvarOrdem('programaDias', mover(dias!, i, delta).map((d) => d.id!));
  }

  return (
    <>
      <Cabecalho titulo="Editar programa" voltar />
      <div className="flex flex-col gap-4 px-4 pb-8">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-secundario">Nome do programa</span>
          <CampoTexto valor={programa.nome} aoSalvar={(nome) => db.programas.update(programaId, { nome })} />
        </label>

        <div className="flex items-center justify-between">
          <span>Dias por semana</span>
          <Contador
            rotulo="dias por semana"
            valor={programa.diasPorSemana}
            min={1}
            max={7}
            aoMudar={(diasPorSemana) => db.programas.update(programaId, { diasPorSemana })}
          />
        </div>

        {programa.ativo ? (
          <p className="rounded-xl bg-primaria/10 px-4 py-3 text-primaria-texto">Este é o programa ativo.</p>
        ) : (
          <Botao onClick={() => definirAtivo(programaId)}>Tornar este o programa ativo</Botao>
        )}

        {dias.map((dia, i) => (
          <EditorDia
            key={dia.id}
            dia={dia}
            primeiro={i === 0}
            ultimo={i === dias.length - 1}
            aoMover={(delta) => moverDia(i, delta)}
          />
        ))}

        <Botao onClick={() => adicionarDia(programaId)}>
          <IconeMais /> Adicionar dia
        </Botao>

        <Botao variante="primario" grande onClick={() => navigate('/programas')}>
          Pronto
        </Botao>
      </div>
    </>
  );
}

/** Input de texto que salva ao sair do campo (não briga com o cursor). */
function CampoTexto({ valor, aoSalvar, className = campo }: { valor: string; aoSalvar: (v: string) => void; className?: string }) {
  const [texto, setTexto] = useState(valor);
  return (
    <input
      className={className}
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={() => {
        const t = texto.trim();
        if (t && t !== valor) aoSalvar(t);
        else setTexto(valor);
      }}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
    />
  );
}

function EditorDia({
  dia,
  primeiro,
  ultimo,
  aoMover,
}: {
  dia: ProgramaDia;
  primeiro: boolean;
  ultimo: boolean;
  aoMover: (delta: number) => void;
}) {
  const itens = useLiveQuery(() => exerciciosDoDia(dia.id!), [dia.id]);
  const exercicios = useExerciciosMap();
  const [escolhendo, setEscolhendo] = useState(false);
  const [editando, setEditando] = useState<ProgramaExercicio | null>(null);

  async function moverItem(i: number, delta: number) {
    await salvarOrdem('programaExercicios', mover(itens!, i, delta).map((x) => x.id!));
  }

  return (
    <Cartao className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <CampoTexto
          valor={dia.nome}
          aoSalvar={(nome) => db.programaDias.update(dia.id!, { nome })}
          className={`${campo} font-semibold`}
        />
        <button type="button" aria-label="Mover dia para cima" className={botaoIcone} disabled={primeiro} onClick={() => aoMover(-1)}>
          <IconeCima />
        </button>
        <button type="button" aria-label="Mover dia para baixo" className={botaoIcone} disabled={ultimo} onClick={() => aoMover(1)}>
          <IconeBaixo />
        </button>
        <button
          type="button"
          aria-label="Excluir dia"
          className={botaoIcone}
          onClick={() => confirm(`Excluir "${dia.nome}"?`) && excluirDia(dia.id!)}
        >
          <IconeLixo />
        </button>
      </div>

      <ul className="flex flex-col divide-y divide-borda">
        {itens?.map((item, i) => {
          const ex = exercicios?.get(item.exercicioId);
          return (
            <li key={item.id} className="flex items-center gap-1 py-1">
              <button type="button" onClick={() => setEditando(item)} className="flex min-h-12 flex-1 flex-col items-start justify-center text-left">
                <span className="font-medium">{ex?.nome ?? 'Exercício removido'}</span>
                <span className="text-sm text-secundario tabular-nums">
                  {item.series} × {item.repsMin}–{item.repsMax} · {item.descansoSeg}s descanso
                </span>
              </button>
              <button type="button" aria-label="Mover para cima" className={botaoIcone} disabled={i === 0} onClick={() => moverItem(i, -1)}>
                <IconeCima />
              </button>
              <button
                type="button"
                aria-label="Mover para baixo"
                className={botaoIcone}
                disabled={i === itens.length - 1}
                onClick={() => moverItem(i, 1)}
              >
                <IconeBaixo />
              </button>
            </li>
          );
        })}
        {itens?.length === 0 && <li className="py-3 text-sm text-secundario">Nenhum exercício neste dia.</li>}
      </ul>

      <Botao variante="fantasma" onClick={() => setEscolhendo(true)}>
        <IconeMais /> Exercício
      </Botao>

      <SeletorExercicio
        aberto={escolhendo}
        aoFechar={() => setEscolhendo(false)}
        aoEscolher={async (ex) => {
          await adicionarExercicioAoDia(dia.id!, ex.id!);
          setEscolhendo(false);
        }}
      />

      <EditorItem item={editando} exercicios={exercicios} aoFechar={() => setEditando(null)} />
    </Cartao>
  );
}

/** Painel para ajustar séries, repetições e descanso de um exercício do dia. */
function EditorItem({
  item,
  exercicios,
  aoFechar,
}: {
  item: ProgramaExercicio | null;
  exercicios: Map<number, Exercicio> | undefined;
  aoFechar: () => void;
}) {
  const atual = useLiveQuery(() => (item ? db.programaExercicios.get(item.id!) : undefined), [item?.id]);
  const [trocando, setTrocando] = useState(false);
  const p = atual ?? item;

  const salvar = (mudanca: Partial<ProgramaExercicio>) => {
    if (!p) return;
    const novo = { ...p, ...mudanca };
    // mantém repsMin ≤ repsMax
    if (mudanca.repsMin !== undefined && novo.repsMin > novo.repsMax) novo.repsMax = novo.repsMin;
    if (mudanca.repsMax !== undefined && novo.repsMax < novo.repsMin) novo.repsMin = novo.repsMax;
    db.programaExercicios.update(p.id!, { series: novo.series, repsMin: novo.repsMin, repsMax: novo.repsMax, descansoSeg: novo.descansoSeg, exercicioId: novo.exercicioId });
  };

  return (
    <Painel aberto={!!item} aoFechar={aoFechar} titulo={(p && exercicios?.get(p.exercicioId)?.nome) ?? 'Exercício'}>
      {p && (
        <div className="flex flex-col gap-4">
          <Linha rotulo="Séries">
            <Contador rotulo="séries" valor={p.series} min={1} max={10} aoMudar={(series) => salvar({ series })} />
          </Linha>
          <Linha rotulo="Reps mínimas">
            <Contador rotulo="reps mínimas" valor={p.repsMin} min={1} max={100} aoMudar={(repsMin) => salvar({ repsMin })} />
          </Linha>
          <Linha rotulo="Reps máximas">
            <Contador rotulo="reps máximas" valor={p.repsMax} min={1} max={100} aoMudar={(repsMax) => salvar({ repsMax })} />
          </Linha>
          <Linha rotulo="Descanso">
            <Contador
              rotulo="descanso"
              valor={p.descansoSeg}
              min={0}
              max={600}
              passo={15}
              formatar={(s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`}
              aoMudar={(descansoSeg) => salvar({ descansoSeg })}
            />
          </Linha>
          <Botao onClick={() => setTrocando(true)}>Trocar exercício</Botao>
          <Botao
            variante="perigo"
            onClick={async () => {
              await db.programaExercicios.delete(p.id!);
              aoFechar();
            }}
          >
            Remover do dia
          </Botao>
          <Botao variante="primario" onClick={aoFechar}>
            Pronto
          </Botao>
          <SeletorExercicio
            aberto={trocando}
            titulo="Trocar por"
            aoFechar={() => setTrocando(false)}
            aoEscolher={(ex) => {
              salvar({ exercicioId: ex.id! });
              setTrocando(false);
            }}
          />
        </div>
      )}
    </Painel>
  );
}

function Linha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span>{rotulo}</span>
      {children}
    </div>
  );
}
