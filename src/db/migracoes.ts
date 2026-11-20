/**
 * Conversões de dados da versão 1 (banco e backup) para a versão 2.
 * Usadas pelo upgrade do Dexie (index.ts) e ao restaurar um backup antigo (backup.ts).
 * Funções MUTAM o objeto recebido (é o que o `modify` do Dexie espera).
 */
import { EXERCICIOS_INICIAIS } from './exerciciosIniciais';
import { CONFIG_PADRAO } from './tipos';

type Linha = Record<string, unknown>;

const SEMENTE = new Map(EXERCICIOS_INICIAIS.map((e) => [e.nome, e]));

/** v2: tipo (composto/isolado) e músculos secundários. Exercícios próprios viram "isolado". */
export function migrarExercicio(e: Linha): void {
  const base = SEMENTE.get(String(e.nome));
  if (e.tipo === undefined) e.tipo = base?.tipo ?? 'isolado';
  if (e.secundarios === undefined) e.secundarios = base ? [...base.secundarios] : [];
}

/** v2: RPE vira RIR (RIR = 10 − RPE, de 0 a 5). */
export function migrarSerie(s: Linha): void {
  if (s.rir === undefined) {
    const rpe = typeof s.rpe === 'number' ? s.rpe : null;
    s.rir = rpe == null ? null : Math.min(5, Math.max(0, Math.round(10 - rpe)));
  }
  delete s.rpe;
}

/**
 * v2: descanso separado para compostos e isolados. Na v1, exercícios de até 8 reps
 * já descansavam 1 minuto a mais que o padrão; isso vira o descanso dos compostos.
 */
export function migrarConfig(c: Linha): void {
  const padrao = typeof c.descansoPadraoSeg === 'number' ? c.descansoPadraoSeg : null;
  if (c.descansoIsoladoSeg === undefined) c.descansoIsoladoSeg = padrao ?? CONFIG_PADRAO.descansoIsoladoSeg;
  if (c.descansoCompostoSeg === undefined) c.descansoCompostoSeg = padrao != null ? padrao + 60 : CONFIG_PADRAO.descansoCompostoSeg;
  if (c.mostrarRir === undefined) c.mostrarRir = c.mostrarRpe === true;
  delete c.descansoPadraoSeg;
  delete c.mostrarRpe;
}
