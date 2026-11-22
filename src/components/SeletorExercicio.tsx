import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { db } from '../db';
import { EQUIPAMENTOS, GRUPOS_MUSCULARES, type Equipamento, type Exercicio, type GrupoMuscular, type TipoExercicio } from '../db/tipos';
import { Link } from 'react-router-dom';
import { MapaMuscular } from './MapaMuscular';
import { Botao, Painel } from './ui';

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Lista pesquisável de exercícios, com filtro por grupo e cadastro de exercício próprio. */
export function ListaExercicios({ aoEscolher }: { aoEscolher?: (ex: Exercicio) => void }) {
  const todos = useLiveQuery(() => db.exercicios.orderBy('nome').toArray(), []);
  const [busca, setBusca] = useState('');
  const [grupo, setGrupo] = useState<GrupoMuscular | ''>('');
  const [criando, setCriando] = useState(false);
  const [vendo, setVendo] = useState<Exercicio | null>(null);

  const filtrados = useMemo(() => {
    const q = semAcento(busca.trim());
    return (todos ?? []).filter((e) => (!grupo || e.grupoMuscular === grupo) && (!q || semAcento(e.nome).includes(q)));
  }, [todos, busca, grupo]);

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar exercício"
        className="min-h-12 rounded-xl bg-cartao-2 px-4 text-base outline-none focus:ring-2 focus:ring-primaria"
      />
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {(['', ...GRUPOS_MUSCULARES] as const).map((g) => (
          <button
            key={g || 'todos'}
            type="button"
            onClick={() => setGrupo(g)}
            className={`min-h-12 shrink-0 rounded-full px-4 text-sm ${grupo === g ? 'bg-primaria text-sobre-primaria font-semibold' : 'bg-cartao-2 text-secundario'}`}
          >
            {g || 'Todos'}
          </button>
        ))}
      </div>

      <Botao onClick={() => setCriando(true)}>+ Criar exercício próprio</Botao>

      <ul className="divide-y divide-borda">
        {filtrados.map((ex) => {
          const conteudo = (
            <>
              <span className="font-medium">{ex.nome}</span>
              <span className="text-sm text-secundario">
                {ex.grupoMuscular} · {ex.equipamento}
                {ex.personalizado && ' · próprio'}
              </span>
            </>
          );
          return (
            <li key={ex.id}>
              {aoEscolher ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => aoEscolher(ex)}
                    className="flex min-h-14 min-w-0 flex-1 flex-col items-start justify-center py-2 text-left active:bg-cartao-2"
                  >
                    {conteudo}
                  </button>
                  <button
                    type="button"
                    aria-label={`Músculos trabalhados: ${ex.nome}`}
                    onClick={() => setVendo(ex)}
                    className="flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-secundario active:bg-cartao-2"
                  >
                    <span aria-hidden="true" className="flex size-7 items-center justify-center rounded-full border-2 border-current text-sm">
                      i
                    </span>
                  </button>
                </div>
              ) : (
                <Link to={`/exercicios/${ex.id}`} className="flex min-h-14 items-center gap-2 py-2 active:bg-cartao-2">
                  <span className="flex min-w-0 flex-1 flex-col">{conteudo}</span>
                  <span aria-hidden="true" className="text-secundario">
                    ›
                  </span>
                </Link>
              )}
            </li>
          );
        })}
        {todos && filtrados.length === 0 && <li className="py-6 text-center text-secundario">Nenhum exercício encontrado.</li>}
      </ul>

      <Painel aberto={!!vendo} aoFechar={() => setVendo(null)} titulo={vendo?.nome ?? ''}>
        {vendo && (
          <div className="flex flex-col gap-4">
            <MapaMuscular exercicio={vendo} />
            <Botao
              variante="primario"
              onClick={() => {
                setVendo(null);
                aoEscolher?.(vendo);
              }}
            >
              Escolher este exercício
            </Botao>
          </div>
        )}
      </Painel>

      <NovoExercicio
        aberto={criando}
        nomeInicial={busca}
        grupoInicial={grupo || 'Peito'}
        aoFechar={() => setCriando(false)}
        aoCriar={(ex) => {
          setCriando(false);
          aoEscolher?.(ex);
        }}
      />
    </div>
  );
}

