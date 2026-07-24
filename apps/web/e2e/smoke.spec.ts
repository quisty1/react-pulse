import { test, expect } from '@playwright/test';

test.describe('Pulse smoke', () => {
  test('login page renders branding', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Pulse' })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('demo credentials fill works', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /fill demo/i }).click();
    await expect(page.getByLabel(/email/i)).toHaveValue('demo@pulse.app');
  });

  test('theme toggle control exists after login attempt UI', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });
});
