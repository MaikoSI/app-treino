import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { db } from '../db';
import { EQUIPAMENTOS, GRUPOS_MUSCULARES, type Equipamento, type Exercicio, type GrupoMuscular } from '../db/tipos';
import { Botao, Painel } from './ui';

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Lista pesquisável de exercícios, com filtro por grupo e cadastro de exercício próprio. */
export function ListaExercicios({ aoEscolher }: { aoEscolher?: (ex: Exercicio) => void }) {
  const todos = useLiveQuery(() => db.exercicios.orderBy('nome').toArray(), []);
  const [busca, setBusca] = useState('');
  const [grupo, setGrupo] = useState<GrupoMuscular | ''>('');
  const [criando, setCriando] = useState(false);

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
        className="min-h-12 rounded-xl bg-superficie-2 px-4 text-base outline-none focus:ring-2 focus:ring-acento"
      />
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {(['', ...GRUPOS_MUSCULARES] as const).map((g) => (
          <button
            key={g || 'todos'}
            type="button"
            onClick={() => setGrupo(g)}
            className={`min-h-10 shrink-0 rounded-full px-4 text-sm ${grupo === g ? 'bg-acento text-black font-semibold' : 'bg-superficie-2 text-suave'}`}
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
              <span className="text-sm text-suave">
                {ex.grupoMuscular} · {ex.equipamento}
                {ex.personalizado && ' · próprio'}
              </span>
            </>
          );
          return (
            <li key={ex.id}>
              {aoEscolher ? (
                <button
                  type="button"
                  onClick={() => aoEscolher(ex)}
                  className="flex min-h-14 w-full flex-col items-start justify-center py-2 text-left active:bg-superficie-2"
                >
                  {conteudo}
                </button>
              ) : (
                <div className="flex min-h-14 flex-col justify-center py-2">{conteudo}</div>
              )}
            </li>
          );
        })}
        {todos && filtrados.length === 0 && <li className="py-6 text-center text-suave">Nenhum exercício encontrado.</li>}
      </ul>

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
  const [erro, setErro] = useState('');

  async function salvar() {
    const n = nome.trim();
    if (!n) return setErro('Dê um nome ao exercício.');
    const existe = await db.exercicios.filter((e) => semAcento(e.nome) === semAcento(n)).first();
    if (existe) return setErro('Já existe um exercício com esse nome.');
    const ex: Exercicio = { nome: n, grupoMuscular: grupo, equipamento, personalizado: true };
    ex.id = await db.exercicios.add(ex);
    aoCriar(ex);
  }

  const campo = 'min-h-12 w-full rounded-xl bg-superficie-2 px-4 text-base outline-none focus:ring-2 focus:ring-acento';
  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm text-suave">Nome</span>
        <input className={campo} value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-suave">Grupo muscular</span>
        <select className={campo} value={grupo} onChange={(e) => setGrupo(e.target.value as GrupoMuscular)}>
          {GRUPOS_MUSCULARES.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-suave">Equipamento</span>
        <select className={campo} value={equipamento} onChange={(e) => setEquipamento(e.target.value as Equipamento)}>
          {EQUIPAMENTOS.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </label>
      {erro && <p className="text-perigo">{erro}</p>}
      <Botao variante="primario" grande onClick={salvar}>
        Salvar exercício
      </Botao>
    </div>
  );
}
