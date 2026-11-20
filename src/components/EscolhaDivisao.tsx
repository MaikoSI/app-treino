import { useState } from 'react';
import { divisoesPara, type Divisao } from '../db/divisoes';
import { Botao, Cartao } from './ui';

/**
 * Passo 1: quantos dias por semana. Passo 2: divisões sugeridas para esse número,
 * com prévia dos exercícios. Quem usa decide o que fazer com a divisão escolhida.
 */
export function EscolhaDivisao({
  aoUsar,
  aoEditar,
  aoCriarDoZero,
}: {
  aoUsar: (d: Divisao) => void;
  aoEditar: (d: Divisao) => void;
  aoCriarDoZero: () => void;
}) {
  const [dias, setDias] = useState<number | null>(null);
  const [aberta, setAberta] = useState<string | null>(null);
  const opcoes = dias ? divisoesPara(dias) : [];

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="mb-3 text-lg font-semibold">Quantos dias por semana você treina?</h2>
        <div className="grid grid-cols-5 gap-2">
          {[2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={dias === n}
              onClick={() => {
                setDias(n);
                setAberta(divisoesPara(n)[0]?.chave ?? null);
              }}
              className={`flex aspect-square flex-col items-center justify-center rounded-2xl text-2xl font-bold ${
                dias === n ? 'bg-acento text-black' : 'bg-superficie-2 text-texto active:bg-borda'
              }`}
            >
              {n}
              <span className="text-xs font-normal">dias</span>
            </button>
          ))}
        </div>
      </section>

      {dias && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{opcoes.length > 1 ? 'Escolha uma divisão' : 'Divisão sugerida'}</h2>
          {opcoes.map((d) => (
            <CartaoDivisao
              key={d.chave}
              divisao={d}
              aberta={aberta === d.chave}
              aoAbrir={() => setAberta(aberta === d.chave ? null : d.chave)}
              aoUsar={() => aoUsar(d)}
              aoEditar={() => aoEditar(d)}
            />
          ))}
        </section>
      )}

      <Botao variante="fantasma" onClick={aoCriarDoZero}>
        Prefiro montar meu programa do zero
      </Botao>
    </div>
  );
}

function CartaoDivisao({
  divisao,
  aberta,
  aoAbrir,
  aoUsar,
  aoEditar,
}: {
  divisao: Divisao;
  aberta: boolean;
  aoAbrir: () => void;
  aoUsar: () => void;
  aoEditar: () => void;
}) {
  return (
    <Cartao className={aberta ? 'ring-2 ring-acento' : ''}>
      <button type="button" onClick={aoAbrir} aria-expanded={aberta} className="w-full text-left">
        <p className="text-lg font-bold">{divisao.nome}</p>
        <p className="text-sm text-suave">{divisao.descricao}</p>
      </button>
      {aberta && (
        <>
          <div className="mt-4 flex flex-col gap-4">
            {divisao.dias.map((dia) => (
              <div key={dia.nome}>
                <p className="font-semibold text-acento">{dia.nome}</p>
                <ul className="mt-1 text-sm">
                  {dia.exercicios.map((ex) => (
                    <li key={ex.nome} className="flex justify-between gap-2 py-0.5">
                      <span>{ex.nome}</span>
                      <span className="shrink-0 text-suave tabular-nums">
                        {ex.series} × {ex.repsMin}–{ex.repsMax}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Botao onClick={aoEditar}>Editar antes</Botao>
            <Botao variante="primario" onClick={aoUsar}>
              Usar esta
            </Botao>
          </div>
        </>
      )}
    </Cartao>
  );
}
