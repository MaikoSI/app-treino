import { Cabecalho, Vazio } from '../components/ui';

/** Página provisória enquanto as etapas seguintes não ficam prontas. */
export function EmBreve({ titulo }: { titulo: string }) {
  return (
    <>
      <Cabecalho titulo={titulo} />
      <Vazio>Em construção.</Vazio>
    </>
  );
}
