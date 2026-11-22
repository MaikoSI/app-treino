declare const __VERSAO__: string;

interface ImportMetaEnv {
  /** DSN do Sentry. Sem ela, o Sentry nem é carregado. */
  readonly VITE_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
