import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Comemoracao } from '../components/Comemoracao';
import { DetalheSessao, useDadosSessao } from '../components/DetalheSessao';
import { Botao } from '../components/ui';

/** Tela mostrada ao finalizar um treino. */
export default function Resumo() {
  const { id } = useParams();
  const sessaoId = Number(id);
  const navigate = useNavigate();
  const dados = useDadosSessao(sessaoId);
  const [festa, setFesta] = useState(false);
  const jaComemorou = useRef(false);
  const acabar = useCallback(() => setFesta(false), []);

  useEffect(() => {
    if (dados?.recordes.length && !jaComemorou.current) {
      jaComemorou.current = true;
      setFesta(true);
    }
  }, [dados]);

  return (
    <div className="pt-seguro px-4 pb-10">
      <header className="py-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-primaria-texto">Treino concluído</p>
        <h1 className="mt-1 text-4xl font-semibold">Mandou bem!</h1>
      </header>
      <DetalheSessao sessaoId={sessaoId} />
      <Botao variante="primario" grande className="mt-6 w-full" onClick={() => navigate('/', { replace: true })}>
        Concluir
      </Botao>
      {festa && <Comemoracao texto="Novo recorde!" aoAcabar={acabar} />}
    </div>
  );
}
