import { expect, test, type Page } from '@playwright/test';

import { loginAndWaitForRedirect } from '../fixtures/auth';
import { bookingWindow } from '../fixtures/dates';
import { PROPERTIES, USERS } from '../fixtures/seed-data';

async function submitBookingHold(page: Page, minStayNights: number) {
  const { checkIn, checkOut } = bookingWindow(minStayNights);

  await page.locator('#booking-check-in').fill(checkIn);
  await page.locator('#booking-check-out').fill(checkOut);
  await page.locator('#booking-guests').fill('1');

  await expect(page.getByTestId('booking-form').getByText(/^total$/i)).toBeVisible({
    timeout: 30_000,
  });

  await page.getByRole('button', { name: /reserve and pay next/i }).click();
}

test.describe('Guest booking flow', () => {
  test('books an instant listing and completes dev mock checkout', async ({ page }) => {
    const property = PROPERTIES.instantBookStudio;

    await loginAndWaitForRedirect(page, {
      email: USERS.customer,
      expectedPath: /\/(account|$)/,
    });

    await page.goto(`/listings/${property.id}`);
    await expect(page.getByRole('heading', { name: property.title, level: 1 })).toBeVisible();
    await expect(page.getByTestId('booking-form')).toBeVisible();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (attempt > 0) {
        await page.goto(`/listings/${property.id}`);
        await expect(page.getByTestId('booking-form')).toBeVisible();
      }

      await submitBookingHold(page, property.minStayNights);

      const reachedCheckout = await page
        .waitForURL(/\/checkout\/.+/, { timeout: 15_000 })
        .then(() => true)
        .catch(() => false);

      if (reachedCheckout) {
        break;
      }

      const submitError = page.getByTestId('booking-form').getByRole('alert');
      const errorMessage = (await submitError.textContent()) ?? 'Unknown booking error';

      if (!/conflict with an existing booking hold/i.test(errorMessage) || attempt === 2) {
        throw new Error(`Booking hold failed: ${errorMessage}`);
      }
    }

    await expect(page.getByRole('heading', { name: property.title })).toBeVisible();

    const payButton = page.getByTestId('checkout-pay');
    await expect(payButton).toBeEnabled();
    await expect(payButton).toHaveText(/simulate payment/i);
    await payButton.click();

    await expect(page).toHaveURL(/\/bookings\/.+/, { timeout: 60_000 });
    await expect(page.getByText(/^confirmed$/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: property.title })).toBeVisible();
  });
});
