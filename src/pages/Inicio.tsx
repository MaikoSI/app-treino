import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconeAjuda, IconeAvancar, IconeFogo } from '../components/Icones';
import { Botao, Cabecalho, Carregando, Cartao, Painel } from '../components/ui';
import { salvarConfig, useConfig } from '../db/config';
import { useExerciciosMap } from '../db/hooks';
import { diasDoPrograma, exerciciosDoDia, programaAtivo } from '../db/programas';
import { iniciarTreino, sessaoEmAndamento, sessoesConcluidas } from '../db/sessoes';
import type { AjusteTreino } from '../db/tipos';
import { dataLonga, duracao } from '../lib/formato';
import { DIAS_SEMANA_LEVE, fimSemanaLeve, semanaLeveAtiva, seriesComAjuste } from '../lib/metas';
import { proximoDia } from '../lib/programa';
import { sequenciaSemanas, treinosNaSemana } from '../lib/semana';

export default function Inicio() {
  const navigate = useNavigate();
  const config = useConfig();
  const exercicios = useExerciciosMap();
  const [outroDia, setOutroDia] = useState(false);
  const [checkin, setCheckin] = useState<{ diaId: number } | null>(null);
  const [explicarLeve, setExplicarLeve] = useState(false);

  const dados = useLiveQuery(async () => {
    const [programa, emAndamento, concluidas] = await Promise.all([programaAtivo(), sessaoEmAndamento(), sessoesConcluidas()]);
    const dias = programa ? await diasDoPrograma(programa.id!) : [];
    const ultimaDoPrograma = concluidas.filter((s) => s.programaId === programa?.id).at(-1);
    const proximo = proximoDia(dias, ultimaDoPrograma?.programaDiaId);
    const itens = proximo ? await exerciciosDoDia(proximo.id!) : [];
    return { programa, emAndamento, datas: concluidas.map((s) => s.inicio), dias, proximo, itens };
  }, []);

  if (!dados || !config) return <Carregando />;
  const { programa, emAndamento, datas, dias, proximo, itens } = dados;
  const meta = config.metaSemanal;
  const feitos = treinosNaSemana(datas);
  const sequencia = sequenciaSemanas(datas, meta);

  const leve = semanaLeveAtiva(config.semanaLeveAte);

  async function comecar(diaId: number | null, ajuste: AjusteTreino = 'normal') {
    await iniciarTreino(diaId, ajuste);
    navigate('/treino');
  }

  /** Antes de um treino do programa, pergunta como foi o sono (se ligado e fora da semana leve). */
  function pedirInicio(diaId: number | null) {
    setOutroDia(false);
    if (diaId != null && config!.checkinSono && !leve) setCheckin({ diaId });
    else void comecar(diaId);
  }

  return (
    <>
      <Cabecalho titulo="Início" />
      <div className="flex flex-col gap-4 px-4">
        {/* Meta semanal */}
        <Cartao>
          <div className="flex items-baseline justify-between">
            <p className="text-sm text-secundario">Meta da semana</p>
            {sequencia > 0 && (
              <p className="flex items-center gap-1 text-sm font-semibold text-primaria-texto">
                <IconeFogo width={18} height={18} /> {sequencia} {sequencia === 1 ? 'semana seguida' : 'semanas seguidas'}
              </p>
            )}
          </div>
          <p className="mt-1 text-3xl font-semibold">
            {feitos}/{meta} <span className="font-sans text-base font-normal text-secundario">treinos esta semana</span>
          </p>
          <div className="mt-3 flex gap-1.5" aria-hidden="true">
            {Array.from({ length: Math.max(meta, feitos) }, (_, i) => (
              <div key={i} className={`h-2 flex-1 rounded-full ${i < feitos ? 'bg-concluido' : 'bg-trilho'}`} />
            ))}
          </div>
        </Cartao>

        {/* Próximo treino */}
        {emAndamento ? (
          <Cartao className="ring-2 ring-primaria">
            <p className="text-sm text-secundario">Treino em andamento</p>
            <p className="mt-1 text-3xl leading-tight font-semibold">{emAndamento.nomeDia}</p>
            <p className="text-sm text-secundario tabular-nums">Começou há {duracao(Date.now() - emAndamento.inicio)}</p>
            <Botao variante="primario" grande className="mt-4 w-full" onClick={() => navigate('/treino')}>
              Continuar treino
            </Botao>
          </Cartao>
        ) : !programa ? (
          <Cartao>
            <p className="text-lg font-semibold">Nenhum programa ativo</p>
            <p className="mt-1 text-secundario">Escolha ou crie um programa para ver o próximo treino aqui.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Botao onClick={() => navigate('/programas')}>Programas</Botao>
              <Botao variante="primario" onClick={() => pedirInicio(null)}>
                Treino livre
              </Botao>
            </div>
          </Cartao>
        ) : proximo ? (
          <Cartao>
            <p className="text-sm text-secundario">Próximo treino · {programa.nome}</p>
            <p className="mt-1 text-3xl leading-tight font-semibold">{proximo.nome}</p>
            <ul className="mt-3 flex flex-col gap-1 text-sm">
              {itens.map((it) => (
                <li key={it.id} className="flex justify-between gap-2">
                  <span>{exercicios?.get(it.exercicioId)?.nome ?? '…'}</span>
                  <span className="shrink-0 text-secundario tabular-nums">
                    {seriesComAjuste(it.series, leve ? 'deload' : 'normal')} × {it.repsMin}–{it.repsMax}
                  </span>
                </li>
              ))}
              {itens.length === 0 && <li className="text-secundario">Este dia ainda não tem exercícios.</li>}
            </ul>
            {leve && <p className="mt-3 text-sm text-secundario">Semana leve: metade das séries em cada exercício.</p>}
            <Botao variante="primario" grande className="mt-4 w-full" onClick={() => pedirInicio(proximo.id!)}>
              Iniciar treino
            </Botao>
            <Botao variante="fantasma" className="mt-2 w-full" onClick={() => setOutroDia(true)}>
              Fazer outro treino
            </Botao>
          </Cartao>
        ) : (
          <Cartao>
            <p className="text-lg font-semibold">{programa.nome}</p>
            <p className="mt-1 text-secundario">Este programa ainda não tem dias de treino.</p>
            <Link to={`/programas/${programa.id}`} className="mt-2 inline-flex min-h-12 items-center text-primaria-texto">
              Editar programa
            </Link>
          </Cartao>
        )}

        {/* Semana leve (deload) */}
        {programa &&
          (leve ? (
            <Cartao>
              <p className="font-semibold">Semana leve até {dataLonga(config.semanaLeveAte!).toLowerCase()}</p>
              <p className="mt-1 text-sm text-secundario">Mesmos exercícios com metade das séries, para a fadiga baixar.</p>
              <Botao variante="fantasma" className="mt-2 w-full" onClick={() => salvarConfig({ semanaLeveAte: null })}>
                Encerrar semana leve
              </Botao>
            </Cartao>
          ) : (
            !emAndamento && (
              <Botao variante="fantasma" onClick={() => setExplicarLeve(true)}>
                Fazer uma semana leve
              </Botao>
            )
          ))}

        {/* Guia de uso: em destaque enquanto a pessoa ainda não terminou nenhum treino */}
        <Link
          to="/ajuda"
          className={`pressionavel flex min-h-16 items-center gap-3 rounded-cartao bg-cartao p-4 shadow-cartao ${
            datas.length === 0 ? 'ring-1 ring-tinta/50' : ''
          }`}
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-tinta/12 text-tinta">
            <IconeAjuda />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Como usar o app</span>
            <span className="block text-sm text-secundario">O que cada tela faz, passo a passo</span>
          </span>
          <IconeAvancar width={20} height={20} className="shrink-0 text-secundario/70" />
        </Link>

        <footer className="mt-2 flex flex-col items-center gap-1 pb-4 text-center text-xs text-secundario">
          <p>Conteúdo informativo. Não substitui orientação de médico, nutricionista ou profissional de educação física.</p>
          <Link to="/sobre" className="flex min-h-12 items-center px-4 text-sm font-semibold text-primaria-texto">
            Sobre: de onde vêm os treinos
          </Link>
        </footer>
      </div>

      <Painel aberto={outroDia} aoFechar={() => setOutroDia(false)} titulo="Qual treino?">
        <div className="flex flex-col gap-2">
          {dias.map((d) => (
            <Botao key={d.id} variante={d.id === proximo?.id ? 'primario' : 'secundario'} onClick={() => pedirInicio(d.id!)}>
              {d.nome}
            </Botao>
          ))}
          <Botao variante="fantasma" onClick={() => pedirInicio(null)}>
            Treino livre (sem programa)
          </Botao>
        </div>
      </Painel>

      <Painel aberto={!!checkin} aoFechar={() => setCheckin(null)} titulo="Como você dormiu?">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-secundario">
            Depois de uma noite ruim, o guia sugere treinar um pouco mais leve: o app tira uma série dos exercícios que têm 3 ou mais.
          </p>
          <Botao variante="primario" grande onClick={() => checkin && comecar(checkin.diaId)}>
            Dormi bem
          </Botao>
          <Botao grande onClick={() => checkin && comecar(checkin.diaId, 'sono')}>
            Dormi mal: treino mais leve
          </Botao>
          <Botao
            variante="fantasma"
            onClick={async () => {
              await salvarConfig({ checkinSono: false });
              if (checkin) await comecar(checkin.diaId);
            }}
          >
            Não perguntar mais
          </Botao>
        </div>
      </Painel>

      <Painel aberto={explicarLeve} aoFechar={() => setExplicarLeve(false)} titulo="Semana leve (deload)">
        <div className="flex flex-col gap-3">
          <p>
            Por {DIAS_SEMANA_LEVE} dias, os treinos do programa vêm com os <strong>mesmos exercícios e metade das séries</strong>.
          </p>
          <p className="text-sm text-secundario">
            Use quando a fadiga acumular ou o progresso travar: cansaço que não passa, cargas caindo, dores. Não é obrigatório fazer de
            tempos em tempos (Coleman et al., 2024).
          </p>
          <Botao
            variante="primario"
            grande
            onClick={async () => {
              await salvarConfig({ semanaLeveAte: fimSemanaLeve() });
              setExplicarLeve(false);
            }}
          >
            Começar semana leve
          </Botao>
          <Botao variante="fantasma" onClick={() => setExplicarLeve(false)}>
            Agora não
          </Botao>
        </div>
      </Painel>
    </>
  );
}
