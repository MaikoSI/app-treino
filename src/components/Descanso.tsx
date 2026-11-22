import { useCallback, useEffect, useRef, useState } from 'react';
import { duracao } from '../lib/formato';

interface EstadoDescanso {
  /** Timestamp em que o descanso acaba. */
  fim: number;
  /** Duração total, em segundos (para a barra de progresso). */
  total: number;
}

const CHAVE = 'descanso-ativo';

function ler(): EstadoDescanso | null {
  try {
    const v = JSON.parse(localStorage.getItem(CHAVE) ?? 'null');
    return v && v.fim > Date.now() ? v : null;
  } catch {
    return null;
  }
}

function gravar(v: EstadoDescanso | null) {
  try {
    if (v) localStorage.setItem(CHAVE, JSON.stringify(v));
    else localStorage.removeItem(CHAVE);
  } catch {
    /* sem armazenamento: o cronômetro só não sobrevive a recarregar a página */
  }
}

let audio: AudioContext | null = null;

/** Prepara o áudio. Precisa ser chamado num toque do usuário (regra dos navegadores). */
function prepararAudio() {
  try {
    audio ??= new AudioContext();
    if (audio.state === 'suspended') void audio.resume();
  } catch {
    audio = null;
  }
}

function avisarFim() {
  try {
    navigator.vibrate?.([300, 150, 300, 150, 300]);
  } catch {
    /* sem vibração (iPhone) */
  }
  if (!audio) return;
  try {
    for (const [i, freq] of [880, 880, 1320].entries()) {
      const osc = audio.createOscillator();
      const ganho = audio.createGain();
      const t = audio.currentTime + i * 0.25;
      osc.frequency.value = freq;
      ganho.gain.setValueAtTime(0.25, t);
      ganho.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(ganho).connect(audio.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    }
  } catch {
    /* ignora */
  }
}

/** Cronômetro de descanso que sobrevive a fechar/reabrir o app (guardado no aparelho). */
export function useDescanso() {
  const [estado, setEstado] = useState<EstadoDescanso | null>(ler);

  const definir = useCallback((v: EstadoDescanso | null) => {
    gravar(v);
    setEstado(v);
  }, []);

  const iniciar = useCallback(
    (segundos: number) => {
      prepararAudio();
      if (segundos > 0) definir({ fim: Date.now() + segundos * 1000, total: segundos });
    },
    [definir],
  );

  const ajustar = useCallback(
    (delta: number) => {
      setEstado((atual) => {
        if (!atual) return atual;
        const novo = { fim: atual.fim + delta * 1000, total: Math.max(1, atual.total + delta) };
        if (novo.fim <= Date.now()) {
          gravar(null);
          return null;
        }
        gravar(novo);
        return novo;
      });
    },
    [],
  );

  const pular = useCallback(() => definir(null), [definir]);

  return { estado, iniciar, ajustar, pular, terminou: () => definir(null) };
}

/** Barra fixa no rodapé com o tempo de descanso restante. */
export function BarraDescanso({
  estado,
  aoAjustar,
  aoPular,
  aoTerminar,
}: {
  estado: EstadoDescanso | null;
  aoAjustar: (delta: number) => void;
  aoPular: () => void;
  aoTerminar: () => void;
}) {
  const [agora, setAgora] = useState(Date.now());
  const avisado = useRef<number | null>(null);

  useEffect(() => {
    if (!estado) return;
    const t = setInterval(() => setAgora(Date.now()), 250);
    return () => clearInterval(t);
  }, [estado]);

  const restanteMs = estado ? estado.fim - agora : 0;

  useEffect(() => {
    if (estado && restanteMs <= 0 && avisado.current !== estado.fim) {
      avisado.current = estado.fim;
      avisarFim();
      aoTerminar();
    }
  }, [estado, restanteMs, aoTerminar]);

  if (!estado) return null;
  const progresso = Math.min(1, Math.max(0, 1 - restanteMs / (estado.total * 1000)));
  const btn = 'pressionavel min-h-11 rounded-full px-4 font-semibold';

  return (
    <div className="barra-entra pb-seguro vidro fixed inset-x-0 bottom-0 z-40 border-t border-borda/60">
      <div className="h-1.5 bg-trilho">
        <div className="h-full bg-destaque transition-[width] duration-200" style={{ width: `${progresso * 100}%` }} />
      </div>
      <div className="mx-auto flex max-w-lg items-center gap-2 px-4 py-3">
        <div className="flex-1">
          <p className="text-xs text-secundario">Descanso</p>
          <p className="text-4xl leading-none font-semibold text-destaque-texto tabular-nums" aria-live="off">
            {duracao(Math.max(0, restanteMs) + 999)}
          </p>
        </div>
        <button type="button" className={`${btn} bg-cartao-2 text-primaria-texto`} onClick={() => aoAjustar(-15)}>
          −15s
        </button>
        <button type="button" className={`${btn} bg-cartao-2 text-primaria-texto`} onClick={() => aoAjustar(15)}>
          +15s
        </button>
        <button type="button" className={`${btn} bg-primaria text-sobre-primaria`} onClick={aoPular}>
          Pular
        </button>
      </div>
    </div>
  );
}
