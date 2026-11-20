import { ListaExercicios } from '../components/SeletorExercicio';
import { Cabecalho } from '../components/ui';

export default function Exercicios() {
  return (
    <>
      <Cabecalho titulo="Exercícios" voltar />
      <div className="px-4 pb-6">
        <ListaExercicios />
      </div>
    </>
  );
}
