/**
 * Observabilidade opcional. Tudo desligado por padrão: só liga com variáveis de ambiente
 * definidas no build (VITE_SENTRY_DSN, VITE_OTEL_ENDPOINT). Sem elas, nenhum código de
 * telemetria é baixado e nenhuma requisição é feita. Nunca envia dados de treino ou pessoais.
 */

type Relator = (erro: unknown) => void;
const relatores: Relator[] = [];
const ouvintesDeNavegacao: ((caminho: string) => void)[] = [];

/** Liga o que estiver configurado. Chamado uma vez em main.tsx. */
export function iniciarObservabilidade() {
  const ambiente = import.meta.env.MODE;
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (dsn) {
    void import('./sentry').then(({ iniciarSentry }) => relatores.push(iniciarSentry(dsn, ambiente))).catch(() => {});
  }
  const otel = import.meta.env.VITE_OTEL_ENDPOINT;
  if (otel) {
    void import('./otel')
      .then(({ iniciarOtel }) => {
        const { relatar, navegou } = iniciarOtel(otel, ambiente);
        relatores.push(relatar);
        ouvintesDeNavegacao.push(navegou);
      })
      .catch(() => {});
  }
}

/** Erros que o React captura (render, efeitos). Vai para o que estiver ligado; sem nada ligado, não faz nada. */
export function relatarErro(erro: unknown) {
  for (const relatar of relatores) relatar(erro);
}

/** Troca de tela (chamado pelo App). Sem telemetria ligada, não faz nada. */
export function registrarNavegacao(caminho: string) {
  for (const ouvir of ouvintesDeNavegacao) ouvir(caminho);
}
