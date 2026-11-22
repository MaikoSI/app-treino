/**
 * Testes de mutação (Stryker) nas regras de negócio puras (src/lib).
 * O Stryker altera o código (troca > por >=, + por -, apaga condições…) e confere se algum
 * teste falha. Mutante que sobrevive = comportamento que nenhum teste protege.
 * Rodar: npm run mutacao  (relatório em reports/mutation/mutation.html)
 */
export default {
  // Runner genérico: o @stryker-mutator/vitest-runner não ativa os mutantes no Vitest 5 (todos "sobrevivem").
  // O command runner passa o mutante por variável de ambiente, que os workers do Vitest herdam.
  testRunner: 'command',
  commandRunner: { command: 'npx vitest run src/lib --bail 1 --reporter=dot --maxWorkers=1' },
  mutate: ['src/lib/**/*.ts', '!src/lib/**/*.test.ts'],
  reporters: ['clear-text', 'progress', 'html'],
  incremental: true,
  incrementalFile: 'reports/stryker-incremental.json',
  coverageAnalysis: 'off',
  // Cada execução sobe um Vitest próprio; poucos em paralelo e folga no tempo evitam falsos "timeout".
  concurrency: 4,
  timeoutMS: 20000,
  thresholds: { high: 85, low: 70, break: 70 },
  tempDirName: '.stryker-tmp',
  // O TypeScript 7 não tem API JavaScript, e o Stryker usaria essa API para reescrever o tsconfig na sandbox.
  // O runner do Vitest não checa tipos, então apontamos para um arquivo que não existe e o passo é pulado.
  tsconfigFile: 'tsconfig.stryker-sem-reescrita.json',
};
