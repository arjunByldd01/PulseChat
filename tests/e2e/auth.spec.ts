import { test, expect } from '@playwright/test';
import { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } from '../global.setup';

// Use a stable timestamp suffix to avoid email collisions across runs
const RUN_ID = Date.now();

test.describe('Authentication', () => {
  test('sign up creates account and auto-signs-in', async ({ page }) => {
    await page.goto('/sign-up');
    await page.getByLabel('Full name').fill(`Test User ${RUN_ID}`);
    await page.getByLabel('Email address').fill(`new-${RUN_ID}@test.local`);
    await page.getByLabel('Password').fill('Secure123!');
    await page.getByRole('button', { name: 'Create account' }).click();

    // After sign-up the user is auto-signed-in and redirected away from /sign-up
    await page.waitForURL(/\/(workspace|$)/, { timeout: 20_000 });
    expect(page.url()).not.toContain('/sign-up');
  });

  test('sign in with valid credentials redirects to workspace', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel('Email address').fill(ADMIN_EMAIL);
    await page.getByLabel('Password').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Sign in with email' }).click();

    await page.waitForURL(/\/workspace\//, { timeout: 20_000 });
    expect(page.url()).toContain('/workspace/');
  });

  test('sign in with wrong password shows error', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel('Email address').fill(ADMIN_EMAIL);
    await page.getByLabel('Password').fill('definitely-wrong');
    await page.getByRole('button', { name: 'Sign in with email' }).click();

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('alert')).toContainText('Invalid email or password');
  });

  test('duplicate email on sign-up shows conflict error', async ({ page }) => {
    await page.goto('/sign-up');
    await page.getByLabel('Full name').fill(ADMIN_NAME);
    await page.getByLabel('Email address').fill(ADMIN_EMAIL); // already registered
    await page.getByLabel('Password').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5_000 });
  });

  test('unauthenticated access to workspace redirects to sign-in', async ({ page }) => {
    await page.goto('/workspace/not-a-real-workspace-id');
    await page.waitForURL(/\/sign-in/, { timeout: 5_000 });
    expect(page.url()).toContain('/sign-in');
  });

  test('sign-out via workspace dropdown redirects to sign-in', async ({ page }) => {
    // Sign in first
    await page.goto('/sign-in');
    await page.getByLabel('Email address').fill(ADMIN_EMAIL);
    await page.getByLabel('Password').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Sign in with email' }).click();
    await page.waitForURL(/\/workspace\//, { timeout: 20_000 });

    // Click the workspace name button in the main sidebar panel (aside) to open dropdown
    const aside = page.locator('aside');
    await aside.getByRole('button').first().click();
    // Click the "Sign out of …" menu item
    await page.getByRole('menuitem', { name: /Sign out/ }).click();

    await page.waitForURL(/\/sign-in/, { timeout: 10_000 });
    expect(page.url()).toContain('/sign-in');
  });
});
