import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { Cabecalho, Cartao } from '../components/ui';
import { db } from '../db';

export default function Inicio() {
  const total = useLiveQuery(() => db.exercicios.count(), []);
  return (
    <>
      <Cabecalho titulo="Início" />
      <div className="px-4">
        <Cartao>
          <p>{total ?? '…'} exercícios na biblioteca.</p>
          <Link to="/exercicios" className="mt-2 inline-block text-acento">Ver exercícios</Link>
        </Cartao>
      </div>
    </>
  );
}
