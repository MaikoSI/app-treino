import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CalculadoraAnilhas } from '../components/CalculadoraAnilhas';
import { Botao, Cabecalho, Carregando, Cartao, Contador, Painel } from '../components/ui';
import { apagarTudo, gerarBackup, nomeArquivoBackup, restaurarBackup, validarBackup } from '../db/backup';
import { salvarConfig, useConfig } from '../db/config';

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
const fmtTempo = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function Config() {
  const config = useConfig();
  const [anilhas, setAnilhas] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const arquivo = useRef<HTMLInputElement>(null);
  const persistente = useArmazenamentoPersistente();

  if (!config) return <Carregando />;

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
      await restaurarBackup(backup);
      setMsg({ tipo: 'ok', texto: `Backup restaurado: ${plural(resumo.sessoes, 'treino', 'treinos')}.` });
    } catch (e) {
      setMsg({ tipo: 'erro', texto: e instanceof Error ? e.message : 'Não foi possível ler o arquivo.' });
    }
  }

  return (
    <>
      <Cabecalho titulo="Ajustes" />
      <div className="flex flex-col gap-4 px-4 pb-8">
        <Cartao className="flex flex-col gap-4">
          <Linha rotulo="Meta de treinos por semana">
            <Contador rotulo="meta semanal" valor={config.metaSemanal} min={1} max={7} aoMudar={(metaSemanal) => salvarConfig({ metaSemanal })} />
          </Linha>
          <Linha rotulo="Descanso padrão" detalhe="Para exercícios novos">
            <Contador
              rotulo="descanso padrão"
              valor={config.descansoPadraoSeg}
              min={15}
              max={600}
              passo={15}
              formatar={fmtTempo}
              aoMudar={(descansoPadraoSeg) => salvarConfig({ descansoPadraoSeg })}
            />
          </Linha>
          <Linha rotulo="Unidade de peso">
            <span className="rounded-xl bg-superficie-2 px-4 py-3 font-semibold">kg</span>
          </Linha>
          <Linha rotulo="Registrar RPE" detalhe="Esforço percebido (1–10) em cada série">
            <button
              type="button"
              role="switch"
              aria-checked={config.mostrarRpe}
              aria-label="Registrar RPE"
              onClick={() => salvarConfig({ mostrarRpe: !config.mostrarRpe })}
              className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${config.mostrarRpe ? 'bg-acento' : 'bg-superficie-2'}`}
            >
              <span className={`absolute top-1 size-6 rounded-full bg-white transition-all ${config.mostrarRpe ? 'left-7' : 'left-1'}`} />
            </button>
          </Linha>
        </Cartao>

        <Cartao className="flex flex-col gap-2">
          <Botao onClick={() => setAnilhas(true)}>Calculadora de anilhas</Botao>
          <Link to="/exercicios" className="flex min-h-12 items-center justify-center rounded-xl bg-superficie-2 active:bg-borda">
            Biblioteca de exercícios
          </Link>
        </Cartao>

        <Cartao className="flex flex-col gap-3">
          <h2 className="font-semibold">Seus dados</h2>
          <p className="text-sm text-suave">
            Tudo fica salvo <strong className="text-texto">só neste aparelho</strong>, sem conta e sem servidor. Se você limpar os dados do
            navegador, desinstalar o app ou trocar de celular, os treinos se perdem.{' '}
            <strong className="text-texto">Exporte um backup de vez em quando</strong> e guarde fora do celular.
          </p>
          {persistente === false && (
            <p className="text-sm text-ouro">O navegador ainda não garantiu armazenamento permanente. Instalar o app na tela inicial ajuda.</p>
          )}
          <Botao variante="primario" onClick={exportar}>
            Exportar backup
          </Botao>
          <Botao onClick={() => arquivo.current?.click()}>Importar backup</Botao>
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
            <p role="status" className={`text-sm ${msg.tipo === 'ok' ? 'text-acento' : 'text-perigo'}`}>
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

        <p className="text-center text-xs text-suave">Versão {__VERSAO__}</p>
      </div>

      <Painel aberto={anilhas} aoFechar={() => setAnilhas(false)} titulo="Calculadora de anilhas">
        <CalculadoraAnilhas />
      </Painel>
    </>
  );
}

function Linha({ rotulo, detalhe, children }: { rotulo: string; detalhe?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p>{rotulo}</p>
        {detalhe && <p className="text-xs text-suave">{detalhe}</p>}
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
