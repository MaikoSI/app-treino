const nf = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

/** 2.5 → "2,5" */
export const num = (n: number) => nf.format(n);

/** 1234.5 → "1.234,5 kg" */
export const kg = (n: number) => `${nf.format(n)} kg`;

/** Duração em ms → "1:05:09" ou "5:09". */
export function duracao(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** Duração em ms → "1h 05min" ou "45min". */
export function duracaoCurta(ms: number): string {
  const min = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(min / 60);
  return h > 0 ? `${h}h ${String(min % 60).padStart(2, '0')}min` : `${min}min`;
}

export const dataCurta = (t: number) =>
  new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

export const dataLonga = (t: number) =>
  new Date(t).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

/** Aceita "2,5" ou "2.5" vindos do teclado do celular. */
export function lerNumero(texto: string): number {
  const n = parseFloat(texto.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}
