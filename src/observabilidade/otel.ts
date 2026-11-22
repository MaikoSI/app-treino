import { SeverityNumber } from '@opentelemetry/api';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchSpanProcessor, TracerProvider } from '@opentelemetry/sdk-trace';
import { rotaSemIds } from './privacidade';

/**
 * OpenTelemetry: traces, métricas e logs via OTLP/HTTP. Só é carregado quando VITE_OTEL_ENDPOINT existe no build.
 *
 * O endpoint deve ser um OpenTelemetry Collector seu, que repassa para Datadog, New Relic etc. e guarda a
 * chave deles (docs/otel-collector.exemplo.yaml). Nunca coloque chave de API no app: o código do navegador é público.
 *
 * Só sai informação técnica: rotas sem ids, tempos, versão e nome/mensagem de erros. Nada de treino ou corpo.
 */
export function iniciarOtel(endpoint: string, ambiente: string) {
  const base = endpoint.replace(/\/+$/, '');
  const resource = resourceFromAttributes({
    'service.name': 'app-treino',
    'service.version': __VERSAO__,
    'deployment.environment.name': ambiente,
  });

  const provedorTraces = new TracerProvider({
    resource,
    spanProcessors: [new BatchSpanProcessor({ exporter: new OTLPTraceExporter({ url: `${base}/v1/traces` }) })],
  });
  const tracer = provedorTraces.getTracer('app-treino');

  const provedorMetricas = new MeterProvider({
    resource,
    readers: [
      new PeriodicExportingMetricReader({ exporter: new OTLPMetricExporter({ url: `${base}/v1/metrics` }), exportIntervalMillis: 60_000 }),
    ],
  });
  const medidor = provedorMetricas.getMeter('app-treino');

  const provedorLogs = new LoggerProvider({
    resource,
    processors: [new BatchLogRecordProcessor({ exporter: new OTLPLogExporter({ url: `${base}/v1/logs` }) })],
  });
  const logger = provedorLogs.getLogger('app-treino');

  const carregamento = medidor.createHistogram('app.carregamento.duracao', { unit: 'ms', description: 'Tempo até a página carregar' });
  const navegacoes = medidor.createCounter('app.navegacoes', { description: 'Trocas de tela' });
  const erros = medidor.createCounter('app.erros', { description: 'Erros não tratados' });

  let rota = rotaSemIds(location.hash.replace(/^#/, '').split('?')[0] || '/');
  const rotaAtual = () => rota;

  // Trace + métrica do carregamento inicial (Navigation Timing)
  const registrarCarregamento = () => {
    const [nav] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (!nav) return;
    const inicio = performance.timeOrigin;
    tracer
      .startSpan('carregamento', { startTime: inicio + nav.startTime, attributes: { 'app.rota': rotaAtual() } })
      .end(inicio + nav.loadEventEnd);
    carregamento.record(nav.loadEventEnd - nav.startTime, { 'app.rota': rotaAtual() });
  };
  if (document.readyState === 'complete') registrarCarregamento();
  else addEventListener('load', () => setTimeout(registrarCarregamento), { once: true });

  // Trace + métrica de cada troca de tela (avisada pelo App): até o próximo quadro desenhado
  const navegou = (caminho: string) => {
    rota = rotaSemIds(caminho);
    const span = tracer.startSpan('navegacao', { attributes: { 'app.rota': rota } });
    navegacoes.add(1, { 'app.rota': rota });
    requestAnimationFrame(() => requestAnimationFrame(() => span.end()));
  };

  // Envia o que estiver na fila quando o app vai para o fundo (celular costuma matar a aba depois)
  addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void Promise.allSettled([provedorTraces.forceFlush(), provedorMetricas.forceFlush(), provedorLogs.forceFlush()]);
    }
  });

  logger.emit({ severityNumber: SeverityNumber.INFO, severityText: 'INFO', body: 'app iniciado', attributes: { 'app.rota': rotaAtual() } });

  const relatar = (erro: unknown) => {
    const e = erro instanceof Error ? erro : new Error(String(erro));
    erros.add(1, { 'app.rota': rotaAtual(), 'erro.tipo': e.name });
    logger.emit({
      severityNumber: SeverityNumber.ERROR,
      severityText: 'ERROR',
      body: `${e.name}: ${e.message}`,
      attributes: { 'app.rota': rotaAtual(), 'exception.type': e.name },
    });
  };

  // Erros fora do React (os do React chegam por relatarErro)
  addEventListener('error', (ev) => relatar(ev.error ?? ev.message));
  addEventListener('unhandledrejection', (ev) => relatar(ev.reason));
  return { relatar, navegou };
}
