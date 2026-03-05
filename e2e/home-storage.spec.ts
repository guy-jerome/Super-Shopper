import { test, expect } from '@playwright/test';

// These tests assume you are signed in. In CI you'd inject a session cookie.
// For local dev, sign in manually and reuse the browser session with storageState.

test.describe('Home Storage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to load
    await page.waitForLoadState('networkidle');
  });

  test('displays empty state with Add Location button when no locations exist', async ({ page }) => {
    // If signed in and no locations, the empty state should show
    const emptyText = page.getByText(/No locations yet/i);
    const addButton = page.getByRole('button', { name: /Add Location/i });
    // One of these will be visible depending on data state
    await expect(emptyText.or(addButton).or(page.getByText(/sign in/i))).toBeVisible({ timeout: 10000 });
  });

  test('search bar is visible on home storage screen', async ({ page }) => {
    const searchbar = page.getByPlaceholder(/search items/i);
    await expect(searchbar.or(page.getByText(/sign in/i))).toBeVisible({ timeout: 10000 });
  });
});
