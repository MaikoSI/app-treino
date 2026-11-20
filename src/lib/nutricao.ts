import type { ObjetivoPeso } from '../db/tipos';
import { inicioDaSemana } from './semana';

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Proteína: 1,6–2,2 g/kg/dia em ~4 refeições de ~0,4 g/kg (Morton 2018; Schoenfeld & Aragon 2018). */
export function proteinaDiaria(pesoKg: number) {
  return {
    minG: Math.round(pesoKg * 1.6),
    maxG: Math.round(pesoKg * 2.2),
    porRefeicaoG: Math.round(pesoKg * 0.4),
    refeicoes: 4,
  };
}

/** Cafeína: 3–6 mg/kg ~60 min antes do treino (ISSN 2021). */
export function cafeinaMg(pesoKg: number) {
  return { minMg: Math.round(pesoKg * 3), maxMg: Math.round(pesoKg * 6) };
}

/** Ritmo semanal de mudança do peso recomendado, em % do peso (Iraki 2019; Helms 2014). */
export const FAIXA_RITMO: Record<ObjetivoPeso, [number, number]> = {
  ganhar: [0.25, 0.5],
  manter: [-0.25, 0.25],
  perder: [-1, -0.5],
};

export interface MediaSemanal {
  /** Início da semana (segunda, 00:00). */
  semana: number;
  media: number;
  registros: number;
}

/** Média do peso em cada semana com registros, da mais antiga para a mais nova. */
export function mediasSemanais(registros: { data: number; kg: number }[]): MediaSemanal[] {
  const grupos = new Map<number, number[]>();
  for (const r of registros) {
    const s = inicioDaSemana(r.data).getTime();
    grupos.set(s, [...(grupos.get(s) ?? []), r.kg]);
  }
  return [...grupos.entries()]
    .sort(([a], [b]) => a - b)
    .map(([semana, pesos]) => ({ semana, media: r1(pesos.reduce((x, y) => x + y, 0) / pesos.length), registros: pesos.length }));
}

/**
 * Variação semanal (% do peso) entre as duas semanas mais recentes com registro.
 * Se houver semanas sem registro entre elas, divide pelo número de semanas.
 */
export function ritmoSemanal(medias: MediaSemanal[]): number | null {
  if (medias.length < 2) return null;
  const [a, b] = medias.slice(-2);
  const semanas = Math.max(1, Math.round((b.semana - a.semana) / (7 * 86_400_000)));
  return Math.round(((b.media - a.media) / a.media / semanas) * 1000) / 10;
}

export type AvaliacaoRitmo = 'devagar' | 'dentro' | 'rapido';

/** Compara o ritmo com a faixa do objetivo. Para "perder", "rápido" = perdendo mais de 1%/semana. */
export function avaliarRitmo(ritmo: number, objetivo: ObjetivoPeso): AvaliacaoRitmo {
  const [min, max] = FAIXA_RITMO[objetivo];
  if (ritmo >= min && ritmo <= max) return 'dentro';
  if (objetivo === 'perder') return ritmo < min ? 'rapido' : 'devagar';
  if (objetivo === 'ganhar') return ritmo > max ? 'rapido' : 'devagar';
  return ritmo > max ? 'rapido' : 'devagar'; // manter: subindo = "rápido", descendo = "devagar"
}

/** Meio-dia local do dia de `t`: data estável para "um registro por dia". */
export function diaDoRegistro(t: number | Date = Date.now()): number {
  const d = new Date(t);
  d.setHours(12, 0, 0, 0);
  return d.getTime();
}
