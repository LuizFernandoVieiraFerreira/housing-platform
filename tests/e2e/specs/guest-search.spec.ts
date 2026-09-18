import { expect, test } from '@playwright/test';

import { PROPERTIES } from '../fixtures/seed-data';

test.describe('Guest search flow', () => {
  test('browses from home to map search and opens a listing', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', {
        name: /stay for international students, business stay, monthly travelers/i,
      }),
    ).toBeVisible();

    await page.getByRole('link', { name: /browse stays/i }).click();
    await expect(page).toHaveURL(/\/map/);

    const listingLink = page.locator(
      `a[href="/listings/${PROPERTIES.instantBookStudio.id}"]`,
    );
    await expect(listingLink).toBeVisible({ timeout: 30_000 });

    await listingLink.click();
    await expect(page).toHaveURL(new RegExp(`/listings/${PROPERTIES.instantBookStudio.id}`));
    await expect(
      page.getByRole('heading', { name: PROPERTIES.instantBookStudio.title, level: 1 }),
    ).toBeVisible();
  });
});
