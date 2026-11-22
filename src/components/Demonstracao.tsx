import { lazy, Suspense, useSyncExternalStore } from 'react';
import { useConfig } from '../db/config';
import type { GrupoMuscular } from '../db/tipos';
import type { Execucao } from '../lib/execucoes';
import { temaEfetivo } from '../lib/tema';
import { Esqueleto } from './ui';
import { useSistemaEscuro } from './useSistemaEscuro';

// three.js fica num pedaço separado, baixado só quando uma demonstração aparece.
const Boneco3D = lazy(() => import('./Boneco3D'));

const CONSULTA_REDUZIR = '(prefers-reduced-motion: reduce)';
function assinarMovimento(avisar: () => void) {
  if (typeof matchMedia !== 'function') return () => {};
  const mq = matchMedia(CONSULTA_REDUZIR);
  mq.addEventListener('change', avisar);
  return () => mq.removeEventListener('change', avisar);
}
const reduzMovimento = () => typeof matchMedia === 'function' && matchMedia(CONSULTA_REDUZIR).matches;

let webgl: boolean | undefined;
function temWebGL(): boolean {
  if (webgl === undefined) {
    try {
      const c = document.createElement('canvas');
      webgl = !!(c.getContext('webgl2') ?? c.getContext('webgl'));
    } catch {
      webgl = false;
    }
  }
  return webgl;
}

/** Boneco 3D do exercício; com "reduzir movimento", as poses de início e fim paradas; sem WebGL, um aviso. */
export function Demonstracao({ execucao, grupo }: { execucao: Execucao; grupo?: GrupoMuscular }) {
  const reduzir = useSyncExternalStore(assinarMovimento, reduzMovimento, () => false);
  const tema = temaEfetivo(useConfig()?.tema ?? 'sistema', useSistemaEscuro());

  if (!temWebGL()) return <p className="rounded-controle bg-cartao-2 p-3 text-sm text-secundario">Animação indisponível neste aparelho.</p>;

  if (reduzir)
    return (
      <div className="grid grid-cols-2 gap-2">
        {(['inicio', 'fim'] as const).map((q) => (
          <figure key={q} className="flex flex-col gap-1">
            <Suspense fallback={<Esqueleto className="aspect-square w-full" />}>
              <Boneco3D execucao={execucao} grupo={grupo} tema={tema} estatico={q} />
            </Suspense>
            <figcaption className="text-center text-sm text-secundario">{q === 'inicio' ? 'Início' : 'Fim'}</figcaption>
          </figure>
        ))}
      </div>
    );

  return (
    <Suspense fallback={<Esqueleto className="aspect-[4/3] w-full" />}>
      <Boneco3D execucao={execucao} grupo={grupo} tema={tema} />
    </Suspense>
  );
}
