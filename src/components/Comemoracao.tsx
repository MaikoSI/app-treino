import { useEffect, useMemo } from 'react';
import { IconeTrofeu } from './Icones';

// Confete nas cores da identidade (sem vermelho: vermelho é só para alertas).
const CORES = ['#3D8BFF', '#22E06B', '#F2F4F3', '#8F9794'];

/** Confete + selo de recorde. Some sozinho depois de alguns segundos. */
export function Comemoracao({ texto, aoAcabar }: { texto: string; aoAcabar: () => void }) {
  useEffect(() => {
    try {
      navigator.vibrate?.([60, 40, 60]);
    } catch {
      /* ignora */
    }
    const t = setTimeout(aoAcabar, 2600);
    return () => clearTimeout(t);
  }, [aoAcabar]);

  const pedacos = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        dur: 1.6 + Math.random() * 1,
        cor: CORES[i % CORES.length],
        tam: 6 + Math.random() * 6,
      })),
    [],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" role="status">
      {pedacos.map((p, i) => (
        <span
          key={i}
          className="absolute -top-4 block rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.tam,
            height: p.tam * 0.5,
            background: p.cor,
            animation: `confete ${p.dur}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
      <div className="absolute inset-x-0 top-24 flex justify-center">
        <div
          className="flex items-center gap-2 rounded-full bg-destaque px-5 py-3 text-lg font-semibold text-sobre-destaque shadow-lg"
          style={{ animation: 'pulsar 0.6s ease-in-out 3' }}
        >
          <IconeTrofeu /> {texto}
        </div>
      </div>
    </div>
  );
}
