import { expect, type Page } from '@playwright/test';

/** Primeiro acesso: escolhe a divisão pronta de 3 dias e cai no Início. */
export async function concluirOnboarding(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Vamos montar seu treino' })).toBeVisible();
  await page.getByRole('button', { name: '3 dias' }).click();
  await page.getByRole('button', { name: 'Usar esta' }).click();
  await expect(page.getByRole('heading', { name: 'Início', level: 1 })).toBeVisible();
}

/** Inicia o próximo treino do programa (respondendo à pergunta do sono). */
export async function iniciarTreino(page: Page) {
  await page.getByRole('button', { name: 'Iniciar treino' }).click();
  await page.getByRole('button', { name: 'Dormi bem' }).click();
  await expect(page).toHaveURL(/#\/treino$/);
}

/** Preenche e marca a primeira série do primeiro exercício. */
export async function registrarPrimeiraSerie(page: Page, carga: string, reps: string) {
  await page.getByRole('textbox', { name: 'Carga da série 1' }).first().fill(carga);
  await page.getByRole('textbox', { name: 'Repetições da série 1' }).first().fill(reps);
  await page.getByRole('checkbox', { name: 'Série 1 feita' }).first().click();
  await expect(page.getByRole('checkbox', { name: 'Série 1 feita' }).first()).toBeChecked();
}

/** Finaliza o treino em andamento e volta ao Início pelo resumo. */
export async function finalizarTreino(page: Page) {
  await page.getByRole('button', { name: 'Finalizar', exact: true }).click();
  await page.getByRole('button', { name: 'Finalizar e ver resumo' }).click();
  await expect(page.getByRole('heading', { name: 'Mandou bem!' })).toBeVisible();
  await page.getByRole('button', { name: 'Concluir' }).click();
  await expect(page.getByRole('heading', { name: 'Início', level: 1 })).toBeVisible();
}
