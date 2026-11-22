/**
 * Observabilidade opcional. Tudo desligado por padrão: só liga com variáveis de ambiente
 * definidas no build (VITE_SENTRY_DSN, VITE_OTEL_ENDPOINT). Sem elas, nenhum código de
 * telemetria é baixado e nenhuma requisição é feita. Nunca envia dados de treino ou pessoais.
 */

type Relator = (erro: unknown) => void;
const relatores: Relator[] = [];

/** Liga o que estiver configurado. Chamado uma vez em main.tsx. */
export function iniciarObservabilidade() {
  const ambiente = import.meta.env.MODE;
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (dsn) {
    void import('./sentry').then(({ iniciarSentry }) => relatores.push(iniciarSentry(dsn, ambiente))).catch(() => {});
  }
}

/** Erros que o React captura (render, efeitos). Vai para o que estiver ligado; sem nada ligado, não faz nada. */
export function relatarErro(erro: unknown) {
  for (const relatar of relatores) relatar(erro);
}
