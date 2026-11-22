declare const __VERSAO__: string;

interface ImportMetaEnv {
  /** DSN do Sentry. Sem ela, o Sentry nem é carregado. */
  readonly VITE_SENTRY_DSN?: string;
  /** URL do seu OpenTelemetry Collector (OTLP/HTTP), ex.: https://otel.exemplo.com. Sem ela, nada é carregado. */
  readonly VITE_OTEL_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