/** Painel com a lista, para escolher um exercício (no programa ou no treino). */
export function SeletorExercicio({
  aberto,
  aoFechar,
  aoEscolher,
  titulo = 'Escolher exercício',
}: {
  aberto: boolean;
  aoFechar: () => void;
  aoEscolher: (ex: Exercicio) => void;
  titulo?: string;
}) {
  return (
    <Painel aberto={aberto} aoFechar={aoFechar} titulo={titulo}>
      <ListaExercicios aoEscolher={aoEscolher} />
    </Painel>
  );
}

function NovoExercicio({
  aberto,
  aoFechar,
  aoCriar,
  nomeInicial,
  grupoInicial,
}: {
  aberto: boolean;
  aoFechar: () => void;
  aoCriar: (ex: Exercicio) => void;
  nomeInicial: string;
  grupoInicial: GrupoMuscular;
}) {
  return (
    <Painel aberto={aberto} aoFechar={aoFechar} titulo="Novo exercício">
      {/* key força recriar o formulário com os valores iniciais a cada abertura */}
      <FormNovoExercicio key={String(aberto)} aoCriar={aoCriar} nomeInicial={nomeInicial} grupoInicial={grupoInicial} />
    </Painel>
  );
}

function FormNovoExercicio({
  aoCriar,
  nomeInicial,
  grupoInicial,
}: {
  aoCriar: (ex: Exercicio) => void;
  nomeInicial: string;
  grupoInicial: GrupoMuscular;
}) {
  const [nome, setNome] = useState(nomeInicial);
  const [grupo, setGrupo] = useState<GrupoMuscular>(grupoInicial);
  const [equipamento, setEquipamento] = useState<Equipamento>('Máquina');
  const [tipo, setTipo] = useState<TipoExercicio>('isolado');
  const [erro, setErro] = useState('');

  async function salvar() {
    const n = nome.trim();
    if (!n) return setErro('Dê um nome ao exercício.');
    const existe = await db.exercicios.filter((e) => semAcento(e.nome) === semAcento(n)).first();
    if (existe) return setErro('Já existe um exercício com esse nome.');
    const novo = { nome: n, grupoMuscular: grupo, equipamento, tipo, secundarios: [], personalizado: true };
    aoCriar({ ...novo, id: await db.exercicios.add(novo) });
  }

  const campo = 'min-h-12 w-full rounded-xl bg-cartao-2 px-4 text-base outline-none focus:ring-2 focus:ring-primaria';
  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm text-secundario">Nome</span>
        <input className={campo} value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-secundario">Grupo muscular</span>
        <select className={campo} value={grupo} onChange={(e) => setGrupo(e.target.value as GrupoMuscular)}>
          {GRUPOS_MUSCULARES.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-secundario">Equipamento</span>
        <select className={campo} value={equipamento} onChange={(e) => setEquipamento(e.target.value as Equipamento)}>
          {EQUIPAMENTOS.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </label>
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-sm text-secundario">Tipo</legend>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-cartao-2 p-1">
          {(['composto', 'isolado'] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tipo === t}
              onClick={() => setTipo(t)}
              className={`min-h-12 rounded-lg px-3 font-semibold capitalize ${tipo === t ? 'bg-primaria text-sobre-primaria' : 'text-secundario active:bg-borda'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <span className="text-xs text-secundario">
          Composto: vários músculos e cargas altas (6–10 reps, 2–3 min de descanso). Isolado: um músculo (10–15 reps, ~1,5 min).
        </span>
      </fieldset>
      {erro && <p className="text-alerta-texto">{erro}</p>}
      <Botao variante="primario" grande onClick={salvar}>
        Salvar exercício
      </Botao>
    </div>
  );
}
