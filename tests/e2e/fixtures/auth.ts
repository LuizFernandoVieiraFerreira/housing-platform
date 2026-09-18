import { expect, type Page } from '@playwright/test';

import { SEED_PASSWORD } from './seed-data';

interface LoginOptions {
  email: string;
  password?: string;
  loginPath?: string;
}

export async function login(page: Page, options: LoginOptions): Promise<void> {
  const { email, password = SEED_PASSWORD, loginPath = '/login' } = options;

  await page.goto(loginPath);
  await expect(page.getByTestId('login-form')).toBeVisible();

  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: /^log in$/i }).click();
}

export async function loginAndWaitForRedirect(
  page: Page,
  options: LoginOptions & { expectedPath: string | RegExp },
): Promise<void> {
  await login(page, options);
  await page.waitForURL(options.expectedPath);
}
