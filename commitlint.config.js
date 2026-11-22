/**
 * Mensagens de commit no padrão Conventional Commits (feat:, fix:, docs:, chore:, ci:…).
 * Corpo e rodapé sem limite de largura: as mensagens são em português e explicam o porquê.
 * Sem regra de maiúsculas no assunto: ele costuma começar com nome próprio (Biome, Sentry, Playwright).
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
    'subject-case': [0],
  },
};
