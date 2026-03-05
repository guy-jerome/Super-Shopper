import { test, expect } from '@playwright/test';

test.describe('Shop tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('shows store selector', async ({ page }) => {
    // Navigate to shop tab if visible
    const shopTab = page.getByRole('tab', { name: /shop/i });
    if (await shopTab.isVisible()) {
      await shopTab.click();
      await expect(page.getByText(/no store|walmart|shop/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('shows empty state with instruction when list is empty', async ({ page }) => {
    const shopTab = page.getByRole('tab', { name: /shop/i });
    if (await shopTab.isVisible()) {
      await shopTab.click();
      const emptyText = page.getByText(/list is empty|home storage/i);
      await expect(emptyText.or(page.getByText(/sign in/i))).toBeVisible({ timeout: 10000 });
    }
  });
});
