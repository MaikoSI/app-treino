import { useNavigate, useParams } from 'react-router-dom';
import { DetalheSessao } from '../components/DetalheSessao';
import { Botao, Cabecalho } from '../components/ui';
import { excluirSessao } from '../db/sessoes';

export default function SessaoDetalhe() {
  const { id } = useParams();
  const sessaoId = Number(id);
  const navigate = useNavigate();

  return (
    <>
      <Cabecalho titulo="Treino" voltar />
      <div className="px-4 pb-8">
        <DetalheSessao sessaoId={sessaoId} />
        <Botao
          variante="perigo"
          className="mt-6 w-full"
          onClick={async () => {
            if (!confirm('Excluir este treino do histórico? Não dá para desfazer.')) return;
            await excluirSessao(sessaoId);
            navigate('/historico', { replace: true });
          }}
        >
          Excluir treino
        </Botao>
      </div>
    </>
  );
}
