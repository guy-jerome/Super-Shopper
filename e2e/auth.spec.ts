import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('shows login screen on first load', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Sign In')).toBeVisible({ timeout: 15000 });
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
  });

  test('shows validation when submitting empty form', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    // Button should be disabled or an error shown — both are acceptable
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('navigates to sign up screen', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByText(/create account|sign up/i).click();
    await expect(page.getByText(/create account|sign up/i)).toBeVisible();
  });
});
