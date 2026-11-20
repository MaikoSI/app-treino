import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { EscolhaDivisao } from '../components/EscolhaDivisao';
import { Cabecalho } from '../components/ui';
import { criarProgramaDeDivisao, criarProgramaVazio } from '../db/programas';

/** Criar um programa novo a partir das divisões prontas (fora da boas-vindas). */
export default function Modelos() {
  const navigate = useNavigate();
  const ocupado = useRef(false);

  async function criar(fn: () => Promise<number>, editar: boolean) {
    if (ocupado.current) return;
    ocupado.current = true;
    const id = await fn();
    navigate(editar ? `/programas/${id}` : '/programas', { replace: true });
  }

  return (
    <>
      <Cabecalho titulo="Modelos prontos" voltar />
      <div className="px-4 pb-6">
        <p className="mb-4 text-secundario">O programa criado vira o ativo. Você pode trocar depois.</p>
        <EscolhaDivisao
          aoUsar={(d) => criar(() => criarProgramaDeDivisao(d, true), false)}
          aoEditar={(d) => criar(() => criarProgramaDeDivisao(d, true), true)}
          aoCriarDoZero={() => criar(() => criarProgramaVazio(), true)}
        />
      </div>
    </>
  );
}
