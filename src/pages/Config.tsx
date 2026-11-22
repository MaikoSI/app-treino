import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CalculadoraAnilhas } from '../components/CalculadoraAnilhas';
import { Botao, Cabecalho, Carregando, Cartao, Contador, Girando, Interruptor, Painel, Segmentado } from '../components/ui';
import { apagarTudo, gerarBackup, nomeArquivoBackup, restaurarBackup, validarBackup } from '../db/backup';
import { salvarConfig, useConfig } from '../db/config';
import { aplicarMetasPadrao, programaAtivo } from '../db/programas';
import type { Objetivo } from '../db/tipos';
import { FAIXAS } from '../lib/metas';

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
const fmtTempo = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function Config() {
  const config = useConfig();
  const [anilhas, setAnilhas] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const [msgMetas, setMsgMetas] = useState<string | null>(null);
  const [restaurando, setRestaurando] = useState(false);
  const arquivo = useRef<HTMLInputElement>(null);
  const persistente = useArmazenamentoPersistente();

  if (!config) return <Carregando titulo="Ajustes" />;

  async function exportar() {
    const backup = await gerarBackup();
    const blob = new Blob([JSON.stringify(backup, null, 1)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivoBackup();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    setMsg({ tipo: 'ok', texto: `Backup salvo como ${a.download}. Guarde fora do celular (Drive, e-mail, WhatsApp…).` });
  }

  async function importar(file: File) {
    setMsg(null);
    try {
      const { backup, resumo } = validarBackup(await file.text());
      const quando = resumo.exportadoEm ? new Date(resumo.exportadoEm).toLocaleString('pt-BR') : 'data desconhecida';
      const ok = confirm(
        `Backup de ${quando}\n${plural(resumo.sessoes, 'treino', 'treinos')} · ${plural(resumo.programas, 'programa', 'programas')} · ${resumo.exercicios} exercícios\n\n` +
          'Isso vai APAGAR todos os dados atuais deste aparelho e colocar os do backup no lugar. Continuar?',
      );
      if (!ok) return;
      setRestaurando(true);
      await restaurarBackup(backup);
      setMsg({ tipo: 'ok', texto: `Backup restaurado: ${plural(resumo.sessoes, 'treino', 'treinos')}.` });
    } catch (e) {
      setMsg({ tipo: 'erro', texto: e instanceof Error ? e.message : 'Não foi possível ler o arquivo.' });
    } finally {
      setRestaurando(false);
    }
  }

  return (
    <>
      <Cabecalho titulo="Ajustes" />
      <div className="flex flex-col gap-4 px-4 pb-8">
        <Cartao className="flex flex-col divide-y divide-borda/70 py-1">
          <Linha rotulo="Meta de treinos por semana">
            <Contador rotulo="meta semanal" valor={config.metaSemanal} min={1} max={7} aoMudar={(metaSemanal) => salvarConfig({ metaSemanal })} />
          </Linha>
          <Linha rotulo="Unidade de peso">
            <span className="rounded-xl bg-cartao-2 px-4 py-3 font-semibold">kg</span>
          </Linha>
          <Linha rotulo="Registrar RIR" detalhe="Repetições em reserva em cada série. Séries com 5+ não contam no volume">
            <Interruptor rotulo="Registrar RIR" ligado={config.mostrarRir} aoMudar={(mostrarRir) => salvarConfig({ mostrarRir })} />
          </Linha>
          <Linha rotulo="Perguntar sobre o sono" detalhe="Antes do treino; se dormiu mal, o treino fica um pouco mais leve">
            <Interruptor rotulo="Perguntar sobre o sono" ligado={config.checkinSono} aoMudar={(checkinSono) => salvarConfig({ checkinSono })} />
          </Linha>
          <div className="flex flex-col gap-2 py-3">
            <p>Aparência</p>
            <Segmentado
              rotulo="Aparência"
              valor={config.tema}
              aoMudar={(tema) => salvarConfig({ tema })}
              opcoes={[
                { valor: 'sistema', rotulo: 'Automático' },
                { valor: 'claro', rotulo: 'Claro' },
                { valor: 'escuro', rotulo: 'Escuro' },
              ]}
            />
            <p className="text-xs text-secundario">Automático segue o modo claro ou escuro do aparelho.</p>
          </div>
        </Cartao>

        <Cartao className="flex flex-col gap-4">
          <div>
            <h2 className="font-semibold">Metas dos exercícios</h2>
            <p className="text-sm text-secundario">Usadas ao criar programas e adicionar exercícios.</p>
          </div>
          <Segmentado
            rotulo="Objetivo"
            valor={config.objetivo}
            aoMudar={(objetivo) => salvarConfig({ objetivo })}
            opcoes={(['hipertrofia', 'forca'] as const).map((o) => ({ valor: o, rotulo: ROTULO_OBJETIVO[o] }))}
          />
          <p className="text-sm text-secundario">
            Compostos {FAIXAS[config.objetivo].composto.join('–')} reps · isolados {FAIXAS[config.objetivo].isolado.join('–')} reps
            {config.objetivo === 'forca' && ' · compostos descansam pelo menos 3:00'}
          </p>
          <Linha rotulo="Descanso dos compostos" detalhe="Guia: 2 a 3 min">
            <Contador
              rotulo="descanso dos compostos"
              valor={config.descansoCompostoSeg}
              min={60}
              max={600}
              passo={15}
              formatar={fmtTempo}
              aoMudar={(descansoCompostoSeg) => salvarConfig({ descansoCompostoSeg })}
            />
          </Linha>
          <Linha rotulo="Descanso dos isolados" detalhe="Guia: 1 a 1,5 min">
            <Contador
              rotulo="descanso dos isolados"
              valor={config.descansoIsoladoSeg}
              min={30}
              max={600}
              passo={15}
              formatar={fmtTempo}
              aoMudar={(descansoIsoladoSeg) => salvarConfig({ descansoIsoladoSeg })}
            />
          </Linha>
          <Botao
            onClick={async () => {
              const p = await programaAtivo();
              if (!p) return setMsgMetas('Nenhum programa ativo.');
              if (!confirm(`Aplicar estas repetições e descansos a todos os exercícios de "${p.nome}"? As séries não mudam.`)) return;
              const n = await aplicarMetasPadrao(p.id);
              setMsgMetas(n ? `${plural(n, 'exercício atualizado', 'exercícios atualizados')} em "${p.nome}".` : 'O programa ativo já usa estas metas.');
            }}
          >
            Aplicar ao programa ativo
          </Botao>
          {msgMetas && (
            <p role="status" className="text-sm text-primaria-texto">
              {msgMetas}
            </p>
          )}
        </Cartao>

        <Cartao className="flex flex-col gap-2">
          <Link to="/corpo" className="flex min-h-12 items-center justify-center rounded-xl bg-cartao-2 active:bg-borda">
            Peso, proteína e suplementos
          </Link>
          <Botao onClick={() => setAnilhas(true)}>Calculadora de anilhas</Botao>
          <Link to="/exercicios" className="flex min-h-12 items-center justify-center rounded-xl bg-cartao-2 active:bg-borda">
            Biblioteca de exercícios
          </Link>
          <Link to="/ajuda" className="flex min-h-12 items-center justify-center rounded-xl bg-cartao-2 active:bg-borda">
            Como usar o app
          </Link>
          <Link to="/sobre" className="flex min-h-12 items-center justify-center rounded-xl bg-cartao-2 active:bg-borda">
            Sobre: base científica dos treinos
          </Link>
        </Cartao>

        <Cartao className="flex flex-col gap-3">
          <h2 className="font-semibold">Seus dados</h2>
          <p className="text-sm text-secundario">
            Tudo fica salvo <strong className="text-texto">só neste aparelho</strong>, sem conta e sem servidor. Se você limpar os dados do
            navegador, desinstalar o app ou trocar de celular, os treinos se perdem.{' '}
            <strong className="text-texto">Exporte um backup de vez em quando</strong> e guarde fora do celular.
          </p>
          {persistente === false && (
            <p className="text-sm text-alerta-texto">O navegador ainda não garantiu armazenamento permanente. Instalar o app na tela inicial ajuda.</p>
          )}
          <Botao variante="primario" onClick={exportar}>
            Exportar backup
          </Botao>
          <Botao onClick={() => arquivo.current?.click()} disabled={restaurando} aria-busy={restaurando || undefined}>
            {restaurando && <Girando />}
            {restaurando ? 'Restaurando backup…' : 'Importar backup'}
          </Botao>
          <input
            ref={arquivo}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void importar(f);
            }}
          />
          {msg && (
            <p role="status" className={`text-sm ${msg.tipo === 'ok' ? 'text-primaria-texto' : 'text-alerta-texto'}`}>
              {msg.texto}
            </p>
          )}
        </Cartao>

        <Botao
          variante="perigo"
          onClick={async () => {
            if (!confirm('Apagar TODOS os treinos, programas e ajustes deste aparelho?')) return;
            if (!confirm('Tem certeza? Não dá para desfazer. Exporte um backup antes se quiser guardar.')) return;
            await apagarTudo();
            location.reload();
          }}
        >
          Apagar todos os dados
        </Botao>

        <p className="text-center text-xs text-secundario">Versão {__VERSAO__}</p>
      </div>

      <Painel aberto={anilhas} aoFechar={() => setAnilhas(false)} titulo="Calculadora de anilhas">
        <CalculadoraAnilhas />
      </Painel>
    </>
  );
}

const ROTULO_OBJETIVO: Record<Objetivo, string> = { hipertrofia: 'Hipertrofia', forca: 'Força' };

function Linha({ rotulo, detalhe, children }: { rotulo: string; detalhe?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 py-2">
      <div>
        <p>{rotulo}</p>
        {detalhe && <p className="text-xs text-secundario">{detalhe}</p>}
      </div>
      {children}
    </div>
  );
}

/** true/false quando o navegador informa se o armazenamento é permanente; undefined se não suporta. */
function useArmazenamentoPersistente() {
  const [valor, setValor] = useState<boolean | undefined>();
  useEffect(() => {
    navigator.storage?.persisted?.().then(setValor, () => {});
  }, []);
  return valor;
}

