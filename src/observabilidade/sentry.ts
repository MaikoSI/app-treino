import * as Sentry from '@sentry/react';
import { limparEvento, limparUrl } from './privacidade';

/**
 * Captura de erros com Sentry. Só é carregado (import dinâmico) quando VITE_SENTRY_DSN existe no build.
 * Nada de dados pessoais: sem PII, sem replay, sem breadcrumbs de cliques/console/requisições,
 * URLs sem ids, e eventos limpos por `limparEvento` antes de sair do aparelho.
 */
export function iniciarSentry(dsn: string, ambiente: string) {
  Sentry.init({
    dsn,
    release: `app-treino@${__VERSAO__}`,
    environment: ambiente,
    // Não coleta IP, usuário, cookies, cabeçalhos, corpos nem query strings
    dataCollection: { userInfo: false, cookies: false, httpHeaders: false, httpBodies: [], urlQueryParams: false },
    // Só o essencial: erros globais e promessas rejeitadas. Sem tracing (fica com o OpenTelemetry) e sem replay.
    defaultIntegrations: false,
    integrations: [
      Sentry.globalHandlersIntegration(),
      Sentry.linkedErrorsIntegration(),
      Sentry.dedupeIntegration(),
      // O console fica sem breadcrumbs porque a integração dele não entra na lista acima
      Sentry.breadcrumbsIntegration({ dom: false, fetch: false, xhr: false, history: true, sentry: false }),
    ],
    tracesSampleRate: 0,
    beforeSend: (evento) => limparEvento(evento),
    beforeBreadcrumb: (b) => (b.category === 'navigation' ? b : null),
    initialScope: (escopo) => escopo.setTag('url', limparUrl(location.href)),
  });
  return (erro: unknown) => Sentry.captureException(erro);
}
