import { useMemo, useState } from 'react';
import { salvarComoFazer } from '../db/exercicios';
import type { Exercicio } from '../db/tipos';
import { execucaoDe } from '../lib/execucoes';
import { Demonstracao } from './Demonstracao';
import { Botao } from './ui';

function Lista({ titulo, itens, numerada }: { titulo: string; itens: string[]; numerada?: boolean }) {
  const Tag = numerada ? 'ol' : 'ul';
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-sm font-semibold text-secundario">{titulo}</h3>
      <Tag className={`flex flex-col gap-1.5 pl-5 ${numerada ? 'list-decimal' : 'list-disc'}`}>
        {itens.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </Tag>
    </section>
  );
}

function Anotacoes({ exercicio }: { exercicio: Exercicio }) {
  const [texto, setTexto] = useState(exercicio.comoFazer ?? '');
  const mudou = texto.trim() !== (exercicio.comoFazer ?? '');
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-secundario">Este exercício foi criado por você, então não tem demonstração. Anote aqui como fazer.</p>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold">Como fazer (suas anotações)</span>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={4}
          className="rounded-controle bg-cartao-2 p-3 text-base"
          placeholder="Ex.: banco no 3º furo, pegada fechada, descer devagar."
        />
      </label>
      {mudou && (
        <Botao variante="primario" onClick={() => salvarComoFazer(exercicio.id, texto)}>
          Salvar anotações
        </Botao>
      )}
    </div>
  );
}

export default function ComoFazerConteudo({ exercicio }: { exercicio: Exercicio }) {
  const execucao = useMemo(
    () => (exercicio.personalizado ? undefined : execucaoDe(exercicio.nome)),
    [exercicio.nome, exercicio.personalizado],
  );

  if (!execucao) return <Anotacoes exercicio={exercicio} />;

  const { posicao, execucao: passos, respiracao, erros, dica } = execucao.explicacao;
  return (
    <div className="flex flex-col gap-4">
      <Demonstracao execucao={execucao} grupo={exercicio.grupoMuscular} />
      <p className="text-sm text-secundario">Arraste o boneco para ver de outro ângulo.</p>
      <Lista titulo="Posição" itens={posicao} />
      <Lista titulo="Execução" itens={passos} numerada />
      <section className="flex flex-col gap-1.5">
        <h3 className="text-sm font-semibold text-secundario">Respiração</h3>
        <p>{respiracao}</p>
      </section>
      <Lista titulo="Erros comuns" itens={erros} />
      {dica && <p className="rounded-controle bg-primaria/10 p-3 text-sm text-primaria-texto">{dica}</p>}
    </div>
  );
}
