import { expect, test } from '@playwright/test';

import { loginAndWaitForRedirect } from '../fixtures/auth';
import { PROPERTIES, USERS } from '../fixtures/seed-data';

test.describe('Host property review flow', () => {
  test('submits a draft listing for admin review', async ({ page }) => {
    const property = PROPERTIES.draftStudio;

    await loginAndWaitForRedirect(page, {
      email: USERS.host2,
      loginPath: '/host/login',
      expectedPath: /\/host(\/)?$/,
    });

    await page.goto('/host/properties');
    await expect(page.getByRole('heading', { name: /your properties/i })).toBeVisible();

    await page
      .getByRole('article')
      .filter({ hasText: property.title })
      .getByRole('link', { name: /edit/i })
      .click();
    await expect(page).toHaveURL(new RegExp(`/host/properties/${property.id}`));
    await expect(page.getByRole('heading', { name: /edit listing/i })).toBeVisible();

    const submitButton = page.getByTestId('submit-for-review');
    if (!(await submitButton.isVisible())) {
      test.skip(true, 'Draft listing was already submitted — reset the database to re-run.');
    }

    await submitButton.click();
    await expect(submitButton).toBeHidden({ timeout: 30_000 });

    await page.goto('/host/properties');
    await expect(
      page.getByRole('article').filter({ hasText: property.title }).getByText(/pending review/i),
    ).toBeVisible();
  });
});
