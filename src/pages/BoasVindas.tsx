import { useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { EscolhaDivisao } from '../components/EscolhaDivisao';
import { salvarConfig, useConfig } from '../db/config';
import type { Divisao } from '../db/divisoes';
import { criarProgramaDeDivisao, criarProgramaVazio } from '../db/programas';

export default function BoasVindas() {
  const config = useConfig();
  const [destino, setDestino] = useState<string | null>(null);
  const ocupado = useRef(false); // evita criar dois programas com toque duplo

  async function concluir(criar: () => Promise<number>, meta: number, editar: boolean) {
    if (ocupado.current) return;
    ocupado.current = true;
    const programaId = await criar();
    await salvarConfig({ metaSemanal: meta, onboardingConcluido: true });
    setDestino(editar ? `/programas/${programaId}` : '/');
  }

  // Só navega depois que a config reativa refletir o onboarding concluído;
  // senão o App redirecionaria de volta para cá.
  if (destino && config?.onboardingConcluido) return <Navigate to={destino} replace />;

  const usar = (d: Divisao, editar: boolean) =>
    concluir(() => criarProgramaDeDivisao(d, true), d.diasPorSemana, editar);

  return (
    <div className="pt-seguro px-4 pb-10">
      <header className="py-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-primaria-texto">Bem-vindo</p>
        <h1 className="mt-2 font-display text-4xl font-bold leading-tight">Vamos montar seu treino</h1>
        <p className="mt-2 text-secundario">
          Escolha quantos dias você treina e a gente sugere uma divisão pronta. Dá para mudar tudo depois.
        </p>
      </header>
      <EscolhaDivisao
        aoUsar={(d) => usar(d, false)}
        aoEditar={(d) => usar(d, true)}
        aoCriarDoZero={() => concluir(() => criarProgramaVazio('Meu programa', true), 3, true)}
      />
    </div>
  );
}
