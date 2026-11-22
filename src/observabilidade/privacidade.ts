/**
 * Regras de privacidade da telemetria. O app guarda dados de treino e de corpo só no aparelho;
 * nada disso pode sair em erros, logs, métricas ou traces. Aqui ficam as limpezas aplicadas
 * a tudo que for enviado.
 */

/** Troca ids numéricos de rotas por ":id" (/exercicios/12 → /exercicios/:id). */
export function rotaSemIds(caminho: string): string {
  return caminho.replace(/\/\d+(?=\/|$)/g, '/:id');
}

/** URL sem query e com a rota do HashRouter sem ids: https://x/app/#/sessoes/:id */
export function limparUrl(url: string): string {
  try {
    const u = new URL(url);
    const rota = u.hash.replace(/^#/, '').split('?')[0];
    return `${u.origin}${u.pathname}${rota ? `#${rotaSemIds(rota)}` : ''}`;
  } catch {
    return '';
  }
}

interface EventoMinimo {
  user?: unknown;
  extra?: unknown;
  contexts?: Record<string, unknown>;
  request?: { url?: string; headers?: unknown; cookies?: unknown; query_string?: unknown; data?: unknown };
  breadcrumbs?: { category?: string; data?: Record<string, unknown> }[];
  tags?: Record<string, unknown>;
}

/** Remove de um evento de erro tudo que poderia identificar a pessoa ou carregar dados dela. */
export function limparEvento<T extends EventoMinimo>(evento: T): T {
  delete evento.user;
  delete evento.extra;
  if (evento.contexts) {
    // Mantém só o necessário para entender o erro (navegador, sistema, aparelho)
    evento.contexts = Object.fromEntries(Object.entries(evento.contexts).filter(([k]) => ['browser', 'os', 'device'].includes(k)));
  }
  if (evento.request) {
    evento.request = { url: evento.request.url ? limparUrl(evento.request.url) : undefined };
  }
  if (evento.breadcrumbs) {
    evento.breadcrumbs = evento.breadcrumbs.filter((b) => b.category === 'navigation').map(limparNavegacao);
  }
  return evento;
}

function limparNavegacao<B extends { data?: Record<string, unknown> }>(b: B): B {
  const data = b.data ?? {};
  return {
    ...b,
    data: {
      from: typeof data.from === 'string' ? rotaSemIds(data.from.split('?')[0]) : undefined,
      to: typeof data.to === 'string' ? rotaSemIds(data.to.split('?')[0]) : undefined,
    },
  };
}
