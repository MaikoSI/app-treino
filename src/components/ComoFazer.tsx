import { lazy, Suspense } from 'react';
import type { Exercicio } from '../db/tipos';
import { Esqueleto } from './ui';

// As receitas e os textos dos 63 exercícios ficam fora do pacote inicial.
const ComoFazerConteudo = lazy(() => import('./ComoFazerConteudo'));

/** Demonstração 3D + passo a passo do exercício (ou as anotações do usuário, nos criados por ele). */
export function ComoFazer({ exercicio }: { exercicio: Exercicio }) {
  return (
    <Suspense
      fallback={
        <div role="status" aria-busy="true" className="flex flex-col gap-3">
          <span className="sr-only">Carregando…</span>
          <Esqueleto className="aspect-[4/3] w-full" />
          <Esqueleto className="h-4 w-2/3" />
          <Esqueleto className="h-4 w-5/6" />
          <Esqueleto className="h-4 w-1/2" />
        </div>
      }
    >
      <ComoFazerConteudo exercicio={exercicio} />
    </Suspense>
  );
}
