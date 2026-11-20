/** As semanas começam na segunda-feira, 00:00 no horário local. */
export function inicioDaSemana(data: number | Date): Date {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  const diaSemana = (d.getDay() + 6) % 7; // segunda = 0 ... domingo = 6
  d.setDate(d.getDate() - diaSemana);
  return d;
}

/** Quantos treinos aconteceram na semana de `agora`. */
export function treinosNaSemana(datas: number[], agora: number | Date = Date.now()): number {
  const inicio = inicioDaSemana(agora).getTime();
  const fim = semanaSeguinte(inicio);
  return datas.filter((t) => t >= inicio && t < fim).length;
}

function semanaSeguinte(inicio: number): number {
  const d = new Date(inicio);
  d.setDate(d.getDate() + 7); // setDate lida com horário de verão
  return d.getTime();
}

function semanaAnterior(inicio: number): number {
  const d = new Date(inicio);
  d.setDate(d.getDate() - 7);
  return d.getTime();
}

/**
 * Sequência de semanas seguidas cumprindo a meta.
 * A semana atual só conta se a meta já foi batida; se ainda não foi,
 * ela não quebra a sequência (a semana ainda não acabou).
 */
export function sequenciaSemanas(datas: number[], meta: number, agora: number | Date = Date.now()): number {
  if (meta <= 0) return 0;
  const porSemana = new Map<number, number>();
  for (const t of datas) {
    const k = inicioDaSemana(t).getTime();
    porSemana.set(k, (porSemana.get(k) ?? 0) + 1);
  }

  const atual = inicioDaSemana(agora).getTime();
  let seq = (porSemana.get(atual) ?? 0) >= meta ? 1 : 0;
  for (let semana = semanaAnterior(atual); (porSemana.get(semana) ?? 0) >= meta; semana = semanaAnterior(semana)) {
    seq++;
  }
  return seq;
}
