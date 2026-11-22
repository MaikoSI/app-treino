import { useState } from 'react';
import { calcularAnilhas } from '../lib/anilhas';
import { kg, lerNumero, num } from '../lib/formato';
import { Segmentado } from './ui';

// Cores no padrão olímpico, para reconhecer de relance.
const COR: Record<string, string> = {
  '25': 'bg-red-600',
  '20': 'bg-blue-600',
  '15': 'bg-yellow-400',
  '10': 'bg-green-600',
  '5': 'bg-zinc-100',
  '2.5': 'bg-zinc-500',
  '1.25': 'bg-zinc-400',
};
const ALTURA: Record<string, string> = {
  '25': 'h-28', '20': 'h-28', '15': 'h-24', '10': 'h-20', '5': 'h-14', '2.5': 'h-11', '1.25': 'h-9',
};

export function CalculadoraAnilhas({ cargaInicial = 60 }: { cargaInicial?: number }) {
  const [texto, setTexto] = useState(cargaInicial > 0 ? num(cargaInicial) : '');
  const [barra, setBarra] = useState(20);
  const total = lerNumero(texto);
  const r = calcularAnilhas(total, barra);

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm text-secundario">Carga total (kg)</span>
        <input
          inputMode="decimal"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onFocus={(e) => e.target.select()}
          className="min-h-14 rounded-xl bg-cartao-2 px-4 text-3xl font-semibold tabular-nums outline-none focus:ring-2 focus:ring-primaria"
        />
      </label>
      <div>
        <span className="text-sm text-secundario">Barra</span>
        <div className="mt-1">
          <Segmentado rotulo="Barra" valor={barra} aoMudar={setBarra} opcoes={[20, 15, 10].map((b) => ({ valor: b, rotulo: `${b} kg` }))} />
        </div>
      </div>

      {!r.valido ? (
        <p className="text-secundario">A carga precisa ser pelo menos o peso da barra ({barra} kg).</p>
      ) : (
        <>
          <div className="flex h-32 items-center rounded-xl bg-fundo px-3" aria-hidden="true">
            <div className="h-3 w-10 rounded-l bg-zinc-400" />
            {r.porLado.map((a, i) => (
              <div
                key={i}
                className={`${COR[String(a)]} ${ALTURA[String(a)]} mx-px flex w-5 items-center justify-center rounded-sm text-[10px] font-semibold text-black`}
              >
                <span className="-rotate-90">{num(a)}</span>
              </div>
            ))}
            <div className="h-3 flex-1 bg-zinc-400" />
          </div>
          <p className="text-lg">
            {r.porLado.length === 0 ? (
              'Só a barra.'
            ) : (
              <>
                <span className="text-secundario">De cada lado: </span>
                <strong>{r.porLado.map(num).join(' + ')}</strong>
                <span className="text-secundario"> kg</span>
              </>
            )}
          </p>
          {r.resto > 0 && <p className="text-secundario">Não fecha exato: sobram {kg(r.resto)} sem anilha.</p>}
        </>
      )}
    </div>
  );
}
