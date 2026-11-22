import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { concluirOnboarding, finalizarTreino, iniciarTreino, registrarPrimeiraSerie } from './ajudantes';

test('primeiro acesso: escolhe uma divisão pronta e chega ao Início com o programa ativo', async ({ page }) => {
  await concluirOnboarding(page);
  await expect(page.getByText('0/3')).toBeVisible();
  await expect(page.getByText('Full Body A', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Iniciar treino' })).toBeVisible();
});

test('treino completo: inicia, registra uma série, finaliza e conta na meta da semana', async ({ page }) => {
  await concluirOnboarding(page);
  await iniciarTreino(page);
  await registrarPrimeiraSerie(page, '60', '8');
  await finalizarTreino(page);
  await expect(page.getByText('1/3')).toBeVisible();

  await page.getByRole('link', { name: 'Histórico' }).click();
  await expect(page.getByText('Full Body A').first()).toBeVisible();
});

test('como fazer: tocar no nome do exercício no treino mostra a explicação sem perder as séries', async ({ page }) => {
  await concluirOnboarding(page);
  await iniciarTreino(page);
  await registrarPrimeiraSerie(page, '40', '10');

  await page
    .getByRole('button', { name: /^Como fazer / })
    .first()
    .click();
  const painel = page.getByRole('dialog');
  await expect(painel.getByRole('heading', { name: 'Execução' })).toBeVisible();
  await expect(painel.getByRole('heading', { name: 'Erros comuns' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(painel).toBeHidden();

  await expect(page.getByRole('checkbox', { name: 'Série 1 feita' }).first()).toBeChecked();
  await expect(page.getByRole('textbox', { name: 'Carga da série 1' }).first()).toHaveValue('40');
});

test('retomar treino: fechar e abrir o app mantém o treino e as séries registradas', async ({ page }) => {
  await concluirOnboarding(page);
  await iniciarTreino(page);
  await registrarPrimeiraSerie(page, '62,5', '7');

  // "Fecha" o app: recarrega na tela inicial
  await page.goto('/');
  await page.reload();
  await page.getByRole('button', { name: 'Continuar treino' }).click();
  await expect(page).toHaveURL(/#\/treino$/);
  await expect(page.getByRole('textbox', { name: 'Carga da série 1' }).first()).toHaveValue('62,5');
  await expect(page.getByRole('checkbox', { name: 'Série 1 feita' }).first()).toBeChecked();
});

test('backup: exporta num aparelho e restaura o histórico em outro', async ({ page, browser }) => {
  page.on('dialog', (d) => d.accept());
  await concluirOnboarding(page);
  await iniciarTreino(page);
  await registrarPrimeiraSerie(page, '60', '8');
  await finalizarTreino(page);

  await page.getByRole('link', { name: 'Ajustes' }).click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar backup' }).click()]);
  const arquivo = await download.path();
  const backup = JSON.parse(await readFile(arquivo, 'utf8'));
  expect(backup.app).toBe('app-treino');
  expect(backup.dados.sessoes).toHaveLength(1);

  // "Outro aparelho": contexto novo, banco vazio
  const outro = await browser.newContext({ ...test.info().project.use });
  const novo = await outro.newPage();
  novo.on('dialog', (d) => d.accept());
  await concluirOnboarding(novo);
  await expect(novo.getByText('0/3')).toBeVisible();
  await novo.getByRole('link', { name: 'Ajustes' }).click();
  await novo.locator('input[type="file"]').setInputFiles(arquivo);
  await expect(novo.getByText('Backup restaurado: 1 treino.')).toBeVisible();
  await novo.getByRole('link', { name: 'Início' }).click();
  await expect(novo.getByText('1/3')).toBeVisible();
  await outro.close();
});
