import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useParams } from 'react-router-dom';
import { ComoFazer } from '../components/ComoFazer';
import { MapaMuscular } from '../components/MapaMuscular';
import { Cabecalho, Carregando, Cartao, Vazio } from '../components/ui';
import { db } from '../db';
import { useConfig } from '../db/config';
import { duracao } from '../lib/formato';
import { metaPadrao } from '../lib/metas';

const TIPO = {
  composto: 'Composto: movimenta várias articulações e músculos, aguenta cargas altas.',
  isolado: 'Isolado: foca um músculo só, com cargas menores.',
};

export default function ExercicioDetalhe() {
  const id = Number(useParams().id);
  const config = useConfig();
  const exercicio = useLiveQuery(async () => (await db.exercicios.get(id)) ?? null, [id]);

  if (exercicio === undefined || !config) return <Carregando titulo="Exercício" voltar />;
  if (exercicio === null)
    return (
      <>
        <Cabecalho titulo="Exercício" voltar />
        <Vazio>Exercício não encontrado.</Vazio>
      </>
    );

  const meta = metaPadrao(exercicio.tipo, config);

  return (
    <>
      <Cabecalho titulo={exercicio.nome} voltar />
      <div className="flex flex-col gap-4 px-4 pb-10">
        <div className="flex flex-wrap gap-2 text-sm">
          {[exercicio.grupoMuscular, exercicio.equipamento, exercicio.tipo === 'composto' ? 'Composto' : 'Isolado'].map((t) => (
            <span key={t} className="rounded-full bg-cartao-2 px-3 py-1 text-secundario">
              {t}
            </span>
          ))}
          {exercicio.personalizado && <span className="rounded-full bg-cartao-2 px-3 py-1 text-secundario">Criado por você</span>}
        </div>

        <Cartao>
          <h2 className="mb-3 font-semibold">Como fazer</h2>
          <ComoFazer exercicio={exercicio} />
        </Cartao>

        <Cartao>
          <h2 className="mb-3 font-semibold">Músculos trabalhados</h2>
          <MapaMuscular exercicio={exercicio} />
        </Cartao>

        <Cartao className="flex flex-col gap-2">
          <h2 className="font-semibold">Meta sugerida</h2>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-cartao-2 p-3">
              <p className="text-3xl font-semibold tabular-nums">
                {meta.repsMin}–{meta.repsMax}
              </p>
              <p className="text-xs text-secundario">repetições</p>
            </div>
            <div className="rounded-xl bg-cartao-2 p-3">
              <p className="text-3xl font-semibold tabular-nums">{duracao(meta.descansoSeg * 1000)}</p>
              <p className="text-xs text-secundario">de descanso</p>
            </div>
          </div>
          <p className="text-sm text-secundario">{TIPO[exercicio.tipo]}</p>
          <p className="text-sm text-secundario">
            Termine cada série perto da falha (0 a 3 repetições sobrando). Muda conforme o objetivo em Ajustes.
          </p>
        </Cartao>

        <Link
          to={`/progresso/${exercicio.id}`}
          className="flex min-h-12 items-center justify-center rounded-cartao vidro-fino font-semibold text-primaria-texto active:bg-cartao-2"
        >
          Ver minha evolução neste exercício
        </Link>
      </div>
    </>
  );
}
