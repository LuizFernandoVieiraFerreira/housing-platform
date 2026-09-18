import { expect, test } from '@playwright/test';

import { loginAndWaitForRedirect } from '../fixtures/auth';
import { PROPERTIES, USERS } from '../fixtures/seed-data';

test.describe('Admin publish flow', () => {
  test('publishes a listing that is pending review', async ({ page }) => {
    const property = PROPERTIES.pendingReviewStudio;

    await loginAndWaitForRedirect(page, {
      email: USERS.admin,
      loginPath: '/admin/login',
      expectedPath: /\/admin(\/)?$/,
    });

    await page.goto('/admin/properties');
    await expect(page.getByRole('heading', { name: /property reviews/i })).toBeVisible();

    const propertyHeading = page.getByRole('heading', { name: property.title, level: 2 });
    if (!(await propertyHeading.isVisible())) {
      test.skip(true, 'Pending listing was already published — reset the database to re-run.');
    }

    await page
      .getByRole('article')
      .filter({ has: propertyHeading })
      .getByRole('button', { name: /^publish$/i })
      .click();

    await expect(propertyHeading).toBeHidden({ timeout: 30_000 });
  });
});
