import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconeMenu } from '../components/Icones';
import { Botao, Cabecalho, Cartao, Painel, Vazio } from '../components/ui';
import { db } from '../db';
import { criarProgramaVazio, definirAtivo, duplicarPrograma, excluirPrograma } from '../db/programas';
import type { Programa } from '../db/tipos';

export default function Programas() {
  const navigate = useNavigate();
  const [menu, setMenu] = useState<Programa | null>(null);
  const programas = useLiveQuery(async () => {
    const lista = await db.programas.orderBy('id').reverse().toArray();
    const dias = await db.programaDias.toArray();
    return lista.map((p) => ({ ...p, qtdDias: dias.filter((d) => d.programaId === p.id).length }));
  }, []);

  async function novo() {
    navigate(`/programas/${await criarProgramaVazio()}`);
  }

  return (
    <>
      <Cabecalho titulo="Programas" />
      <div className="flex flex-col gap-3 px-4">
        <div className="grid grid-cols-2 gap-2">
          <Botao variante="primario" onClick={novo}>
            + Novo programa
          </Botao>
          <Botao onClick={() => navigate('/programas/modelos')}>Modelos prontos</Botao>
        </div>

        {programas?.length === 0 && <Vazio>Nenhum programa ainda.</Vazio>}

        {programas?.map((p) => (
          <Cartao key={p.id} className={`flex items-center gap-2 ${p.ativo ? 'ring-2 ring-primaria' : ''}`}>
            <Link to={`/programas/${p.id}`} className="flex min-h-12 flex-1 flex-col justify-center">
              <span className="flex items-center gap-2 text-lg font-bold">
                {p.nome}
                {p.ativo && <span className="rounded-full bg-primaria px-2 py-0.5 text-xs font-semibold text-sobre-primaria">Ativo</span>}
              </span>
              <span className="text-sm text-secundario">
                {p.qtdDias} {p.qtdDias === 1 ? 'treino' : 'treinos'} · {p.diasPorSemana}x por semana
              </span>
            </Link>
            <button
              type="button"
              aria-label={`Opções de ${p.nome}`}
              onClick={() => setMenu(p)}
              className="flex size-12 items-center justify-center rounded-xl active:bg-cartao-2"
            >
              <IconeMenu />
            </button>
          </Cartao>
        ))}

        <Link to="/exercicios" className="flex min-h-12 items-center justify-center py-2 text-primaria-texto">
          Biblioteca de exercícios
        </Link>
      </div>

      <Painel aberto={!!menu} aoFechar={() => setMenu(null)} titulo={menu?.nome ?? ''}>
        {menu && (
          <div className="flex flex-col gap-2">
            <Botao onClick={() => navigate(`/programas/${menu.id}`)}>Editar</Botao>
            {!menu.ativo && (
              <Botao
                variante="primario"
                onClick={async () => {
                  await definirAtivo(menu.id!);
                  setMenu(null);
                }}
              >
                Tornar ativo
              </Botao>
            )}
            <Botao
              onClick={async () => {
                await duplicarPrograma(menu.id!);
                setMenu(null);
              }}
            >
              Duplicar
            </Botao>
            <Botao
              variante="perigo"
              onClick={async () => {
                if (!confirm(`Excluir o programa "${menu.nome}"? Os treinos já feitos continuam no histórico.`)) return;
                await excluirPrograma(menu.id!);
                setMenu(null);
              }}
            >
              Excluir
            </Botao>
          </div>
        )}
      </Painel>
    </>
  );
}
