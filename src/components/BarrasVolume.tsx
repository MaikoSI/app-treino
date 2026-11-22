import type { ReactNode } from 'react';
import { num } from '../lib/formato';
import { type FaixaVolume, FREQUENCIA_MIN, faixaVolume, VOLUME_IDEAL_MAX, VOLUME_IDEAL_MIN } from '../lib/volume';

export interface LinhaVolume {
  grupo: string;
  series: number;
  /** Panturrilha/abdômen/antebraço: sem meta, sem alerta. */
  complementar?: boolean;
  /** Vezes por semana (só na análise de programa). */
  frequencia?: number;
}

const COR: Record<FaixaVolume, string> = { baixo: 'bg-volume-baixo', ideal: 'bg-volume-ideal', alto: 'bg-volume-alto' };
const TEXTO: Record<FaixaVolume, string> = { baixo: 'text-secundario', ideal: 'text-primaria-texto', alto: 'text-alerta-texto' };
const ROTULO: Record<FaixaVolume, string> = { baixo: 'abaixo', ideal: 'ideal', alto: 'alto' };

/**
 * Séries semanais por músculo, com a faixa do guia (10–20) marcada na barra.
 * A faixa também aparece escrita, para não depender só da cor.
 */
export function BarrasVolume({ linhas }: { linhas: LinhaVolume[] }) {
  // Escala fixa até pelo menos 24 séries: as marcas de 10 e 20 ficam sempre no mesmo lugar.
  const escala = Math.max(24, ...linhas.map((l) => l.series));
  const temComplementar = linhas.some((l) => l.complementar);
  return (
    <>
      <ul className="mt-2 flex flex-col gap-2.5">
        {linhas.map((l) => {
          const faixa = faixaVolume(l.series);
          const freqBaixa = l.frequencia !== undefined && !l.complementar && l.frequencia < FREQUENCIA_MIN;
          return (
            <li key={l.grupo} className="grid grid-cols-[6rem_1fr_4.75rem] items-center gap-2 text-sm">
              <span className="min-w-0">
                <span className="block truncate">{l.grupo}</span>
                {l.frequencia !== undefined && (
                  <span className={`block text-xs ${freqBaixa ? 'font-semibold text-alerta-texto' : 'text-secundario'}`}>
                    {num(l.frequencia)}x/semana
                  </span>
                )}
              </span>
              <span className="relative h-3 rounded-full bg-trilho">
                <span
                  className={`block h-full rounded-full ${l.complementar ? 'bg-volume-baixo' : COR[faixa]}`}
                  style={{ width: `${(Math.min(l.series, escala) / escala) * 100}%` }}
                />
                {[VOLUME_IDEAL_MIN, VOLUME_IDEAL_MAX].map((m) => (
                  <span
                    key={m}
                    aria-hidden="true"
                    className="absolute -inset-y-1 w-px bg-secundario/60"
                    style={{ left: `${(m / escala) * 100}%` }}
                  />
                ))}
              </span>
              <span className="text-right tabular-nums">
                <strong>{num(l.series)}</strong> {!l.complementar && <span className={`text-xs ${TEXTO[faixa]}`}>{ROTULO[faixa]}</span>}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-secundario">
        <Legenda cor="bg-volume-baixo">abaixo de {VOLUME_IDEAL_MIN}</Legenda>
        <Legenda cor="bg-volume-ideal">
          ideal {VOLUME_IDEAL_MIN}–{VOLUME_IDEAL_MAX}
        </Legenda>
        <Legenda cor="bg-volume-alto">alto, acima de {VOLUME_IDEAL_MAX}</Legenda>
      </p>
      <p className="mt-1 text-xs text-secundario">
        As marcas na barra indicam 10 e 20. Compostos contam meia série para os músculos auxiliares (o supino conta para tríceps e ombros).
        {temComplementar && ' Panturrilha, abdômen e antebraço são complementares, sem meta.'}
      </p>
    </>
  );
}

function Legenda({ cor, children }: { cor: string; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span aria-hidden="true" className={`size-2.5 rounded-full ${cor}`} />
      {children}
    </span>
  );
}
